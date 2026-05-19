const express = require('express');
const router = express.Router();
const focusController = require('../controllers/focusController');
const authMiddleware = require('../middleware/authMiddleware');
const focusValidation = require('../middleware/validation/focusValidation');

router.use(authMiddleware);

router.get('/', focusValidation.getFocusValidation, focusController.getFocusSessions);
router.post('/', focusValidation.createFocusValidation, focusController.createFocusSession);
router.patch('/:id', focusValidation.updateFocusValidation, focusController.updateFocusSession);
router.delete('/:id', focusValidation.deleteFocusValidation, focusController.deleteFocusSession);

module.exports = router;
