const { PDFParse } = require('pdf-parse');

/**
 * Core text question parser state machine.
 * Extracts questions, options A/B/C/D, answers, explanations, etc. from raw text.
 * @param {String} textContent - Raw string containing MCQs
 * @returns {Array} List of extracted question objects
 */
const parseTextQuestions = (textContent) => {
  const lines = textContent.split(/\r?\n/).map(l => l.trim());
  const questions = [];
  let currentQuestion = null;

  lines.forEach((line) => {
    if (!line) return;

    const lowerLine = line.toLowerCase();
    
    // Check for Question start: e.g., "Q: ...", "Question: ...", or numbered "1. ..."
    if (lowerLine.startsWith('q:') || lowerLine.startsWith('question:') || line.match(/^\d+[\.\)]\s/)) {
      // Push previous question if complete
      if (currentQuestion && currentQuestion.text && currentQuestion.options.length === 4) {
        questions.push(currentQuestion);
      }
      
      let qText = line;
      if (lowerLine.startsWith('q:')) {
        qText = line.replace(/^q:\s*/i, '');
      } else if (lowerLine.startsWith('question:')) {
        qText = line.replace(/^question:\s*/i, '');
      } else {
        // Strip numbering "1. Cell structure..." -> "Cell structure..."
        qText = line.replace(/^\d+[\.\)]\s*/, '');
      }

      currentQuestion = {
        text: qText,
        options: [],
        correctAnswer: 0,
        marks: 1,
        explanation: '',
        difficulty: 'medium',
        subject: 'General',
        category: 'General'
      };
    } else if (currentQuestion) {
      // Capture options: A) Option, A. Option
      if (line.match(/^[A-D]\)|^[A-D]\./i)) {
        const optText = line.replace(/^[A-D]\)|^[A-D]\.\s*/i, '');
        currentQuestion.options.push(optText);
      } 
      // Capture answer: Answer: B, Ans: C
      else if (lowerLine.startsWith('answer:') || lowerLine.startsWith('ans:')) {
        const ansString = line.replace(/^(answer:|ans:)\s*/i, '').trim().toUpperCase();
        if (ansString.startsWith('A') || ansString.includes('0')) currentQuestion.correctAnswer = 0;
        else if (ansString.startsWith('B') || ansString.includes('1')) currentQuestion.correctAnswer = 1;
        else if (ansString.startsWith('C') || ansString.includes('2')) currentQuestion.correctAnswer = 2;
        else if (ansString.startsWith('D') || ansString.includes('3')) currentQuestion.correctAnswer = 3;
      } 
      // Capture explanation
      else if (lowerLine.startsWith('explanation:')) {
        currentQuestion.explanation = line.replace(/^explanation:\s*/i, '');
      } 
      // Capture difficulty
      else if (lowerLine.startsWith('difficulty:')) {
        const diffStr = line.replace(/^difficulty:\s*/i, '').trim().toLowerCase();
        if (['easy', 'medium', 'hard'].includes(diffStr)) currentQuestion.difficulty = diffStr;
      } 
      // Capture subject
      else if (lowerLine.startsWith('subject:')) {
        const subStr = line.replace(/^subject:\s*/i, '').trim();
        currentQuestion.subject = subStr;
        currentQuestion.category = subStr;
      }
    }
  });

  // Push the final question block
  if (currentQuestion && currentQuestion.text && currentQuestion.options.length === 4) {
    questions.push(currentQuestion);
  }

  return questions;
};

/**
 * Parses question data from uploaded files (CSV, TXT, PDF)
 * @param {Buffer} buffer - File buffer
 * @param {String} fileName - Original file name with extension
 * @returns {Array} List of formatted question objects ready to be saved
 */
const parseUploadedFile = async (buffer, fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  let textContent = '';
  const questions = [];

  if (extension === 'pdf') {
    try {
      const parserInstance = new PDFParse(new Uint8Array(buffer));
      const parsedData = await parserInstance.getText();
      textContent = parsedData.text;
    } catch (err) {
      console.error('Error parsing PDF content:', err.message);
      return [];
    }
  } else {
    textContent = buffer.toString('utf-8');
  }

  if (extension === 'csv') {
    // Parse CSV line by line
    const lines = textContent.split(/\r?\n/);
    if (lines.length < 2) return [];

    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim());
      
      const questionText = row[0];
      const optA = row[1];
      const optB = row[2];
      const optC = row[3];
      const optD = row[4];
      const correctVal = row[5];
      const marksVal = parseInt(row[6]) || 1;
      const explanation = row[7] || '';
      const difficulty = (row[8] || 'medium').toLowerCase();
      const subject = row[9] || 'General';

      if (!questionText || !optA || !optB || !optC || !optD) continue;

      let correctAnswer = 0;
      if (!isNaN(correctVal) && correctVal !== '') {
        correctAnswer = parseInt(correctVal);
      } else {
        const letter = correctVal.toUpperCase();
        if (letter === 'A' || letter === '1') correctAnswer = 0;
        else if (letter === 'B' || letter === '2') correctAnswer = 1;
        else if (letter === 'C' || letter === '3') correctAnswer = 2;
        else if (letter === 'D' || letter === '4') correctAnswer = 3;
      }

      questions.push({
        text: questionText,
        options: [optA, optB, optC, optD],
        correctAnswer,
        marks: marksVal,
        explanation,
        difficulty: ['easy', 'medium', 'hard'].includes(difficulty) ? difficulty : 'medium',
        subject,
        category: subject,
      });
    }
  } else {
    // Call our core text parser
    return parseTextQuestions(textContent);
  }

  return questions;
};

module.exports = {
  parseTextQuestions,
  parseUploadedFile,
};
