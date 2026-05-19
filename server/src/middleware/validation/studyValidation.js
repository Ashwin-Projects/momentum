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

const getStudyValidation = [
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

const createStudyValidation = [
  body('subject')
    .exists({ checkFalsy: true })
    .withMessage('subject is required')
    .isString()
    .withMessage('subject must be a string')
    .trim(),
  body('durationMinutes')
    .exists({ checkFalsy: true })
    .withMessage('durationMinutes is required')
    .isInt({ min: 1 })
    .withMessage('durationMinutes must be an integer greater than 0'),
  body('startedAt')
    .exists({ checkFalsy: true })
    .withMessage('startedAt is required')
    .isISO8601()
    .withMessage('startedAt must be a valid ISO 8601 date'),
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

const updateStudyValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  body('subject')
    .optional()
    .isString()
    .withMessage('subject must be a string')
    .trim(),
  body('durationMinutes')
    .optional()
    .isInt({ min: 1 })
    .withMessage('durationMinutes must be an integer greater than 0'),
  body('startedAt')
    .optional()
    .isISO8601()
    .withMessage('startedAt must be a valid ISO 8601 date'),
  body('notes')
    .optional({ nullable: true })
    .isString()
    .withMessage('notes must be a string'),
  handleValidation
];

const deleteStudyValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  handleValidation
];

module.exports = {
  getStudyValidation,
  createStudyValidation,
  updateStudyValidation,
  deleteStudyValidation
};
