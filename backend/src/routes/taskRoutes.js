const express = require('express');
const router = express.Router();
const {
  getTasks,
  getDashboardStats,
  createTask,
  updateTask,
  toggleStatus,
  deleteTask
} = require('../controllers/taskController');
const { authenticateToken } = require('../middleware/authMiddleware');

router.use(authenticateToken);

router.get('/', getTasks);
router.get('/dashboard-stats', getDashboardStats);
router.post('/', createTask);
router.put('/:id', updateTask);
router.patch('/:id/toggle-status', toggleStatus);
router.delete('/:id', deleteTask);

module.exports = router;
