const express = require('express');
const router = express.Router();
const analyticsController = require('../controllers/analyticsController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/summary', analyticsController.getAnalyticsSummary);
router.get('/trends', analyticsController.getAnalyticsTrends);
router.get('/mood-trends', analyticsController.getMoodTrends);
router.get('/focus-trends', analyticsController.getFocusTrends);
router.get('/screentime-breakdown', analyticsController.getScreenTimeBreakdown);
router.get('/productivity-score', analyticsController.getProductivityScore);

module.exports = router;
