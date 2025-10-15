import Bookmark from '../models/Bookmark.js';
import Note from '../models/Note.js';
import User from '../models/User.js';

// @desc    Add bookmark
// @route   POST /api/bookmarks/:noteId
// @access  Private
export const addBookmark = async (req, res) => {
  try {
    const { noteId } = req.params;

    // Check if note exists
    const note = await Note.findById(noteId);
    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check if already bookmarked
    const existingBookmark = await Bookmark.findOne({
      user: req.user._id,
      note: noteId,
    });

    if (existingBookmark) {
      return res.status(400).json({
        success: false,
        message: 'Note already bookmarked',
      });
    }

    // Create bookmark
    const bookmark = await Bookmark.create({
      user: req.user._id,
      note: noteId,
    });

    // Add to user's bookmarks array
    await User.findByIdAndUpdate(req.user._id, {
      $push: { bookmarks: noteId },
    });

    // Add to note's bookmarkedBy array
    await Note.findByIdAndUpdate(noteId, {
      $push: { bookmarkedBy: req.user._id },
    });

    res.status(201).json({
      success: true,
      message: 'Bookmark added successfully',
      data: bookmark,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Remove bookmark
// @route   DELETE /api/bookmarks/:noteId
// @access  Private
export const removeBookmark = async (req, res) => {
  try {
    const { noteId } = req.params;

    // Find and delete bookmark
    const bookmark = await Bookmark.findOneAndDelete({
      user: req.user._id,
      note: noteId,
    });

    if (!bookmark) {
      return res.status(404).json({
        success: false,
        message: 'Bookmark not found',
      });
    }

    // Remove from user's bookmarks array
    await User.findByIdAndUpdate(req.user._id, {
      $pull: { bookmarks: noteId },
    });

    // Remove from note's bookmarkedBy array
    await Note.findByIdAndUpdate(noteId, {
      $pull: { bookmarkedBy: req.user._id },
    });

    res.status(200).json({
      success: true,
      message: 'Bookmark removed successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all user bookmarks
// @route   GET /api/bookmarks
// @access  Private
export const getMyBookmarks = async (req, res) => {
  try {
    const bookmarks = await Bookmark.find({ user: req.user._id })
      .populate({
        path: 'note',
        populate: {
          path: 'uploadedBy',
          select: 'name email branch',
        },
      })
      .sort({ createdAt: -1 });

    const notes = bookmarks.map(bookmark => bookmark.note).filter(note => note !== null);

    res.status(200).json({
      success: true,
      data: notes,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Check if note is bookmarked
// @route   GET /api/bookmarks/check/:noteId
// @access  Private
export const checkBookmark = async (req, res) => {
  try {
    const { noteId } = req.params;

    const bookmark = await Bookmark.findOne({
      user: req.user._id,
      note: noteId,
    });

    res.status(200).json({
      success: true,
      data: {
        isBookmarked: !!bookmark,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};