const express = require('express');
const multer = require('multer');
const { uploadQuestionsFile, uploadScreenshot } = require('../controllers/uploadController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Memory storage configuration for document parsing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
  fileFilter: (req, file, cb) => {
    const filetypes = /csv|txt|pdf|docx|xlsx|xls/;
    const extname = filetypes.test(file.originalname.toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Only document files (CSV, TXT, PDF, DOCX, XLSX) are allowed'));
  },
});

router.post('/questions', protect, admin, upload.single('file'), uploadQuestionsFile);
router.post('/screenshot', protect, uploadScreenshot);

module.exports = router;
