const mongoose = require('mongoose');

const DocumentRequestSchema = new mongoose.Schema({
  resident: { type: mongoose.Schema.Types.ObjectId, ref: 'Resident', required: true },
  type: { type: String, enum: ['certificate', 'clearance', 'indigency'], required: true },
  fields: { type: Map, of: String, default: {} },
  purpose: { type: String },
  status: { type: String, enum: ['pending', 'approved', 'processing', 'rejected', 'ready_for_pickup', 'completed'], default: 'pending' },
  adminEdits: { type: Map, of: String, default: {} },
  generatedFileName: { type: String, trim: true, default: '' },
  generatedFileUrl: { type: String, trim: true, default: '' },
  generatedAt: { type: Date },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

DocumentRequestSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  if (typeof next === 'function') return next();
});

module.exports = mongoose.model('DocumentRequest', DocumentRequestSchema);
