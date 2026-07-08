const Test = require('../models/Test');
const Question = require('../models/Question');
const ExamSession = require('../models/ExamSession');
const Result = require('../models/Result');

// @desc    Create a new test
// @route   POST /api/tests
// @access  Private/Admin
const createTest = async (req, res) => {
  try {
    const {
      title,
      description,
      duration,
      passingMarks,
      negativeMarks,
      startDate,
      endDate,
      instructions,
      maxAttempts,
      status,
      questions, // array of question IDs or objects
    } = req.body;

    if (!title || !duration || !passingMarks || !startDate || !endDate) {
      return res.status(400).json({ success: false, message: 'Please add all required test fields' });
    }

    let questionIds = [];
    if (questions && questions.length > 0) {
      // If questions are objects, create them first
      if (typeof questions[0] === 'object') {
        const createdQuestions = await Question.insertMany(questions);
        questionIds = createdQuestions.map(q => q._id);
      } else {
        questionIds = questions; // assume IDs
      }
    }

    const test = await Test.create({
      title,
      description,
      duration,
      passingMarks,
      negativeMarks,
      startDate,
      endDate,
      instructions: instructions || [],
      maxAttempts: maxAttempts || 1,
      status: status || 'draft',
      questions: questionIds,
      creator: req.user.id,
    });

    if (req.io) {
      req.io.emit('exam-updated');
    }

    res.status(201).json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get all tests
// @route   GET /api/tests
// @access  Private
const getTests = async (req, res) => {
  try {
    let query = {};
    
    // Students only see published exams that are active or upcoming
    if (req.user.role === 'student') {
      query.status = 'published';
    }

    const tests = await Test.find(query).populate('questions', '-correctAnswer -explanation').sort({ startDate: 1 });
    
    if (req.user.role === 'student') {
      const testsWithStatus = [];
      for (let t of tests) {
        const session = await ExamSession.findOne({
          student: req.user.id,
          test: t._id
        }).sort({ createdAt: -1 });

        testsWithStatus.push({
          ...t.toObject(),
          studentSession: session ? {
            status: session.status,
            startTime: session.startTime,
            endTime: session.endTime,
            warningCount: session.warningCount
          } : null
        });
      }
      return res.status(200).json({ success: true, count: testsWithStatus.length, data: testsWithStatus });
    }

    res.status(200).json({ success: true, count: tests.length, data: tests });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single test by ID
// @route   GET /api/tests/:id
// @access  Private
const getTestById = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // Security: Omit correct answers and explanations for students
    let questionsQuery = Question.find({ _id: { $in: test.questions } });
    if (req.user.role === 'student') {
      questionsQuery = questionsQuery.select('-correctAnswer -explanation');
    }
    
    const questions = await questionsQuery;
    const testData = test.toObject();
    testData.questions = questions;

    res.status(200).json({ success: true, data: testData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Update a test
// @route   PUT /api/tests/:id
// @access  Private/Admin
const updateTest = async (req, res) => {
  try {
    let test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    test = await Test.findByIdAndUpdate(req.params.id, req.body, {
      new: true,
      runValidators: true,
    });

    if (req.io) {
      req.io.emit('exam-updated');
    }

    res.status(200).json({ success: true, data: test });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Delete a test
// @route   DELETE /api/tests/:id
// @access  Private/Admin
const deleteTest = async (req, res) => {
  try {
    const test = await Test.findById(req.params.id);

    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // Also delete references or questions if needed, but keeping questions in QuestionBank is standard
    await test.deleteOne();

    if (req.io) {
      req.io.emit('exam-updated');
    }

    res.status(200).json({ success: true, message: 'Test removed successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get dashboard metrics / analytics
// @route   GET /api/tests/dashboard/analytics
// @access  Private/Admin
const getAdminAnalytics = async (req, res) => {
  try {
    const totalStudents = await User.countDocuments({ role: 'student' });
    const totalTests = await Test.countDocuments();
    const completedExams = await ExamSession.countDocuments({ status: 'submitted' });
    const totalResults = await Result.find();
    
    // Average score calculation
    let averageScore = 0;
    if (totalResults.length > 0) {
      const sum = totalResults.reduce((acc, curr) => acc + curr.percentage, 0);
      averageScore = Math.round(sum / totalResults.length);
    }

    // Recent activity log (Mocked/Aggregated)
    const recentSubmissions = await Result.find()
      .populate('student', 'name email')
      .populate('test', 'title')
      .sort({ createdAt: -1 })
      .limit(5);

    // Violation report count
    const totalViolations = await ExamSession.aggregate([
      { $group: { _id: null, count: { $sum: '$warningCount' } } }
    ]);
    const violationCount = totalViolations.length > 0 ? totalViolations[0].count : 0;

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        totalTests,
        completedExams,
        averageScore,
        violationCount,
        recentSubmissions,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  createTest,
  getTests,
  getTestById,
  updateTest,
  deleteTest,
  getAdminAnalytics,
};
const User = require('../models/User'); // Import User for admin metrics
