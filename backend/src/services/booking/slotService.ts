import { Slot } from '../../shared/types/conversation';
import { getNextBusinessDay, isBusinessDay, addDays } from '../../shared/utils/dateTime';

const IST_TIMEZONE = 'Asia/Kolkata';
const BUSINESS_HOURS = { start: 9, end: 18 }; // 9 AM to 6 PM IST
const SLOT_DURATION_HOURS = 1; // 1 hour slots

// Mock available slots - in production, this would query a database
const mockSlots: Map<string, Slot> = new Map();

export function generateMockSlots(startDate: Date, days: number = 7): Slot[] {
  const slots: Slot[] = [];
  let currentDate = new Date(startDate);
  
  for (let day = 0; day < days; day++) {
    if (!isBusinessDay(currentDate)) {
      currentDate = getNextBusinessDay(currentDate);
      continue;
    }
    
    // Generate slots from 9 AM to 5 PM (last slot starts at 5 PM, ends at 6 PM)
    for (let hour = BUSINESS_HOURS.start; hour < BUSINESS_HOURS.end; hour++) {
      const startTime = new Date(currentDate);
      startTime.setHours(hour, 0, 0, 0);
      
      const endTime = new Date(startTime);
      endTime.setHours(hour + SLOT_DURATION_HOURS, 0, 0, 0);
      
      const slotId = `slot-${currentDate.toISOString()}-${hour}`;
      
      // Check if slot is already booked
      const existingSlot = mockSlots.get(slotId);
      if (existingSlot && existingSlot.status === 'booked') {
        continue;
      }
      
      const slot: Slot = {
        id: slotId,
        startTime: startTime,
        endTime: endTime,
        status: existingSlot?.status || 'available',
        bookingCode: existingSlot?.bookingCode,
      };
      
      slots.push(slot);
      mockSlots.set(slotId, slot);
    }
    
    currentDate = getNextBusinessDay(currentDate);
  }
  
  return slots.filter(slot => slot.status === 'available');
}

export async function getAvailableSlots(datePreference?: string, timePreference?: string): Promise<Slot[]> {
  const startDate = datePreference
    ? new Date(datePreference)
    : getNextBusinessDay();
  
  const endDate = addDays(startDate, 7);
  
  let slots: Slot[] = [];
  
  // Try to use real calendar if MCP is enabled
  const mcpEnabled = process.env.MCP_ENABLED === 'true';
  if (mcpEnabled) {
    try {
      // Lazy import to avoid loading when MCP is disabled
      const { getAvailableSlots: getCalendarSlots } = await import('../mcp/calendarMCP');
      const calendarSlots = await getCalendarSlots(startDate, endDate);
      
      // Track calendar slots in mockSlots map to track bookings
      for (const slot of calendarSlots) {
        const existingSlot = mockSlots.get(slot.id);
        if (existingSlot && existingSlot.status === 'booked') {
          // Slot is already booked, mark it as booked
          slot.status = 'booked';
          slot.bookingCode = existingSlot.bookingCode;
        }
        // Store in map for booking tracking
        mockSlots.set(slot.id, slot);
      }
      
      slots = calendarSlots;
    } catch (error: any) {
      console.error('Failed to get slots from calendar, falling back to mock:', error.message);
      console.error('Calendar error details:', error);
      // Fall through to mock slots - don't throw, just use fallback
      slots = generateMockSlots(startDate, 7);
    }
  } else {
    // Use mock slots
    slots = generateMockSlots(startDate, 7);
  }
  
  // Filter out booked slots - only return available ones
  slots = slots.filter(slot => slot.status === 'available');
  
  // Filter by time preference if provided
  if (timePreference) {
    const lowerTime = timePreference.toLowerCase();
    let preferredHour: number | null = null;
    
    if (lowerTime.includes('morning') || lowerTime.includes('am')) {
      preferredHour = 9; // 9-12
    } else if (lowerTime.includes('afternoon') || lowerTime.includes('12') || lowerTime.includes('1') || lowerTime.includes('2')) {
      preferredHour = 12; // 12-3
    } else if (lowerTime.includes('evening') || lowerTime.includes('pm') || lowerTime.includes('4') || lowerTime.includes('5')) {
      preferredHour = 15; // 3-6
    }
    
    if (preferredHour !== null) {
      slots = slots.filter(slot => {
        const hour = slot.startTime.getHours();
        return hour >= preferredHour! && hour < preferredHour! + 3;
      });
    }
  }
  
  return slots.slice(0, 10); // Return first 10 available slots
}

export function bookSlot(slotId: string, bookingCode: string): Slot | null {
  const slot = mockSlots.get(slotId);
  if (!slot) {
    // Slot not in map - might be from calendar query
    // Try to find it by ID pattern or create a new entry
    console.warn(`Slot ${slotId} not found in mockSlots map. This might be a calendar slot.`);
    return null;
  }
  
  if (slot.status !== 'available') {
    console.warn(`Slot ${slotId} is not available. Status: ${slot.status}`);
    return null;
  }
  
  slot.status = 'booked';
  slot.bookingCode = bookingCode;
  mockSlots.set(slotId, slot);
  
  return slot;
}

// Function to book a slot by Slot object (for calendar slots)
export function bookSlotByObject(slot: Slot, bookingCode: string): Slot {
  // Update the slot status
  slot.status = 'booked';
  slot.bookingCode = bookingCode;
  
  // Also store in mockSlots map for consistency
  mockSlots.set(slot.id, slot);
  
  return slot;
}

export function releaseSlot(slotId: string): void {
  const slot = mockSlots.get(slotId);
  if (slot) {
    slot.status = 'available';
    slot.bookingCode = undefined;
    mockSlots.set(slotId, slot);
  }
}

export function getSlotById(slotId: string): Slot | undefined {
  return mockSlots.get(slotId);
}

