import mongoose from 'mongoose';

const reportSchema = new mongoose.Schema({
  term: { type: mongoose.Schema.Types.ObjectId, ref: 'Term', required: true },
  reporter: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  reason: { type: String, required: true },
  status: { type: String, enum: ['pending', 'resolved'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Report', reportSchema);
