import mongoose from 'mongoose';

const termSchema = new mongoose.Schema({
  name: { type: String, required: true },
  definition: { type: String, required: true },
  example: { type: String, required: true },
  category: { type: String, default: 'General' },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  upvotes: { type: Number, default: 0 },
  downvotes: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('Term', termSchema);
