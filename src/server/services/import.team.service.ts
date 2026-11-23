import connectToDatabase from '@/server/config/db';
import Team from '@/server/models/Team';
import Round from '@/server/models/Round';
import { v4 as uuidv4 } from 'uuid';
import { sendRegistrationTicketEmail } from './email.service';

export interface RawEmployeeCsvRow {
  Emp_id?: string;
  emp_name?: string;
  place?: string;
  team_name?: string;
  email_id?: string;
  team_leader_mail?: string;
  team_leader_name?: string;
  [key: string]: any;
}

export interface ParsedEmployeeMember {
  empId: string;
  name: string;
  email: string;
  place: string;
  isLead: boolean;
  isDuplicate?: boolean;
  duplicateInTeams?: string[];
}

export interface ParsedEmployeeTeam {
  tempId: string;
  name: string;
  place: string;
  leadName: string;
  leadEmail: string;
  leadEmpId: string;
  members: ParsedEmployeeMember[];
  hasDuplicateMembers: boolean;
  duplicateMembersCount: number;
  duplicateInTeamsSummary: string[];
  existingInDb?: boolean;
}

export interface ParseValidationResult {
  teams: ParsedEmployeeTeam[];
  totalRows: number;
  totalTeams: number;
  totalMembers: number;
  conflictedTeamsCount: number;
  cleanTeamsCount: number;
  duplicateEmployeeMap: Record<string, string[]>;
}

// Normalizes field names for CSV headers
function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[\s_\-.]/g, '');
}

