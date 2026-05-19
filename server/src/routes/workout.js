const express = require('express');
const router = express.Router();
const workoutController = require('../controllers/workoutController');
const authMiddleware = require('../middleware/authMiddleware');
const workoutValidation = require('../middleware/validation/workoutValidation');

router.use(authMiddleware);

router.get('/', workoutValidation.getWorkoutValidation, workoutController.getWorkouts);
router.post('/', workoutValidation.createWorkoutValidation, workoutController.createWorkout);
router.patch('/:id', workoutValidation.updateWorkoutValidation, workoutController.updateWorkout);
router.delete('/:id', workoutValidation.deleteWorkoutValidation, workoutController.deleteWorkout);

module.exports = router;
