const mongoose = require('mongoose');

const examSessionSchema = new mongoose.Schema(
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
    startTime: {
      type: Date,
      default: Date.now,
    },
    endTime: {
      type: Date,
    },
    answers: {
      type: Map,
      of: Number, // key is questionId string, value is selected option index (0-3)
      default: {},
    },
    status: {
      type: String,
      enum: ['in-progress', 'submitted', 'disqualified'],
      default: 'in-progress',
    },
    warningCount: {
      type: Number,
      default: 0,
    },
    tabSwitches: {
      type: Number,
      default: 0,
    },
    fullscreenExits: {
      type: Number,
      default: 0,
    },
    ipAddress: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('ExamSession', examSessionSchema);
