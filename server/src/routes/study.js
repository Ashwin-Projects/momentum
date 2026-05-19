const express = require('express');
const router = express.Router();
const studyController = require('../controllers/studyController');
const authMiddleware = require('../middleware/authMiddleware');
const studyValidation = require('../middleware/validation/studyValidation');

router.use(authMiddleware);

router.get('/', studyValidation.getStudyValidation, studyController.getStudySessions);
router.post('/', studyValidation.createStudyValidation, studyController.createStudySession);
router.patch('/:id', studyValidation.updateStudyValidation, studyController.updateStudySession);
router.delete('/:id', studyValidation.deleteStudyValidation, studyController.deleteStudySession);

module.exports = router;
