// Quick test script to diagnose MCP authentication issues
import dotenv from 'dotenv';
import { getGoogleAuthClient } from './src/services/mcp/googleAuth';
import { google } from 'googleapis';

dotenv.config();

async function testMCP() {
  console.log('🧪 Testing MCP Authentication and Operations...\n');
  
  try {
    // Test 1: Authentication
    console.log('1️⃣ Testing Google Authentication...');
    const auth = await getGoogleAuthClient();
    console.log('✅ Authentication successful\n');
    
    // Test 2: Calendar API
    console.log('2️⃣ Testing Calendar API...');
    const calendar = google.calendar({ version: 'v3', auth });
    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    
    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID not set');
    }
    
    // Try to get calendar info (read permission test)
    try {
      const calendarResponse = await calendar.calendars.get({
        calendarId: calendarId,
      });
      console.log('✅ Calendar access successful');
      console.log(`   Calendar: ${calendarResponse.data.summary || calendarId}\n`);
    } catch (calError: any) {
      console.error('❌ Calendar access failed:', calError.message);
      console.error(`   Code: ${calError.code || 'N/A'}`);
      if (calError.response?.data) {
        console.error(`   Details: ${JSON.stringify(calError.response.data, null, 2)}`);
      }
      throw calError;
    }
    
    // Test 3: Sheets API
    console.log('3️⃣ Testing Sheets API...');
    const sheets = google.sheets({ version: 'v4', auth });
    const sheetId = process.env.GOOGLE_SHEET_ID;
    
    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID not set');
    }
    
    // Try to read the sheet (read permission test)
    try {
      const sheetsResponse = await sheets.spreadsheets.get({
        spreadsheetId: sheetId,
      });
      console.log('✅ Sheets access successful');
      console.log(`   Sheet: ${sheetsResponse.data.properties.title}\n`);
    } catch (sheetError: any) {
      console.error('❌ Sheets access failed:', sheetError.message);
      console.error(`   Code: ${sheetError.code || 'N/A'}`);
      if (sheetError.response?.data) {
        console.error(`   Details: ${JSON.stringify(sheetError.response.data, null, 2)}`);
      }
      throw sheetError;
    }
    
    // Test 4: Gmail API
    console.log('4️⃣ Testing Gmail API...');
    const gmail = google.gmail({ version: 'v1', auth });
    
    // Try to get profile (read permission test)
    try {
      const gmailResponse = await gmail.users.getProfile({
        userId: 'me',
      });
      console.log('✅ Gmail access successful');
      console.log(`   Email: ${gmailResponse.data.emailAddress}\n`);
    } catch (gmailError: any) {
      console.error('❌ Gmail access failed:', gmailError.message);
      console.error(`   Code: ${gmailError.code || 'N/A'}`);
      if (gmailError.response?.data) {
        console.error(`   Details: ${JSON.stringify(gmailError.response.data, null, 2)}`);
      }
      console.warn('⚠️  Gmail API may require OAuth2 instead of service account - this is expected\n');
    }
    
    console.log('🎉 MCP tests completed!');
    
  } catch (error: any) {
    console.error('\n❌ MCP Test Failed:');
    console.error(`   Error: ${error.message}`);
    console.error(`   Code: ${error.code || 'N/A'}`);
    
    if (error.response?.data) {
      console.error(`   Details: ${JSON.stringify(error.response.data, null, 2)}`);
    }
    
    if (error.message.includes('not found')) {
      console.error('\n💡 Tip: Check if the service account file exists at the specified path');
    } else if (error.message.includes('permission') || error.code === 403) {
      console.error('\n💡 Tip: The service account may not have access to:');
      console.error('   - Share the calendar with the service account email');
      console.error('   - Share the sheet with the service account email');
      console.error('   - Enable the APIs in Google Cloud Console');
    } else if (error.code === 401) {
      console.error('\n💡 Tip: Authentication failed. Check:');
      console.error('   - Service account JSON file is valid');
      console.error('   - Service account is not disabled in Google Cloud');
    }
    
    process.exit(1);
  }
}

testMCP();









