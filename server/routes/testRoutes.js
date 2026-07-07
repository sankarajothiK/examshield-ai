const express = require('express');
const {
  createTest,
  getTests,
  getTestById,
  updateTest,
  deleteTest,
  getAdminAnalytics,
} = require('../controllers/testController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, admin, createTest)
  .get(protect, getTests);

router.route('/analytics')
  .get(protect, admin, getAdminAnalytics);

router.route('/:id')
  .get(protect, getTestById)
  .put(protect, admin, updateTest)
  .delete(protect, admin, deleteTest);

module.exports = router;
