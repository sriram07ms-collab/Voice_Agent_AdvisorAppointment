import { ConversationState, ConversationStep, Intent, Topic, Slot } from '../../shared/types/conversation';
import { SYSTEM_MESSAGES, EDUCATIONAL_LINKS } from '../../shared/constants/messages';
import { TOPICS, TOPIC_KEYWORDS } from '../../shared/constants/topics';
import { getAvailableSlots, getSlotById } from '../booking/slotService';
import { createBooking, getBookingByCode, rescheduleBooking, cancelBooking } from '../booking/bookingService';
import { formatDateTimeIST } from '../../shared/utils/dateTime';
import { parseDateTimeInput } from '../../utils/dateParser';
import { GroqFunctionCall } from '../../shared/types/conversation';
import { updateContext, transitionStep, addToHistory } from './stateManager';
import { handleReschedule, confirmReschedule } from './handleReschedule';

export interface FlowResult {
  response: string;
  nextStep: ConversationStep;
  contextUpdates?: Partial<ConversationState['context']>;
  slots?: Slot[];
  bookingCode?: string;
  educationalLinks?: string[];
  metadata?: any;
}

export async function processFlow(
  state: ConversationState,
  userMessage: string,
  intent: Intent,
  functionCalls?: GroqFunctionCall[]
): Promise<FlowResult> {
  let response = '';
  let nextStep = state.currentStep;
  const contextUpdates: Partial<ConversationState['context']> = {};
  
  // Handle function calls first
  if (functionCalls && functionCalls.length > 0) {
    for (const call of functionCalls) {
      const result = handleFunctionCall(state, call);
      if (result) {
        Object.assign(contextUpdates, result.contextUpdates);
        if (result.response) response += result.response + ' ';
        if (result.nextStep) nextStep = result.nextStep;
      }
    }
  }
  
  // Handle intent-based flow
  const intentResult = await handleIntent(state, intent, userMessage);
  if (intentResult) {
    if (intentResult.response) response = intentResult.response;
    if (intentResult.nextStep) nextStep = intentResult.nextStep;
    if (intentResult.contextUpdates) {
      Object.assign(contextUpdates, intentResult.contextUpdates);
    }
  }
  
  // Handle step-based flow
  const stepResult = await handleStep(state, userMessage);
  if (stepResult) {
    if (stepResult.response) response = stepResult.response;
    if (stepResult.nextStep) nextStep = stepResult.nextStep;
    if (stepResult.contextUpdates) {
      Object.assign(contextUpdates, stepResult.contextUpdates);
    }
  }
  
  // If no response was generated, provide a more helpful message based on current step
  if (!response.trim()) {
    switch (nextStep) {
      case 'TIME_PREFERENCE':
        response = SYSTEM_MESSAGES.TIME_PREFERENCE + ' Please provide your preferred date and time.';
        break;
      case 'SLOT_OFFERING':
        response = 'Please select one of the available slots above.';
        break;
      case 'CONFIRMATION':
        response = 'Please confirm your selected slot to proceed with booking.';
        break;
      default:
        response = 'Could you please rephrase? I want to make sure I understand correctly.';
    }
  }
  
  return {
    response: response.trim(),
    nextStep,
    contextUpdates,
  };
}

function handleFunctionCall(
  state: ConversationState,
  call: GroqFunctionCall
): Partial<FlowResult> | null {
  switch (call.name) {
    case 'select_topic':
      return {
        contextUpdates: { topic: call.arguments.topic as Topic },
        nextStep: 'TOPIC_SELECTION',
        response: `You've selected ${call.arguments.topic}. Is that correct?`,
      };
      
    case 'collect_time_preference':
      return {
        contextUpdates: {
          datePreference: call.arguments.datePreference,
          timePreference: call.arguments.timePreference,
        },
        nextStep: 'TIME_PREFERENCE',
      };
      
    case 'select_slot':
      const slot = getSlotById(call.arguments.slotId);
      if (slot) {
        return {
          contextUpdates: { selectedSlots: [slot] },
          nextStep: 'CONFIRMATION',
          response: `Please confirm this slot: ${formatDateTimeIST(slot.startTime)} IST`,
        };
      }
      return {
        response: 'Sorry, that slot is no longer available. Please select another.',
      };
      
    case 'provide_booking_code':
      return {
        contextUpdates: { bookingCode: call.arguments.bookingCode },
        nextStep: 'VALIDATE_CODE',
      };
      
    case 'confirm_action':
      if (call.arguments.action === 'confirm_booking') {
        // Note: This will be handled asynchronously in handleStep
        return { nextStep: 'CONFIRMATION' };
      } else if (call.arguments.action === 'confirm_reschedule') {
        return { nextStep: 'TIME_PREFERENCE' };
      } else if (call.arguments.action === 'confirm_cancel') {
        // Note: This will be handled asynchronously in handleStep
        return { nextStep: 'CANCELLATION' };
      }
      break;
  }
  
  return null;
}

