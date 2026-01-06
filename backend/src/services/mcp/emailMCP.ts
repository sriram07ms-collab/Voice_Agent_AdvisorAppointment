import { google } from 'googleapis';
import { getGoogleAuthClient } from './googleAuth';
import { getGmailOAuth2Client, isGmailOAuth2Ready, refreshGmailTokenIfNeeded } from './gmailOAuth2';
import { Booking } from '../../shared/types/conversation';
import { formatDateTimeIST } from '../../shared/utils/dateTime';

export async function draftAdvisorEmail(booking: Booking): Promise<string> {
  try {
    // Try OAuth2 first (for personal Gmail), then fall back to service account
    let auth: any;
    let useOAuth2 = false;
    
    if (isGmailOAuth2Ready()) {
      try {
        await refreshGmailTokenIfNeeded();
        auth = getGmailOAuth2Client();
        useOAuth2 = true;
        console.log('📧 Using OAuth2 for Gmail API');
      } catch (error: any) {
        console.warn('⚠️  OAuth2 token refresh failed, trying service account:', error.message);
        auth = await getGoogleAuthClient();
      }
    } else {
      auth = await getGoogleAuthClient();
    }
    
    const gmail = google.gmail({ version: 'v1', auth });

    const advisorEmail = process.env.GMAIL_USER_EMAIL || 'advisor@groww.in';
    const fromEmail = process.env.GMAIL_FROM_EMAIL || 'noreply@groww.in';
    const useDelegation = process.env.GMAIL_USE_DELEGATION === 'true';

    if (!booking.selectedSlot) {
      throw new Error('Booking must have a selected slot');
    }
    
    // For OAuth2, always use 'me' (authenticated user)
    // For service account with delegation, use 'me' or email
    // For service account without delegation, use email (won't work for Gmail)

    const subject = `New Advisor Consultation Request - ${booking.bookingCode}`;
    const dateTime = formatDateTimeIST(booking.selectedSlot.startTime);
    
    const body = `Dear Advisor,

A new consultation request has been received:

Booking Code: ${booking.bookingCode}
Topic: ${booking.topic}
Date & Time: ${dateTime} IST
Status: Tentative

User Preferences:
${booking.preferredDate ? `Preferred Date: ${new Date(booking.preferredDate).toLocaleDateString()}` : ''}
${booking.preferredTime ? `Preferred Time: ${booking.preferredTime}` : ''}

Please review and confirm this appointment.

Best regards,
Groww Advisor Scheduler`;

    // Create email message
    const message = [
      `To: ${advisorEmail}`,
      `From: ${fromEmail}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\n');

    // Encode message in base64url format (RFC 4648)
    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    // Determine userId based on authentication method
    let userId: string;
    if (useOAuth2) {
      userId = 'me'; // OAuth2 always uses 'me'
    } else if (useDelegation) {
      userId = 'me'; // Domain-wide delegation uses 'me'
    } else {
      userId = advisorEmail; // Service account without delegation (won't work for Gmail)
    }

    console.log(`📧 Creating email draft for user: ${userId} (method: ${useOAuth2 ? 'OAuth2' : useDelegation ? 'Domain-wide delegation' : 'Service account'})`);

    const response = await gmail.users.drafts.create({
      userId: userId,
      requestBody: {
        message: {
          raw: encodedMessage,
        },
      },
    });

    if (!response.data.id) {
      throw new Error('Failed to create email draft');
    }

    console.log(`✅ Email draft created: ${response.data.id}`);
    return response.data.id;
  } catch (error: any) {
    console.error('❌ Error creating email draft:', error.message);
    console.error('   Error code:', error.code);
    
    // Provide helpful error messages
    if (error.code === 403 || error.message?.includes('insufficient permission')) {
      console.error('   ⚠️  Gmail API requires OAuth2 (for personal Gmail) or domain-wide delegation (for Google Workspace)');
      console.error('   📖 See GMAIL_OAUTH2_SETUP.md for OAuth2 setup instructions');
      console.error('   📖 See GMAIL_SETUP.md for domain-wide delegation setup');
      if (!isGmailOAuth2Ready()) {
        console.error('   💡 For personal Gmail: Visit http://localhost:3001/api/auth/gmail/authorize to authorize');
      }
    }
    
    if (error.response?.data) {
      console.error('   Error details:', JSON.stringify(error.response.data, null, 2));
    }
    
    // Don't fail the booking if email draft fails
    console.warn('⚠️  Email draft creation failed, but booking will continue');
    return '';
  }
}

export async function draftWaitlistEmail(booking: Booking): Promise<string> {
  try {
    // Try OAuth2 first (for personal Gmail), then fall back to service account
    let auth: any;
    let useOAuth2 = false;
    
    if (isGmailOAuth2Ready()) {
      try {
        await refreshGmailTokenIfNeeded();
        auth = getGmailOAuth2Client();
        useOAuth2 = true;
      } catch (error: any) {
        console.warn('⚠️  OAuth2 token refresh failed, trying service account:', error.message);
        auth = await getGoogleAuthClient();
      }
    } else {
      auth = await getGoogleAuthClient();
    }
    
    const gmail = google.gmail({ version: 'v1', auth });

    const advisorEmail = process.env.GMAIL_USER_EMAIL || 'advisor@groww.in';
    const fromEmail = process.env.GMAIL_FROM_EMAIL || 'noreply@groww.in';
    const useDelegation = process.env.GMAIL_USE_DELEGATION === 'true';
    
    // Determine userId based on authentication method
    let userId: string;
    if (useOAuth2) {
      userId = 'me';
    } else if (useDelegation) {
      userId = 'me';
    } else {
      userId = advisorEmail;
    }

    const subject = `Waitlist Request - ${booking.topic}`;
    
    const body = `Dear Advisor,

A user has been added to the waitlist:

Topic: ${booking.topic}
${booking.preferredDate ? `Preferred Date: ${new Date(booking.preferredDate).toLocaleDateString()}` : ''}
${booking.preferredTime ? `Preferred Time: ${booking.preferredTime}` : ''}

Please review and contact the user when slots become available.

Best regards,
Groww Advisor Scheduler`;

    const message = [
      `To: ${advisorEmail}`,
      `From: ${fromEmail}`,
      `Subject: ${subject}`,
      'Content-Type: text/plain; charset=utf-8',
      '',
      body,
    ].join('\n');

    const encodedMessage = Buffer.from(message)
      .toString('base64')
      .replace(/\+/g, '-')
      .replace(/\//g, '_')
      .replace(/=+$/, '');

    const response = await gmail.users.drafts.create({
      userId: userId,
      requestBody: {
        message: {
          raw: encodedMessage,
        },
      },
    });

    if (!response.data.id) {
      throw new Error('Failed to create waitlist email draft');
    }

    console.log(`✅ Waitlist email draft created: ${response.data.id}`);
    return response.data.id;
  } catch (error: any) {
    console.error('❌ Error creating waitlist email draft:', error.message);
    if (error.code === 403 || error.message?.includes('insufficient permission')) {
      console.error('   ⚠️  Gmail API requires OAuth2 (for personal Gmail) or domain-wide delegation');
      if (!isGmailOAuth2Ready()) {
        console.error('   💡 For personal Gmail: Visit http://localhost:3001/api/auth/gmail/authorize to authorize');
      }
    }
    return '';
  }
}



