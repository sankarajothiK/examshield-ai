const mongoose = require('mongoose');

const questionSchema = new mongoose.Schema(
  {
    text: {
      type: String,
      required: [true, 'Please add question text'],
      trim: true,
    },
    options: {
      type: [String],
      required: [true, 'Please add 4 options'],
      validate: {
        validator: function (val) {
          return val.length === 4;
        },
        message: 'A question must have exactly 4 options',
      },
    },
    correctAnswer: {
      type: Number,
      required: [true, 'Please specify the correct option index (0-3)'],
      min: 0,
      max: 3,
    },
    marks: {
      type: Number,
      default: 1,
    },
    explanation: {
      type: String,
      default: '',
    },
    difficulty: {
      type: String,
      enum: ['easy', 'medium', 'hard'],
      default: 'medium',
    },
    category: {
      type: String,
      default: 'General',
    },
    subject: {
      type: String,
      default: 'General',
    },
    imageUrl: {
      type: String,
      default: '',
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model('Question', questionSchema);