async function handleIntent(
  state: ConversationState,
  intent: Intent,
  userMessage: string
): Promise<Partial<FlowResult> | null> {
  // First, try to detect topic from user message if we're in topic selection or disclaimer
  if (state.currentStep === 'TOPIC_SELECTION' || state.currentStep === 'DISCLAIMER') {
    const detectedTopic = detectTopicFromMessage(userMessage);
    if (detectedTopic) {
      return {
        contextUpdates: { topic: detectedTopic },
        response: `You've selected ${detectedTopic}. Is that correct?`,
        nextStep: 'TOPIC_SELECTION',
      };
    }
  }
  
  // Handle time preference extraction in TIME_PREFERENCE step
  if (state.currentStep === 'TIME_PREFERENCE') {
    const timeInfo = extractTimePreference(userMessage);
    if (timeInfo.datePreference || timeInfo.timePreference) {
      const updatedContext = {
        datePreference: timeInfo.datePreference || state.context.datePreference,
        timePreference: timeInfo.timePreference || state.context.timePreference,
      };
      
      const slots = await getAvailableSlots(updatedContext.datePreference, updatedContext.timePreference);
      if (slots.length === 0) {
        return {
          response: SYSTEM_MESSAGES.NO_SLOTS + ' ' + SYSTEM_MESSAGES.WAITLIST_CONFIRMED,
          nextStep: 'COMPLETE',
          contextUpdates: updatedContext,
        };
      }
      
      const offeredSlots = slots.slice(0, 2);
      return {
        response: SYSTEM_MESSAGES.SLOT_OFFERING + '\n' +
          offeredSlots.map((s, i) => `${i + 1}. ${formatDateTimeIST(s.startTime)} IST`).join('\n') +
          '\n\nPlease select a slot by number (1 or 2) or say "book slot 1" / "book slot 2".',
        slots: offeredSlots,
        contextUpdates: { ...updatedContext, selectedSlots: offeredSlots },
        nextStep: 'SLOT_OFFERING',
      };
    }
  }
  
  switch (intent) {
    case 'book_new':
      if (state.currentStep === 'INITIAL' || state.currentStep === 'GREET') {
        return {
          response: SYSTEM_MESSAGES.GREET + ' ' + SYSTEM_MESSAGES.DISCLAIMER,
          nextStep: 'DISCLAIMER',
        };
      }
      break;
      
    case 'reschedule':
      return {
        response: SYSTEM_MESSAGES.RESCHEDULE_PROMPT,
        nextStep: 'VALIDATE_CODE',
      };
      
    case 'cancel':
      return {
        response: SYSTEM_MESSAGES.CANCEL_PROMPT,
        nextStep: 'VALIDATE_CODE',
      };
      
    case 'what_to_prepare':
      if (state.context.topic) {
        const links = EDUCATIONAL_LINKS[state.context.topic] || [];
        return {
          response: `Here's what you might need for ${state.context.topic}:\n${links.map(l => `- ${l}`).join('\n')}`,
          educationalLinks: links,
          nextStep: state.currentStep, // Stay in current step
        };
      }
      return {
        response: 'Please first select a topic to see what you need to prepare.',
      };
      
    case 'check_availability':
      const slots = getAvailableSlots(state.context.datePreference, state.context.timePreference);
      return {
        response: `Here are available slots:\n${slots.slice(0, 5).map(s => `- ${formatDateTimeIST(s.startTime)}`).join('\n')}`,
        slots: slots.slice(0, 5),
        nextStep: 'AVAILABILITY_LIST',
      };
  }
  
  return null;
}

