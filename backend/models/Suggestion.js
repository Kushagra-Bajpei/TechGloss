import mongoose from 'mongoose';

const suggestionSchema = new mongoose.Schema({
  term: { type: mongoose.Schema.Types.ObjectId, ref: 'Term', required: true },
  suggestedDefinition: { type: String, required: true },
  suggestedExample: { type: String, required: true },
  author: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' }
}, { timestamps: true });

export default mongoose.model('Suggestion', suggestionSchema);
