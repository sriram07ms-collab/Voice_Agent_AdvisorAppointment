# Voice Agent: Advisor Appointment Scheduler - Architecture

## 1. System Overview

### 1.1 High-Level Architecture
```
┌─────────────────┐
│   Web Client    │ (React/Next.js with Voice UI)
│  (Groww Theme)  │
└────────┬────────┘
         │ WebSocket/HTTP
         │
┌────────▼─────────────────────────────────────┐
│         Backend API Server                    │
│  ┌─────────────────────────────────────────┐ │
│  │  Voice Agent Orchestrator               │ │
│  │  - Intent Recognition                   │ │
│  │  - Conversation State Management        │ │
│  │  - Flow Controller                      │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │  Booking Service                        │ │
│  │  - Slot Management                      │ │
│  │  - Booking Code Generation              │ │
│  │  - Waitlist Management                  │ │
│  └─────────────────────────────────────────┘ │
│  ┌─────────────────────────────────────────┐ │
│  │  MCP Integration Layer                  │ │
│  │  - Calendar MCP                         │ │
│  │  - Notes/Doc MCP                        │ │
│  │  - Email Draft MCP                      │ │
│  └─────────────────────────────────────────┘ │
└────────┬─────────────────────────────────────┘
         │
         ├──────────┬──────────┬──────────┐
         │          │          │        │
    ┌────▼────┐ ┌───▼───┐ ┌────▼────┐ ┌─▼────┐
    │ Calendar│ │ Notes │ │  Email  │ │ DB   │
    │   MCP   │ │  MCP  │ │   MCP   │ │(PG)  │
    └─────────┘ └───────┘ └─────────┘ └──────┘
```

### 1.2 Technology Stack

#### Frontend
- **Framework**: Next.js 14+ (App Router) with React 18+
- **Voice Processing**: 
  - Web Speech API (browser-based) or
  - Deepgram/AssemblyAI SDK for real-time transcription
  - Web Audio API for audio capture
- **UI Framework**: 
  - Tailwind CSS (for Groww theme implementation)
  - Shadcn/ui or custom components matching Groww design system
- **State Management**: Zustand or React Context for conversation state
- **Real-time Communication**: WebSocket (Socket.io) or Server-Sent Events

#### Backend
- **Runtime**: Node.js 20+ with TypeScript
- **Framework**: Express.js or Fastify
- **Voice Processing**: 
  - Deepgram/AssemblyAI for transcription
  - OpenAI Whisper (alternative)
  - Text-to-Speech: ElevenLabs, Google TTS, or Azure TTS
- **NLP/Intent Recognition**: 
  - OpenAI GPT-4 for intent classification and conversation
  - Or specialized NLU service (Dialogflow, Rasa)
- **Database**: PostgreSQL 15+ (for bookings, conversation logs)
- **ORM**: Prisma or Drizzle
- **Caching**: Redis (for session management, slot availability)

#### MCP Integrations
- **MCP Protocol**: Model Context Protocol SDK
- **Calendar MCP**: Integration for creating tentative holds
- **Notes/Doc MCP**: Integration for appending booking records
- **Email MCP**: Integration for drafting advisor emails

#### Infrastructure
- **Deployment**: 
  - Frontend: Vercel/Netlify
  - Backend: AWS/GCP/Azure (containerized with Docker)
- **API Gateway**: For rate limiting, authentication
- **Monitoring**: Sentry, DataDog, or similar
- **Logging**: Winston/Pino with structured logging

## 2. Core Components

### 2.1 Voice Agent Orchestrator

**Responsibilities:**
- Manage conversation flow state machine
- Handle intent recognition and routing
- Coordinate between voice input/output and business logic
- Maintain conversation context

**Key Modules:**
- `ConversationStateManager`: Tracks current state (greet → disclaimer → topic → time → slots → confirm)
- `IntentClassifier`: Classifies user intents (book, reschedule, cancel, what-to-prepare, check-availability)
- `FlowController`: Executes state transitions based on intents and user responses
- `ContextManager`: Maintains conversation context (topic, preferences, selected slot)