export async function parseAndValidateEmployeeData(rawRows: any[]): Promise<ParseValidationResult> {
  await connectToDatabase();

  // Fetch existing teams from DB to check for conflicts against already registered teams
  const existingTeams = await Team.find({}, { name: 1, leadEmail: 1, leadEmpId: 1, members: 1 }).lean();

  const teamsMap = new Map<string, {
    name: string;
    place: string;
    leadNameCandidate: string;
    leadEmailCandidate: string;
    rows: any[];
  }>();

  // 1. Group raw rows by team_name
  for (const raw of rawRows) {
    if (!raw || typeof raw !== 'object') continue;

    // Normalize keys
    const row: Record<string, string> = {};
    for (const [k, v] of Object.entries(raw)) {
      row[normalizeKey(k)] = typeof v === 'string' ? v.trim() : (v ? String(v).trim() : '');
    }

    const empId = row['empid'] || row['employeeid'] || row['id'] || '';
    const empName = row['empname'] || row['employeename'] || row['name'] || '';
    const place = row['place'] || row['location'] || row['city'] || row['branch'] || '';
    const teamName = row['teamname'] || row['team'] || '';
    const emailId = row['emailid'] || row['email'] || '';
    const teamLeaderMail = row['teamleadermail'] || row['teamleadmail'] || row['teamleaderemail'] || row['leademail'] || '';
    const teamLeaderName = row['teamleadername'] || row['teamleadname'] || row['leadname'] || '';

    // Ignore completely empty rows
    if (!teamName && !empName && !empId && !emailId) continue;

    const effectiveTeamName = teamName || (empName ? `${empName}'s Team` : 'Unnamed Team');
    const teamKey = effectiveTeamName.toLowerCase();

    if (!teamsMap.has(teamKey)) {
      teamsMap.set(teamKey, {
        name: effectiveTeamName,
        place: place,
        leadNameCandidate: teamLeaderName,
        leadEmailCandidate: teamLeaderMail,
        rows: []
      });
    }

    const teamGroup = teamsMap.get(teamKey)!;
    if (!teamGroup.place && place) teamGroup.place = place;
    if (!teamGroup.leadNameCandidate && teamLeaderName) teamGroup.leadNameCandidate = teamLeaderName;
    if (!teamGroup.leadEmailCandidate && teamLeaderMail) teamGroup.leadEmailCandidate = teamLeaderMail;

    teamGroup.rows.push({
      empId,
      empName,
      place,
      emailId,
      teamLeaderMail,
      teamLeaderName
    });
  }

  // 2. Build preliminary team and member list
  const parsedTeams: ParsedEmployeeTeam[] = [];
  let totalMembersCount = 0;

  for (const [, group] of teamsMap) {
    const members: ParsedEmployeeMember[] = [];
    let leadRow = group.rows.find(r => 
      (group.leadEmailCandidate && r.emailId && r.emailId.toLowerCase() === group.leadEmailCandidate.toLowerCase()) ||
      (group.leadNameCandidate && r.empName && r.empName.toLowerCase() === group.leadNameCandidate.toLowerCase())
    );

    // If no explicit match, pick the first member as lead
    if (!leadRow && group.rows.length > 0) {
      leadRow = group.rows[0];
    }

    const leadName = group.leadNameCandidate || leadRow?.empName || 'Team Lead';
    const leadEmail = group.leadEmailCandidate || leadRow?.emailId || '';
    const leadEmpId = leadRow?.empId || '';

    // If lead is specified via teamLeaderMail / teamLeaderName but didn't have their own row, add them
    const hasLeadInRows = group.rows.some(r => 
      (leadEmail && r.emailId && r.emailId.toLowerCase() === leadEmail.toLowerCase()) ||
      (leadEmpId && r.empId && r.empId.toLowerCase() === leadEmpId.toLowerCase())
    );

    if (!hasLeadInRows && (leadName || leadEmail)) {
      members.push({
        empId: leadEmpId,
        name: leadName,
        email: leadEmail,
        place: group.place,
        isLead: true
      });
      totalMembersCount++;
    }

    for (const r of group.rows) {
      const isLead = (
        (leadEmail && r.emailId && r.emailId.toLowerCase() === leadEmail.toLowerCase()) ||
        (!leadEmail && leadEmpId && r.empId && r.empId.toLowerCase() === leadEmpId.toLowerCase()) ||
        (!leadEmail && !leadEmpId && r.empName === leadName)
      );

      // Avoid duplicate row inside same team
      const alreadyInTeam = members.some(m => 
        (r.empId && m.empId && m.empId.toLowerCase() === r.empId.toLowerCase()) ||
        (r.emailId && m.email && m.email.toLowerCase() === r.emailId.toLowerCase())
      );

      if (!alreadyInTeam) {
        members.push({
          empId: r.empId,
          name: r.empName || (isLead ? leadName : 'Member'),
          email: r.emailId || '',
          place: r.place || group.place,
          isLead
        });
        totalMembersCount++;
      }
    }

    // Ensure at least one member is marked as lead
    if (!members.some(m => m.isLead) && members.length > 0) {
      members[0].isLead = true;
    }

    parsedTeams.push({
      tempId: `TMP-${uuidv4().substring(0, 6).toUpperCase()}`,
      name: group.name,
      place: group.place,
      leadName: leadName || members.find(m => m.isLead)?.name || 'Team Lead',
      leadEmail: leadEmail || members.find(m => m.isLead)?.email || '',
      leadEmpId: leadEmpId || members.find(m => m.isLead)?.empId || '',
      members,
      hasDuplicateMembers: false,
      duplicateMembersCount: 0,
      duplicateInTeamsSummary: []
    });
  }

  // 3. Duplicate Member Detection across all teams in this batch + existing DB teams
  // Index mappings: empId -> Set<teamName>, email -> Set<teamName>
  const empIdToTeams = new Map<string, Set<string>>();
  const emailToTeams = new Map<string, Set<string>>();

  // Register existing DB teams into tracking
  for (const existing of existingTeams) {
    const tName = `${existing.name} (Existing DB)`;
    if (existing.leadEmpId) {
      const k = existing.leadEmpId.toLowerCase();
      if (!empIdToTeams.has(k)) empIdToTeams.set(k, new Set());
      empIdToTeams.get(k)!.add(tName);
    }
    if (existing.leadEmail) {
      const k = existing.leadEmail.toLowerCase();
      if (!emailToTeams.has(k)) emailToTeams.set(k, new Set());
      emailToTeams.get(k)!.add(tName);
    }
    if (Array.isArray(existing.members)) {
      for (const m of existing.members) {
        const mEmpId = m.empId || m.supersetId;
        if (mEmpId) {
          const k = String(mEmpId).trim().toLowerCase();
          if (!empIdToTeams.has(k)) empIdToTeams.set(k, new Set());
          empIdToTeams.get(k)!.add(tName);
        }
        if (m.email) {
          const k = String(m.email).trim().toLowerCase();
          if (!emailToTeams.has(k)) emailToTeams.set(k, new Set());
          emailToTeams.get(k)!.add(tName);
        }
      }
    }
  }

  // Register all imported teams and their members into tracking
  for (const team of parsedTeams) {
    for (const m of team.members) {
      if (m.empId) {
        const k = m.empId.toLowerCase();
        if (!empIdToTeams.has(k)) empIdToTeams.set(k, new Set());
        empIdToTeams.get(k)!.add(team.name);
      }
      if (m.email) {
        const k = m.email.toLowerCase();
        if (!emailToTeams.has(k)) emailToTeams.set(k, new Set());
        emailToTeams.get(k)!.add(team.name);
      }
    }
  }

  // 4. Mark duplicates and conflicts
  let conflictedTeamsCount = 0;
  const duplicateEmployeeMap: Record<string, string[]> = {};

  for (const team of parsedTeams) {
    const teamConflictSummaries = new Set<string>();
    let teamDuplicateCount = 0;

    for (const m of team.members) {
      const conflictingTeams = new Set<string>();

      if (m.empId && empIdToTeams.has(m.empId.toLowerCase())) {
        const registeredTeams = empIdToTeams.get(m.empId.toLowerCase())!;
        if (registeredTeams.size > 1) {
          for (const t of registeredTeams) {
            if (t !== team.name) conflictingTeams.add(t);
          }
          duplicateEmployeeMap[`Emp ID: ${m.empId}`] = Array.from(registeredTeams);
        }
      }

      if (m.email && emailToTeams.has(m.email.toLowerCase())) {
        const registeredTeams = emailToTeams.get(m.email.toLowerCase())!;
        if (registeredTeams.size > 1) {
          for (const t of registeredTeams) {
            if (t !== team.name) conflictingTeams.add(t);
          }
          duplicateEmployeeMap[`Email: ${m.email}`] = Array.from(registeredTeams);
        }
      }

      if (conflictingTeams.size > 0) {
        m.isDuplicate = true;
        m.duplicateInTeams = Array.from(conflictingTeams);
        teamDuplicateCount++;
        for (const ct of conflictingTeams) teamConflictSummaries.add(ct);
      } else {
        m.isDuplicate = false;
        m.duplicateInTeams = [];
      }
    }

    if (teamDuplicateCount > 0) {
      team.hasDuplicateMembers = true;
      team.duplicateMembersCount = teamDuplicateCount;
      team.duplicateInTeamsSummary = Array.from(teamConflictSummaries);
      conflictedTeamsCount++;
    } else {
      team.hasDuplicateMembers = false;
      team.duplicateMembersCount = 0;
      team.duplicateInTeamsSummary = [];
    }
  }

  return {
    teams: parsedTeams,
    totalRows: rawRows.length,
    totalTeams: parsedTeams.length,
    totalMembers: totalMembersCount,
    conflictedTeamsCount,
    cleanTeamsCount: parsedTeams.length - conflictedTeamsCount,
    duplicateEmployeeMap
  };
}

