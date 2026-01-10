export const SYSTEM_MESSAGES = {
  GREET: "Welcome! I'm here to help you schedule an advisor consultation.",
  DISCLAIMER:
    "Important: This service provides general information only and does not constitute investment advice. Please consult with a qualified financial advisor for personalized investment guidance.",
  TOPIC_SELECTION: "What topic would you like to discuss with the advisor?",
  TIME_PREFERENCE: "When would you prefer to have this consultation?",
  SLOT_OFFERING: "Here are available slots for you:",
  CONFIRMATION: "Please confirm your selected slot:",
  BOOKING_SUCCESS: "Your booking has been confirmed!",
  BOOKING_CODE: "Your booking code is:",
  SECURE_URL: "Please use this secure link to provide your contact details:",
  RESCHEDULE_PROMPT: "Please provide your booking code to reschedule:",
  CANCEL_PROMPT: "Please provide your booking code to cancel:",
  INVALID_CODE: "I couldn't find a booking with that code. Please check and try again.",
  NO_SLOTS: "I'm sorry, there are no available slots matching your preference. Would you like to be added to the waitlist?",
  WAITLIST_CONFIRMED: "You've been added to the waitlist. We'll contact you when slots become available.",
  INVESTMENT_ADVICE_REFUSAL:
    "I cannot provide investment advice. For personalized investment guidance, please consult with a qualified financial advisor. Here are some educational resources: [Educational Links]",
  PII_DETECTED:
    "For security reasons, please don't share personal information like phone numbers, email addresses, or account numbers during this conversation. We'll collect contact details through a secure link after booking.",
};

export const EDUCATIONAL_LINKS: Record<string, string[]> = {
  'KYC/Onboarding': [
    'https://groww.in/kyc-process',
    'https://groww.in/account-setup-guide',
  ],
  'SIP/Mandates': [
    'https://groww.in/sip-guide',
    'https://groww.in/mandate-setup',
  ],
  'Statements/Tax Docs': [
    'https://groww.in/tax-documents',
    'https://groww.in/statement-guide',
  ],
  'Withdrawals & Timelines': [
    'https://groww.in/withdrawal-process',
    'https://groww.in/processing-times',
  ],
  'Account Changes/Nominee': [
    'https://groww.in/nominee-update',
    'https://groww.in/account-changes',
  ],
};













