import mongoose from 'mongoose';

const SupportTicketSchema = new mongoose.Schema({
  teamId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Team', 
    required: true 
  },
  ticketNumber: { 
    type: String, 
    required: true, 
    unique: true 
  },
  subject: { 
    type: String, 
    required: true 
  },
  category: { 
    type: String, 
    enum: [
      'Technical / Portal Issue', 
      'Problem Statement / Slot', 
      'Submissions & Project Links', 
      'Evaluation & Judging', 
      'General / Other'
    ], 
    default: 'General / Other' 
  },
  description: { 
    type: String, 
    required: true 
  },
  contactName: { 
    type: String 
  },
  contactEmail: { 
    type: String 
  },
  contactPhone: { 
    type: String 
  },
  priority: { 
    type: String, 
    enum: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'], 
    default: 'MEDIUM' 
  },
  status: { 
    type: String, 
    enum: ['OPEN', 'IN_PROGRESS', 'RESOLVED'], 
    default: 'OPEN' 
  },
  adminResponse: { 
    type: String 
  },
  resolvedAt: { 
    type: Date 
  },
  resolvedBy: { 
    type: String 
  }
}, { timestamps: true });

SupportTicketSchema.index({ teamId: 1, createdAt: -1 });
SupportTicketSchema.index({ status: 1 });

export default mongoose.models.SupportTicket || mongoose.model('SupportTicket', SupportTicketSchema);
