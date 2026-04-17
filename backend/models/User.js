import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  username: { type: String, required: true, unique: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, enum: ['user', 'moderator'], default: 'user' },
  upvotedTerms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Term' }],
  downvotedTerms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Term' }],
  savedTerms: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Term' }],
  notifications: [{
    message: String,
    type: { type: String, enum: ['approval', 'suggestion_accepted', 'system'] },
    read: { type: Boolean, default: false },
    createdAt: { type: Date, default: Date.now }
  }],
  points: { type: Number, default: 0 }
}, { timestamps: true });

export default mongoose.model('User', userSchema);
