import fs from 'fs';
import path from 'path';

export async function sendRegistrationTicketEmail(team: any) {
  process.env.NODE_TLS_REJECT_UNAUTHORIZED = '0';
  let apiKey = process.env.BREVO_API_KEY || process.env.SENDINBLUE_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL || 'hackathonhex@gmail.com';
  const senderName = process.env.BREVO_SENDER_NAME || 'HACKPRO';

  if (!apiKey) {
    console.warn('⚠️ BREVO_API_KEY is missing in environment variables. Email sending skipped.');
    return { success: false, message: 'BREVO_API_KEY not configured' };
  }

  // Ensure Brevo key prefix if missing
  if (!apiKey.startsWith('xkeysib-')) {
    apiKey = `xkeysib-${apiKey}`;
  }

  const leadName = team.leadName || 'Team Lead';
  const leadEmail = team.leadEmail;
  const teamName = team.name || 'Hackathon Team';
  const teamId = team.uniqueId || 'TM-000000';
  const college = team.collegeName || '';
  const department = team.department || '';
  const leadSuperset = team.leadSupersetId || team.supersetId || team.members?.[0]?.supersetId || '—';

  // Read official HACKPRO logo for inline CID attachment
  let logoBase64 = '';
  try {
    const logoPath = path.join(process.cwd(), 'public', 'hackpro-logo.png');
    if (fs.existsSync(logoPath)) {
      logoBase64 = fs.readFileSync(logoPath).toString('base64');
    }
  } catch (e) {
    console.error('Failed to read logo file for email attachment:', e);
  }

  const logoSrc = logoBase64 ? 'cid:hackpro-logo.png' : 'https://app.hackpro.in/hackpro-logo.png';
  const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(teamId)}&size=160&margin=1`;

  const memberRowsHtml = (team.members || []).map((m: any, idx: number) => `
    <tr>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #0f172a;">#${idx + 1} ${m.name || 'Member'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 13px; color: #0284c7; font-weight: 700;">${m.supersetId || '—'}</td>
      <td style="padding: 10px 12px; border-bottom: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #475569;">${m.email || m.contact || '—'}</td>
    </tr>
  `).join('');

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>HACKPRO 2026 - Registration & Ticket Confirmation</title>
</head>
<body style="margin: 0; padding: 32px 16px; background-color: #f1f5f9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; color: #0f172a; -webkit-font-smoothing: antialiased;">
  <div style="max-width: 640px; margin: 0 auto; background: #ffffff; border-radius: 16px; overflow: hidden; border: 1px solid #cbd5e1; box-shadow: 0 4px 20px rgba(15, 23, 42, 0.08);">
    
    <!-- Top Gradient Accent Bar matching Logo -->
    <div style="height: 5px; background: linear-gradient(90deg, #00b4d8 0%, #0284c7 50%, #0b132b 100%);"></div>

    <!-- Header Section with Official Logo -->
    <div style="padding: 36px 32px 24px 32px; text-align: center; background: #ffffff; border-bottom: 1px solid #e2e8f0;">
      <img src="${logoSrc}" alt="HACKPRO" width="220" style="display: block; margin: 0 auto 16px auto; max-width: 220px; width: 100%; height: auto; border: 0;" />
      <div>
        <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase; color: #0284c7; background: #e0f2fe; padding: 5px 14px; border-radius: 20px; display: inline-block;">
          OFFICIAL PARTICIPANT PASS
        </span>
      </div>
    </div>

    <!-- Main Body Content -->
    <div style="padding: 32px; background: #ffffff;">
      
      <!-- Formal Salutation -->
      <h2 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 20px; font-weight: 700; color: #0f172a; margin: 0 0 12px 0;">
        Registration Confirmation
      </h2>
      <p style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; line-height: 1.6; color: #334155; margin: 0 0 24px 0;">
        Dear ${leadName},<br/><br/>
        Your team <strong>${teamName}</strong> has been successfully registered for <strong>HACKPRO 2026</strong>. Please review your event credentials, check-in instructions, and official admission pass detailed below.
      </p>

      <!-- Credentials Card -->
      <div style="background: #f8fafc; border: 1px solid #cbd5e1; border-left: 4px solid #0284c7; border-radius: 8px; padding: 18px 20px; margin-bottom: 28px;">
        <h3 style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #0284c7; margin: 0 0 12px 0;">
          Team Portal Access Credentials
        </h3>
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <td style="padding: 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #475569; width: 140px;">Team ID:</td>
            <td style="padding: 5px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px; font-weight: 700; color: #0284c7;">${teamId}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #475569;">Login Email:</td>
            <td style="padding: 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #0f172a;">${leadEmail}</td>
          </tr>
          <tr>
            <td style="padding: 5px 0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; color: #475569;">Access Key:</td>
            <td style="padding: 5px 0; font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 14px; font-weight: 700; color: #0284c7;">${teamId}</td>
          </tr>
        </table>
      </div>

      <!-- Ticket Pass Card -->
      <div style="border: 1px solid #cbd5e1; border-radius: 12px; overflow: hidden; background: #ffffff; margin-bottom: 28px; box-shadow: 0 2px 8px rgba(15, 23, 42, 0.04);">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <!-- Left Stub (Navy & Cyan Theme matching Logo) -->
            <td width="38%" style="background: #0b132b; padding: 24px 16px; text-align: center; vertical-align: middle; border-right: 2px dashed #334155;">
              <span style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 9px; font-weight: 700; letter-spacing: 1.5px; text-transform: uppercase; background: rgba(2, 132, 199, 0.25); color: #38bdf8; padding: 4px 10px; border-radius: 12px; display: inline-block;">
                CHECK-IN PASS
              </span>
              <div style="background: #ffffff; padding: 8px; border-radius: 10px; margin: 14px auto; display: inline-block; border: 1px solid #e2e8f0;">
                <img src="${qrImageUrl}" alt="QR Code" width="130" height="130" style="display: block; border-radius: 4px;" />
              </div>
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 15px; font-weight: 700; color: #38bdf8; letter-spacing: 1.5px;">
                ${teamId}
              </div>
            </td>

            <!-- Right Body -->
            <td width="62%" style="padding: 22px 24px; vertical-align: top; background: #ffffff;">
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 18px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">
                ${teamName}
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; font-weight: 500; color: #0284c7; margin-bottom: 14px;">
                ${college} ${department ? '· ' + department : ''}
              </div>
              
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 3px;">
                Team Lead
              </div>
              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; font-weight: 600; color: #0f172a; margin-bottom: 2px;">
                ${leadName}
              </div>
              <div style="font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace; font-size: 11px; color: #0284c7; font-weight: 600; margin-bottom: 12px;">
                Superset ID: ${leadSuperset}
              </div>

              <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 10px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; color: #64748b; margin-bottom: 6px;">
                Team Members (${team.members?.length || 0})
              </div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                ${memberRowsHtml}
              </table>
            </td>
          </tr>
        </table>
      </div>

      <!-- Action Button -->
      <div style="text-align: center; margin: 24px 0;">
        <a href="https://app.hackpro.in" style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 14px; font-weight: 600; color: #ffffff; background: #0284c7; padding: 12px 28px; border-radius: 8px; text-decoration: none; display: inline-block;">
          Access Team Portal
        </a>
      </div>

      <!-- Important Notice -->
      <div style="background: #f8fafc; border-radius: 8px; padding: 16px; margin-bottom: 24px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 12px; line-height: 1.5; color: #64748b;">
        <strong>Important Check-In Instructions:</strong> Please present the digital QR pass above or a printed copy at the event registration desk. Ensure all registered members carry valid institution identification.
      </div>

      <!-- Formal Sign-Off -->
      <div style="padding-top: 16px; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 13px; line-height: 1.6; color: #475569;">
        Sincerely,<br/>
        <strong style="color: #0f172a;">HACKPRO Organizing Committee</strong><br/>
        <span style="font-size: 12px; color: #64748b;">Hexaware Technologies & Academic Partners</span>
      </div>

    </div>

    <!-- Sub-footer -->
    <div style="background: #f8fafc; padding: 16px; text-align: center; border-top: 1px solid #e2e8f0; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; font-size: 11px; color: #94a3b8;">
      This is an automated event confirmation sent to ${leadEmail}. Please do not reply directly to this email.
    </div>

  </div>
</body>
</html>`;

  try {
    const attachments: any[] = [];
    if (logoBase64) {
      attachments.push({
        name: 'hackpro-logo.png',
        content: logoBase64
      });
    }

    const payload: any = {
      sender: {
        name: senderName,
        email: senderEmail
      },
      to: [
        {
          email: leadEmail,
          name: leadName
        }
      ],
      subject: `HACKPRO 2026 - Registration & Ticket Confirmation: ${teamName}`,
      htmlContent
    };

    if (attachments.length > 0) {
      payload.attachment = attachments;
    }

    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify(payload)
    });

    const resData: any = await response.json();
    if (!response.ok) {
      console.error('[Brevo Email API Error]:', resData);
      return { success: false, message: resData.message || 'Brevo API Error' };
    }

    console.log(`[Brevo Email Sent]: Successfully sent welcome ticket to ${leadEmail}`);
    return { success: true, messageId: resData.messageId };
  } catch (err: any) {
    console.error('[Brevo Email Exception]:', err);
    return { success: false, message: err.message };
  }
}
