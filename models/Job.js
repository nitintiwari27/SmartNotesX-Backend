import mongoose from 'mongoose';

const jobSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Job title is required'],
      trim: true,
      minlength: [3, 'Title must be at least 3 characters'],
      maxlength: [100, 'Title must not exceed 100 characters'],
    },
    company: {
      type: String,
      required: [true, 'Company name is required'],
      trim: true,
    },
    companyLogo: {
      type: String,
      default: 'https://via.placeholder.com/100',
    },
    description: {
      type: String,
      required: [true, 'Description is required'],
      minlength: [20, 'Description must be at least 20 characters'],
    },
    type: {
      type: String,
      enum: ['Job', 'Internship'],
      required: true,
    },
    location: {
      type: String,
      required: [true, 'Location is required'],
    },
    locationType: {
      type: String,
      enum: ['Remote', 'On-site', 'Hybrid'],
      default: 'On-site',
    },
    salary: {
      min: { type: Number },
      max: { type: Number },
      currency: { type: String, default: 'INR' },
    },
    stipend: {
      amount: { type: Number },
      currency: { type: String, default: 'INR' },
      duration: { type: String }, // e.g., "per month"
    },
    duration: {
      type: String, // e.g., "3 months", "6 months"
    },
    skills: [{
      type: String,
      trim: true,
    }],
    eligibility: {
      branches: [{ type: String }], // e.g., ['CSE', 'IT', 'ECE']
      minCGPA: { type: Number },
      graduationYear: [{ type: Number }], // e.g., [2024, 2025]
    },
    applicationDeadline: {
      type: Date,
      required: [true, 'Application deadline is required'],
    },
    applyLink: {
      type: String,
      required: [true, 'Application link is required'],
    },
    postedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    status: {
      type: String,
      enum: ['active', 'closed', 'draft'],
      default: 'active',
    },
    applicants: [{
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    }],
    views: {
      type: Number,
      default: 0,
    },
    isVerified: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Index for faster searches
jobSchema.index({ title: 'text', company: 'text', description: 'text' });
jobSchema.index({ type: 1, status: 1 });
jobSchema.index({ applicationDeadline: 1 });

// Method to increment views
jobSchema.methods.incrementViews = async function () {
  this.views += 1;
  await this.save();
};

const Job = mongoose.model('Job', jobSchema);

export default Job;