import express from 'express';
import {
  getDashboardStats,
  getAllUsers,
  toggleUserStatus,
  deleteUser,
  getAllNotes,
  deleteNoteAdmin,
} from '../controllers/adminController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';

const router = express.Router();

// All routes are protected and admin-only
router.use(protect, isAdmin);

// Dashboard
router.get('/stats', getDashboardStats);

// User management
router.get('/users', getAllUsers);
router.patch('/users/:id/toggle-status', toggleUserStatus);
router.delete('/users/:id', deleteUser);

// Note management
router.get('/notes', getAllNotes);
router.delete('/notes/:id', deleteNoteAdmin);

export default router;