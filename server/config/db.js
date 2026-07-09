const mongoose = require('mongoose');

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/examshield');
    console.log(`MongoDB Connected: ${conn.connection.host}`);

    // Auto-seed check
    const User = require('../models/User');
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('Database is empty. Triggering automatic database seeding...');
      const Question = require('../models/Question');
      const Test = require('../models/Test');
      
      // 1. Seed Questions
      const questionsSeed = [
        {
          text: "Which cell organelle is commonly referred to as the powerhouse of the cell?",
          options: ["Lysosome", "Mitochondrion", "Golgi Apparatus", "Endoplasmic Reticulum"],
          correctAnswer: 1,
          marks: 1,
          difficulty: "easy",
          subject: "Biology",
          category: "Biology",
          explanation: "Mitochondria produce ATP, which serves as the cellular energy currency."
        },
        {
          text: "What is the primary function of red blood cells (Erythrocytes) in the human body?",
          options: ["Synthesizing antibodies", "Clotting open wounds", "Transporting oxygen", "Filtering toxins from liver"],
          correctAnswer: 2,
          marks: 1,
          difficulty: "easy",
          subject: "Biology",
          category: "Biology",
          explanation: "Red blood cells contain hemoglobin, which binds to oxygen molecules and carries them throughout the body."
        },
        {
          text: "Which of the following blood groups is considered the universal recipient?",
          options: ["O Negative", "AB Positive", "A Positive", "B Negative"],
          correctAnswer: 1,
          marks: 1,
          difficulty: "medium",
          subject: "Biology",
          category: "Biology",
          explanation: "AB Positive blood has no antibodies against A, B, or Rh antigens, allowing it to receive blood of any type."
        },
        {
          text: "How many chambers are typically present in the human heart?",
          options: ["Two chambers", "Three chambers", "Four chambers", "Five chambers"],
          correctAnswer: 2,
          marks: 1,
          difficulty: "easy",
          subject: "Biology",
          category: "Biology",
          explanation: "The human heart has 4 chambers: two upper atria and two lower ventricles."
        },
        {
          text: "Which hormone is primary responsible for regulating glucose levels in the bloodstream?",
          options: ["Thyroxine", "Insulin", "Adrenaline", "Melatonin"],
          correctAnswer: 1,
          marks: 1,
          difficulty: "medium",
          subject: "Biology",
          category: "Biology",
          explanation: "Insulin is secreted by the pancreas to facilitate glucose absorption into tissues, lowering blood sugar."
        }
      ];
      
      const createdQuestions = await Question.insertMany(questionsSeed);
      const qIds = createdQuestions.map(q => q._id);
      console.log(`Created ${qIds.length} sample questions.`);
      
      // 2. Create Users
      const admin = await User.create({
        name: 'Dr. Jane invigilator',
        employeeId: 'ADM-001',
        email: 'admin@examshield.com',
        password: 'admin123',
        role: 'admin',
        isVerified: true
      });
      
      const student = await User.create({
        name: 'Edward candidate',
        employeeId: 'EMP-7429',
        email: 'student@examshield.com',
        password: 'student123',
        role: 'student',
        isVerified: true
      });
      
      console.log('Admin (admin@examshield.com / admin123) and Student (student@examshield.com / student123) accounts created.');
      
      // 3. Create active Test
      const today = new Date();
      const startDate = new Date(today);
      startDate.setHours(today.getHours() - 2); // active starting 2 hours ago
      
      const endDate = new Date(today);
      endDate.setDate(today.getDate() + 30); // active for next 30 days
      
      await Test.create({
        title: 'Medical Biology & Physiology Mock Test',
        description: 'Pre-requisite qualifying screening biology test covering cell structures, blood systems, and insulin regulatory networks.',
        duration: 15,
        passingMarks: 3,
        negativeMarks: 0.25,
        startDate,
        endDate,
        instructions: [
          'Camera and microphone devices must remain enabled continuously.',
          'Leaving fullscreen boundaries triggers integrity alerts.',
          'Copy-paste, right clicks, and Inspect consoles are blocked.',
          '3 or more tab switches will trigger automated disqualification.'
        ],
        maxAttempts: 2,
        status: 'published',
        questions: qIds,
        creator: admin._id
      });
      console.log('Mock Biology Examination created and published successfully.');
    }
  } catch (error) {
    console.error(`Database connection error: ${error.message}`);
    process.exit(1);
  }
};

module.exports = connectDB;
