const mongoose = require('mongoose');

const resultSchema = new mongoose.Schema(
  {
    student: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    test: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Test',
      required: true,
    },
    session: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'ExamSession',
      required: true,
    },
    score: {
      type: Number,
      required: true,
    },
    percentage: {
      type: Number,
      required: true,
    },
    status: {
      type: String,
      enum: ['pass', 'fail'],
      required: true,
    },
    correctAnswers: {
      type: Number,
      default: 0,
    },
    wrongAnswers: {
      type: Number,
      default: 0,
    },
    skippedAnswers: {
      type: Number,
      default: 0,
    },
    totalMarksPossible: {
      type: Number,
      required: true,
    },
    violationReport: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Violation',
    },
    pdfPath: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Result', resultSchema);
