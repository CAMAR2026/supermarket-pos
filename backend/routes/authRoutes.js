const express = require('express');
const { login, register, me } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');
const { authorize } = require('../middleware/roleMiddleware');

const router = express.Router();

router.post('/login', login);
router.post('/register', protect, authorize('admin'), register);
router.get('/me', protect, me);

module.exports = router;
