import User from '../models/User.js';
import Note from '../models/Note.js';
import cloudinary from '../config/cloudinary.js';

// @desc    Get dashboard statistics
// @route   GET /api/admin/stats
// @access  Private/Admin
export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments({ role: 'student' });
    const totalNotes = await Note.countDocuments();
    const totalDownloads = await Note.aggregate([
      { $group: { _id: null, total: { $sum: '$downloads' } } },
    ]);
    const totalViews = await Note.aggregate([
      { $group: { _id: null, total: { $sum: '$views' } } },
    ]);

    // Get notes by branch
    const notesByBranch = await Note.aggregate([
      { $group: { _id: '$branch', count: { $count: {} } } },
      { $sort: { count: -1 } },
    ]);

    // Get notes by semester
    const notesBySemester = await Note.aggregate([
      { $group: { _id: '$semester', count: { $count: {} } } },
      { $sort: { _id: 1 } },
    ]);

    // Get top contributors
    const topContributors = await User.aggregate([
      {
        $lookup: {
          from: 'notes',
          localField: '_id',
          foreignField: 'uploadedBy',
          as: 'notes',
        },
      },
      {
        $project: {
          name: 1,
          email: 1,
          branch: 1,
          notesCount: { $size: '$notes' },
        },
      },
      { $sort: { notesCount: -1 } },
      { $limit: 5 },
    ]);

    // Recent uploads
    const recentNotes = await Note.find()
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalUsers,
          totalNotes,
          totalDownloads: totalDownloads[0]?.total || 0,
          totalViews: totalViews[0]?.total || 0,
        },
        notesByBranch,
        notesBySemester,
        topContributors,
        recentNotes,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all users
// @route   GET /api/admin/users
// @access  Private/Admin
export const getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20, search, role } = req.query;

    const query = {};
    if (search) {
      query.$or = [
        { name: new RegExp(search, 'i') },
        { email: new RegExp(search, 'i') },
      ];
    }
    if (role) query.role = role;

    const skip = (page - 1) * limit;

    const users = await User.find(query)
      .select('-password')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await User.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        users,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Toggle user active status
// @route   PATCH /api/admin/users/:id/toggle-status
// @access  Private/Admin
export const toggleUserStatus = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot deactivate admin users',
      });
    }

    user.isActive = !user.isActive;
    await user.save();

    res.status(200).json({
      success: true,
      message: `User ${user.isActive ? 'activated' : 'deactivated'} successfully`,
      data: user,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete user
// @route   DELETE /api/admin/users/:id
// @access  Private/Admin
export const deleteUser = async (req, res) => {
  try {
    const user = await User.findById(req.params.id);

    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found',
      });
    }

    if (user.role === 'admin') {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete admin users',
      });
    }

    // Delete all notes uploaded by this user
    const userNotes = await Note.find({ uploadedBy: user._id });
    
    for (const note of userNotes) {
      await cloudinary.uploader.destroy(note.cloudinaryPublicId, {
        resource_type: note.fileType.startsWith('image/') ? 'image' : 'raw',
      });
      await Note.findByIdAndDelete(note._id);
    }

    // Delete user
    await User.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'User and associated notes deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all notes (admin view)
// @route   GET /api/admin/notes
// @access  Private/Admin
export const getAllNotes = async (req, res) => {
  try {
    const { page = 1, limit = 20, status, branch, semester } = req.query;

    const query = {};
    if (status) query.status = status;
    if (branch) query.branch = branch;
    if (semester) query.semester = semester;

    const skip = (page - 1) * limit;

    const notes = await Note.find(query)
      .populate('uploadedBy', 'name email branch')
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .skip(skip);

    const total = await Note.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        notes,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
        },
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete note (admin)
// @route   DELETE /api/admin/notes/:id
// @access  Private/Admin
export const deleteNoteAdmin = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Delete from Cloudinary
    await cloudinary.uploader.destroy(note.cloudinaryPublicId, {
      resource_type: note.fileType.startsWith('image/') ? 'image' : 'raw',
    });

    // Remove from user's uploadedNotes
    await User.findByIdAndUpdate(note.uploadedBy, {
      $pull: { uploadedNotes: note._id },
    });

    // Delete note
    await Note.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: 'Note deleted successfully',
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};