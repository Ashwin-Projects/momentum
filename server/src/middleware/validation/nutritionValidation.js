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

const getNutritionValidation = [
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

const createNutritionValidation = [
  body('mealType')
    .exists({ checkFalsy: true })
    .withMessage('mealType is required')
    .isString()
    .withMessage('mealType must be a string')
    .trim(),
  body('foodName')
    .exists({ checkFalsy: true })
    .withMessage('foodName is required')
    .isString()
    .withMessage('foodName must be a string')
    .trim(),
  body('calories')
    .exists({ checkFalsy: true })
    .withMessage('calories is required')
    .isInt({ min: 0 })
    .withMessage('calories must be a non-negative integer'),
  body('loggedAt')
    .exists({ checkFalsy: true })
    .withMessage('loggedAt is required')
    .isISO8601()
    .withMessage('loggedAt must be a valid ISO 8601 date'),
  body('proteinGrams')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('proteinGrams must be a non-negative integer'),
  body('carbsGrams')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('carbsGrams must be a non-negative integer'),
  body('fatGrams')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('fatGrams must be a non-negative integer'),
  body('dailyTargetId')
    .optional({ nullable: true })
    .isString()
    .withMessage('dailyTargetId must be a string'),
  handleValidation
];

const updateNutritionValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  body('mealType')
    .optional()
    .isString()
    .withMessage('mealType must be a string')
    .trim(),
  body('foodName')
    .optional()
    .isString()
    .withMessage('foodName must be a string')
    .trim(),
  body('calories')
    .optional()
    .isInt({ min: 0 })
    .withMessage('calories must be a non-negative integer'),
  body('proteinGrams')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('proteinGrams must be a non-negative integer'),
  body('carbsGrams')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('carbsGrams must be a non-negative integer'),
  body('fatGrams')
    .optional({ nullable: true })
    .isInt({ min: 0 })
    .withMessage('fatGrams must be a non-negative integer'),
  body('loggedAt')
    .optional()
    .isISO8601()
    .withMessage('loggedAt must be a valid ISO 8601 date'),
  handleValidation
];

const deleteNutritionValidation = [
  param('id')
    .exists({ checkFalsy: true })
    .withMessage('id is required')
    .isString()
    .withMessage('id must be a string'),
  handleValidation
];

module.exports = {
  getNutritionValidation,
  createNutritionValidation,
  updateNutritionValidation,
  deleteNutritionValidation
};
