const express = require('express');
const {
  startExamSession,
  saveAnswer,
  logViolation,
  submitExam,
  getSessionDetails,
  getAllSessionsAdmin,
  updateVerificationStatus,
  verifyIdentity,
} = require('../controllers/examController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.post('/start', protect, startExamSession);
router.post('/save-answer', protect, saveAnswer);
router.post('/violation', protect, logViolation);
router.post('/submit', protect, submitExam);
router.post('/verify-identity', protect, verifyIdentity);
router.get('/session/:id', protect, getSessionDetails);
router.get('/admin/sessions', protect, admin, getAllSessionsAdmin);
router.put('/session/:id/verification', protect, admin, updateVerificationStatus);

module.exports = router;
