const ExamSession = require('../models/ExamSession');
const Test = require('../models/Test');
const Question = require('../models/Question');
const Result = require('../models/Result');
const Violation = require('../models/Violation');
const Notification = require('../models/Notification');

// @desc    Start/Initialize an exam session
// @route   POST /api/exams/start
// @access  Private
const startExamSession = async (req, res) => {
  try {
    const { testId } = req.body;

    const test = await Test.findById(testId);
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    if (test.status !== 'published') {
      return res.status(400).json({ success: false, message: 'This test is not published yet' });
    }

    // Check if within start/end window
    const now = new Date();
    if (now < new Date(test.startDate) || now > new Date(test.endDate)) {
      return res.status(400).json({ success: false, message: 'Exam is not currently active' });
    }

    // Check attempt limits
    const existingSessions = await ExamSession.countDocuments({
      student: req.user.id,
      test: testId,
      status: { $in: ['submitted', 'disqualified'] },
    });

    if (existingSessions >= test.maxAttempts) {
      return res.status(400).json({
        success: false,
        message: `Maximum attempt limit reached. You have already attempted this exam ${existingSessions} time(s).`,
      });
    }

    // Create session
    const session = await ExamSession.create({
      student: req.user.id,
      test: testId,
      startTime: now,
      status: 'in-progress',
      warningCount: 0,
      tabSwitches: 0,
      fullscreenExits: 0,
      ipAddress: req.ip || req.connection.remoteAddress,
    });

    // Notify exam start
    await Notification.create({
      recipient: req.user.id,
      title: 'Exam Started',
      message: `You have successfully started the exam: ${test.title}`,
      type: 'exam-started',
    });

    res.status(201).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Auto-save selected answer
// @route   POST /api/exams/save-answer
// @access  Private
const saveAnswer = async (req, res) => {
  try {
    const { sessionId, questionId, selectedOptionIndex } = req.body;

    const session = await ExamSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Exam session not found' });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({ success: false, message: 'Session is no longer active' });
    }

    // Update the answer map (selectedIndex can be -1 if cleared/skipped)
    if (selectedOptionIndex === -1 || selectedOptionIndex === null) {
      session.answers.delete(questionId);
    } else {
      session.answers.set(questionId, selectedOptionIndex);
    }

    await session.save();
    res.status(200).json({ success: true, message: 'Answer saved successfully' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Log a proctoring violation and check auto-disqualification
// @route   POST /api/exams/violation
// @access  Private
const logViolation = async (req, res) => {
  try {
    const { sessionId, violationType, screenshot } = req.body;

    const session = await ExamSession.findById(sessionId).populate('test', 'title maxAttempts');
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({ success: false, message: 'Session is no longer active' });
    }

    // Increment metrics in session
    session.warningCount += 1;
    if (violationType === 'tab-switch') {
      session.tabSwitches += 1;
    } else if (violationType === 'fullscreen-exit') {
      session.fullscreenExits += 1;
    }

    // Get or create violation report
    let violationReport = await Violation.findOne({ session: sessionId });
    if (!violationReport) {
      violationReport = await Violation.create({
        session: sessionId,
        student: req.user.id,
        test: session.test._id,
        violations: [],
      });
    }

    // Add violation details
    violationReport.violations.push({
      type: violationType,
      timestamp: new Date(),
      screenshot: screenshot || '',
      warningCountAtViolation: session.warningCount,
    });

    await violationReport.save();

    // Check Auto-Disqualification Rules:
    // 1. More than 3 tab switches
    // 2. Mobile detected
    // 3. Multiple faces
    // 4. Camera disabled
    // 5. Fullscreen exited repeatedly (>3 times)
    // 6. Overall warnings > 5
    let disqualify = false;
    let reason = '';

    if (session.tabSwitches > 3) {
      disqualify = true;
      reason = 'Exceeded tab switching threshold (maximum 3 allowed)';
    } else if (violationType === 'mobile-detected') {
      disqualify = true;
      reason = 'Mobile phone device detected in examination area';
    } else if (violationType === 'multiple-faces') {
      disqualify = true;
      reason = 'Multiple faces detected in camera stream';
    } else if (session.fullscreenExits > 3) {
      disqualify = true;
      reason = 'Exceeded fullscreen exits threshold';
    } else if (session.warningCount >= 6) {
      disqualify = true;
      reason = 'Exceeded maximum allowable safety warnings';
    }

    if (disqualify) {
      session.status = 'disqualified';
      session.endTime = new Date();
      await session.save();

      // Submit automatic fail result
      const test = await Test.findById(session.test._id);
      let totalQuestionsMarks = 0;
      const testQuestions = await Question.find({ _id: { $in: test.questions } });
      testQuestions.forEach((q) => {
        totalQuestionsMarks += q.marks;
      });

      await Result.create({
        student: req.user.id,
        test: session.test._id,
        session: session._id,
        score: 0,
        percentage: 0,
        status: 'fail',
        correctAnswers: 0,
        wrongAnswers: 0,
        skippedAnswers: test.questions.length,
        totalMarksPossible: totalQuestionsMarks,
        violationReport: violationReport._id,
      });

      await Notification.create({
        recipient: req.user.id,
        title: 'Disqualified from Exam',
        message: `You were automatically disqualified from the exam "${session.test.title}". Reason: ${reason}`,
        type: 'alert',
      });

      return res.status(200).json({
        success: true,
        disqualified: true,
        message: `Exam terminated: ${reason}`,
      });
    }

    await session.save();
    return res.status(200).json({
      success: true,
      disqualified: false,
      warningCount: session.warningCount,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Submit & Evaluate Exam Session
// @route   POST /api/exams/submit
// @access  Private
const submitExam = async (req, res) => {
  try {
    const { sessionId } = req.body;

    const session = await ExamSession.findById(sessionId);
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    if (session.status !== 'in-progress') {
      return res.status(400).json({ success: false, message: 'Exam has already been submitted or disqualified' });
    }

    const test = await Test.findById(session.test).populate('questions');
    if (!test) {
      return res.status(404).json({ success: false, message: 'Test not found' });
    }

    // Evaluation Logic
    let correct = 0;
    let wrong = 0;
    let skipped = 0;
    let totalScore = 0;
    let totalMarksPossible = 0;

    test.questions.forEach((question) => {
      totalMarksPossible += question.marks;
      const selectedIndex = session.answers.get(question._id.toString());

      if (selectedIndex === undefined || selectedIndex === null) {
        skipped += 1;
      } else if (selectedIndex === question.correctAnswer) {
        correct += 1;
        totalScore += question.marks;
      } else {
        wrong += 1;
        // Apply negative marks if set
        if (test.negativeMarks > 0) {
          totalScore -= test.negativeMarks;
        }
      }
    });

    // Ensure score is not negative
    totalScore = Math.max(0, totalScore);
    const percentage = totalMarksPossible > 0 ? parseFloat(((totalScore / totalMarksPossible) * 100).toFixed(2)) : 0;
    const status = totalScore >= test.passingMarks ? 'pass' : 'fail';

    session.status = 'submitted';
    session.endTime = new Date();
    await session.save();

    // Check if violation report exists
    const violationReport = await Violation.findOne({ session: sessionId });

    const result = await Result.create({
      student: req.user.id,
      test: test._id,
      session: session._id,
      score: totalScore,
      percentage,
      status,
      correctAnswers: correct,
      wrongAnswers: wrong,
      skippedAnswers: skipped,
      totalMarksPossible,
      violationReport: violationReport ? violationReport._id : null,
    });

    // Notify exam completion
    await Notification.create({
      recipient: req.user.id,
      title: 'Exam Results Available',
      message: `You completed "${test.title}" with a score of ${totalScore}/${totalMarksPossible} (${percentage}%). Status: ${status.toUpperCase()}`,
      type: 'result-published',
    });

    res.status(200).json({ success: true, data: result });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get details of student's own active exam session
// @route   GET /api/exams/session/:id
// @access  Private
const getSessionDetails = async (req, res) => {
  try {
    const session = await ExamSession.findById(req.params.id)
      .populate('test', 'title duration passingMarks negativeMarks instructions')
      .populate('student', 'name email');

    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }

    res.status(200).json({ success: true, data: session });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  startExamSession,
  saveAnswer,
  logViolation,
  submitExam,
  getSessionDetails,
};
