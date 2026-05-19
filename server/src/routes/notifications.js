const express = require('express');
const router = express.Router();
const notificationController = require('../controllers/notificationController');
const notificationValidation = require('../middleware/validation/notificationValidation');
const authMiddleware = require('../middleware/authMiddleware');

router.get('/', authMiddleware, notificationController.getNotifications);
router.post('/', authMiddleware, notificationValidation.createNotificationValidation, notificationController.createNotification);
router.patch('/:id/read', authMiddleware, notificationController.markAsRead);
router.delete('/:id', authMiddleware, notificationController.deleteNotification);

module.exports = router;