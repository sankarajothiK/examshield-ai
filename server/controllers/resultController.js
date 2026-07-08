const Result = require('../models/Result');
const Test = require('../models/Test');
const ExamSession = require('../models/ExamSession');
const Violation = require('../models/Violation');
const pdfService = require('../services/pdfService');

// @desc    Get current student's exam results
// @route   GET /api/results/my
// @access  Private
const getMyResults = async (req, res) => {
  try {
    // Allowed for all logged-in students to fetch their own results list

    const results = await Result.find({ student: req.user.id })
      .populate('test', 'title duration passingMarks')
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, count: results.length, data: results });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get single result details
// @route   GET /api/results/:id
// @access  Private
const getResultById = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('test', 'title duration passingMarks negativeMarks instructions')
      .populate('student', 'name email avatar')
      .populate('violationReport');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result record not found' });
    }

    if (req.user.role !== 'admin' && result.student._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Unauthorized access to this result record' });
    }

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get leaderboard for a specific test
// @route   GET /api/results/leaderboard/:testId
// @access  Private
const getTestLeaderboard = async (req, res) => {
  try {
    const leaderboard = await Result.find({ test: req.params.testId })
      .populate('student', 'name email avatar')
      .sort({ score: -1, percentage: -1 })
      .limit(10);

    res.status(200).json({ success: true, count: leaderboard.length, data: leaderboard });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get administrative report analytics
// @route   GET /api/results/admin/reports
// @access  Private/Admin
const getAdminReports = async (req, res) => {
  try {
    const totalResults = await Result.countDocuments();
    const passedResults = await Result.countDocuments({ status: 'pass' });
    const failedResults = await Result.countDocuments({ status: 'fail' });

    // Aggregate average statistics
    const aggregates = await Result.aggregate([
      {
        $group: {
          _id: null,
          avgPercentage: { $avg: '$percentage' },
          avgScore: { $avg: '$score' },
          maxScore: { $max: '$score' },
        },
      },
    ]);

    const stats = aggregates[0] || { avgPercentage: 0, avgScore: 0, maxScore: 0 };
    
    // Group by test for test-by-test stats
    const testStats = await Result.aggregate([
      {
        $group: {
          _id: '$test',
          avgScore: { $avg: '$score' },
          passCount: {
            $sum: { $cond: [{ $eq: ['$status', 'pass'] }, 1, 0] },
          },
          totalCount: { $sum: 1 },
        },
      },
      {
        $lookup: {
          from: 'tests',
          localField: '_id',
          foreignField: '_id',
          as: 'testDetails',
        },
      },
      {
        $unwind: '$testDetails',
      },
      {
        $project: {
          testTitle: '$testDetails.title',
          avgScore: 1,
          passRate: { $multiply: [{ $divide: ['$passCount', '$totalCount'] }, 100] },
          totalParticipants: '$totalCount',
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        overall: {
          totalExamsTaken: totalResults,
          passPercentage: totalResults > 0 ? Math.round((passedResults / totalResults) * 100) : 0,
          averagePercentage: Math.round(stats.avgPercentage),
          averageScore: Math.round(stats.avgScore),
          maxScore: stats.maxScore,
        },
        testBreakdown: testStats,
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Download result sheet PDF
// @route   GET /api/results/:id/pdf
// @access  Private
const downloadResultPdf = async (req, res) => {
  try {
    const result = await Result.findById(req.params.id)
      .populate('test')
      .populate('student', 'name email avatar')
      .populate('violationReport');

    if (!result) {
      return res.status(404).json({ success: false, message: 'Result not found' });
    }

    if (req.user.role !== 'admin' && result.student._id.toString() !== req.user.id.toString()) {
      return res.status(403).json({ success: false, message: 'Access denied: Unauthorized access to this result PDF' });
    }

    // Set Response Headers
    res.setHeader('Content-Type', 'application/pdf');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename="ExamShield_Result_${result.student.name.replace(/\s+/g, '_')}_${result._id}.pdf"`
    );

    // Call PDFKit Service to stream into response object
    pdfService.generateResultPdf(result, res);
  } catch (error) {
    console.error(error);
    res.status(500).json({ success: false, message: 'Could not generate PDF result sheet' });
  }
};

module.exports = {
  getMyResults,
  getResultById,
  getTestLeaderboard,
  getAdminReports,
  downloadResultPdf,
};
