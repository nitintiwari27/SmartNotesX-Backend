import express from 'express';
import {
  createJob,
  getJobs,
  getJobById,
  updateJob,
  deleteJob,
  applyForJob,
  getMyApplications,
  getJobApplications,
} from '../controllers/jobController.js';
import { protect } from '../middleware/auth.js';
import { isAdmin } from '../middleware/admin.js';

const router = express.Router();

// Public routes
router.get('/', getJobs);
router.get('/:id', getJobById);

// Protected routes
router.post('/:id/apply', protect, applyForJob);
router.get('/user/my-applications', protect, getMyApplications);

// Admin routes
router.post('/', protect, isAdmin, createJob);
router.put('/:id', protect, isAdmin, updateJob);
router.delete('/:id', protect, isAdmin, deleteJob);
router.get('/:id/applications', protect, isAdmin, getJobApplications);

export default router;