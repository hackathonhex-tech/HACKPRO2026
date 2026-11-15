import mongoose from 'mongoose';

const RoundSchema = new mongoose.Schema({
  name: { type: String, required: true }, // e.g. "Round 1: Idea Phase"
  isActive: { type: Boolean, default: false },
  isSubmissionsOpen: { type: Boolean, default: false },
  activeRubricId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rubric' },
  activeMemberRubricId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rubric' },
  allowedTeamIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Team' }]
}, { timestamps: true });

// Clear cached model to ensure new schema properties (allowedTeamIds) are compiled
if (mongoose.models && mongoose.models.Round) {
  delete (mongoose.models as any).Round;
}

export default mongoose.model('Round', RoundSchema);
