import { Router, Request, Response } from 'express';
import { processConversation } from '../services/conversation/orchestrator';
import { createSession } from '../services/conversation/stateManager';
import { SYSTEM_MESSAGES } from '../../../shared/constants/messages';

const router = Router();

// Start a new conversation
router.post('/start', (req: Request, res: Response) => {
  try {
    const session = createSession();
    // Return welcome message instead of "Conversation started"
    const welcomeMessage = SYSTEM_MESSAGES.GREET + ' ' + SYSTEM_MESSAGES.DISCLAIMER;
    res.json({
      sessionId: session.sessionId,
      message: welcomeMessage,
    });
  } catch (error) {
    console.error('Error starting conversation:', error);
    res.status(500).json({ error: 'Failed to start conversation' });
  }
});

// Send a message
router.post('/message', async (req: Request, res: Response) => {
  try {
    const { sessionId, message } = req.body;
    
    if (!sessionId || !message) {
      return res.status(400).json({ error: 'sessionId and message are required' });
    }
    
    console.log(`Processing message for session ${sessionId}: ${message}`);
    const response = await processConversation(sessionId, message);
    console.log(`Response generated: ${response.message.substring(0, 100)}...`);
    res.json(response);
  } catch (error: any) {
    console.error('Error processing message:', error);
    console.error('Error stack:', error?.stack);
    res.status(500).json({ 
      error: 'Failed to process message',
      details: error?.message || 'Unknown error'
    });
  }
});

// Get conversation history
router.get('/history/:sessionId', (req: Request, res: Response) => {
  try {
    const { sessionId } = req.params;
    const { getSession } = require('../services/conversation/stateManager');
    const session = getSession(sessionId);
    
    if (!session) {
      return res.status(404).json({ error: 'Session not found' });
    }
    
    res.json({
      sessionId: session.sessionId,
      currentStep: session.currentStep,
      context: session.context,
      history: session.history,
    });
  } catch (error) {
    console.error('Error getting history:', error);
    res.status(500).json({ error: 'Failed to get history' });
  }
});

export default router;