### 2.2 Intent Handlers

#### 2.2.1 Book New Intent
- Flow: Topic selection → Time preference → Slot offering → Confirmation
- Generates booking code (format: NL-{Alphanumeric})
- Creates calendar hold via MCP
- Appends to Notes/Doc via MCP
- Drafts email via MCP

#### 2.2.2 Reschedule Intent
- Validates existing booking code
- Offers new slots
- Updates calendar hold
- Updates Notes/Doc entry

#### 2.2.3 Cancel Intent
- Validates booking code
- Removes calendar hold
- Marks booking as cancelled in Notes/Doc
- Sends cancellation confirmation

#### 2.2.4 What to Prepare Intent
- Returns educational content based on topic
- Provides links (no investment advice)
- Returns to main flow

#### 2.2.5 Check Availability Intent
- Queries available slots for date range
- Returns available windows (mock calendar)

### 2.3 Booking Service

**Responsibilities:**
- Slot management (mock calendar with predefined availability)
- Booking code generation (unique, secure)
- Waitlist management
- Timezone handling (IST)

**Key Features:**
- Predefined availability windows (e.g., 9 AM - 6 PM IST, weekdays)
- Slot conflict detection
- Booking code format: `NL-{A-Z}{0-9}{0-9}{0-9}` (e.g., NL-A742)
- Secure URL generation for contact details collection

### 2.4 MCP Integration Layer

**Calendar MCP:**
- Create tentative hold: `"Advisor Q&A — {Topic} — {Code}"`
- Update hold (reschedule)
- Delete hold (cancel)

**Notes/Doc MCP:**
- Append booking record: `{date, topic, slot, code}`
- Update existing records
- Query records (for reschedule/cancel validation)

**Email Draft MCP:**
- Generate advisor email with booking details
- Include: date, time, topic, booking code, user preferences
- Approval-gated (requires manual review before sending)

## 3. Data Models

### 3.1 Booking Schema
```typescript
interface Booking {
  id: string; // UUID
  bookingCode: string; // NL-A742 format
  topic: Topic; // KYC/Onboarding, SIP/Mandates, etc.
  preferredDate: Date;
  preferredTime: string; // Time preference
  selectedSlot: Slot; // Confirmed slot
  status: 'tentative' | 'confirmed' | 'cancelled' | 'waitlisted';
  timezone: 'IST';
  createdAt: Date;
  updatedAt: Date;
  calendarHoldId?: string; // MCP Calendar reference
  notesDocId?: string; // MCP Notes reference
  emailDraftId?: string; // MCP Email reference
  secureUrl?: string; // For contact details collection
  expiresAt?: Date; // For tentative holds
}
```

### 3.2 Slot Schema
```typescript
interface Slot {
  id: string;
  startTime: Date; // IST
  endTime: Date; // IST
  advisorId?: string; // Optional for future multi-advisor
  status: 'available' | 'booked' | 'hold';
  bookingCode?: string; // If booked
}
```

### 3.3 Conversation State Schema
```typescript
interface ConversationState {
  sessionId: string;
  currentStep: ConversationStep;
  context: {
    topic?: Topic;
    datePreference?: string;
    timePreference?: string;
    selectedSlots?: Slot[];
    bookingCode?: string;
  };
  history: ConversationTurn[];
  createdAt: Date;
  lastActivity: Date;
}
```

## 4. Conversation Flow State Machine

```
INITIAL
  ↓
GREET
  ↓
DISCLAIMER ("informational, not investment advice")
  ↓
TOPIC_SELECTION (KYC/Onboarding, SIP/Mandates, Statements/Tax Docs, Withdrawals & Timelines, Account Changes/Nominee)
  ↓
TIME_PREFERENCE (day/time collection)
  ↓
SLOT_OFFERING (show 2 available slots)
  ↓
CONFIRMATION (user confirms slot)
  ↓
BOOKING_CODE_GENERATION
  ↓
MCP_OPERATIONS (Calendar, Notes, Email)
  ↓
COMPLETE (provide booking code + secure URL)
```

