const express = require('express');
const router = express.Router();
const { getAllUsers, createUser, updateUser, deleteUser } = require('../controllers/adminController');
const { authenticateToken, requireSuperAdmin } = require('../middleware/authMiddleware');

router.use(authenticateToken, requireSuperAdmin);

router.get('/users', getAllUsers);
router.post('/users', createUser);
router.put('/users/:id', updateUser);
router.delete('/users/:id', deleteUser);

module.exports = router;
