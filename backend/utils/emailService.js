// utils/emailService.js
const mailjet = require('node-mailjet');

const sendInvitationEmail = async (recipient, invitationData) => {
  try {
    // Connect to MailJet using API keys
    const mailjetClient = mailjet.apiConnect(
      process.env.MJ_APIKEY_PUBLIC,
      process.env.MJ_APIKEY_PRIVATE
    );
    
    const { token, companyName, role, invitedByEmail } = invitationData;
    
    // Create the invitation URL
    const frontendUrl = process.env.FRONTEND_URL || 'http://localhost:5173';
    const invitationUrl = `${frontendUrl}/accept-invitation/${token}`;
    
    console.log(`Sending invitation email to ${recipient} with token ${token}`);
    console.log(`Invitation URL: ${invitationUrl}`);
    
    // Prepare and send the email
    const request = mailjetClient.post('send', { version: 'v3.1' }).request({
      Messages: [
        {
          From: {
            Email: process.env.MJ_SENDER_EMAIL || 'noreply@wealthmap.com',
            Name: 'WealthMap'
          },
          To: [
            {
              Email: recipient
            }
          ],
          Subject: `Invitation to join ${companyName} on WealthMap`,
          HTMLPart: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <div style="background-color: #003087; color: white; padding: 20px; text-align: center;">
                <h1 style="margin: 0;">WealthMap</h1>
              </div>
              <div style="padding: 20px; border: 1px solid #e0e0e0; border-top: none;">
                <h2>You've been invited to join ${companyName}</h2>
                <p>Hello,</p>
                <p>${invitedByEmail} has invited you to join ${companyName} on WealthMap as a ${role}.</p>
                <p>WealthMap is a platform that allows you to explore property ownership and net worth data across the US through interactive maps and data integrations.</p>
                <div style="margin: 30px 0; text-align: center;">
                  <a href="${invitationUrl}" style="background-color: #003087; color: white; padding: 12px 24px; text-decoration: none; border-radius: 4px; display: inline-block;">
                    Accept Invitation
                  </a>
                </div>
                <p>This invitation will expire in 7 days.</p>
                <p>If you have any questions, please contact your administrator.</p>
                <p>Thank you,<br>The WealthMap Team</p>
              </div>
              <div style="padding: 10px; background-color: #f5f5f5; font-size: 12px; color: #666; text-align: center;">
                <p>If you received this email by mistake, simply ignore it.</p>
              </div>
            </div>
          `,
          TextPart: `
            You've been invited to join ${companyName} on WealthMap
            
            Hello,
            
            ${invitedByEmail} has invited you to join ${companyName} on WealthMap as a ${role}.
            
            WealthMap is a platform that allows you to explore property ownership and net worth data across the US through interactive maps and data integrations.
            
            To accept the invitation, visit this link:
            ${invitationUrl}
            
            This invitation will expire in 7 days.
            
            Thank you,
            The WealthMap Team
          `
        }
      ]
    });
    
    const result = await request;
    console.log('Email sent successfully:', result.body);
    return { success: true, data: result.body };
  } catch (error) {
    console.error('Failed to send email:', error);
    // Don't throw the error, just return failure status
    return { success: false, error: error.message };
  }
};

module.exports = {
  sendInvitationEmail
};