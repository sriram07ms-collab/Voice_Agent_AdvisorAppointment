import { Topic } from '../types/conversation';

export const TOPICS: Topic[] = [
  'KYC/Onboarding',
  'SIP/Mandates',
  'Statements/Tax Docs',
  'Withdrawals & Timelines',
  'Account Changes/Nominee',
];

export const TOPIC_DESCRIPTIONS: Record<Topic, string> = {
  'KYC/Onboarding': 'Know Your Customer verification and account onboarding processes',
  'SIP/Mandates': 'Systematic Investment Plans and mandate-related queries',
  'Statements/Tax Docs': 'Account statements and tax documentation',
  'Withdrawals & Timelines': 'Withdrawal processes and timeline information',
  'Account Changes/Nominee': 'Account modifications and nominee updates',
};

export const TOPIC_KEYWORDS: Record<Topic, string[]> = {
  'KYC/Onboarding': ['kyc', 'onboarding', 'verification', 'account setup', 'documentation'],
  'SIP/Mandates': ['sip', 'mandate', 'systematic', 'investment plan', 'auto-debit'],
  'Statements/Tax Docs': ['statement', 'tax', 'document', 'form 16', 'consolidated statement'],
  'Withdrawals & Timelines': ['withdrawal', 'redeem', 'timeline', 'processing time', 'fund transfer'],
  'Account Changes/Nominee': ['nominee', 'account change', 'update', 'modification', 'beneficiary'],
};













