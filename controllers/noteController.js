import Note from '../models/Note.js';
import User from '../models/User.js';
import cloudinary from '../config/cloudinary.js';
import { Readable } from 'stream';

// Helper function to upload to Cloudinary
const uploadToCloudinary = (buffer, options) => {
  return new Promise((resolve, reject) => {
    const uploadStream = cloudinary.uploader.upload_stream(
      options,
      (error, result) => {
        if (error) reject(error);
        else resolve(result);
      }
    );
    
    const readableStream = new Readable();
    readableStream.push(buffer);
    readableStream.push(null);
    readableStream.pipe(uploadStream);
  });
};

// @desc    Upload a new note
// @route   POST /api/notes
// @access  Private
export const uploadNote = async (req, res) => {
  try {
    const { title, description, subject, semester, branch, tags } = req.body;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Please upload a file',
      });
    }

    // Determine resource type based on file mimetype
    let resourceType = 'auto';
    if (req.file.mimetype.startsWith('image/')) {
      resourceType = 'image';
    } else {
      resourceType = 'raw'; // For PDFs and documents
    }

    // Upload to Cloudinary
    const result = await uploadToCloudinary(req.file.buffer, {
      folder: 'study-hub-notes',
      resource_type: resourceType,
      format: req.file.mimetype.includes('pdf') ? 'pdf' : undefined,
    });


    // Create note in database
    const note = await Note.create({
      title,
      description,
      subject,
      semester,
      branch,
      fileUrl: result.secure_url,
      fileType: req.file.mimetype,
      fileSize: req.file.size,
      cloudinaryPublicId: result.public_id,
      uploadedBy: req.user._id,
      tags: tags ? tags.split(',').map(tag => tag.trim()) : [],
    });

    // Add note to user's uploadedNotes
    await User.findByIdAndUpdate(req.user._id, {
      $push: { uploadedNotes: note._id },
    });

    const populatedNote = await Note.findById(note._id).populate(
      'uploadedBy',
      'name email branch'
    );

    res.status(201).json({
      success: true,
      message: 'Note uploaded successfully',
      data: populatedNote,
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Get all notes with filters
// @route   GET /api/notes
// @access  Public
export const getNotes = async (req, res) => {
  try {
    const {
      semester,
      branch,
      subject,
      search,
      page = 1,
      limit = 12,
      sortBy = 'createdAt',
      order = 'desc',
    } = req.query;

    // Build query
    const query = { status: 'approved' };

    if (semester) query.semester = semester;
    if (branch) query.branch = branch;
    if (subject) query.subject = new RegExp(subject, 'i');
    if (search) {
      query.$or = [
        { title: new RegExp(search, 'i') },
        { description: new RegExp(search, 'i') },
        { subject: new RegExp(search, 'i') },
      ];
    }

    // Calculate pagination
    const skip = (page - 1) * limit;

    // Execute query
    const notes = await Note.find(query)
      .populate('uploadedBy', 'name email branch')
      .sort({ [sortBy]: order === 'desc' ? -1 : 1 })
      .limit(parseInt(limit))
      .skip(skip);

    // Get total count
    const total = await Note.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        notes,
        pagination: {
          total,
          page: parseInt(page),
          pages: Math.ceil(total / limit),
          limit: parseInt(limit),
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

// @desc    Get single note by ID
// @route   GET /api/notes/:id
// @access  Public
export const getNoteById = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id).populate(
      'uploadedBy',
      'name email branch'
    );

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Increment views
    await note.incrementViews();

    res.status(200).json({
      success: true,
      data: note,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Download note (increment download count)
// @route   POST /api/notes/:id/download
// @access  Public
export const downloadNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    await note.incrementDownloads();

    res.status(200).json({
      success: true,
      message: 'Download count incremented',
      data: { fileUrl: note.fileUrl },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Update note
// @route   PUT /api/notes/:id
// @access  Private
export const updateNote = async (req, res) => {
  try {
    const { title, description, subject, semester, branch, tags } = req.body;

    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check ownership
    if (note.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to update this note',
      });
    }

    // Update fields
    note.title = title || note.title;
    note.description = description || note.description;
    note.subject = subject || note.subject;
    note.semester = semester || note.semester;
    note.branch = branch || note.branch;
    if (tags) {
      note.tags = tags.split(',').map(tag => tag.trim());
    }

    const updatedNote = await note.save();

    res.status(200).json({
      success: true,
      message: 'Note updated successfully',
      data: updatedNote,
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// @desc    Delete note
// @route   DELETE /api/notes/:id
// @access  Private
export const deleteNote = async (req, res) => {
  try {
    const note = await Note.findById(req.params.id);

    if (!note) {
      return res.status(404).json({
        success: false,
        message: 'Note not found',
      });
    }

    // Check ownership or admin
    if (note.uploadedBy.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to delete this note',
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

// @desc    Get user's uploaded notes
// @route   GET /api/notes/my-notes
// @access  Private
export const getMyNotes = async (req, res) => {
  try {
    const notes = await Note.find({ uploadedBy: req.user._id })
      .populate('uploadedBy', 'name email')
      .sort({ createdAt: -1 });

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