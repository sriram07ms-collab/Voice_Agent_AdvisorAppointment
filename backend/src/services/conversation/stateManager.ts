import { v4 as uuidv4 } from 'uuid';
import { ConversationState, ConversationStep, ConversationTurn, Intent, Topic } from '../../shared/types/conversation';

// In-memory session storage (in production, use Redis or database)
const sessions: Map<string, ConversationState> = new Map();

export function createSession(): ConversationState {
  const sessionId = uuidv4();
  
  const state: ConversationState = {
    sessionId,
    currentStep: 'INITIAL',
    context: {},
    history: [],
    createdAt: new Date(),
    lastActivity: new Date(),
  };
  
  sessions.set(sessionId, state);
  return state;
}

export function getSession(sessionId: string): ConversationState | undefined {
  return sessions.get(sessionId);
}

export function updateSession(sessionId: string, updates: Partial<ConversationState>): ConversationState | null {
  const session = sessions.get(sessionId);
  if (!session) {
    return null;
  }
  
  Object.assign(session, updates);
  session.lastActivity = new Date();
  
  sessions.set(sessionId, session);
  return session;
}

export function addToHistory(sessionId: string, turn: ConversationTurn): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.history.push(turn);
    session.lastActivity = new Date();
  }
}

export function updateContext(
  sessionId: string,
  contextUpdates: Partial<ConversationState['context']>
): void {
  const session = sessions.get(sessionId);
  if (session) {
    session.context = { ...session.context, ...contextUpdates };
    session.lastActivity = new Date();
  }
}

export function transitionStep(sessionId: string, newStep: ConversationStep): void {
  const session = sessions.get(sessionId);
  if (session) {
    const oldStep = session.currentStep;
    session.currentStep = newStep;
    session.lastActivity = new Date();
    
    // Log state transition
    addToHistory(sessionId, {
      role: 'system',
      content: `State transition: ${oldStep} → ${newStep}`,
      timestamp: new Date(),
      metadata: {
        stateTransition: {
          from: oldStep,
          to: newStep,
        },
      },
    });
  }
}

export function cleanupExpiredSessions(timeoutMinutes: number = 30): void {
  const now = new Date();
  const timeoutMs = timeoutMinutes * 60 * 1000;
  
  for (const [sessionId, session] of sessions.entries()) {
    if (now.getTime() - session.lastActivity.getTime() > timeoutMs) {
      sessions.delete(sessionId);
    }
  }
}

// Cleanup expired sessions every 5 minutes
setInterval(() => cleanupExpiredSessions(30), 5 * 60 * 1000);

