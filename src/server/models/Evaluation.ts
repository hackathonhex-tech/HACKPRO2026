import mongoose from 'mongoose';

const ScoreSchema = new mongoose.Schema({
  criterionId: { type: mongoose.Schema.Types.ObjectId, required: true },
  score: { type: Number, required: true } // Actual score out of maxScore (e.g., 8 out of 10)
});

const MemberScoreSchema = new mongoose.Schema({
  memberId: { type: String, required: true }, // 'lead' or index
  name: { type: String, required: true },
  scores: [ScoreSchema],
  totalScore: { type: Number, default: 0 }
});

const EvaluationSchema = new mongoose.Schema({
  teamId: { type: mongoose.Schema.Types.ObjectId, ref: 'Team', required: true },
  judgeId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  roundId: { type: mongoose.Schema.Types.ObjectId, ref: 'Round', required: true },
  rubricId: { type: mongoose.Schema.Types.ObjectId, ref: 'Rubric', required: true },
  scores: [ScoreSchema],
  memberScores: [MemberScoreSchema],
  totalScore: { type: Number, default: 0 }, // Weighted total computed score for the team
  comment: { type: String }, // Private notes
  publicFeedback: { type: String }, // Optional public feedback
  isLocked: { type: Boolean, default: false }, // Once locked, judge cannot change it
  isFlagged: { type: Boolean, default: false } // Flagged for admin review
}, { timestamps: true });

EvaluationSchema.index({ teamId: 1, judgeId: 1, roundId: 1 }, { unique: true });

export default mongoose.models.Evaluation || mongoose.model('Evaluation', EvaluationSchema);
