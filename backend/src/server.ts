import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { createServer } from 'http';
import { WebSocketServer } from 'ws';
import conversationRoutes from './routes/conversation';
import healthRoutes from './routes/health';
import gmailAuthRoutes from './routes/gmailAuth';
import voiceRoutes from './routes/voice';
import { setupVoiceWebSocket } from './services/voice/voiceWebSocket';

dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Routes
app.use('/api/conversation', conversationRoutes);
app.use('/api/health', healthRoutes);
app.use('/api/auth/gmail', gmailAuthRoutes);
app.use('/api/voice', voiceRoutes);

// Root endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Voice Agent Advisor Appointment Scheduler API',
    version: '1.0.0',
    endpoints: {
      health: '/api/health/health',
      conversation: {
        start: 'POST /api/conversation/start',
        message: 'POST /api/conversation/message',
        history: 'GET /api/conversation/history/:sessionId',
      },
    },
  });
});

// Error handling middleware
app.use((err: Error, req: express.Request, res: express.Response, next: express.NextFunction) => {
  console.error('Error:', err);
  res.status(500).json({ error: 'Internal server error' });
});

// Create HTTP server for WebSocket support
const server = createServer(app);

// Setup WebSocket server for voice streaming
const wss = new WebSocketServer({ 
  server, 
  path: '/api/voice/ws',
  clientTracking: true,
  perMessageDeflate: false, // Disable compression for lower latency
});
setupVoiceWebSocket(wss);

// Start server
server.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
  console.log(`📝 API documentation available at http://localhost:${PORT}`);
  
  if (!process.env.GROQ_API_KEY || process.env.GROQ_API_KEY === 'your_groq_api_key_here') {
    console.error('❌ ERROR: GROQ_API_KEY is not set or invalid!');
    console.error('Please set GROQ_API_KEY in backend/.env file');
    console.error('Get your API key from: https://console.groq.com/');
  } else {
    console.log('✅ GROQ_API_KEY is configured (for LLM services)');
  }
  
  // Check for separate voice API key
  if (process.env.GROQ_VOICE_API_KEY && process.env.GROQ_VOICE_API_KEY !== 'your_groq_voice_api_key_here') {
    console.log('✅ GROQ_VOICE_API_KEY is configured (for STT/TTS services)');
  } else {
    console.log('ℹ️  GROQ_VOICE_API_KEY not set, will use GROQ_API_KEY for voice services');
  }
  
  // Check TTS Provider configuration
  const ttsProvider = process.env.TTS_PROVIDER?.toLowerCase() || 'auto';
  if (ttsProvider === 'elevenlabs' || (ttsProvider === 'auto' && process.env.ELEVENLABS_API_KEY)) {
    if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY !== 'your_elevenlabs_api_key_here') {
      console.log('✅ ElevenLabs TTS is configured (with Groq fallback)');
    } else {
      console.log('⚠️  ElevenLabs API key not set, will use Groq TTS');
    }
  } else if (ttsProvider === 'groq') {
    console.log('✅ Using Groq TTS directly');
  } else {
    console.log('✅ Using Groq TTS (default)');
  }
  
  // Check STT Provider configuration
  const sttProvider = process.env.STT_PROVIDER?.toLowerCase() || 'auto';
  if (sttProvider === 'elevenlabs' || (sttProvider === 'auto' && process.env.ELEVENLABS_API_KEY)) {
    if (process.env.ELEVENLABS_API_KEY && process.env.ELEVENLABS_API_KEY !== 'your_elevenlabs_api_key_here') {
      console.log('✅ ElevenLabs STT is configured (with Groq fallback)');
    } else {
      console.log('⚠️  ElevenLabs API key not set, will use Groq STT');
    }
  } else if (sttProvider === 'groq') {
    console.log('✅ Using Groq STT directly');
  } else {
    console.log('✅ Using Groq STT (default)');
  }
  
  // Check Gmail OAuth2 status
  if (process.env.MCP_ENABLED === 'true') {
    try {
      const { isGmailOAuth2Ready } = require('./services/mcp/gmailOAuth2');
      if (process.env.GMAIL_OAUTH2_CLIENT_ID && process.env.GMAIL_OAUTH2_CLIENT_SECRET) {
        if (isGmailOAuth2Ready()) {
          console.log('✅ Gmail OAuth2 is authenticated');
        } else {
          console.log('⚠️  Gmail OAuth2 not authenticated');
          console.log('   Visit: http://localhost:3001/api/auth/gmail/authorize');
          console.log('   See: GMAIL_OAUTH2_SETUP.md for setup instructions');
        }
      } else if (process.env.GMAIL_USE_DELEGATION === 'true') {
        console.log('✅ Gmail using domain-wide delegation');
      } else {
        console.log('⚠️  Gmail not configured (OAuth2 or domain-wide delegation required)');
      }
    } catch (error) {
      // OAuth2 module may not be ready yet, ignore
    }
  }
});

