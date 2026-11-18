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

  const qrImageUrl = `https://quickchart.io/qr?text=${encodeURIComponent(teamId)}&size=160&margin=1`;

  const memberRowsHtml = (team.members || []).map((m: any, idx: number) => `
    <tr>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; font-weight: 600; color: #0f172a;">#${idx + 1} ${m.name || 'Member'}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #3c2cda; font-weight: 700; font-family: monospace;">${m.supersetId || '—'}</td>
      <td style="padding: 8px 10px; border-bottom: 1px solid #e2e8f0; font-size: 12px; color: #64748b;">${m.email || m.contact || '—'}</td>
    </tr>
  `).join('');

  const htmlContent = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Welcome to HACKPRO!</title>
</head>
<body style="font-family: 'Segoe UI', Arial, sans-serif; background-color: #f4f5ff; margin: 0; padding: 20px; color: #1a164c;">
  <div style="max-width: 680px; margin: 0 auto; background: #ffffff; border-radius: 20px; overflow: hidden; border: 2px solid #d4d0fa; box-shadow: 0 10px 30px rgba(60, 44, 218, 0.15);">
    
    <!-- Header Banner -->
    <div style="background: #3c2cda; padding: 32px 24px; text-align: center; color: #ffffff;">
      <span style="font-size: 10px; font-weight: 800; letter-spacing: 2px; text-transform: uppercase; background: rgba(255, 255, 255, 0.2); padding: 4px 12px; border-radius: 20px; color: #f4f5ff;">OFFICIAL HACKATHON PASS</span>
      <h1 style="font-size: 28px; font-weight: 900; margin: 12px 0 4px 0; color: #ffffff;">HACKPRO</h1>
      <p style="font-size: 13px; opacity: 0.9; margin: 8px 0 0 0; font-weight: 500;">Participant Zone</p>
    </div>

    <!-- Welcome Greeting -->
    <div style="padding: 28px 32px; background: #ffffff;">
      <h2 style="font-size: 20px; font-weight: 800; color: #3c2cda; margin-top: 0;">🎉 Congratulations, ${leadName}!</h2>
      <p style="font-size: 14px; line-height: 1.6; color: #334155; margin-bottom: 20px;">
        Welcome onboard! Your team <strong>${teamName}</strong> has been successfully registered for <strong>HACKPRO</strong>. Below is your official ticket pass, check-in QR code, and portal access credentials.
      </p>

      <!-- Credentials Card -->
      <div style="background: #f4f5ff; border: 1.5px solid #b5adfc; border-radius: 14px; padding: 18px; margin-bottom: 24px;">
        <h3 style="font-size: 11px; font-weight: 800; text-transform: uppercase; letter-spacing: 1.5px; color: #3c2cda; margin: 0 0 10px 0;">🔑 Team Portal Credentials</h3>
        <p style="font-size: 13px; color: #1a164c; margin: 4px 0;"><strong>Team ID:</strong> <span style="font-family: monospace; color: #3c2cda; font-weight: 800;">${teamId}</span></p>
        <p style="font-size: 13px; color: #1a164c; margin: 4px 0;"><strong>Login Email:</strong> ${leadEmail}</p>
        <p style="font-size: 13px; color: #1a164c; margin: 4px 0;"><strong>Password / Security Key:</strong> <span style="font-family: monospace; color: #3c2cda; font-weight: 800;">${teamId}</span></p>
      </div>

      <!-- Ticket Pass Card -->
      <div style="border: 2px solid #d4d0fa; border-radius: 18px; overflow: hidden; background: #f4f5ff; margin-bottom: 24px;">
        <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
          <tr>
            <!-- Left Stub -->
            <td width="38%" style="background: #3c2cda; padding: 24px 16px; text-align: center; vertical-align: middle;">
              <span style="font-size: 9px; font-weight: 800; letter-spacing: 1.5px; text-transform: uppercase; background: rgba(255, 255, 255, 0.2); color: #f4f5ff; padding: 4px 10px; border-radius: 12px;">CHECK-IN PASS</span>
              <div style="background: #ffffff; padding: 10px; border-radius: 14px; margin: 14px auto; display: inline-block;">
                <img src="${qrImageUrl}" alt="QR Code" width="140" height="140" style="display: block; border-radius: 6px;" />
              </div>
              <div style="font-family: monospace; font-size: 16px; font-weight: 900; color: #d4d0fa; letter-spacing: 2px;">${teamId}</div>
            </td>

            <!-- Right Body -->
            <td width="62%" style="padding: 22px 24px; vertical-align: top; background: #ffffff;">
              <div style="font-size: 20px; font-weight: 800; color: #3c2cda;">${teamName}</div>
              <div style="font-size: 12px; font-weight: 600; color: #584df0; margin-bottom: 14px;">${college} ${department ? '· ' + department : ''}</div>
              
              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #b5adfc; margin-bottom: 4px;">Team Lead</div>
              <div style="font-size: 13px; font-weight: 700; color: #0f172a; margin-bottom: 2px;">${leadName}</div>
              <div style="font-size: 11px; color: #3c2cda; font-weight: 700; font-family: monospace; margin-bottom: 12px;">Superset ID: ${team.leadSupersetId || team.supersetId || '—'}</div>

              <div style="font-size: 10px; font-weight: 800; text-transform: uppercase; letter-spacing: 1px; color: #b5adfc; margin-bottom: 6px;">Team Members (${team.members?.length || 0})</div>
              <table width="100%" cellpadding="0" cellspacing="0" style="border-collapse: collapse;">
                ${memberRowsHtml}
              </table>
            </td>
          </tr>
        </table>
      </div>

      <!-- Footer Note -->
      <div style="text-align: center; padding-top: 16px; border-top: 1px dashed #d4d0fa; font-size: 12px; color: #64748b;">
        Please present this ticket pass or check-in QR code at registration check-in.<br/>
        <strong>Best of luck from the HACKPRO Team!</strong>
      </div>
    </div>

  </div>
</body>
</html>`;

  try {
    const response = await fetch('https://api.brevo.com/v3/smtp/email', {
      method: 'POST',
      headers: {
        'api-key': apiKey,
        'accept': 'application/json',
        'content-type': 'application/json'
      },
      body: JSON.stringify({
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
        subject: `🎉 Welcome to HACKPRO! Ticket & Credentials for ${teamName}`,
        htmlContent
      })
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
