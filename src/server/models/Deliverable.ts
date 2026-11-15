import mongoose from 'mongoose';

const DeliverableSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  roundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Round', required: true },
  githubLink: { type: String },
  deckUrl: { type: String },
  videoLink: { type: String },
  abstract: { type: String },
}, { timestamps: true });

DeliverableSchema.index({ teamId: 1, roundId: 1 }, { unique: true });

export default mongoose.models.Deliverable || mongoose.model('Deliverable', DeliverableSchema);
