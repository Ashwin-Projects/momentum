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

const getSleepValidation = [
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

const createSleepValidation = [
  body('date')
    .exists({ checkFalsy: true })
    .withMessage('date is required')
    .isISO8601()
    .withMessage('date must be a valid ISO 8601 date'),
  body('sleepHoursGoal')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('sleepHoursGoal must be a number between 0 and 24'),
  body('sleepHoursActual')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('sleepHoursActual must be a number between 0 and 24'),
  handleValidation
];

const updateSleepValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  body('sleepHoursGoal')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('sleepHoursGoal must be a number between 0 and 24'),
  body('sleepHoursActual')
    .optional()
    .isFloat({ min: 0, max: 24 })
    .withMessage('sleepHoursActual must be a number between 0 and 24'),
  handleValidation
];

const deleteSleepValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  handleValidation
];

module.exports = {
  getSleepValidation,
  createSleepValidation,
  updateSleepValidation,
  deleteSleepValidation
};
