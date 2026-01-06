import { v4 as uuidv4 } from 'uuid';
import { Booking, Topic, Slot, BookingStatus } from '../../shared/types/conversation';
import { generateBookingCode } from './codeGenerator';
import { bookSlot, bookSlotByObject, releaseSlot, getSlotById } from './slotService';
import { getBookings, getBookingsByCode, addBooking, updateBooking, removeBooking } from './bookingStorage';

// Use file-based storage for bookings
const bookings = getBookings();
const bookingsByCode = getBookingsByCode();

export async function createBooking(
  topic: Topic,
  selectedSlot: Slot,
  preferredDate?: Date,
  preferredTime?: string
): Promise<Booking> {
  const bookingCode = generateBookingCode();
  const bookingId = uuidv4();
  
  // Book the slot - try by ID first, then by object
  let bookedSlot = bookSlot(selectedSlot.id, bookingCode);
  if (!bookedSlot) {
    // Slot might not be in mockSlots map (e.g., from calendar query)
    // Try booking by object instead
    console.log(`Slot ${selectedSlot.id} not in map, booking by object`);
    bookedSlot = bookSlotByObject({ ...selectedSlot }, bookingCode);
  }
  
  if (!bookedSlot || bookedSlot.status !== 'booked') {
    throw new Error('Slot is no longer available');
  }
  
  const booking: Booking = {
    id: bookingId,
    bookingCode,
    topic,
    preferredDate,
    preferredTime,
    selectedSlot: bookedSlot,
    status: 'tentative',
    timezone: 'IST',
    createdAt: new Date(),
    updatedAt: new Date(),
    secureUrl: generateSecureUrl(bookingCode),
    expiresAt: new Date(Date.now() + 24 * 60 * 60 * 1000), // 24 hours
  };
  
  // MCP Operations (Phase 2) - Graceful degradation if MCP fails
  const mcpEnabled = process.env.MCP_ENABLED === 'true';
  if (mcpEnabled) {
    try {
      // Lazy import to avoid loading when MCP is disabled
      const { createTentativeHold } = await import('../mcp/calendarMCP');
      const { appendBookingRecord } = await import('../mcp/notesMCP');
      const { draftAdvisorEmail } = await import('../mcp/emailMCP');
      
      // Create calendar hold
      const eventId = await createTentativeHold(booking);
      booking.calendarHoldId = eventId;
      
      // Append to Google Sheet
      const rowNumber = await appendBookingRecord(booking);
      booking.notesDocId = rowNumber;
      
      // Draft advisor email
      const draftId = await draftAdvisorEmail(booking);
      if (draftId) {
        booking.emailDraftId = draftId;
      }
      
      booking.updatedAt = new Date();
      console.log(`✅ MCP operations completed for booking ${bookingCode}`);
      console.log(`   - Calendar Event ID: ${booking.calendarHoldId || 'N/A'}`);
      console.log(`   - Sheet Row: ${booking.notesDocId || 'N/A'}`);
      console.log(`   - Email Draft ID: ${booking.emailDraftId || 'N/A'}`);
    } catch (error: any) {
      console.error('❌ MCP operations failed (booking will continue):', error.message);
      console.error('   Error stack:', error.stack);
      console.error('   Full error:', JSON.stringify(error, null, 2));
      // Continue with booking even if MCP fails (graceful degradation)
    }
  }
  
  addBooking(booking);
  
  return booking;
}

export function getBookingByCode(bookingCode: string): Booking | undefined {
  return bookingsByCode.get(bookingCode);
}

export function getBookingById(bookingId: string): Booking | undefined {
  return bookings.get(bookingId);
}

export async function rescheduleBooking(bookingCode: string, newSlot: Slot): Promise<Booking | null> {
  const booking = bookingsByCode.get(bookingCode);
  if (!booking) {
    return null;
  }
  
  // Release old slot
  if (booking.selectedSlot) {
    releaseSlot(booking.selectedSlot.id);
  }
  
  // Book new slot
  const bookedSlot = bookSlot(newSlot.id, bookingCode);
  if (!bookedSlot) {
    throw new Error('New slot is no longer available');
  }
  
  booking.selectedSlot = bookedSlot;
  booking.updatedAt = new Date();
  booking.status = 'tentative'; // Reset status to tentative on reschedule
  
  // Save to storage
  updateBooking(booking);
  
  // MCP Operations (Phase 2)
  const mcpEnabled = process.env.MCP_ENABLED === 'true';
  if (mcpEnabled) {
    try {
      // Lazy import to avoid loading when MCP is disabled
      const { updateHold } = await import('../mcp/calendarMCP');
      const { updateBookingRecord } = await import('../mcp/notesMCP');
      
      // Update calendar hold
      if (booking.calendarHoldId) {
        await updateHold(booking.calendarHoldId, booking);
      }
      
      // Update Google Sheet
      if (booking.notesDocId) {
        await updateBookingRecord(booking.notesDocId, booking);
      }
      
      console.log(`✅ MCP operations completed for reschedule ${bookingCode}`);
    } catch (error: any) {
      console.error('MCP operations failed during reschedule:', error.message);
      // Continue even if MCP fails
    }
  }
  
  return booking;
}

export async function cancelBooking(bookingCode: string): Promise<Booking | null> {
  const booking = bookingsByCode.get(bookingCode);
  if (!booking) {
    return null;
  }
  
  // Release slot
  if (booking.selectedSlot) {
    releaseSlot(booking.selectedSlot.id);
  }
  
  booking.status = 'cancelled';
  booking.updatedAt = new Date();
  
  // Save to storage
  updateBooking(booking);
  
  // MCP Operations (Phase 2)
  const mcpEnabled = process.env.MCP_ENABLED === 'true';
  if (mcpEnabled) {
    try {
      // Lazy import to avoid loading when MCP is disabled
      const { deleteHold } = await import('../mcp/calendarMCP');
      const { markAsCancelled } = await import('../mcp/notesMCP');
      
      // Delete calendar hold
      if (booking.calendarHoldId) {
        await deleteHold(booking.calendarHoldId);
      }
      
      // Mark as cancelled in Google Sheet
      if (booking.notesDocId) {
        await markAsCancelled(booking.notesDocId, bookingCode);
      }
      
      console.log(`✅ MCP operations completed for cancellation ${bookingCode}`);
    } catch (error: any) {
      console.error('MCP operations failed during cancellation:', error.message);
      // Continue even if MCP fails
    }
  }
  
  return booking;
}

function generateSecureUrl(bookingCode: string): string {
  // In production, generate a secure, time-limited URL
  return `/booking/${bookingCode}`;
}

