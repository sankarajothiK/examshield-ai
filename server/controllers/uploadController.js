const path = require('path');
const fs = require('fs');
const { parseUploadedFile } = require('../utils/questionParser');
const Question = require('../models/Question');

// @desc    Upload file and parse questions
// @route   POST /api/uploads/questions
// @access  Private/Admin
const uploadQuestionsFile = async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ success: false, message: 'Please upload a file' });
    }

    const extracted = parseUploadedFile(req.file.buffer, req.file.originalname);
    
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

module.exports = {
  uploadQuestionsFile,
  uploadScreenshot,
};
