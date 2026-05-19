const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const authValidation = require('../middleware/validation/authValidation');
const authMiddleware = require('../middleware/authMiddleware');

router.post('/register', authValidation.registerValidation, authController.register);
router.post('/login', authValidation.loginValidation, authController.login);
router.post('/logout', authValidation.logoutValidation, authController.logout);
router.get('/me', authMiddleware, authController.getMe);

module.exports = router;
