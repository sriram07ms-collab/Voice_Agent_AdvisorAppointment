import { google } from 'googleapis';
import { getGoogleAuthClient } from './googleAuth';
import { Booking, Slot } from '../../shared/types/conversation';
import { formatDateTimeIST, getNextBusinessDay, isBusinessDay, addDays } from '../../shared/utils/dateTime';

const IST_TIMEZONE = 'Asia/Kolkata';
const BUSINESS_HOURS = { start: 9, end: 18 }; // 9 AM to 6 PM IST
const SLOT_DURATION_HOURS = 1; // 1 hour slots

export async function createTentativeHold(booking: Booking): Promise<string> {
  try {
    const auth = await getGoogleAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID not configured');
    }

    if (!booking.selectedSlot) {
      throw new Error('Booking must have a selected slot');
    }

    const eventTitle = `Advisor Q&A — ${booking.topic} — ${booking.bookingCode}`;
    const eventDescription = `Booking Code: ${booking.bookingCode}\nTopic: ${booking.topic}\nStatus: Tentative`;

    const event = {
      summary: eventTitle,
      description: eventDescription,
      start: {
        dateTime: booking.selectedSlot.startTime.toISOString(),
        timeZone: IST_TIMEZONE,
      },
      end: {
        dateTime: booking.selectedSlot.endTime.toISOString(),
        timeZone: IST_TIMEZONE,
      },
      status: 'tentative',
      transparency: 'opaque',
    };

    const response = await calendar.events.insert({
      calendarId,
      requestBody: event,
    });

    if (!response.data.id) {
      throw new Error('Failed to create calendar event');
    }

    console.log(`✅ Calendar event created: ${response.data.id}`);
    console.log(`   Event link: ${response.data.htmlLink || 'N/A'}`);
    return response.data.id;
  } catch (error: any) {
    console.error('❌ Error creating calendar hold:', error.message);
    console.error('   Error code:', error.code);
    console.error('   Error details:', error.response?.data || error);
    if (error.response?.data) {
      console.error('   Full error response:', JSON.stringify(error.response.data, null, 2));
    }
    throw new Error(`Failed to create calendar hold: ${error.message}`);
  }
}

export async function updateHold(eventId: string, booking: Booking): Promise<void> {
  try {
    const auth = await getGoogleAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID not configured');
    }

    if (!booking.selectedSlot) {
      throw new Error('Booking must have a selected slot');
    }

    const eventTitle = `Advisor Q&A — ${booking.topic} — ${booking.bookingCode}`;
    const eventDescription = `Booking Code: ${booking.bookingCode}\nTopic: ${booking.topic}\nStatus: Tentative (Rescheduled)`;

    const event = {
      summary: eventTitle,
      description: eventDescription,
      start: {
        dateTime: booking.selectedSlot.startTime.toISOString(),
        timeZone: IST_TIMEZONE,
      },
      end: {
        dateTime: booking.selectedSlot.endTime.toISOString(),
        timeZone: IST_TIMEZONE,
      },
      status: 'tentative',
    };

    await calendar.events.update({
      calendarId,
      eventId,
      requestBody: event,
    });

    console.log(`✅ Calendar event updated: ${eventId}`);
  } catch (error: any) {
    console.error('Error updating calendar hold:', error);
    throw new Error(`Failed to update calendar hold: ${error.message}`);
  }
}

export async function deleteHold(eventId: string): Promise<void> {
  try {
    const auth = await getGoogleAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId) {
      throw new Error('GOOGLE_CALENDAR_ID not configured');
    }

    await calendar.events.delete({
      calendarId,
      eventId,
    });

    console.log(`✅ Calendar event deleted: ${eventId}`);
  } catch (error: any) {
    console.error('Error deleting calendar hold:', error);
    throw new Error(`Failed to delete calendar hold: ${error.message}`);
  }
}

export async function getAvailableSlots(
  startDate: Date,
  endDate: Date
): Promise<Slot[]> {
  try {
    const auth = await getGoogleAuthClient();
    const calendar = google.calendar({ version: 'v3', auth });

    const calendarId = process.env.GOOGLE_CALENDAR_ID;
    if (!calendarId || calendarId.includes('your_calendar_id')) {
      console.warn('GOOGLE_CALENDAR_ID not configured, falling back to mock slots');
      throw new Error('GOOGLE_CALENDAR_ID not configured');
    }

    // Get existing events in the date range
    const response = await calendar.events.list({
      calendarId,
      timeMin: startDate.toISOString(),
      timeMax: endDate.toISOString(),
      singleEvents: true,
      orderBy: 'startTime',
    });

    const existingEvents = response.data.items || [];
    const bookedSlots = new Set<string>();

    // Mark booked time slots
    existingEvents.forEach((event) => {
      if (event.start?.dateTime) {
        const startTime = new Date(event.start.dateTime);
        const hour = startTime.getHours();
        const dateKey = startTime.toISOString().split('T')[0];
        bookedSlots.add(`${dateKey}-${hour}`);
      }
    });

    // Generate available slots
    const availableSlots: Slot[] = [];
    let currentDate = new Date(startDate);

    while (currentDate <= endDate) {
      if (!isBusinessDay(currentDate)) {
        currentDate = addDays(currentDate, 1);
        continue;
      }

      for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
        const dateKey = currentDate.toISOString().split('T')[0];
        const slotKey = `${dateKey}-${hour}`;

        if (!bookedSlots.has(slotKey)) {
          const startTime = new Date(currentDate);
          startTime.setHours(hour, 0, 0, 0);

          const endTime = new Date(startTime);
          endTime.setHours(hour + SLOT_DURATION_HOURS, 0, 0, 0);

          availableSlots.push({
            id: `slot-${dateKey}-${hour}`,
            startTime,
            endTime,
            status: 'available',
          });
        }
      }

      currentDate = addDays(currentDate, 1);
    }

    return availableSlots;
  } catch (error: any) {
    console.error('Error getting available slots from calendar:', error);
    // Fallback to mock slots if calendar query fails
    console.warn('Falling back to mock slot generation');
    return generateMockSlotsFallback(startDate);
  }
}

// Fallback function if calendar query fails
function generateMockSlotsFallback(startDate: Date): Slot[] {
  const slots: Slot[] = [];
  let currentDate = new Date(startDate);

  for (let day = 0; day < 7; day++) {
    if (!isBusinessDay(currentDate)) {
      currentDate = addDays(currentDate, 1);
      continue;
    }

    for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
      const startTime = new Date(currentDate);
      startTime.setHours(hour, 0, 0, 0);

      const endTime = new Date(startTime);
      endTime.setHours(hour + SLOT_DURATION_HOURS, 0, 0, 0);

      slots.push({
        id: `slot-${currentDate.toISOString().split('T')[0]}-${hour}`,
        startTime,
        endTime,
        status: 'available',
      });
    }

    currentDate = addDays(currentDate, 1);
  }

  return slots;
}



