const express = require('express');
const {
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
} = require('../controllers/questionController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

router.route('/')
  .post(protect, admin, createQuestion)
  .get(protect, getQuestions);

router.route('/:id')
  .put(protect, admin, updateQuestion)
  .delete(protect, admin, deleteQuestion);

module.exports = router;
