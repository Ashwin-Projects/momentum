const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const authMiddleware = require('../middleware/authMiddleware');

router.use(authMiddleware);

router.get('/study', exportController.exportStudyCsv);
router.get('/workout', exportController.exportWorkoutCsv);
router.get('/nutrition', exportController.exportNutritionCsv);
router.get('/sleep', exportController.exportSleepCsv);
router.get('/all', exportController.exportAllJson);

module.exports = router;
