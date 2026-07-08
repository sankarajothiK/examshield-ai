const express = require('express');
const multer = require('multer');
const { uploadQuestionsFile, uploadScreenshot, uploadVerification, extractExamFromPdfs } = require('../controllers/uploadController');
const { protect, admin } = require('../middleware/auth');

const router = express.Router();

// Memory storage configuration for document parsing
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10 MB limit for PDFs / images
  fileFilter: (req, file, cb) => {
    const filetypes = /csv|txt|pdf|docx|xlsx|xls|png|jpg|jpeg|gif/;
    const extname = filetypes.test(file.originalname.toLowerCase());
    if (extname) {
      return cb(null, true);
    }
    cb(new Error('Uploaded file type is not supported.'));
  },
});

router.post('/questions', protect, admin, upload.single('file'), uploadQuestionsFile);
router.post('/screenshot', protect, uploadScreenshot);
router.post('/verification', protect, upload.single('file'), uploadVerification);
router.post('/extract-exam', protect, admin, upload.fields([
  { name: 'questionPaper', maxCount: 1 },
  { name: 'answerKey', maxCount: 1 }
]), extractExamFromPdfs);

module.exports = router;
