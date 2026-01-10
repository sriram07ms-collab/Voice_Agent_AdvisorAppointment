export type ConversationStep =
  | 'INITIAL'
  | 'GREET'
  | 'DISCLAIMER'
  | 'TOPIC_SELECTION'
  | 'TIME_PREFERENCE'
  | 'SLOT_OFFERING'
  | 'CONFIRMATION'
  | 'BOOKING_CODE_GENERATION'
  | 'MCP_OPERATIONS'
  | 'COMPLETE'
  | 'VALIDATE_CODE'
  | 'EDUCATIONAL_CONTENT'
  | 'CANCELLATION'
  | 'AVAILABILITY_LIST';

export type Intent =
  | 'book_new'
  | 'reschedule'
  | 'cancel'
  | 'what_to_prepare'
  | 'check_availability'
  | 'greeting'
  | 'unknown';

export type Topic =
  | 'KYC/Onboarding'
  | 'SIP/Mandates'
  | 'Statements/Tax Docs'
  | 'Withdrawals & Timelines'
  | 'Account Changes/Nominee';

export type BookingStatus = 'tentative' | 'confirmed' | 'cancelled' | 'waitlisted';

export interface Slot {
  id: string;
  startTime: Date;
  endTime: Date;
  status: 'available' | 'booked' | 'hold';
  bookingCode?: string;
}

export interface Booking {
  id: string;
  bookingCode: string;
  topic: Topic;
  preferredDate?: Date;
  preferredTime?: string;
  selectedSlot?: Slot;
  status: BookingStatus;
  timezone: 'IST';
  createdAt: Date;
  updatedAt: Date;
  secureUrl?: string;
  expiresAt?: Date;
}

export interface ConversationState {
  sessionId: string;
  currentStep: ConversationStep;
  intent?: Intent;
  context: {
    topic?: Topic;
    datePreference?: string;
    timePreference?: string;
    selectedSlots?: Slot[];
    bookingCode?: string;
    bookingId?: string;
  };
  history: ConversationTurn[];
  createdAt: Date;
  lastActivity: Date;
}

export interface ConversationTurn {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    functionCalls?: Array<{
      name: string;
      arguments: Record<string, any>;
    }>;
    stateTransition?: {
      from: ConversationStep;
      to: ConversationStep;
    };
  };
}

export interface GroqFunctionCall {
  name: string;
  arguments: Record<string, any>;
}













