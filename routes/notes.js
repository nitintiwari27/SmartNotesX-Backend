import express from 'express';
import {
  uploadNote,
  getNotes,
  getNoteById,
  downloadNote,
  updateNote,
  deleteNote,
  getMyNotes,
} from '../controllers/noteController.js';
import { protect } from '../middleware/auth.js';
import { uploadSingle, handleUploadError } from '../middleware/upload.js';
import { noteValidation, validate } from '../utils/validateInput.js';

const router = express.Router();

// Public routes
router.get('/', getNotes);
router.get('/:id', getNoteById);
router.post('/:id/download', downloadNote);

// Protected routes
router.post(
  '/',
  protect,
  uploadSingle,
  handleUploadError,
  noteValidation,
  validate,
  uploadNote
);
router.get('/user/my-notes', protect, getMyNotes);
router.put('/:id', protect, updateNote);
router.delete('/:id', protect, deleteNote);

export default router;