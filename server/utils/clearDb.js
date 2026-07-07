const mongoose = require('mongoose');
const User = require('../models/User');
const Test = require('../models/Test');
const Question = require('../models/Question');
const ExamSession = require('../models/ExamSession');
const Result = require('../models/Result');
const Notification = require('../models/Notification');
const dotenv = require('dotenv');

dotenv.config({ path: '../.env' }); // load config variables

const MONGO_URI = process.env.MONGO_URI;

if (!MONGO_URI) {
  console.error("Error: MONGO_URI is missing from environment file.");
  process.exit(1);
}

const clearDB = async () => {
  try {
    console.log(`Connecting to database at: ${MONGO_URI.split('@')[1] || MONGO_URI}`);
    await mongoose.connect(MONGO_URI);
    console.log('Successfully connected to MongoDB.');

    // 1. Clear testing/dummy logs and logs history
    console.log('Cleaning results and logs...');
    await Result.deleteMany({});
    await ExamSession.deleteMany({});
    await Notification.deleteMany({});

    // 2. Clear dummy mock tests and questions
    console.log('Cleaning test structures and questions bank...');
    await Test.deleteMany({});
    await Question.deleteMany({});

    // 3. Clear all students and seed clean admin entry
    console.log('Cleaning student accounts...');
    await User.deleteMany({});

    console.log('Re-creating clean administrative profile...');
    const admin = new User({
      name: 'System Administrator',
      email: 'admin@examshield.com',
      password: 'admin123',
      role: 'admin',
      isVerified: true
    });
    await admin.save();

    console.log('----------------------------------------------------');
    console.log('Database successfully cleaned for production!');
    console.log('Your database is now 100% clean with no mock data.');
    console.log('Admin account created:');
    console.log('Email: admin@examshield.com');
    console.log('Password: admin123 (Please change this after first login)');
    console.log('----------------------------------------------------');
    
    process.exit(0);
  } catch (err) {
    console.error('Database cleaning failed:', err);
    process.exit(1);
  }
};

clearDB();
