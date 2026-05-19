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

const getScreenTimeValidation = [
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
  query('category')
    .optional()
    .isString()
    .withMessage('category must be a string')
    .trim(),
  handleValidation
];

const createScreenTimeValidation = [
  body('appName')
    .exists({ checkFalsy: true })
    .withMessage('appName is required')
    .isString()
    .withMessage('appName must be a string')
    .trim(),
  body('durationMinutes')
    .exists({ checkFalsy: true })
    .withMessage('durationMinutes is required')
    .isInt({ min: 1 })
    .withMessage('durationMinutes must be an integer greater than 0'),
  body('category')
    .exists({ checkFalsy: true })
    .withMessage('category is required')
    .isString()
    .withMessage('category must be a string')
    .trim(),
  body('loggedAt')
    .exists({ checkFalsy: true })
    .withMessage('loggedAt is required')
    .isISO8601()
    .withMessage('loggedAt must be a valid ISO 8601 date'),
  body('dailyTargetId')
    .optional({ nullable: true })
    .isString()
    .withMessage('dailyTargetId must be a string'),
  handleValidation
];

const updateScreenTimeValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  body('appName')
    .optional()
    .isString()
    .withMessage('appName must be a string')
    .trim(),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('durationMinutes must be an integer greater than 0'),
  body('category')
    .optional()
    .isString()
    .withMessage('category must be a string')
    .trim(),
  body('loggedAt')
    .optional()
    .isISO8601()
    .withMessage('loggedAt must be a valid ISO 8601 date'),
  handleValidation
];

const deleteScreenTimeValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  handleValidation
];

module.exports = {
  getScreenTimeValidation,
  createScreenTimeValidation,
  updateScreenTimeValidation,
  deleteScreenTimeValidation
};
