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

const updateProfileValidation = [
  body('name')
    .optional()
    .isString()
    .withMessage('name must be a string')
    .trim()
    .notEmpty()
    .withMessage('name cannot be empty'),
  body('email')
    .optional()
    .isEmail()
    .withMessage('email must be a valid email')
    .normalizeEmail(),
  handleValidation
];

const updatePasswordValidation = [
  body('currentPassword')
    .exists({ checkFalsy: true })
    .withMessage('current password is required')
    .isString()
    .withMessage('current password must be a string'),
  body('newPassword')
    .exists({ checkFalsy: true })
    .withMessage('new password is required')
    .isString()
    .withMessage('new password must be a string')
    .isLength({ min: 6 })
    .withMessage('new password must be at least 6 characters long'),
  handleValidation
];

module.exports = {
  updateProfileValidation,
  updatePasswordValidation
};