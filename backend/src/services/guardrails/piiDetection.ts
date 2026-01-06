import { SYSTEM_MESSAGES } from '../../shared/constants/messages';

// Patterns to detect PII
const PII_PATTERNS = {
  phone: /\b(?:\+91|0)?[6-9]\d{9}\b/g,
  email: /\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g,
  accountNumber: /\b\d{10,}\b/g, // Generic account number pattern
  pan: /\b[A-Z]{5}\d{4}[A-Z]{1}\b/g,
  aadhaar: /\b\d{4}\s?\d{4}\s?\d{4}\b/g,
};

export interface PIIDetectionResult {
  detected: boolean;
  types: string[];
  message?: string;
}

export function detectPII(text: string): PIIDetectionResult {
  const detectedTypes: string[] = [];
  
  if (PII_PATTERNS.phone.test(text)) {
    detectedTypes.push('phone');
  }
  if (PII_PATTERNS.email.test(text)) {
    detectedTypes.push('email');
  }
  if (PII_PATTERNS.accountNumber.test(text)) {
    detectedTypes.push('account_number');
  }
  if (PII_PATTERNS.pan.test(text)) {
    detectedTypes.push('pan');
  }
  if (PII_PATTERNS.aadhaar.test(text)) {
    detectedTypes.push('aadhaar');
  }
  
  return {
    detected: detectedTypes.length > 0,
    types: detectedTypes,
    message: detectedTypes.length > 0 ? SYSTEM_MESSAGES.PII_DETECTED : undefined,
  };
}

