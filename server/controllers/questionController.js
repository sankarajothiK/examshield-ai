const Question = require('../models/Question');
const Test = require('../models/Test');

// @desc    Create a new question
// @route   POST /api/questions
// @access  Private/Admin
const createQuestion = async (req, res) => {
  try {
    const { text, options, correctAnswer, marks, explanation, difficulty, category, subject, imageUrl } = req.body;

    if (!text || !options || correctAnswer === undefined) {
      return res.status(400).json({ success: false, message: 'Please provide question text, options, and correct answer' });
    }

    const question = await Question.create({
      text,
      options,
      correctAnswer,
      marks: marks || 1,
      explanation: explanation || '',
      difficulty: difficulty || 'medium',
      category: category || 'General',
      subject: subject || 'General',
      imageUrl: imageUrl || '',
    });

    res.status(201).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all questions from Question Bank
// @route   GET /api/questions
// @access  Private/Admin
const getQuestions = async (req, res) => {
  try {
    const { difficulty, category, subject, search } = req.query;
    let query = {};

    if (difficulty) query.difficulty = difficulty;
    if (category) query.category = category;
    if (subject) query.subject = subject;
    if (search) {
      query.text = { $regex: search, $options: 'i' };
    }

    const questions = await Question.find(query).sort({ createdAt: -1 });
    res.status(200).json({ success: true, count: questions.length, data: questions });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a question
// @route   PUT /api/questions/:id
// @access  Private/Admin
const updateQuestion = async (req, res) => {
  try {
    let question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    question = await Question.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    res.status(200).json({ success: true, data: question });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a question
// @route   DELETE /api/questions/:id
// @access  Private/Admin
const deleteQuestion = async (req, res) => {
  try {
    const question = await Question.findById(req.params.id);

    if (!question) {
      return res.status(404).json({ success: false, message: 'Question not found' });
    }

    // Remove question from any Tests referencing it
    await Test.updateMany(
      { questions: req.params.id },
      { $pull: { questions: req.params.id } }
    );

    await question.deleteOne();

    res.status(200).json({ success: true, message: 'Question removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createQuestion,
  getQuestions,
  updateQuestion,
  deleteQuestion,
};
