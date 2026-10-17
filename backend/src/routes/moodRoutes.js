const express = require('express');
const router = express.Router();
const { getLatestMood, logMood, getRecommendations } = require('../controllers/moodController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/latest', getLatestMood);
router.post('/log', logMood);
router.get('/recommendations', getRecommendations);

module.exports = router;