// Helper function to detect topic from user message
function detectTopicFromMessage(message: string): Topic | null {
  const lowerMessage = message.toLowerCase();
  
  // Check each topic and its keywords
  for (const topic of TOPICS) {
    const keywords = TOPIC_KEYWORDS[topic];
    const topicLower = topic.toLowerCase();
    
    // Check if message contains topic name or keywords
    if (lowerMessage.includes(topicLower) || 
        keywords.some(keyword => lowerMessage.includes(keyword.toLowerCase()))) {
      return topic;
    }
  }
  
  // Special cases
  if (lowerMessage.includes('nominee') || lowerMessage.includes('beneficiary')) {
    return 'Account Changes/Nominee';
  }
  if (lowerMessage.includes('kyc') || lowerMessage.includes('onboarding')) {
    return 'KYC/Onboarding';
  }
  if (lowerMessage.includes('sip') || lowerMessage.includes('mandate')) {
    return 'SIP/Mandates';
  }
  if (lowerMessage.includes('statement') || lowerMessage.includes('tax')) {
    return 'Statements/Tax Docs';
  }
  if (lowerMessage.includes('withdrawal') || lowerMessage.includes('redeem')) {
    return 'Withdrawals & Timelines';
  }
  
  return null;
}

async function handleStep(state: ConversationState, userMessage: string): Promise<Partial<FlowResult> | null> {
  switch (state.currentStep) {
    case 'INITIAL':
      return {
        response: SYSTEM_MESSAGES.GREET + ' ' + SYSTEM_MESSAGES.DISCLAIMER,
        nextStep: 'DISCLAIMER',
      };
      
    case 'DISCLAIMER':
      // Check if user already mentioned a topic in their message
      const topicFromMessage = detectTopicFromMessage(userMessage);
      if (topicFromMessage) {
        // Topic detected, skip the list and go directly to confirmation
        return {
          contextUpdates: { topic: topicFromMessage },
          response: `You've selected ${topicFromMessage}. Is that correct?`,
          nextStep: 'TOPIC_SELECTION',
        };
      }
      // No topic detected, show the list
      return {
        response: SYSTEM_MESSAGES.TOPIC_SELECTION + '\n' + 
          '1. KYC/Onboarding\n2. SIP/Mandates\n3. Statements/Tax Docs\n4. Withdrawals & Timelines\n5. Account Changes/Nominee',
        nextStep: 'TOPIC_SELECTION',
      };
      
    case 'TOPIC_SELECTION':
      // If user confirms (yes, correct, that's right, etc.)
      const topicConfirmMsg = userMessage.toLowerCase();
      if (state.context.topic && (topicConfirmMsg.includes('yes') || topicConfirmMsg.includes('correct') ||
          topicConfirmMsg.includes('right') || topicConfirmMsg.includes('confirm') || topicConfirmMsg === 'y')) {
        return {
          response: `Great! You've selected ${state.context.topic}. ${SYSTEM_MESSAGES.TIME_PREFERENCE}`,
          nextStep: 'TIME_PREFERENCE',
        };
      }
      // If topic is already set but user is trying to change it
      if (state.context.topic) {
        const newTopic = detectTopicFromMessage(userMessage);
        if (newTopic && newTopic !== state.context.topic) {
          return {
            contextUpdates: { topic: newTopic },
            response: `You've selected ${newTopic}. Is that correct?`,
            nextStep: 'TOPIC_SELECTION',
          };
        }
        // Topic already set, just need confirmation
        return {
          response: `You've selected ${state.context.topic}. Is that correct? Please reply with 'yes' to continue.`,
          nextStep: 'TOPIC_SELECTION',
        };
      }
      // Try to detect topic from message
      const detectedTopic = detectTopicFromMessage(userMessage);
      if (detectedTopic) {
        return {
          contextUpdates: { topic: detectedTopic },
          response: `You've selected ${detectedTopic}. Is that correct?`,
          nextStep: 'TOPIC_SELECTION',
        };
      }
      // No topic detected, ask again
      return {
        response: SYSTEM_MESSAGES.TOPIC_SELECTION + '\n' + 
          '1. KYC/Onboarding\n2. SIP/Mandates\n3. Statements/Tax Docs\n4. Withdrawals & Timelines\n5. Account Changes/Nominee',
        nextStep: 'TOPIC_SELECTION',
      };
      
    case 'TIME_PREFERENCE':
      // Try to extract date/time from user message if not already set
      if (!state.context.datePreference || !state.context.timePreference) {
        const timeInfo = extractTimePreference(userMessage);
        if (timeInfo.datePreference || timeInfo.timePreference) {
          const updatedContext = {
            datePreference: timeInfo.datePreference || state.context.datePreference,
            timePreference: timeInfo.timePreference || state.context.timePreference,
          };
          
          const slots = await getAvailableSlots(updatedContext.datePreference, updatedContext.timePreference);
          if (slots.length === 0) {
            return {
              response: SYSTEM_MESSAGES.NO_SLOTS + ' ' + SYSTEM_MESSAGES.WAITLIST_CONFIRMED,
              nextStep: 'COMPLETE',
              contextUpdates: updatedContext,
            };
          }
          
          const offeredSlots = slots.slice(0, 2);
          return {
            response: SYSTEM_MESSAGES.SLOT_OFFERING + '\n' +
              offeredSlots.map((s, i) => `${i + 1}. ${formatDateTimeIST(s.startTime)} IST`).join('\n') +
              '\n\nPlease select a slot by number (1 or 2) or say "book slot 1" / "book slot 2".',
            slots: offeredSlots,
            contextUpdates: { ...updatedContext, selectedSlots: offeredSlots },
            nextStep: 'SLOT_OFFERING',
          };
        }
      }
      
      // If already have preferences, show slots
      if (state.context.datePreference || state.context.timePreference) {
        const slots = await getAvailableSlots(state.context.datePreference, state.context.timePreference);
        if (slots.length === 0) {
          return {
            response: SYSTEM_MESSAGES.NO_SLOTS + ' ' + SYSTEM_MESSAGES.WAITLIST_CONFIRMED,
            nextStep: 'COMPLETE',
          };
        }
        
        const offeredSlots = slots.slice(0, 2);
        return {
          response: SYSTEM_MESSAGES.SLOT_OFFERING + '\n' +
            offeredSlots.map((s, i) => `${i + 1}. ${formatDateTimeIST(s.startTime)} IST`).join('\n') +
            '\n\nPlease select a slot by number (1 or 2) or say "book slot 1" / "book slot 2".',
          slots: offeredSlots,
          contextUpdates: { selectedSlots: offeredSlots },
          nextStep: 'SLOT_OFFERING',
        };
      }
      
      // No time preference yet, ask for it
      return {
        response: SYSTEM_MESSAGES.TIME_PREFERENCE + ' For example: "tomorrow afternoon" or "Dec 30, 2025 at 2pm"',
        nextStep: 'TIME_PREFERENCE',
      };
      
    case 'SLOT_OFFERING':
      // Check if user is selecting a slot
      const slotSelection = parseSlotSelection(userMessage, state.context.selectedSlots);
      if (slotSelection) {
        return {
          contextUpdates: { selectedSlots: [slotSelection] },
          response: `You've selected: ${formatDateTimeIST(slotSelection.startTime)} IST. Please confirm by saying "yes" or "confirm" to book this slot.`,
          nextStep: 'CONFIRMATION',
        };
      }
      
      // Check if user says "book it" or similar
      const slotMsg = userMessage.toLowerCase();
      if ((slotMsg.includes('book') || slotMsg.includes('confirm')) && state.context.selectedSlots && state.context.selectedSlots.length > 0) {
        // User wants to book, use the first available slot
        return {
          contextUpdates: { selectedSlots: [state.context.selectedSlots[0]] },
          response: `You've selected: ${formatDateTimeIST(state.context.selectedSlots[0].startTime)} IST. Please confirm by saying "yes" or "confirm" to proceed.`,
          nextStep: 'CONFIRMATION',
        };
      }
      
      // If slots are available but user hasn't selected, remind them
      if (state.context.selectedSlots && state.context.selectedSlots.length > 0) {
        return {
          response: SYSTEM_MESSAGES.SLOT_OFFERING + '\n' +
            state.context.selectedSlots.map((s, i) => `${i + 1}. ${formatDateTimeIST(s.startTime)} IST`).join('\n') +
            '\n\nPlease select a slot by number (1 or 2) or say "book slot 1" / "book slot 2".',
          nextStep: 'SLOT_OFFERING',
        };
      }
      break;
      
    case 'CONFIRMATION':
      // Check if user confirms
      const confirmationMsg = userMessage.toLowerCase();
      if (confirmationMsg.includes('yes') || confirmationMsg.includes('confirm') || confirmationMsg.includes('book') || confirmationMsg === 'y') {
        return await handleBookingConfirmation(state);
      }
      // User hasn't confirmed yet
      if (state.context.selectedSlots && state.context.selectedSlots.length > 0) {
        return {
          response: `Please confirm your booking for ${formatDateTimeIST(state.context.selectedSlots[0].startTime)} IST. Reply with "yes" or "confirm" to proceed.`,
          nextStep: 'CONFIRMATION',
        };
      }
      return await handleBookingConfirmation(state);
      
    case 'CANCELLATION':
      // Check if user confirms cancellation
      const cancelMsg = userMessage.toLowerCase();
      if (cancelMsg.includes('yes') || cancelMsg.includes('confirm') || cancelMsg === 'y') {
        return await handleCancellation(state);
      }
      // User hasn't confirmed yet
      if (state.context.bookingCode) {
        return {
          response: `Please confirm cancellation of booking ${state.context.bookingCode}. Reply with "yes" or "confirm" to proceed.`,
          nextStep: 'CANCELLATION',
        };
      }
      return { response: SYSTEM_MESSAGES.INVALID_CODE };
      
    case 'VALIDATE_CODE':
      if (state.context.bookingCode) {
        const booking = getBookingByCode(state.context.bookingCode);
        if (!booking) {
          return {
            response: SYSTEM_MESSAGES.INVALID_CODE,
            nextStep: 'GREET',
          };
        }
        
        if (state.intent === 'reschedule') {
          // Store booking ID for reschedule flow
          return {
            response: `Found your booking for ${booking.topic} on ${formatDateTimeIST(booking.selectedSlot!.startTime)}. When would you like to reschedule?`,
            nextStep: 'TIME_PREFERENCE',
            contextUpdates: { bookingId: booking.id },
          };
        } else if (state.intent === 'cancel') {
          return {
            response: `Found your booking for ${booking.topic} on ${formatDateTimeIST(booking.selectedSlot!.startTime)}. Confirm cancellation?`,
            nextStep: 'CANCELLATION',
            contextUpdates: { bookingId: booking.id },
          };
        }
      }
      break;
  }
  
  return null;
}

