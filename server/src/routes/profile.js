const express = require('express');
const router = express.Router();
const profileController = require('../controllers/profileController');
const profileValidation = require('../middleware/validation/profileValidation');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, profileController.getProfile);
router.patch('/', authMiddleware, profileValidation.updateProfileValidation, profileController.updateProfile);
router.patch('/password', authMiddleware, profileValidation.updatePasswordValidation, profileController.updatePassword);

module.exports = router;