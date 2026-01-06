import { google } from 'googleapis';
import { getGoogleAuthClient } from './googleAuth';
import { Booking } from '../../shared/types/conversation';
import { formatDateTimeIST } from '../../shared/utils/dateTime';

export async function appendBookingRecord(booking: Booking): Promise<string> {
  try {
    const auth = await getGoogleAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    const rowData = [
      booking.selectedSlot
        ? formatDateTimeIST(booking.selectedSlot.startTime).split(',')[0] // Date
        : booking.preferredDate
        ? new Date(booking.preferredDate).toISOString().split('T')[0]
        : '',
      booking.selectedSlot
        ? formatDateTimeIST(booking.selectedSlot.startTime).split(',')[1]?.trim() || formatDateTimeIST(booking.selectedSlot.startTime) // Time
        : booking.preferredTime || '',
      booking.topic,
      booking.bookingCode,
      booking.status,
      booking.createdAt.toISOString(),
      booking.updatedAt.toISOString(),
    ];

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:G`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    // Calculate row number (assuming headers in row 1)
    const updatedRange = response.data.updates?.updatedRange;
    let rowNumber = '1';
    if (updatedRange) {
      const match = updatedRange.match(/(\d+)$/);
      if (match) {
        rowNumber = match[1];
      }
    }

    console.log(`✅ Booking record appended to sheet at row ${rowNumber}`);
    return rowNumber;
  } catch (error: any) {
    console.error('❌ Error appending booking record to Google Sheet:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error details:', error.response?.data || error);
    if (error.response?.data) {
      console.error('   Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(`Failed to append booking record: ${error.message}`);
  }
}

export async function updateBookingRecord(
  rowNumber: string,
  booking: Booking
): Promise<void> {
  try {
    const auth = await getGoogleAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    const rowData = [
      booking.selectedSlot
        ? formatDateTimeIST(booking.selectedSlot.startTime).split(',')[0]
        : booking.preferredDate
        ? new Date(booking.preferredDate).toISOString().split('T')[0]
        : '',
      booking.selectedSlot
        ? formatDateTimeIST(booking.selectedSlot.startTime).split(',')[1]?.trim() || formatDateTimeIST(booking.selectedSlot.startTime)
        : booking.preferredTime || '',
      booking.topic,
      booking.bookingCode,
      booking.status,
      booking.createdAt.toISOString(),
      booking.updatedAt.toISOString(),
    ];

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!A${rowNumber}:G${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [rowData],
      },
    });

    console.log(`✅ Booking record updated at row ${rowNumber}`);
  } catch (error: any) {
    console.error('Error updating booking record:', error);
    throw new Error(`Failed to update booking record: ${error.message}`);
  }
}

export async function markAsCancelled(
  rowNumber: string,
  bookingCode: string
): Promise<void> {
  try {
    const auth = await getGoogleAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    // Update status column (column E) and updatedAt column (column G)
    const now = new Date().toISOString();
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!E${rowNumber}:G${rowNumber}`,
      valueInputOption: 'USER_ENTERED',
      requestBody: {
        values: [['cancelled', '', now]],
      },
    });

    console.log(`✅ Booking ${bookingCode} marked as cancelled at row ${rowNumber}`);
  } catch (error: any) {
    console.error('Error marking booking as cancelled:', error);
    throw new Error(`Failed to mark booking as cancelled: ${error.message}`);
  }
}

export async function findBookingByCode(bookingCode: string): Promise<number | null> {
  try {
    const auth = await getGoogleAuthClient();
    const sheets = google.sheets({ version: 'v4', auth });

    const sheetId = process.env.GOOGLE_SHEET_ID;
    const sheetName = process.env.GOOGLE_SHEET_NAME || 'Sheet1';

    if (!sheetId) {
      throw new Error('GOOGLE_SHEET_ID not configured');
    }

    // Get all data from the sheet
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: `${sheetName}!A:G`,
    });

    const rows = response.data.values || [];
    
    // Skip header row, search for booking code in column D (index 3)
    for (let i = 1; i < rows.length; i++) {
      if (rows[i][3] === bookingCode) {
        return i + 1; // Return 1-based row number
      }
    }

    return null;
  } catch (error: any) {
    console.error('Error finding booking by code:', error);
    return null;
  }
}



