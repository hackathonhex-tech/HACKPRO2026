import mongoose, { Document, Model } from 'mongoose';

export interface ITimer extends Document {
  status: 'STOPPED' | 'RUNNING' | 'PAUSED';
  durationRemaining: number; // in seconds
  endTime: Date | null;
  automaticBuzzer: boolean;
  autoBuzzerTriggerTime: number;
  lastManualBuzzer: Date | null;
  updatedAt: Date;
}

const TimerSchema = new mongoose.Schema<ITimer>(
  {
    status: { type: String, enum: ['STOPPED', 'RUNNING', 'PAUSED'], default: 'STOPPED' },
    durationRemaining: { type: Number, default: 0 },
    endTime: { type: Date, default: null },
    automaticBuzzer: { type: Boolean, default: true },
    autoBuzzerTriggerTime: { type: Number, default: 0 }, // seconds remaining to trigger
    lastManualBuzzer: { type: Date, default: null },
  },
  { timestamps: true }
);

// We only need a single document for the global timer, so we'll use a singleton approach when querying
export const Timer: Model<ITimer> = mongoose.models.Timer || mongoose.model<ITimer>('Timer', TimerSchema);
