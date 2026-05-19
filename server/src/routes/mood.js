const express = require('express');
const router = express.Router();
const moodController = require('../controllers/moodController');
const authMiddleware = require('../middleware/authMiddleware');
const moodValidation = require('../middleware/validation/moodValidation');

router.use(authMiddleware);

router.get('/', moodValidation.getMoodValidation, moodController.getMoodLogs);
router.post('/', moodValidation.createMoodValidation, moodController.createMoodLog);
router.patch('/:id', moodValidation.updateMoodValidation, moodController.updateMoodLog);
router.delete('/:id', moodValidation.deleteMoodValidation, moodController.deleteMoodLog);

module.exports = router;
