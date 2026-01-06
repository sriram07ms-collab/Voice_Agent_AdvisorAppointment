import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3001/api';

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout
});

// Add response interceptor for better error handling
apiClient.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error('API Error:', error);
    if (error.response) {
      // Server responded with error status
      console.error('Response error:', error.response.data);
    } else if (error.request) {
      // Request made but no response
      console.error('No response received:', error.request);
    } else {
      // Error in request setup
      console.error('Request setup error:', error.message);
    }
    return Promise.reject(error);
  }
);

export interface StartConversationResponse {
  sessionId: string;
  message: string;
}

export interface MessageResponse {
  message: string;
  sessionId: string;
  currentStep: string;
  functionCalls?: Array<{ name: string; arguments: Record<string, any> }>;
  stateTransition?: { from: string; to: string };
  bookingCode?: string;
  slots?: Array<{ id: string; startTime: string; endTime: string }>;
  educationalLinks?: string[];
  piiDetected?: boolean;
  investmentAdviceDetected?: boolean;
}

export interface ConversationHistory {
  sessionId: string;
  currentStep: string;
  context: Record<string, any>;
  history: Array<{
    role: 'user' | 'assistant' | 'system';
    content: string;
    timestamp: Date;
    metadata?: any;
  }>;
}

export async function startConversation(): Promise<StartConversationResponse> {
  const response = await apiClient.post<StartConversationResponse>('/conversation/start');
  return response.data;
}

export async function sendMessage(
  sessionId: string,
  message: string
): Promise<MessageResponse> {
  const response = await apiClient.post<MessageResponse>('/conversation/message', {
    sessionId,
    message,
  });
  return response.data;
}

export async function getHistory(sessionId: string): Promise<ConversationHistory> {
  const response = await apiClient.get<ConversationHistory>(`/conversation/history/${sessionId}`);
  return response.data;
}




