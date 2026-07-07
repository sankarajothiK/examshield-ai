const mongoose = require('mongoose');

const testSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Please add a test title'],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: '',
    },
    duration: {
      type: Number,
      required: [true, 'Please specify exam duration in minutes'],
    },
    passingMarks: {
      type: Number,
      required: [true, 'Please specify passing marks'],
    },
    negativeMarks: {
      type: Number,
      default: 0, // e.g. 0.25 for 1/4 mark negative marking
    },
    startDate: {
      type: Date,
      required: [true, 'Please specify start date and time'],
    },
    endDate: {
      type: Date,
      required: [true, 'Please specify end date and time'],
    },
    instructions: {
      type: [String],
      default: [],
    },
    maxAttempts: {
      type: Number,
      default: 1,
    },
    status: {
      type: String,
      enum: ['draft', 'published', 'archived'],
      default: 'draft',
    },
    questions: [
      {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Question',
      },
    ],
    creator: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Test', testSchema);
