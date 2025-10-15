import express from 'express';
import {
  addBookmark,
  removeBookmark,
  getMyBookmarks,
  checkBookmark,
} from '../controllers/bookmarkController.js';
import { protect } from '../middleware/auth.js';

const router = express.Router();

// All routes are protected
router.use(protect);

router.get('/', getMyBookmarks);
router.post('/:noteId', addBookmark);
router.delete('/:noteId', removeBookmark);
router.get('/check/:noteId', checkBookmark);

export default router;