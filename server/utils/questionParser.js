/**
 * Parses question data from uploaded files (CSV, TXT, Excel/DOCX mock outputs)
 * @param {Buffer} buffer - File buffer
 * @param {String} fileName - Original file name with extension
 * @returns {Array} List of formatted question objects ready to be saved
 */
const parseUploadedFile = (buffer, fileName) => {
  const extension = fileName.split('.').pop().toLowerCase();
  const textContent = buffer.toString('utf-8');
  const questions = [];

  if (extension === 'csv') {
    // Parse CSV line by line
    const lines = textContent.split(/\r?\n/);
    if (lines.length < 2) return [];

    // Parse header to match indexes
    const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
    
    for (let i = 1; i < lines.length; i++) {
      if (!lines[i].trim()) continue;
      
      // Basic CSV splitter (handles simple quotes, but robust enough for MERN demonstration)
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
      if (!isNaN(correctVal)) {
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
    // For TXT, DOCX/PDF text content: Parse using regex patterns
    // Expected format block:
    // Q: What is the primary function of white blood cells?
    // A) Oxygen transport
    // B) Fighting infections
    // C) Blood clotting
    // D) Digesting food
    // Answer: B
    // Explanation: White blood cells are part of the immune system.
    
    const blocks = textContent.split(/\r?\n\r?\n/); // split by blank lines
    
    blocks.forEach((block) => {
      if (!block.trim()) return;

      const lines = block.split(/\r?\n/).map(l => l.trim()).filter(l => l);
      let text = '';
      const options = [];
      let correctAnswer = 0;
      let explanation = '';
      let difficulty = 'medium';
      let subject = 'General';

      lines.forEach((line) => {
        if (line.toLowerCase().startsWith('q:') || line.toLowerCase().startsWith('question:')) {
          text = line.replace(/^(q:|question:)\s*/i, '');
        } else if (line.match(/^[A-D]\)|^[A-D]\./i)) {
          options.push(line.replace(/^[A-D]\)|^[A-D]\.\s*/i, ''));
        } else if (line.toLowerCase().startsWith('answer:') || line.toLowerCase().startsWith('ans:')) {
          const ansString = line.replace(/^(answer:|ans:)\s*/i, '').trim().toUpperCase();
          if (ansString.startsWith('A') || ansString.includes('0')) correctAnswer = 0;
          else if (ansString.startsWith('B') || ansString.includes('1')) correctAnswer = 1;
          else if (ansString.startsWith('C') || ansString.includes('2')) correctAnswer = 2;
          else if (ansString.startsWith('D') || ansString.includes('3')) correctAnswer = 3;
        } else if (line.toLowerCase().startsWith('explanation:')) {
          explanation = line.replace(/^explanation:\s*/i, '');
        } else if (line.toLowerCase().startsWith('difficulty:')) {
          const diffStr = line.replace(/^difficulty:\s*/i, '').trim().toLowerCase();
          if (['easy', 'medium', 'hard'].includes(diffStr)) difficulty = diffStr;
        } else if (line.toLowerCase().startsWith('subject:')) {
          subject = line.replace(/^subject:\s*/i, '').trim();
        }
      });

      // Validate we have a proper block
      if (text && options.length === 4) {
        questions.push({
          text,
          options,
          correctAnswer,
          marks: 1,
          explanation,
          difficulty,
          subject,
          category: subject,
        });
      }
    });
  }

  return questions;
};

module.exports = {
  parseUploadedFile,
};
