# Voice Agent Advisor Appointment App

A full-stack voice-enabled appointment scheduling application with real-time WebSocket communication, speech-to-text, and text-to-speech capabilities.

## Features

- 🎤 **Voice Interaction**: Real-time voice conversation using WebSocket streaming
- 📅 **Appointment Booking**: Intelligent calendar slot management with availability tracking
- 🔄 **Reschedule & Cancel**: Support for rescheduling and canceling existing bookings
- 💾 **Persistent Storage**: File-based storage for booking data
- 🎯 **Intent Recognition**: AI-powered conversation flow with Groq integration
- 🛡️ **Guardrails**: Investment advice restrictions and PII detection
- 📱 **Modern UI**: ChatGPT-like interface with welcome messages

## Tech Stack

### Frontend
- **Next.js 14** (App Router)
- **React 18+**
- **TypeScript**
- **Tailwind CSS** for styling
- **Axios** for HTTP requests
- **Native WebSocket API** for real-time voice streaming
- **date-fns** for date/time handling

### Backend
- **Node.js 20+**
- **Express.js** for REST API
- **TypeScript**
- **WebSocket (ws)** for real-time voice streaming
- **Groq SDK** for AI conversation processing and intent recognition
- **ElevenLabs** for Text-to-Speech (TTS)
- **Google Cloud Speech-to-Text** for Speech-to-Text (STT) - optional
- **Google Cloud Text-to-Speech** for TTS fallback - optional
- **Google APIs** (googleapis) for MCP integrations (Calendar, Gmail, Sheets)
- **Custom File-based Logger** for structured logging (JSON format)
- **Zod** for schema validation
- **date-fns** for date/time handling
- **File-based Storage** for booking data (JSON)

## Project Structure

```
Voice_Agent_AdvisorAppointment/
├── backend/
│   ├── src/
│   │   ├── routes/          # API routes
│   │   ├── services/
│   │   │   ├── voice/       # Voice processing (STT, TTS, WebSocket)
│   │   │   ├── conversation/ # Conversation flow management
│   │   │   ├── booking/     # Booking and slot management
│   │   │   └── groq/        # AI service integration
│   │   ├── utils/           # Utilities (logger, etc.)
│   │   └── server.ts        # Main server file
│   ├── data/                # Persistent storage (bookings.json)
│   ├── logs/                # Application logs
│   └── package.json
├── frontend/
│   ├── components/
│   │   ├── voice/           # Voice recording components
│   │   └── chat/            # Chat interface components
│   ├── app/                 # Next.js app directory
│   └── package.json
└── shared/
    ├── constants/           # Shared constants (messages, topics)
    ├── types/               # TypeScript type definitions
    └── utils/               # Shared utilities
```

## Setup Instructions

### Prerequisites
- Node.js (v18 or higher)
- npm or yarn
- ElevenLabs API key (for TTS)
- Groq API key (for AI conversation)
- Google Cloud credentials (optional, for STT/TTS fallback)

### Backend Setup

1. Navigate to the backend directory:
```bash
cd backend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env` file in the `backend` directory:
```env
PORT=3001
GROQ_API_KEY=your_groq_api_key
ELEVENLABS_API_KEY=your_elevenlabs_api_key
ELEVENLABS_VOICE_ID=your_voice_id
GOOGLE_APPLICATION_CREDENTIALS=path/to/google-credentials.json
MCP_ENABLED=false
```

4. Start the backend server:
```bash
npm run dev
```

The backend will run on `http://localhost:3001`

### Frontend Setup

1. Navigate to the frontend directory:
```bash
cd frontend
```

2. Install dependencies:
```bash
npm install
```

3. Create a `.env.local` file (if needed):
```env
NEXT_PUBLIC_API_URL=http://localhost:3001
```

4. Start the frontend development server:
```bash
npm run dev
```

The frontend will run on `http://localhost:3000`

## API Endpoints

### Conversation
- `POST /api/conversation/start` - Start a new conversation
- `POST /api/conversation/message` - Send a message
- `GET /api/conversation/history/:sessionId` - Get conversation history

### Voice
- `WebSocket /api/voice/ws` - WebSocket endpoint for voice streaming

### Health
- `GET /api/health/health` - Health check endpoint

## Configuration

### Voice Providers
The application supports multiple TTS/STT providers:
- **ElevenLabs** (primary TTS)
- **Google Cloud** (optional STT/TTS)

Configure providers in the `.env` file. The system will use the configured provider without fallback.

### Booking Storage
Bookings are stored in `backend/data/bookings.json`. The system automatically:
- Tracks booked slots
- Filters out unavailable slots
- Supports rescheduling and cancellation

## Logging

Backend logs are stored in `backend/logs/`:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs

Logs use structured JSON format with timestamps, service names, and context.

## Development

### Running in Development Mode
Both servers support hot-reload:
- Backend: `npm run dev` (uses tsx watch)
- Frontend: `npm run dev` (Next.js dev server)

### Building for Production
- Backend: `npm run build` (if configured)
- Frontend: `npm run build` then `npm start`

## Features in Detail

### Voice Streaming
- Real-time audio streaming via WebSocket
- Automatic transcription using STT
- Voice responses using TTS
- Session management for multiple users

### Booking System
- Intelligent slot generation based on date/time preferences
- Automatic filtering of booked slots
- Booking code generation for easy reference
- Reschedule and cancel functionality

### Conversation Flow
- Multi-step conversation management
- Intent recognition (book, reschedule, cancel, inquire)
- Context-aware responses
- Educational content for investment topics

## Troubleshooting

### Backend not starting
- Check if port 3001 is available
- Verify `.env` file exists and has required keys
- Check logs in `backend/logs/` for errors

### Voice not working
- Verify API keys are set correctly
- Check WebSocket connection in browser console
- Review backend logs for STT/TTS errors

### Import errors
- Ensure all dependencies are installed (`npm install`)
- Check TypeScript path mappings in `tsconfig.json`
- Verify shared folder structure

## License

[Add your license here]

## Contributing

[Add contributing guidelines if needed]