export async function importEmployeeTeams(
  teams: ParsedEmployeeTeam[],
  options: { sendEmails?: boolean } = {}
) {
  await connectToDatabase();

  const results = {
    createdCount: 0,
    skippedCount: 0,
    errors: [] as string[],
    createdTeams: [] as any[]
  };

  for (const t of teams) {
    try {
      const uniqueId = `TM-${uuidv4().substring(0, 6).toUpperCase()}`;

      const formattedMembers = t.members.map(m => ({
        name: m.name,
        empId: m.empId || '',
        place: m.place || t.place || '',
        supersetId: m.empId || '',
        contact: m.email || '',
        email: m.email || '',
        phone: '',
        college: m.place || t.place || '',
        department: '',
        attendance: false,
        customFields: {
          empId: m.empId || '',
          place: m.place || t.place || ''
        }
      }));

      const newTeam = new Team({
        uniqueId,
        qrCodeString: uniqueId,
        name: t.name,
        leadName: t.leadName,
        leadEmail: t.leadEmail,
        leadPhone: '',
        leadEmpId: t.leadEmpId || '',
        place: t.place || '',
        leadSupersetId: t.leadEmpId || '',
        supersetId: t.leadEmpId || '',
        collegeName: t.place || '',
        department: '',
        members: formattedMembers,
        attendance: false,
        customFields: {
          empId: t.leadEmpId || '',
          place: t.place || '',
          importSource: 'employee_csv_import',
          importedAt: new Date().toISOString()
        }
      });

      await newTeam.save();

      // Automatically enroll newly created team in active hackathon rounds
      try {
        await Round.updateMany(
          { $or: [{ isActive: true }, { allowedTeamIds: { $exists: true } }] },
          { $addToSet: { allowedTeamIds: newTeam._id } }
        );
      } catch (err) {
        console.error('[Auto-Allow Round Qualification Import Error]:', err);
      }

      // Optionally send ticket email
      if (options.sendEmails && newTeam.leadEmail) {
        sendRegistrationTicketEmail(newTeam).catch(err => {
          console.error(`[Brevo Email Error for ${newTeam.name}]:`, err);
        });
      }

      results.createdCount++;
      results.createdTeams.push({
        _id: newTeam._id.toString(),
        name: newTeam.name,
        uniqueId: newTeam.uniqueId,
        leadEmail: newTeam.leadEmail,
        memberCount: newTeam.members.length
      });
    } catch (err: any) {
      console.error(`Failed to import team ${t.name}:`, err);
      results.skippedCount++;
      results.errors.push(`Team "${t.name}": ${err.message || 'Database error'}`);
    }
  }

  return results;
}
