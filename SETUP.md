# Setup Guide - Phase 1: Core Conversation Engine

## Prerequisites

- Node.js 20+ installed
- npm or yarn
- Groq API key (get one at https://console.groq.com/)

## Installation Steps

### 1. Install Backend Dependencies

```bash
cd backend
npm install
```

### 2. Install Frontend Dependencies

```bash
cd ../frontend
npm install
```

### 3. Configure Environment Variables

#### Option A: Use Setup Script (Recommended)

**Windows (PowerShell):**
```powershell
.\setup-env.ps1
```

**Linux/Mac:**
```bash
chmod +x setup-env.sh
./setup-env.sh
```

#### Option B: Manual Setup

**Backend (.env)**
Copy the template and add your Groq API key:
```bash
# Windows
copy backend\env.template backend\.env

# Linux/Mac
cp backend/env.template backend/.env
```

Then edit `backend/.env` and replace `your_groq_api_key_here` with your actual Groq API key from https://console.groq.com/

**Frontend (.env.local)**
```bash
# Windows
copy frontend\env.template frontend\.env.local

# Linux/Mac
cp frontend/env.template frontend/.env.local
```

#### Environment Variables Reference

**backend/.env:**
```env
PORT=3001
NODE_ENV=development
GROQ_API_KEY=your_groq_api_key_here  # ⚠️ Replace with your actual key from https://console.groq.com/
SESSION_TIMEOUT_MINUTES=30
DEFAULT_TIMEZONE=Asia/Kolkata
```

**frontend/.env.local:**
```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### 4. Start Development Servers

#### Terminal 1 - Backend
```bash
cd backend
npm run dev
```

The backend will start on `http://localhost:3001`

#### Terminal 2 - Frontend
```bash
cd frontend
npm run dev
```

The frontend will start on `http://localhost:3000`

## Testing the Application

1. Open `http://localhost:3000` in your browser
2. You should see the chat interface
3. Try these test conversations:

### Test 1: Book New Appointment
```
User: "I want to book an advisor call"
AI: [Greeting + Disclaimer]
User: "I need help with nominee changes"
AI: [Confirms topic]
User: "Yes"
AI: [Asks for time preference]
User: "Tomorrow afternoon"
AI: [Shows available slots]
User: "I'll take the first one"
AI: [Confirms booking, provides code NL-XXXX]
```

### Test 2: Check Availability
```
User: "What slots are available?"
AI: [Shows available slots]
```

### Test 3: Reschedule
```
User: "I want to reschedule"
AI: [Asks for booking code]
User: "NL-A742"
AI: [Shows booking, asks for new time]
```

### Test 4: What to Prepare
```
User: "What should I prepare for KYC?"
AI: [Provides educational links]
```

### Test 5: Cancel
```
User: "I want to cancel my appointment"
AI: [Asks for booking code]
User: "NL-A742"
AI: [Confirms cancellation]
```

## Debug Features

The chat UI includes:
- **Function Calls**: Click to expand and see Groq function calls
- **State Transitions**: Shows conversation state changes
- **Current Step**: Displayed in the header

## Troubleshooting

### Backend won't start
- Check if port 3001 is available
- Verify GROQ_API_KEY is set correctly
- Check console for error messages

### Frontend won't connect
- Ensure backend is running on port 3001
- Check NEXT_PUBLIC_API_URL in .env.local
- Check browser console for CORS errors

### Groq API errors
- Verify your API key is valid
- Check API rate limits
- Ensure you're using a supported model

## Project Structure

```
backend/
  src/
    services/
      groq/          # Groq AI integration
      conversation/  # State machine & flow control
      booking/       # Booking & slot management
      guardrails/    # PII detection & compliance
    routes/          # API endpoints
    server.ts        # Express server

frontend/
  app/              # Next.js app router
  components/       # React components
  lib/              # API client & utilities
```

## Next Steps

After Phase 1 is validated:
- Phase 2: Add voice input/output
- Phase 3: MCP integrations
- Phase 4: Production deployment

