const express = require('express');
const router = express.Router();
const { analyzeRisk, analyzeComplaintText, chatWithAssistant } = require('../controllers/aiController');
const { protect } = require('../middleware/auth');

router.use(protect);

router.post('/analyze-risk', analyzeRisk);
router.post('/analyze-complaint', analyzeComplaintText);
router.post('/chat', chatWithAssistant);

module.exports = router;
