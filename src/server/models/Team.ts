import mongoose from 'mongoose';

const TeamMemberSchema = new mongoose.Schema({
  name: { type: String, required: true },
  empId: { type: String },
  place: { type: String },
  supersetId: { type: String },
  contact: { type: String },
  email: { type: String },
  phone: { type: String },
  college: { type: String },
  department: { type: String },
  attendance: { type: Boolean, default: false },
  customFields: { type: mongoose.Schema.Types.Mixed, default: {} }
});

const TeamSchema = new mongoose.Schema({
  uniqueId: { type: String, unique: true, required: true },
  name: { type: String, required: true },
  leadName: { type: String, required: true },
  leadEmail: { type: String, required: true },
  leadPhone: { type: String },
  leadEmpId: { type: String },
  place: { type: String },
  leadSupersetId: { type: String },
  supersetId: { type: String },
  collegeName: { type: String },
  department: { type: String },
  members: [TeamMemberSchema],
  customFields: { type: mongoose.Schema.Types.Mixed, default: {} },
  problemStatementId: { type: mongoose.Schema.Types.ObjectId, ref: 'ProblemStatement' },
  selectedStack: { type: String },
  qrCodeString: { type: String, required: true },
  attendance: { type: Boolean, default: false },
  assignedJudges: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }]
}, { timestamps: true });

TeamSchema.index({ leadEmail: 1 }, { unique: true, sparse: true });

export default mongoose.models.Team || mongoose.model('Team', TeamSchema);
