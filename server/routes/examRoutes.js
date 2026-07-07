const express = require('express');
const {
  startExamSession,
  saveAnswer,
  logViolation,
  submitExam,
  getSessionDetails,
} = require('../controllers/examController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/start', protect, startExamSession);
router.post('/save-answer', protect, saveAnswer);
router.post('/violation', protect, logViolation);
router.post('/submit', protect, submitExam);
router.get('/session/:id', protect, getSessionDetails);

module.exports = router;
