const User = require('../models/User');
const generateToken = require('../utils/generateToken');
const sendEmail = require('../services/emailService');

// @desc    Register a new student
// @route   POST /api/auth/register
// @access  Public
const registerStudent = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    if (!name || !email || !password) {
      return res.status(400).json({ success: false, message: 'Please add all fields' });
    }

    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ success: false, message: 'User already exists' });
    }

    // Generate random 6-digit verification code
    const verificationCode = Math.floor(100000 + Math.random() * 900000).toString();

    const user = await User.create({
      name,
      email,
      password,
      role: 'student',
      verificationCode,
      isVerified: false,
    });

    if (user) {
      // Send verification code via email
      try {
        await sendEmail({
          to: user.email,
          subject: 'ExamShield AI - Verify Your Account',
          text: `Hello ${user.name},\n\nThank you for registering on ExamShield AI.\n\nYour 6-digit account verification code is: ${verificationCode}\n\nPlease enter this code in the portal to verify your account and start your exams.\n\nBest regards,\nExamShield AI System Security`,
          html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
            <h2 style="color: #0c85eb; margin-top: 0;">Verify Your Account</h2>
            <p>Hello <strong>${user.name}</strong>,</p>
            <p>Thank you for registering on ExamShield AI. Use the verification code below to activate your candidate profile:</p>
            <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
              <span style="font-size: 24px; font-weight: bold; letter-spacing: 4px; color: #0f172a;">${verificationCode}</span>
            </div>
            <p style="font-size: 12px; color: #64748b;">If you did not initiate this request, please ignore this email.</p>
            <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
            <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">ExamShield AI Proctoring System</p>
          </div>`
        });
      } catch (err) {
        console.error("Failed to send verification email:", err.message);
      }

      return res.status(201).json({
        success: true,
        data: {
          _id: user._id,
          name: user.name,
          email: user.email,
          role: user.role,
          isVerified: user.isVerified,
          token: generateToken(user._id),
        },
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid user data' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Authenticate student / admin
// @route   POST /api/auth/login
// @access  Public
const loginUser = async (req, res) => {
  try {
    const { email, password, role } = req.body; // role specifies login intent ('student' or 'admin')

    if (!email || !password) {
      return res.status(400).json({ success: false, message: 'Please add email and password' });
    }

    const user = await User.findOne({ email }).select('+password');
    if (!user) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    // Verify role if specified (e.g. preventing student logging into admin or vice versa)
    if (role && user.role !== role) {
      return res.status(403).json({ success: false, message: `Access denied: Role mismatch` });
    }

    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: 'Invalid email or password' });
    }

    return res.status(200).json({
      success: true,
      data: {
        _id: user._id,
        name: user.name,
        email: user.email,
        role: user.role,
        isVerified: user.isVerified,
        token: generateToken(user._id),
      },
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Verify student email code
// @route   POST /api/auth/verify
// @access  Private
const verifyEmail = async (req, res) => {
  try {
    const { code } = req.body;
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }

    if (user.verificationCode === code) {
      user.isVerified = true;
      user.verificationCode = null;
      await user.save();
      return res.status(200).json({
        success: true,
        message: 'Email verified successfully',
        data: {
          isVerified: true,
        },
      });
    } else {
      return res.status(400).json({ success: false, message: 'Invalid verification code' });
    }
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found with this email' });
    }

    // Generate mock new password reset (e.g. resets password to password123)
    const tempPassword = 'reset' + Math.floor(1000 + Math.random() * 9000).toString();
    user.password = tempPassword;
    await user.save();

    try {
      await sendEmail({
        to: user.email,
        subject: 'ExamShield AI - Password Reset Request',
        text: `Hello ${user.name},\n\nYour ExamShield AI account password has been reset.\n\nYour temporary password is: ${tempPassword}\n\nPlease log in and update your password immediately.\n\nBest regards,\nExamShield AI Team`,
        html: `<div style="font-family: sans-serif; max-width: 500px; margin: 0 auto; padding: 20px; border: 1px solid #e2e8f0; border-radius: 12px;">
          <h2 style="color: #0c85eb; margin-top: 0;">Password Reset</h2>
          <p>Hello <strong>${user.name}</strong>,</p>
          <p>Your ExamShield AI account password has been successfully reset. Use the temporary credentials below to log in:</p>
          <div style="background-color: #f8fafc; border: 1px solid #cbd5e1; border-radius: 8px; padding: 15px; text-align: center; margin: 20px 0;">
            <span style="font-size: 18px; font-weight: bold; color: #0f172a;">${tempPassword}</span>
          </div>
          <p>Please change your password immediately after logging in.</p>
          <hr style="border: 0; border-top: 1px solid #e2e8f0; margin: 20px 0;" />
          <p style="font-size: 11px; color: #94a3b8; margin-bottom: 0;">ExamShield AI Proctoring System</p>
        </div>`
      });
    } catch (err) {
      console.error("Failed to send reset password email:", err.message);
    }

    return res.status(200).json({
      success: true,
      message: `Password reset instructions sent. For demonstration, your password has been reset to: ${tempPassword}`,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// @desc    Get current user profile
// @route   GET /api/auth/me
// @access  Private
const getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    return res.status(200).json({
      success: true,
      data: user,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

module.exports = {
  registerStudent,
  loginUser,
  verifyEmail,
  forgotPassword,
  getMe,
};
