import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
  name: { type: String, required: true },
  type: { type: String, required: true },
  size: { type: String, required: true },
  data: { type: Buffer, required: true },
  contentType: { type: String, required: true },
  instituteId: { type: String, required: true, index: true },
  category: { type: String, enum: ['personal', 'academic'], required: true },
  status: { type: String, enum: ['Pending', 'Approved', 'Rejected'], default: 'Pending', required: true },
  uploadedAt: { type: Date, default: Date.now }
}, { timestamps: true });

export default mongoose.models.Document || mongoose.model('Document', documentSchema);