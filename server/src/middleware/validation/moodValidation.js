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

const getMoodValidation = [
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

const createMoodValidation = [
  body('mood')
    .exists({ checkFalsy: true })
    .withMessage('mood is required')
    .isString()
    .withMessage('mood must be a string')
    .trim(),
  body('loggedAt')
    .exists({ checkFalsy: true })
    .withMessage('loggedAt is required')
    .isISO8601()
    .withMessage('loggedAt must be a valid ISO 8601 date'),
  body('energyLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('energyLevel must be an integer between 1 and 10'),
  body('stressLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('stressLevel must be an integer between 1 and 10'),
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

const updateMoodValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  body('mood')
    .optional()
    .isString()
    .withMessage('mood must be a string')
    .trim(),
  body('loggedAt')
    .optional()
    .isISO8601()
    .withMessage('loggedAt must be a valid ISO 8601 date'),
  body('energyLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('energyLevel must be an integer between 1 and 10'),
  body('stressLevel')
    .optional()
    .isInt({ min: 1, max: 10 })
    .withMessage('stressLevel must be an integer between 1 and 10'),
  body('notes')
    .optional({ nullable: true })
    .isString()
    .withMessage('notes must be a string'),
  handleValidation
];

const deleteMoodValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  handleValidation
];

module.exports = {
  getMoodValidation,
  createMoodValidation,
  updateMoodValidation,
  deleteMoodValidation
};
