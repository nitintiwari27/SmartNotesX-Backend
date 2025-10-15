import mongoose from 'mongoose';
import { NOTE_STATUS } from '../utils/constants.js';

const noteSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title must not exceed 100 characters'],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [500, 'Description must not exceed 500 characters'],
    },
    subject: {
      type: String,
      required: [true, 'Subject is required'],
      trim: true,
    },
    semester: {
      type: Number,
      required: [true, 'Semester is required'],
      min: 1,
      max: 8,
    },
    branch: {
      type: String,
      required: [true, 'Branch is required'],
      trim: true,
    },
    fileUrl: {
      type: String,
      required: [true, 'File URL is required'],
    },
    fileType: {
      type: String,
      required: true,
    },
    fileSize: {
      type: Number, // in bytes
    },
    cloudinaryPublicId: {
      type: String,
      required: true,
    },
    uploadedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: Object.values(NOTE_STATUS),
      default: NOTE_STATUS.APPROVED, // Auto-approve for now
    },
    views: {
      type: Number,
      default: 0,
    },
    downloads: {
      type: Number,
      default: 0,
    },
    bookmarkedBy: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    tags: [{
      type: String,
      trim: true,
    }],
    rating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    ratingCount: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
noteSchema.index({ title: 'text', description: 'text', subject: 'text' });
noteSchema.index({ semester: 1, branch: 1, subject: 1 });
noteSchema.index({ uploadedBy: 1 });

// Method to increment views
noteSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
};

// Method to increment downloads
noteSchema.methods.incrementDownloads = async function () {
  this.downloads += 1;
  await this.save();
};

const Note = mongoose.model('Note', noteSchema);

export default Note;