const express = require('express');
const router = express.Router();
const aiPlannerController = require('../controllers/aiPlannerController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/context', aiPlannerController.getAIContext);
router.post('/chat', aiPlannerController.chatWithAI);

module.exports = router;