**Alternative Flows:**
- Reschedule: VALIDATE_CODE → TIME_PREFERENCE → SLOT_OFFERING → CONFIRMATION
- Cancel: VALIDATE_CODE → CONFIRMATION → CANCELLATION
- What to Prepare: TOPIC_SELECTION → EDUCATIONAL_CONTENT → RETURN_TO_FLOW
- Check Availability: DATE_RANGE → AVAILABILITY_LIST

## 5. Security & Compliance

### 5.1 PII Protection
- **No PII on call**: Phone, email, account numbers not collected during voice interaction
- **Secure URL**: Separate HTTPS endpoint for contact details collection (outside call)
- **Data Encryption**: All data at rest and in transit encrypted
- **Session Management**: Secure session tokens, automatic expiration

### 5.2 Compliance
- **Disclaimer**: Mandatory at start of conversation
- **Investment Advice Refusal**: Automated response with educational links
- **Data Retention**: Configurable retention policies
- **Audit Logs**: All booking operations logged

### 5.3 Security Measures
- Rate limiting on API endpoints
- CSRF protection
- Input validation and sanitization
- SQL injection prevention (ORM)
- XSS prevention (React best practices)

## 6. Error Handling & Edge Cases

### 6.1 No Matching Slots
- Create waitlist entry
- Draft waitlist email to advisor
- Inform user of waitlist status
- Provide estimated callback time

### 6.2 Invalid Booking Code (Reschedule/Cancel)
- Graceful error message
- Option to start new booking
- Support escalation path

### 6.3 MCP Integration Failures
- Retry mechanism with exponential backoff
- Fallback: Store booking locally, sync later
- Alert system for critical failures

### 6.4 Voice Recognition Errors
- Confirmation prompts for critical information
- Fallback to text input option
- Repetition of misunderstood information

## 7. Scalability Considerations

### 7.1 Horizontal Scaling
- Stateless backend design
- Session state in Redis
- Load balancer for API servers

### 7.2 Performance Optimization
- Caching slot availability (Redis)
- Database indexing on booking codes, dates
- CDN for static assets
- Voice processing optimization (streaming)

### 7.3 Future Enhancements
- Multi-advisor support
- Real calendar integration (Google Calendar, Outlook)
- SMS notifications
- Multi-language support
- Analytics dashboard

## 8. Integration Points

### 8.1 Groww Design System
- Color palette matching Groww brand
- Typography (fonts, sizes)
- Component library alignment
- Responsive design (mobile-first)

### 8.2 External Services
- Voice transcription service (Deepgram/AssemblyAI)
- TTS service (ElevenLabs/Google TTS)
- Email service (for secure URL notifications)
- Monitoring and logging services

## 9. Development Phases

### Phase 1: Foundation (Week 1-2)
- Project setup and structure
- Basic voice capture/playback
- Intent recognition (basic)
- Database schema and migrations

### Phase 2: Core Flow (Week 3-4)
- Conversation state machine
- Topic selection and time preference
- Slot management (mock calendar)
- Booking code generation

### Phase 3: MCP Integrations (Week 5-6)
- Calendar MCP integration
- Notes/Doc MCP integration
- Email Draft MCP integration
- Error handling and retries

### Phase 4: Additional Intents (Week 7-8)
- Reschedule flow
- Cancel flow
- What to prepare flow
- Check availability flow

### Phase 5: UI/UX Polish (Week 9-10)
- Groww theme implementation
- Voice UI components
- Error states and loading states
- Accessibility improvements

### Phase 6: Testing & Deployment (Week 11-12)
- Unit tests
- Integration tests
- E2E tests
- Performance testing
- Production deployment












