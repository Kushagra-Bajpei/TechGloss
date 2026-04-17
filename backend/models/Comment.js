import mongoose from 'mongoose';

const commentSchema = new mongoose.Schema({
  term: { type: mongoose.Schema.Types.ObjectId, ref: 'Term', required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  text: { type: String, required: true }
}, { timestamps: true });

export default mongoose.model('Comment', commentSchema);
