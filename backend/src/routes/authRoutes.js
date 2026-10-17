const express = require('express');
const router = express.Router();
const { register, login, getMe, updateCapacity } = require('../controllers/authController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.post('/register', register);
router.post('/login', login);
router.get('/me', authenticateToken, getMe);
router.put('/capacity', authenticateToken, updateCapacity);

module.exports = router;
