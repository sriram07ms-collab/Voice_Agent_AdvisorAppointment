import { ConversationState, ConversationTurn } from '../../shared/types/conversation';
import { processUserMessage, GroqResponse } from '../groq/groqService';
import { processFlow, FlowResult } from './flowController';
import { detectPII } from '../guardrails/piiDetection';
import { detectInvestmentAdviceRequest } from '../guardrails/investmentAdvice';
import {
  getSession,
  updateSession,
  addToHistory,
  updateContext,
  transitionStep,
} from './stateManager';

export interface OrchestratorResponse {
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

export async function processConversation(
  sessionId: string,
  userMessage: string
): Promise<OrchestratorResponse> {
  // Get or create session
  let session = getSession(sessionId);
  if (!session) {
    const { createSession } = require('./stateManager');
    session = createSession();
  }
  
  // Check for PII
  const piiResult = detectPII(userMessage);
  if (piiResult.detected) {
    addToHistory(sessionId, {
      role: 'user',
      content: '[PII detected - message redacted]',
      timestamp: new Date(),
    });
    
    return {
      message: piiResult.message || '',
      sessionId,
      currentStep: session.currentStep,
      piiDetected: true,
    };
  }
  
  // Check for investment advice requests
  const investmentAdviceResult = detectInvestmentAdviceRequest(
    userMessage,
    session.context.topic
  );
  if (investmentAdviceResult.detected) {
    addToHistory(sessionId, {
      role: 'user',
      content: userMessage,
      timestamp: new Date(),
    });
    
    addToHistory(sessionId, {
      role: 'assistant',
      content: investmentAdviceResult.message || '',
      timestamp: new Date(),
    });
    
    return {
      message: investmentAdviceResult.message || '',
      sessionId,
      currentStep: session.currentStep,
      investmentAdviceDetected: true,
      educationalLinks: investmentAdviceResult.educationalLinks,
    };
  }
  
  // Add user message to history
  addToHistory(sessionId, {
    role: 'user',
    content: userMessage,
    timestamp: new Date(),
  });
  
  // Process with Groq AI
  let groqResponse: GroqResponse;
  try {
    groqResponse = await processUserMessage(userMessage, session);
  } catch (error: any) {
    console.error('Groq processing error:', error);
    console.error('Error stack:', error?.stack);
    const errorMessage = error?.message || 'Unknown error';
    return {
      message: `I apologize, but I encountered an error: ${errorMessage}. Please check the backend logs for details.`,
      sessionId,
      currentStep: session.currentStep,
    };
  }
  
  // Update intent if detected
  if (groqResponse.intent) {
    updateSession(sessionId, { intent: groqResponse.intent });
  }
  
  // Process flow
  const flowResult = await processFlow(
    session,
    userMessage,
    groqResponse.intent || 'unknown',
    groqResponse.functionCalls
  );
  
  // Update context
  if (flowResult.contextUpdates) {
    updateContext(sessionId, flowResult.contextUpdates);
  }
  
  // Transition step
  if (flowResult.nextStep !== session.currentStep) {
    transitionStep(sessionId, flowResult.nextStep);
  }
  
  // Update session
  session = getSession(sessionId)!;
  
  // Add assistant response to history
  const assistantMessage = flowResult.response || groqResponse.message;
  addToHistory(sessionId, {
    role: 'assistant',
    content: assistantMessage,
    timestamp: new Date(),
    metadata: {
      functionCalls: groqResponse.functionCalls?.map(fc => ({
        name: fc.name,
        arguments: fc.arguments,
      })),
      stateTransition: flowResult.nextStep !== session.currentStep
        ? {
            from: session.currentStep,
            to: flowResult.nextStep,
          }
        : undefined,
    },
  });
  
  // Build response
  const response: OrchestratorResponse = {
    message: assistantMessage,
    sessionId,
    currentStep: flowResult.nextStep,
    functionCalls: groqResponse.functionCalls?.map(fc => ({
      name: fc.name,
      arguments: fc.arguments,
    })),
    stateTransition: flowResult.nextStep !== session.currentStep
      ? {
          from: session.currentStep,
          to: flowResult.nextStep,
        }
      : undefined,
  };
  
  if (flowResult.bookingCode) {
    response.bookingCode = flowResult.bookingCode;
  }
  
  if (flowResult.slots) {
    response.slots = flowResult.slots.map(s => ({
      id: s.id,
      startTime: s.startTime.toISOString(),
      endTime: s.endTime.toISOString(),
    }));
  }
  
  if (flowResult.educationalLinks) {
    response.educationalLinks = flowResult.educationalLinks;
  }
  
  return response;
}

