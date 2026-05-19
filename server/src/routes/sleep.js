const express = require('express');
const router = express.Router();
const sleepController = require('../controllers/sleepController');
const authMiddleware = require('../middleware/authMiddleware');
const sleepValidation = require('../middleware/validation/sleepValidation');

router.use(authMiddleware);

router.get('/', sleepValidation.getSleepValidation, sleepController.getSleepLogs);
router.post('/', sleepValidation.createSleepValidation, sleepController.logSleep);
router.patch('/:id', sleepValidation.updateSleepValidation, sleepController.updateSleepLog);
router.delete('/:id', sleepValidation.deleteSleepValidation, sleepController.deleteSleepLog);

module.exports = router;
