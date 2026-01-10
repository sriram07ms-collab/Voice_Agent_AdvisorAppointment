# Voice Agent: Advisor Appointment Scheduler

A voice-powered appointment scheduling system for Groww advisors, enabling users to book, reschedule, or cancel consultation appointments through natural voice conversation.

## 🎯 Project Overview

This application helps users schedule advisor consultations for topics like KYC/Onboarding, SIP/Mandates, Statements/Tax Docs, Withdrawals & Timelines, and Account Changes/Nominee. The system uses voice interaction to provide a seamless booking experience while maintaining compliance and security standards.

## ✨ Key Features

- **5 Core Intents**: Book new, reschedule, cancel, "what to prepare," check availability
- **Voice-First Interface**: Natural conversation flow with voice input/output
- **Compliant Pre-booking**: Disclaimer and educational content (no investment advice)
- **MCP Integrations**: Calendar holds, Notes/Doc records, Email drafts
- **Secure Booking**: Booking codes and secure URLs for contact details (no PII on call)
- **IST Timezone**: All times displayed and managed in Indian Standard Time
- **Groww Theme**: UI/UX aligned with Groww's official design system

## 🏗️ Project Structure

```
Voice_Agent_AdvisorAppointment/
│
├── frontend/                          # Next.js frontend application
│   ├── app/                           # Next.js App Router
│   │   ├── layout.tsx                # Root layout with Groww theme
│   │   ├── page.tsx                   # Main voice agent page
│   │   ├── api/                       # API routes (if needed)
│   │   └── booking/
│   │       └── [code]/
│   │           └── page.tsx           # Secure URL for contact details
│   │
│   ├── components/                    # React components
│   │   ├── voice/                     # Voice UI components
│   │   ├── conversation/              # Conversation flow components
│   │   ├── booking/                   # Booking-related components
│   │   ├── ui/                        # Reusable UI components (Groww theme)
│   │   └── layout/                    # Layout components
│   │
│   ├── lib/                           # Utility libraries
│   │   ├── voice/                     # Voice processing utilities
│   │   ├── websocket/                 # WebSocket client
│   │   ├── api/                       # API client
│   │   └── utils/                     # General utilities
│   │
│   ├── store/                         # State management (Zustand)
│   │   ├── conversationStore.ts
│   │   ├── bookingStore.ts
│   │   └── voiceStore.ts
│   │
│   ├── styles/                        # Styling
│   │   ├── globals.css
│   │   ├── groww-theme.css
│   │   └── tailwind.config.ts
│   │
│   └── types/                         # TypeScript types
│
├── backend/                           # Node.js backend API
│   ├── src/
│   │   ├── server.ts                  # Express/Fastify server setup
│   │   ├── routes/                    # API routes
│   │   │   ├── voice/                 # Voice endpoints
│   │   │   ├── conversation/          # Conversation endpoints
│   │   │   ├── booking/               # Booking endpoints
│   │   │   └── health/                # Health check
│   │   │
│   │   ├── services/                  # Business logic
│   │   │   ├── voice/                 # Voice processing services
│   │   │   ├── conversation/          # Conversation orchestration
│   │   │   ├── booking/               # Booking operations
│   │   │   └── mcp/                   # MCP integrations
│   │   │
│   │   ├── models/                    # Data models
│   │   ├── database/                  # Database configuration
│   │   ├── middleware/                # Express middleware
│   │   ├── utils/                     # Utility functions
│   │   ├── types/                     # TypeScript types
│   │   └── config/                    # Configuration
│   │
│   ├── prisma/                        # Prisma schema (if using Prisma)
│   ├── tests/                         # Backend tests
│   └── package.json
│
├── shared/                            # Shared code between frontend/backend
│   ├── types/                         # Shared TypeScript types
│   ├── constants/                     # Shared constants
│   └── utils/                         # Shared utilities
│
├── docs/                              # Documentation
│   ├── ARCHITECTURE.md                # Detailed architecture
│   ├── API.md                         # API documentation
│   └── DEPLOYMENT.md                  # Deployment guide
│
├── scripts/                           # Utility scripts
│   ├── setup.sh
│   ├── seed-db.ts
│   └── generate-slots.ts
│
├── .gitignore
├── README.md                          # This file
├── package.json                       # Root package.json (workspace)
├── docker-compose.yml                 # Local development setup
└── .env.example                       # Environment variables template
```

