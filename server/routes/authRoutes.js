const express = require('express');
const {
  registerStudent,
  loginUser,
  verifyEmail,
  forgotPassword,
  getMe,
} = require('../controllers/authController');
const { protect } = require('../middleware/auth');

const router = express.Router();

router.post('/register', registerStudent);
router.post('/login', loginUser);
router.post('/verify', protect, verifyEmail);
router.post('/forgot-password', forgotPassword);
router.get('/me', protect, getMe);

module.exports = router;
