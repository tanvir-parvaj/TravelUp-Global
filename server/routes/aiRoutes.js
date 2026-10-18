const express = require('express');
const router = express.Router();
const aiController = require('../controllers/aiController');

router.post('/budget', aiController.calculateBudget);
router.post('/quiz', aiController.quizRecommendation);
router.post('/assistant', aiController.askAssistant);

module.exports = router;
