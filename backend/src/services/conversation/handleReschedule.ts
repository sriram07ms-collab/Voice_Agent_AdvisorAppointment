import { ConversationState, ConversationStep, Slot } from '../../shared/types/conversation';
import { getAvailableSlots } from '../booking/slotService';
import { rescheduleBooking, getBookingByCode } from '../booking/bookingService';
import { formatDateTimeIST } from '../../shared/utils/dateTime';
import { SYSTEM_MESSAGES } from '../../shared/constants/messages';

export async function handleReschedule(state: ConversationState): Promise<{ response: string; nextStep: ConversationStep; slots?: Slot[]; contextUpdates?: any }> {
  // Check if we have a booking code and booking ID
  if (!state.context.bookingCode) {
    return { response: SYSTEM_MESSAGES.INVALID_CODE, nextStep: 'GREET' as ConversationStep };
  }
  
  const booking = getBookingByCode(state.context.bookingCode);
  if (!booking) {
    return { response: SYSTEM_MESSAGES.INVALID_CODE, nextStep: 'GREET' as ConversationStep };
  }
  
  // Check if we have new time preferences
  if (!state.context.datePreference && !state.context.timePreference) {
    return {
      response: SYSTEM_MESSAGES.TIME_PREFERENCE + ' For example: "tomorrow afternoon" or "Dec 30, 2025 at 2pm"',
      nextStep: 'TIME_PREFERENCE' as ConversationStep,
    };
  }
  
  // Get available slots based on new preferences
  const slots = await getAvailableSlots(state.context.datePreference, state.context.timePreference);
  if (slots.length === 0) {
    return {
      response: SYSTEM_MESSAGES.NO_SLOTS + ' ' + SYSTEM_MESSAGES.WAITLIST_CONFIRMED,
      nextStep: 'COMPLETE' as ConversationStep,
    };
  }
  
  // Offer first 2 slots (use SLOT_OFFERING step for consistency)
  const offeredSlots = slots.slice(0, 2);
  return {
    response: SYSTEM_MESSAGES.SLOT_OFFERING + '\n' +
      offeredSlots.map((s, i) => `${i + 1}. ${formatDateTimeIST(s.startTime)} IST`).join('\n') +
      '\n\nPlease select a slot by number (1 or 2) or say "book slot 1" / "book slot 2".',
    nextStep: 'SLOT_OFFERING' as ConversationStep,
    slots: offeredSlots,
    contextUpdates: { selectedSlots: offeredSlots },
  };
}

export async function confirmReschedule(
  state: ConversationState,
  selectedSlotId?: string
): Promise<{ response: string; nextStep: ConversationStep; bookingCode?: string }> {
  if (!state.context.bookingCode) {
    return { response: SYSTEM_MESSAGES.INVALID_CODE, nextStep: 'GREET' as ConversationStep };
  }
  
  const booking = getBookingByCode(state.context.bookingCode);
  if (!booking) {
    return { response: SYSTEM_MESSAGES.INVALID_CODE, nextStep: 'GREET' as ConversationStep };
  }
  
  // Find the selected slot
  let selectedSlot;
  if (selectedSlotId && state.context.selectedSlots) {
    selectedSlot = state.context.selectedSlots.find(s => s.id === selectedSlotId);
  } else if (state.context.selectedSlots && state.context.selectedSlots.length > 0) {
    selectedSlot = state.context.selectedSlots[0];
  }
  
  if (!selectedSlot) {
    // Get available slots and offer again
    const slots = await getAvailableSlots(state.context.datePreference, state.context.timePreference);
    if (slots.length === 0) {
      return {
        response: SYSTEM_MESSAGES.NO_SLOTS + ' ' + SYSTEM_MESSAGES.WAITLIST_CONFIRMED,
        nextStep: 'COMPLETE' as ConversationStep,
      };
    }
    const offeredSlots = slots.slice(0, 2);
    return {
      response: SYSTEM_MESSAGES.SLOT_OFFERING + '\n' +
        offeredSlots.map((s, i) => `${i + 1}. ${formatDateTimeIST(s.startTime)} IST`).join('\n') +
        '\n\nPlease select a slot by number (1 or 2).',
      nextStep: 'SLOT_OFFERING' as ConversationStep,
    };
  }
  
  // Perform reschedule
  try {
    const rescheduledBooking = await rescheduleBooking(state.context.bookingCode, selectedSlot);
    if (!rescheduledBooking) {
      return { response: SYSTEM_MESSAGES.INVALID_CODE, nextStep: 'GREET' as ConversationStep };
    }
    
    const mcpEnabled = process.env.MCP_ENABLED === 'true';
    const mcpMessage = mcpEnabled ? '[Calendar hold updated]' : '[Mock calendar hold updated]';
    
    return {
      response: `Your booking ${state.context.bookingCode} has been rescheduled to ${formatDateTimeIST(selectedSlot.startTime)} IST. ${mcpMessage}`,
      nextStep: 'COMPLETE' as ConversationStep,
      bookingCode: rescheduledBooking.bookingCode,
    };
  } catch (error: any) {
    return {
      response: `Failed to reschedule: ${error.message}. Please try again.`,
      nextStep: 'TIME_PREFERENCE' as ConversationStep,
    };
  }
}
