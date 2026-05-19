const express = require('express');
const router = express.Router();
const targetsController = require('../controllers/targetsController');
const authMiddleware = require('../middleware/authMiddleware');
const targetsValidation = require('../middleware/validation/targetsValidation');

router.use(authMiddleware);

router.get('/', targetsValidation.getTargetsValidation, targetsController.getTargets);
router.post('/', targetsValidation.createTargetValidation, targetsController.createTarget);
router.patch('/:id', targetsValidation.updateTargetValidation, targetsController.updateTarget);
router.delete('/:id', targetsValidation.deleteTargetValidation, targetsController.deleteTarget);

module.exports = router;
