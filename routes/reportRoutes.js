const express = require('express');
const { protect } = require('../middleware/authMiddleware'); // if you want auth
const { analyzeReport } = require('../controllers/aiController');
const router = express.Router();

// POST /api/report/analyze
router.post('/analyze', protect, analyzeReport);

module.exports = router;
