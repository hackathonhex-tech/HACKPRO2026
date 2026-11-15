import mongoose from 'mongoose';

const ProblemStatementSchema = new mongoose.Schema({
  title: { type: String, required: true },
  description: { type: String, required: true },
  track: { type: String, required: true }, // e.g. "Web3", "AI", "Open Innovation"
  slotLimit: { type: Number, default: 0 },
  slotsFilled: { type: Number, default: 0 },
  isVisible: { type: Boolean, default: true },
  allowedStacks: [{ type: String }]
}, { timestamps: true });

export default mongoose.models.ProblemStatement || mongoose.model('ProblemStatement', ProblemStatementSchema);