// Helper function to extract time preference from user message
function extractTimePreference(message: string): { datePreference?: string; timePreference?: string } {
  const result: { datePreference?: string; timePreference?: string } = {};
  
  // Use the new date parser to handle various formats like "tomorrow 2pm", "Jan 6, 2pm", etc.
  const parsed = parseDateTimeInput(message);
  
  if (parsed) {
    if (parsed.date) {
      // Convert to ISO date string (YYYY-MM-DD)
      const dateStr = parsed.date.toISOString().split('T')[0];
      result.datePreference = dateStr;
    }
    
    if (parsed.time) {
      result.timePreference = parsed.time;
    }
  }
  
  // Fallback: Extract basic patterns if parser didn't find anything
  if (!parsed || (!result.datePreference && !result.timePreference)) {
    const lowerMsg = message.toLowerCase();
    
    // Extract date preferences
    if (lowerMsg.includes('tomorrow') && !result.datePreference) {
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      result.datePreference = tomorrow.toISOString().split('T')[0];
    } else if (lowerMsg.includes('today') && !result.datePreference) {
      result.datePreference = new Date().toISOString().split('T')[0];
    }
    
    // Extract time preferences
    if (lowerMsg.includes('morning') && !result.timePreference) {
      result.timePreference = 'morning';
    } else if (lowerMsg.includes('afternoon') && !result.timePreference) {
      result.timePreference = 'afternoon';
    } else if (lowerMsg.includes('evening') && !result.timePreference) {
      result.timePreference = 'evening';
    }
  }
  
  return result;
}