## 🚀 Getting Started

### Prerequisites

- Node.js 20+
- PostgreSQL 15+
- Redis (for caching and sessions)
- npm or yarn

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd Voice_Agent_AdvisorAppointment
```

2. Install dependencies:
```bash
# Install root dependencies
npm install

# Install frontend dependencies
cd frontend && npm install

# Install backend dependencies
cd ../backend && npm install
```

3. Set up environment variables:
```bash
# Copy example env files
cp .env.example .env
cp frontend/.env.example frontend/.env.local
cp backend/.env.example backend/.env
```

4. Configure environment variables (see `.env.example` for required variables)

5. Set up database:
```bash
cd backend
npx prisma migrate dev
npx prisma db seed
```

6. Start development servers:
```bash
# Terminal 1: Backend
cd backend
npm run dev

# Terminal 2: Frontend
cd frontend
npm run dev
```

## 📋 Conversation Flow

1. **Greet**: Welcome message
2. **Disclaimer**: "This is informational, not investment advice"
3. **Topic Selection**: 
   - KYC/Onboarding
   - SIP/Mandates
   - Statements/Tax Docs
   - Withdrawals & Timelines
   - Account Changes/Nominee
4. **Time Preference**: Collect day/time preference
5. **Slot Offering**: Present 2 available slots
6. **Confirmation**: User confirms slot
7. **Booking Code**: Generate code (e.g., NL-A742)
8. **MCP Operations**: 
   - Create calendar hold
   - Append to Notes/Doc
   - Draft advisor email
9. **Complete**: Provide booking code + secure URL

## 🎨 Design System

The application follows Groww's official design system:
- Color palette matching Groww brand
- Typography and spacing standards
- Component library alignment
- Responsive, mobile-first design

## 🔒 Security & Compliance

- **No PII on Call**: Phone, email, account numbers not collected during voice interaction
- **Secure URLs**: Separate HTTPS endpoint for contact details
- **Data Encryption**: All data encrypted at rest and in transit
- **Compliance**: Mandatory disclaimer, no investment advice
- **Audit Logs**: All operations logged for compliance

## 🧪 Testing

```bash
# Run backend tests
cd backend
npm test

# Run frontend tests
cd frontend
npm test

# Run E2E tests
npm run test:e2e
```

## 📦 Deployment

See `docs/DEPLOYMENT.md` for detailed deployment instructions.

### Quick Deploy

1. Build frontend:
```bash
cd frontend
npm run build
```

2. Build backend:
```bash
cd backend
npm run build
```

3. Deploy using Docker:
```bash
docker-compose up -d
```

## 🛠️ Technology Stack

### Frontend
- Next.js 14+ (App Router)
- React 18+
- Tailwind CSS
- Zustand (state management)
- Deepgram/AssemblyAI (voice transcription)
- Socket.io (WebSocket)

### Backend
- Node.js 20+
- Express.js/Fastify
- TypeScript
- PostgreSQL (Prisma/Drizzle)
- Redis
- OpenAI GPT-4 (intent classification)
- MCP SDK (Model Context Protocol)

## 📚 Documentation

- [Architecture Documentation](./ARCHITECTURE.md) - Detailed system architecture
- [API Documentation](./docs/API.md) - API endpoints and schemas
- [Deployment Guide](./docs/DEPLOYMENT.md) - Deployment instructions

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Write/update tests
4. Submit a pull request

## 📝 License

[Your License Here]

## 👥 Team

[Your Team Information]

## 🔗 Links

- [Groww Website](https://groww.in)
- [Documentation](./docs/)
- [Issues](https://github.com/your-repo/issues)













