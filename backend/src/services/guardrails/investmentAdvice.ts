import { SYSTEM_MESSAGES, EDUCATIONAL_LINKS } from '../../shared/constants/messages';
import { Topic } from '../../shared/types/conversation';

// Keywords that might indicate investment advice requests
const INVESTMENT_ADVICE_KEYWORDS = [
  'should i invest',
  'is it good to invest',
  'recommend',
  'best investment',
  'which stock',
  'which mutual fund',
  'buy or sell',
  'investment advice',
  'financial advice',
  'what should i do',
  'tell me what to invest',
];

export interface InvestmentAdviceDetectionResult {
  detected: boolean;
  message?: string;
  educationalLinks?: string[];
  topic?: Topic;
}

export function detectInvestmentAdviceRequest(
  text: string,
  currentTopic?: Topic
): InvestmentAdviceDetectionResult {
  const lowerText = text.toLowerCase();
  
  const detected = INVESTMENT_ADVICE_KEYWORDS.some(keyword =>
    lowerText.includes(keyword)
  );
  
  if (detected) {
    const links = currentTopic && EDUCATIONAL_LINKS[currentTopic]
      ? EDUCATIONAL_LINKS[currentTopic]
      : Object.values(EDUCATIONAL_LINKS).flat();
    
    return {
      detected: true,
      message: SYSTEM_MESSAGES.INVESTMENT_ADVICE_REFUSAL,
      educationalLinks: links,
      topic: currentTopic,
    };
  }
  
  return { detected: false };
}

