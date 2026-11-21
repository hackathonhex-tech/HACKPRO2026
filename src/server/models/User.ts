import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
  email: { type: String, unique: true, sparse: true },
  uniqueId: { type: String, unique: true, required: true }, // For login
  password: { type: String, required: true },
  role: { type: String, enum: ['admin', 'judge', 'sub-admin'], required: true },
  assessmentMode: { type: String, enum: ['virtual', 'offline'], default: 'virtual' },
  customRoleId: { type: mongoose.Schema.Types.ObjectId, ref: 'Role' },
  name: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

export default mongoose.models.User || mongoose.model('User', UserSchema);
