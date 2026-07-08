const pdf = require('pdf-parse');

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
      const parsedData = await pdf(buffer);
      textContent = parsedData.text;
      console.log('Successfully extracted text from PDF question file.');
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

    // Parse header to match indexes
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Basic CSV splitter (handles simple quotes)
      const row = lines[i].split(/,(?=(?:(?:[^"]*"){2})*[^"]*$)/).map(cell => cell.replace(/^"|"$/g, '').trim());
      
      const questionText = row[0];
      const optA = row[1];
      const optB = row[2];
      const optC = row[3];
      const optD = row[4];
      const correctVal = row[5]; // Can be 0-3 index or Option letter/text
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
    // For TXT or PDF text content: Parse using an ultra-robust line-by-line state machine
    const lines = textContent.split(/\r?\n/).map(l => l.trim());
    let currentQuestion = null;

    lines.forEach((line) => {
      if (!line) return;

      const lowerLine = line.toLowerCase();
      
      // Check for Question start: "Q: ...", "Question: ...", or numbered e.g. "1. ..."
      if (lowerLine.startsWith('q:') || lowerLine.startsWith('question:') || line.match(/^\d+[\.\)]\s/)) {
        // If we already have a previous complete question block, store it
        if (currentQuestion && currentQuestion.text && currentQuestion.options.length === 4) {
          questions.push(currentQuestion);
        }
        
        let qText = line;
        if (lowerLine.startsWith('q:')) {
          qText = line.replace(/^q:\s*/i, '');
        } else if (lowerLine.startsWith('question:')) {
          qText = line.replace(/^question:\s*/i, '');
        } else {
          // Strip out numbers e.g. "1. Cell structure..." -> "Cell structure..."
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
        // Check for options: "A) ...", "A. ...", etc.
        if (line.match(/^[A-D]\)|^[A-D]\./i)) {
          const optText = line.replace(/^[A-D]\)|^[A-D]\.\s*/i, '');
          currentQuestion.options.push(optText);
        }
        // Check for correct answer: "Answer: ...", "Ans: ..."
        else if (lowerLine.startsWith('answer:') || lowerLine.startsWith('ans:')) {
          const ansString = line.replace(/^(answer:|ans:)\s*/i, '').trim().toUpperCase();
          if (ansString.startsWith('A') || ansString.includes('0')) currentQuestion.correctAnswer = 0;
          else if (ansString.startsWith('B') || ansString.includes('1')) currentQuestion.correctAnswer = 1;
          else if (ansString.startsWith('C') || ansString.includes('2')) currentQuestion.correctAnswer = 2;
          else if (ansString.startsWith('D') || ansString.includes('3')) currentQuestion.correctAnswer = 3;
        }
        // Check for explanation: "Explanation: ..."
        else if (lowerLine.startsWith('explanation:')) {
          currentQuestion.explanation = line.replace(/^explanation:\s*/i, '');
        }
        // Check for difficulty: "Difficulty: ..."
        else if (lowerLine.startsWith('difficulty:')) {
          const diffStr = line.replace(/^difficulty:\s*/i, '').trim().toLowerCase();
          if (['easy', 'medium', 'hard'].includes(diffStr)) currentQuestion.difficulty = diffStr;
        }
        // Check for subject: "Subject: ..."
        else if (lowerLine.startsWith('subject:')) {
          const subStr = line.replace(/^subject:\s*/i, '').trim();
          currentQuestion.subject = subStr;
          currentQuestion.category = subStr;
        }
      }
    });

    // Don't forget to push the final question block after loop completion
    if (currentQuestion && currentQuestion.text && currentQuestion.options.length === 4) {
      questions.push(currentQuestion);
    }
  }

  return questions;
};

module.exports = {
  parseUploadedFile,
};
