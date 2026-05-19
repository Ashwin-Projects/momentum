const { body, param, query, validationResult } = require('express-validator');

const handleValidation = (req, res, next) => {
  const errors = validationResult(req);

  if (errors.isEmpty()) {
    return next();
  }

  return res.status(400).json({
    success: false,
    error: `Validation failed: ${errors.array().map((err) => err.msg).join(', ')}`,
    code: 400
  });
};

const getTargetsValidation = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('date must be a valid ISO 8601 date'),
  handleValidation
];

const createTargetValidation = [
  body('date')
    .exists({ checkFalsy: true })
    .withMessage('date is required')
    .isISO8601()
    .withMessage('date must be a valid ISO 8601 date'),
  body('studyMinutesGoal')
    .optional()
    .isInt({ min: 0 })
    .withMessage('studyMinutesGoal must be a non-negative integer'),
  body('workoutGoal')
    .optional()
    .isInt({ min: 0 })
    .withMessage('workoutGoal must be a non-negative integer'),
  body('caloriesGoal')
    .optional()
    .isInt({ min: 0 })
    .withMessage('caloriesGoal must be a non-negative integer'),
  body('sleepHoursGoal')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('sleepHoursGoal must be a number between 0 and 24'),
  handleValidation
];

const updateTargetValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  body('studyMinutesGoal')
    .optional()
    .isInt({ min: 0 })
    .withMessage('studyMinutesGoal must be a non-negative integer'),
  body('workoutGoal')
    .optional()
    .isInt({ min: 0 })
    .withMessage('workoutGoal must be a non-negative integer'),
  body('caloriesGoal')
    .optional()
    .isInt({ min: 0 })
    .withMessage('caloriesGoal must be a non-negative integer'),
  body('sleepHoursGoal')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('sleepHoursGoal must be a number between 0 and 24'),
  body('studyMinutesActual')
    .optional()
    .isInt({ min: 0 })
    .withMessage('studyMinutesActual must be a non-negative integer'),
  body('workoutsCompleted')
    .optional()
    .isInt({ min: 0 })
    .withMessage('workoutsCompleted must be a non-negative integer'),
  body('caloriesActual')
    .optional()
    .isInt({ min: 0 })
    .withMessage('caloriesActual must be a non-negative integer'),
  body('sleepHoursActual')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('sleepHoursActual must be a number between 0 and 24'),
  handleValidation
];

const deleteTargetValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  handleValidation
];

module.exports = {
  getTargetsValidation,
  createTargetValidation,
  updateTargetValidation,
  deleteTargetValidation
};
