const path = require('path');
const fs = require('fs');
const pdf = require('pdf-parse');
const { parseUploadedFile, parseTextQuestions } = require('../utils/questionParser');
const Question = require('../models/Question');

// @desc    Upload file and parse questions
// @route   POST /api/uploads/questions
// @access  Private/Admin
const uploadQuestionsFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const extracted = await parseUploadedFile(req.file.buffer, req.file.originalname);
    
    if (extracted.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No questions could be extracted. Please check the file formatting.',
      });
    }

    res.status(200).json({
      success: true,
      count: extracted.length,
      data: extracted,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload violation screenshot
// @route   POST /api/uploads/screenshot
// @access  Private
const uploadScreenshot = async (req, res) => {
  try {
    const { imageBase64, sessionId } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ success: false, message: 'No screenshot content provided' });
    }

    // Clean up base64 prefix
    const base64Data = imageBase64.replace(/^data:image\/\w+;base64,/, '');
    const buffer = Buffer.from(base64Data, 'base64');

    const uploadsDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir, { recursive: true });
    }

    const filename = `violation_${sessionId || 'anonymous'}_${Date.now()}.jpg`;
    const filepath = path.join(uploadsDir, filename);

    fs.writeFileSync(filepath, buffer);

    const relativeUrl = `/uploads/${filename}`;

    res.status(200).json({
      success: true,
      url: relativeUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Upload verification selfie or Aadhaar card front image
// @route   POST /api/uploads/verification
// @access  Private
const uploadVerification = async (req, res) => {
  try {
    let relativeUrl = '';
    
    // Check if it's a multipart file upload (Aadhaar select file)
    if (req.file) {
      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }
      
      const ext = path.extname(req.file.originalname) || '.jpg';
      const filename = `verification_${req.user.id}_${Date.now()}${ext}`;
      const filepath = path.join(uploadsDir, filename);
      fs.writeFileSync(filepath, req.file.buffer);
      relativeUrl = `/uploads/${filename}`;
    } 
    // Check if it's a base64 webcam capture (webcam selfie / webcam Aadhaar)
    else if (req.body.imageBase64) {
      const base64Data = req.body.imageBase64.replace(/^data:image\/\w+;base64,/, '');
      const buffer = Buffer.from(base64Data, 'base64');

      const uploadsDir = path.join(__dirname, '../uploads');
      if (!fs.existsSync(uploadsDir)) {
        fs.mkdirSync(uploadsDir, { recursive: true });
      }

      const filename = `verification_${req.user.id}_${Date.now()}.jpg`;
      const filepath = path.join(uploadsDir, filename);

      fs.writeFileSync(filepath, buffer);
      relativeUrl = `/uploads/${filename}`;
    } else {
      return res.status(400).json({ success: false, message: 'No file or captured image content provided' });
    }

    res.status(200).json({
      success: true,
      url: relativeUrl,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Extract Question Paper and Answer Key PDFs and match them
// @route   POST /api/uploads/extract-exam
// @access  Private/Admin
const extractExamFromPdfs = async (req, res) => {
  try {
    if (!req.files || !req.files.questionPaper) {
      return res.status(400).json({ success: false, message: 'Please upload at least the Question Paper PDF file' });
    }

    const qPaperFile = req.files.questionPaper[0];
    const aKeyFile = req.files.answerKey ? req.files.answerKey[0] : null;

    // 1. Extract text from Question Paper PDF
    let qText = '';
    try {
      const qPdf = await pdf(qPaperFile.buffer);
      qText = qPdf.text;
    } catch (err) {
      return res.status(400).json({ success: false, message: 'Failed to extract text from Question Paper PDF: ' + err.message });
    }

    // 2. Parse questions from Question Paper
    const parsedQuestions = parseTextQuestions(qText);
    if (parsedQuestions.length === 0) {
      return res.status(400).json({ success: false, message: 'No questions could be structured from the Question Paper PDF. Check formatting.' });
    }

    let matchedQuestions = [];
    let totalQuestions = parsedQuestions.length;
    let totalAnswersExtracted = 0;
    let validationWarning = '';
    let success = true;

    // 3. If separate Answer Key PDF is uploaded, match answers
    if (aKeyFile) {
      let aText = '';
      try {
        const aPdf = await pdf(aKeyFile.buffer);
        aText = aPdf.text;
      } catch (err) {
        return res.status(400).json({ success: false, message: 'Failed to extract text from Answer Key PDF: ' + err.message });
      }

      // Parse answers from Answer Key
      const answerMap = new Map();
      const regex = /\b(\d+)\s*[\.\-\)\:\s=]+\s*([A-D])\b/gi;
      let match;
      while ((match = regex.exec(aText)) !== null) {
        const qNum = parseInt(match[1]);
        const ansLetter = match[2].toUpperCase();
        const ansIdx = ansLetter.charCodeAt(0) - 65; // A=0, B=1, C=2, D=3
        answerMap.set(qNum, ansIdx);
      }

      matchedQuestions = parsedQuestions.map((q, idx) => {
        const qNum = idx + 1;
        let correctAnswer = q.correctAnswer; // default to inline if any
        let matched = false;

        if (answerMap.has(qNum)) {
          correctAnswer = answerMap.get(qNum);
          matched = true;
        }

        return {
          ...q,
          correctAnswer,
          matched,
        };
      });

      totalAnswersExtracted = answerMap.size;
      if (totalQuestions !== totalAnswersExtracted) {
        success = false;
        validationWarning = `Mismatch: Extracted ${totalQuestions} questions from the Question Paper, but found ${totalAnswersExtracted} answer keys in the Answer Key PDF.`;
      }

      const unmatchedQuestions = matchedQuestions.filter(q => !q.matched);
      if (unmatchedQuestions.length > 0) {
        success = false;
        if (validationWarning) validationWarning += ' ';
        validationWarning += `Some questions (like Question ${matchedQuestions.findIndex(q => !q.matched) + 1}) could not be matched with an answer key automatically.`;
      }
    } else {
      // Single PDF mode: answers are inline
      matchedQuestions = parsedQuestions.map(q => ({ ...q, matched: q.correctAnswer !== undefined }));
      totalAnswersExtracted = matchedQuestions.filter(q => q.correctAnswer !== undefined).length;
      
      const unmatchedQuestions = matchedQuestions.filter(q => q.correctAnswer === 0 && !q.matched);
      if (unmatchedQuestions.length > 0) {
        success = false;
        validationWarning = 'Single PDF parsed. Some questions do not contain inline answers (defaulted to Option A).';
      }
    }

    res.status(200).json({
      success: true,
      data: {
        questions: matchedQuestions,
        totalQuestions,
        totalAnswers: totalAnswersExtracted,
        isFullyValidated: success,
        validationWarning,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  uploadQuestionsFile,
  uploadScreenshot,
  uploadVerification,
  extractExamFromPdfs,
};
