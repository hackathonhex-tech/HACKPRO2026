import mongoose from 'mongoose';

const CriterionSchema = new mongoose.Schema({
  name: { type: String, required: true },
  weight: { type: Number, required: true }, // e.g. 30 for 30%
  maxScore: { type: Number, default: 10 } // Usually 1-10 scale
});

const RubricSchema = new mongoose.Schema({
  name: { type: String, required: true },
  isTemplate: { type: Boolean, default: false },
  criteria: [CriterionSchema]
}, { timestamps: true });

export default mongoose.models.Rubric || mongoose.model('Rubric', RubricSchema);
