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

const registerValidation = [
  body('name')
    .exists({ checkFalsy: true })
    .withMessage('name is required')
    .isString()
    .withMessage('name must be a string')
    .trim(),
  body('email')
    .exists({ checkFalsy: true })
    .withMessage('email is required')
    .isEmail()
    .withMessage('email must be a valid email')
    .normalizeEmail(),
  body('password')
    .exists({ checkFalsy: true })
    .withMessage('password is required')
    .isString()
    .withMessage('password must be a string')
    .isLength({ min: 6 })
    .withMessage('password must be at least 6 characters long'),
  handleValidation
];

const loginValidation = [
  body('email')
    .exists({ checkFalsy: true })
    .withMessage('email is required')
    .isEmail()
    .withMessage('email must be a valid email')
    .normalizeEmail(),
  body('password')
    .exists({ checkFalsy: true })
    .withMessage('password is required')
    .isString()
    .withMessage('password must be a string'),
  handleValidation
];

const logoutValidation = [handleValidation];

module.exports = {
  registerValidation,
  loginValidation,
  logoutValidation
};