// Helper function to parse slot selection from user message
function parseSlotSelection(message: string, availableSlots?: Slot[]): Slot | null {
  if (!availableSlots || availableSlots.length === 0) return null;
  
  const lowerMsg = message.toLowerCase();
  
  // Check for slot number (1, 2, first, second, etc.)
  if (lowerMsg.includes('1') || lowerMsg.includes('first') || lowerMsg.includes('slot 1')) {
    return availableSlots[0];
  }
  if (lowerMsg.includes('2') || lowerMsg.includes('second') || lowerMsg.includes('slot 2')) {
    return availableSlots[1] || availableSlots[0];
  }
  
  return null;
}

async function handleBookingConfirmation(state: ConversationState): Promise<Partial<FlowResult>> {
  if (!state.context.topic || !state.context.selectedSlots || state.context.selectedSlots.length === 0) {
    return { response: 'Missing information. Please start over.' };
  }
  
  const slot = state.context.selectedSlots[0];
  const booking = await createBooking(
    state.context.topic,
    slot,
    state.context.datePreference ? new Date(state.context.datePreference) : undefined,
    state.context.timePreference
  );
  
  const mcpEnabled = process.env.MCP_ENABLED === 'true';
  let mcpMessage = '';
  
  if (mcpEnabled) {
    const mcpStatus = [];
    if (booking.calendarHoldId) {
      mcpStatus.push(`✅ Calendar event created (ID: ${booking.calendarHoldId})`);
    } else {
      mcpStatus.push(`❌ Calendar event creation failed`);
    }
    if (booking.notesDocId) {
      mcpStatus.push(`✅ Sheet entry added (Row: ${booking.notesDocId})`);
    } else {
      mcpStatus.push(`❌ Sheet entry failed`);
    }
    if (booking.emailDraftId) {
      mcpStatus.push(`✅ Email draft created (ID: ${booking.emailDraftId})`);
    } else {
      mcpStatus.push(`❌ Email draft creation failed`);
    }
    mcpMessage = `\n\nMCP Operations:\n${mcpStatus.join('\n')}`;
  } else {
    mcpMessage = `\n\n[Mock mode: Calendar, Sheet, and Email operations are disabled]`;
  }
  
  // Create simplified voice message (only booking ID, time, and date)
  const slotDateTime = formatDateTimeIST(booking.selectedSlot.startTime);
  const voiceMessage = `Booking confirmed. Your booking code is ${booking.bookingCode}. Scheduled for ${slotDateTime}.`;
  
  // Full message for chat display (includes secure URL)
  const fullMessage = `${SYSTEM_MESSAGES.BOOKING_SUCCESS}\n${SYSTEM_MESSAGES.BOOKING_CODE} ${booking.bookingCode}\n${SYSTEM_MESSAGES.SECURE_URL} ${booking.secureUrl}${mcpMessage}`;
  
  return {
    response: voiceMessage, // Simplified for voice
    nextStep: 'COMPLETE',
    contextUpdates: { bookingCode: booking.bookingCode },
    bookingCode: booking.bookingCode,
    // Store full message in metadata for chat display if needed
    metadata: { fullMessage },
  };
}

async function handleCancellation(state: ConversationState): Promise<Partial<FlowResult>> {
  if (!state.context.bookingCode) {
    return { response: SYSTEM_MESSAGES.INVALID_CODE };
  }
  
  const booking = await cancelBooking(state.context.bookingCode);
  if (!booking) {
    return { response: SYSTEM_MESSAGES.INVALID_CODE };
  }
  
  const mcpEnabled = process.env.MCP_ENABLED === 'true';
  const mcpMessage = mcpEnabled ? '[Calendar hold removed]' : '[Mock calendar hold removed]';
  
  return {
    response: `Your booking ${state.context.bookingCode} has been cancelled. ${mcpMessage}`,
    nextStep: 'COMPLETE',
  };
}

