const { body, validationResult } = require('express-validator');

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

const createNotificationValidation = [
  body('title')
    .exists({ checkFalsy: true })
    .withMessage('title is required')
    .isString()
    .withMessage('title must be a string')
    .trim()
    .notEmpty()
    .withMessage('title cannot be empty'),
  body('message')
    .exists({ checkFalsy: true })
    .withMessage('message is required')
    .isString()
    .withMessage('message must be a string')
    .trim()
    .notEmpty()
    .withMessage('message cannot be empty'),
  body('type')
    .optional()
    .isString()
    .withMessage('type must be a string')
    .isIn(['reminder', 'alert', 'info'])
    .withMessage('type must be one of: reminder, alert, info'),
  handleValidation
];

module.exports = {
  createNotificationValidation
};