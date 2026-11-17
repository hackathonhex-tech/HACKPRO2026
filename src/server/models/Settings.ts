import mongoose from 'mongoose';

const FieldConfigSchema = new mongoose.Schema({
  id: { type: String, required: true },
  key: { type: String, required: true },
  label: { type: String, required: true },
  type: { type: String, default: 'text' }, // text, number, email, tel, select, textarea
  placeholder: { type: String, default: '' },
  required: { type: Boolean, default: false },
  enabled: { type: Boolean, default: true },
  isCustom: { type: Boolean, default: false },
  options: [{ type: String }],
  description: { type: String, default: '' }
}, { _id: false });

const RegistrationFieldsConfigSchema = new mongoose.Schema({
  teamFields: [FieldConfigSchema],
  memberFields: [FieldConfigSchema]
}, { _id: false });

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
  },
  registrationFieldsConfig: { type: RegistrationFieldsConfigSchema, default: null }
}, { timestamps: true });

export default mongoose.models.Settings || mongoose.model('Settings', SettingsSchema);
