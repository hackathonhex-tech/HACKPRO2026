"use server";

import connectToDatabase from '@/server/config/db';
import SupportTicket from '@/server/models/SupportTicket';
import Team from '@/server/models/Team';
import ProblemStatement from '@/server/models/ProblemStatement';
import { verifyApiAuth } from '@/server/middleware/apiAuth';

export async function createSupportTicketAction(data: {
  subject: string;
  category: string;
  description: string;
  priority?: string;
  contactName?: string;
  contactEmail?: string;
  contactPhone?: string;
}) {
  try {
    const auth = await verifyApiAuth();
    if (!auth.authenticated || !auth.user) {
      return { success: false, message: 'Authentication required' };
    }

    if (auth.user.role !== 'team') {
      return { success: false, message: 'Only teams can submit support tickets' };
    }

    await connectToDatabase();

    const team = await Team.findOne({
      $or: [
        { _id: auth.user.id },
        { uniqueId: auth.user.uniqueId }
      ]
    });

    if (!team) {
      return { success: false, message: 'Team profile not found' };
    }

    if (!data.subject?.trim() || !data.description?.trim()) {
      return { success: false, message: 'Subject and description are required' };
    }

    // Generate unique readable ticket number
    const randomSuffix = Math.floor(1000 + Math.random() * 9000);
    const ticketNumber = `TKT-${team.uniqueId}-${randomSuffix}`;

    const newTicket = await SupportTicket.create({
      teamId: team._id,
      ticketNumber,
      subject: data.subject.trim(),
      category: data.category || 'General / Other',
      description: data.description.trim(),
      contactName: data.contactName?.trim() || team.leadName || team.name,
      contactEmail: data.contactEmail?.trim() || team.leadEmail || auth.user.email || '',
      contactPhone: data.contactPhone?.trim() || team.leadPhone || '',
      priority: data.priority || 'MEDIUM',
      status: 'OPEN'
    });

    return { 
      success: true, 
      ticket: JSON.parse(JSON.stringify(newTicket)),
      message: `Support ticket ${ticketNumber} raised successfully!` 
    };
  } catch (error: any) {
    console.error('Error creating support ticket:', error);
    return { success: false, message: error.message || 'Failed to submit support ticket' };
  }
}

export async function getMyTeamTicketsAction() {
  try {
    const auth = await verifyApiAuth();
    if (!auth.authenticated || !auth.user) {
      return { success: false, message: 'Authentication required' };
    }

    await connectToDatabase();

    const team = await Team.findOne({
      $or: [
        { _id: auth.user.id },
        { uniqueId: auth.user.uniqueId }
      ]
    });

    if (!team) {
      return { success: false, message: 'Team profile not found' };
    }

    const tickets = await SupportTicket.find({ teamId: team._id })
      .sort({ createdAt: -1 })
      .lean();

    return { 
      success: true, 
      tickets: JSON.parse(JSON.stringify(tickets)) 
    };
  } catch (error: any) {
    console.error('Error fetching team tickets:', error);
    return { success: false, message: error.message || 'Failed to fetch tickets' };
  }
}

export async function getAllSupportTicketsAction(statusFilter?: string) {
  try {
    const auth = await verifyApiAuth(['admin', 'sub-admin']);
    if (!auth.authenticated || !auth.user) {
      return { success: false, message: 'Admin authorization required' };
    }

    await connectToDatabase();
    // Register ProblemStatement model to populate properly
    if (!ProblemStatement) {
      console.log('ProblemStatement loaded');
    }

    const query: any = {};
    if (statusFilter && statusFilter !== 'ALL') {
      query.status = statusFilter;
    }

    const [tickets, totalCount, openCount, inProgressCount, resolvedCount] = await Promise.all([
      SupportTicket.find(query)
        .populate({
          path: 'teamId',
          select: 'name uniqueId leadName leadEmail leadPhone members problemStatementId collegeName department',
          populate: {
            path: 'problemStatementId',
            select: 'title track'
          }
        })
        .sort({ createdAt: -1 })
        .lean(),
      SupportTicket.countDocuments(),
      SupportTicket.countDocuments({ status: 'OPEN' }),
      SupportTicket.countDocuments({ status: 'IN_PROGRESS' }),
      SupportTicket.countDocuments({ status: 'RESOLVED' })
    ]);

    return {
      success: true,
      tickets: JSON.parse(JSON.stringify(tickets)),
      stats: {
        total: totalCount,
        open: openCount,
        inProgress: inProgressCount,
        resolved: resolvedCount
      }
    };
  } catch (error: any) {
    console.error('Error fetching all support tickets:', error);
    return { success: false, message: error.message || 'Failed to load tickets' };
  }
}

export async function updateSupportTicketStatusAction(
  ticketId: string, 
  data: { status: string; adminResponse?: string }
) {
  try {
    const auth = await verifyApiAuth(['admin', 'sub-admin']);
    if (!auth.authenticated || !auth.user) {
      return { success: false, message: 'Admin authorization required' };
    }

    await connectToDatabase();

    const updateFields: any = {
      status: data.status,
    };

    if (data.adminResponse !== undefined) {
      updateFields.adminResponse = data.adminResponse.trim();
    }

    if (data.status === 'RESOLVED') {
      updateFields.resolvedAt = new Date();
      updateFields.resolvedBy = auth.user.name || 'Admin';
    }

    const updated = await SupportTicket.findByIdAndUpdate(
      ticketId,
      { $set: updateFields },
      { new: true }
    ).populate({
      path: 'teamId',
      select: 'name uniqueId leadName leadEmail leadPhone problemStatementId members'
    }).lean();

    if (!updated) {
      return { success: false, message: 'Ticket not found' };
    }

    return { 
      success: true, 
      ticket: JSON.parse(JSON.stringify(updated)),
      message: `Ticket updated to ${data.status}` 
    };
  } catch (error: any) {
    console.error('Error updating ticket status:', error);
    return { success: false, message: error.message || 'Failed to update ticket' };
  }
}

export async function deleteSupportTicketAction(ticketId: string) {
  try {
    const auth = await verifyApiAuth(['admin', 'sub-admin']);
    if (!auth.authenticated || !auth.user) {
      return { success: false, message: 'Admin authorization required' };
    }

    await connectToDatabase();

    const deleted = await SupportTicket.findByIdAndDelete(ticketId);
    if (!deleted) {
      return { success: false, message: 'Ticket not found' };
    }

    return { 
      success: true, 
      message: 'Support ticket deleted successfully' 
    };
  } catch (error: any) {
    console.error('Error deleting ticket:', error);
    return { success: false, message: error.message || 'Failed to delete ticket' };
  }
}
