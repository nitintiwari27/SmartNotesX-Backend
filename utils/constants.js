export const BRANCHES = [
  'CSE',
  'AIML',
  'AIDS',
  'IT',
  'ECE',
  'EE',
  'ME',
  'CE',
  'BT',
  'MAE',
  'Other'
];

export const SEMESTERS = [1, 2, 3, 4, 5, 6, 7, 8];

export const FILE_TYPES = {
  PDF: 'application/pdf',
  DOCX: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  DOC: 'application/msword',
  JPG: 'image/jpeg',
  PNG: 'image/png',
};

export const ALLOWED_FILE_TYPES = Object.values(FILE_TYPES);

export const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

export const USER_ROLES = {
  STUDENT: 'student',
  ADMIN: 'admin',
};

export const NOTE_STATUS = {
  PENDING: 'pending',
  APPROVED: 'approved',
  REJECTED: 'rejected',
};