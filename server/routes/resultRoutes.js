const express = require('express');
const {
  getMyResults,
  getResultById,
  getTestLeaderboard,
  getAdminReports,
  downloadResultPdf,
} = require('../controllers/resultController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.get('/my', protect, getMyResults);
router.get('/leaderboard/:testId', protect, getTestLeaderboard);
router.get('/admin/reports', protect, admin, getAdminReports);
router.get('/:id', protect, getResultById);
router.get('/:id/pdf', protect, downloadResultPdf);

module.exports = router;
