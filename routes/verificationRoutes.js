const express = require('express');
const router = express.Router();
const controller = require('../controllers/verificationController');
const multer = require('multer');
const authMiddleware = require('../middlewares/authMiddleware');

// Multer configuration
const upload = multer({
  dest: 'uploads/tmp/',
  limits: { fileSize: 2 * 1024 * 1024 }, // 2MB
  fileFilter: (req, file, cb) => {
    if (['application/pdf', 'image/jpeg', 'image/png'].includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new Error('Invalid file type. Only PDF, JPG, PNG allowed'), false);
    }
  }
});

// Routes
router.post(
  '/',
  authMiddleware,
  upload.single('proof'),
  controller.submitVerification
);

router.get(
  '/',
  authMiddleware,
  controller.getAllVerifications
);

router.get(
  '/files/:filename',
  authMiddleware,
  controller.serveVerificationFile
);

// Error handling middleware
router.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({ error: err.message });
  } else if (err) {
    return res.status(400).json({ error: err.message });
  }
  next();
});

module.exports = router;