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

const getWorkoutValidation = [
  query('date')
    .optional()
    .isISO8601()
    .withMessage('date must be a valid ISO 8601 date'),
  query('startDate')
    .optional()
    .isISO8601()
    .withMessage('startDate must be a valid ISO 8601 date'),
  query('endDate')
    .optional()
    .isISO8601()
    .withMessage('endDate must be a valid ISO 8601 date'),
  handleValidation
];

const createWorkoutValidation = [
  body('type')
    .exists({ checkFalsy: true })
    .withMessage('type is required')
    .isString()
    .withMessage('type must be a string')
    .trim(),
  body('durationMinutes')
    .exists({ checkFalsy: true })
    .withMessage('durationMinutes is required')
    .isInt({ min: 1 })
    .withMessage('durationMinutes must be an integer greater than 0'),
  body('completedAt')
    .exists({ checkFalsy: true })
    .withMessage('completedAt is required')
    .isISO8601()
    .withMessage('completedAt must be a valid ISO 8601 date'),
  body('caloriesBurned')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('caloriesBurned must be a non-negative integer'),
  body('notes')
    .optional({ nullable: true })
    .isString()
    .withMessage('notes must be a string'),
  body('dailyTargetId')
    .optional({ nullable: true })
    .isString()
    .withMessage('dailyTargetId must be a string'),
  handleValidation
];

const updateWorkoutValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  body('type')
    .optional()
    .isString()
    .withMessage('type must be a string')
    .trim(),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('durationMinutes must be an integer greater than 0'),
  body('completedAt')
    .optional()
    .isISO8601()
    .withMessage('completedAt must be a valid ISO 8601 date'),
  body('caloriesBurned')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('caloriesBurned must be a non-negative integer'),
  body('notes')
    .optional({ nullable: true })
    .isString()
    .withMessage('notes must be a string'),
  handleValidation
];

const deleteWorkoutValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  handleValidation
];

module.exports = {
  getWorkoutValidation,
  createWorkoutValidation,
  updateWorkoutValidation,
  deleteWorkoutValidation
};
