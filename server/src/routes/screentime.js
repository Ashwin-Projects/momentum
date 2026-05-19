const express = require('express');
const router = express.Router();
const screenTimeController = require('../controllers/screenTimeController');
const authMiddleware = require('../middleware/authMiddleware');
const screenTimeValidation = require('../middleware/validation/screentimeValidation');

router.use(authMiddleware);

router.get('/', screenTimeValidation.getScreenTimeValidation, screenTimeController.getScreenTimeLogs);
router.post('/', screenTimeValidation.createScreenTimeValidation, screenTimeController.createScreenTimeLog);
router.patch('/:id', screenTimeValidation.updateScreenTimeValidation, screenTimeController.updateScreenTimeLog);
router.delete('/:id', screenTimeValidation.deleteScreenTimeValidation, screenTimeController.deleteScreenTimeLog);

module.exports = router;
