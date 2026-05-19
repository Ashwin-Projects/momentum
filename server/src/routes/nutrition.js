const express = require('express');
const router = express.Router();
const nutritionController = require('../controllers/nutritionController');
const authMiddleware = require('../middleware/authMiddleware');
const nutritionValidation = require('../middleware/validation/nutritionValidation');

router.use(authMiddleware);

router.get('/lookup', nutritionController.getNutritionLookup);
router.get('/', nutritionValidation.getNutritionValidation, nutritionController.getNutritionLogs);
router.post('/', nutritionValidation.createNutritionValidation, nutritionController.createNutritionLog);
router.patch('/:id', nutritionValidation.updateNutritionValidation, nutritionController.updateNutritionLog);
router.delete('/:id', nutritionValidation.deleteNutritionValidation, nutritionController.deleteNutritionLog);

module.exports = router;
