import mongoose from 'mongoose';

const SettingsSchema = new mongoose.Schema({
  isLeaderboardVisible: { type: Boolean, default: true }, // Legacy
  isPublicLeaderboardVisible: { type: Boolean, default: true },
  isTeamLeaderboardVisible: { type: Boolean, default: true },
  hideTeamDetailsOnLeaderboard: { type: Boolean, default: false },
  isRegistrationOpen: { type: Boolean, default: true },
  maxTeamSize: { type: Number, default: 4 },
  leaderboardFilters: {
    round: { type: Boolean, default: true },
    judge: { type: Boolean, default: true },
    problemStatement: { type: Boolean, default: true }
  }
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
