# Deployment Guide

This guide covers deploying the Voice Agent Advisor Appointment App to various platforms.

## Overview

The application consists of:
- **Frontend**: Next.js application (port 3000)
- **Backend**: Express.js API server (port 3001)
- **Shared**: TypeScript types and constants

## Prerequisites

1. **GitHub Repository**: Code should be pushed to GitHub
2. **API Keys**: Required API keys for services
3. **Environment Variables**: Configured for each environment

## Required Environment Variables

### Frontend
- `NEXT_PUBLIC_API_URL` - Backend API URL (e.g., `https://api.yourdomain.com/api`)

### Backend
- `PORT` - Server port (default: 3001)
- `GROQ_API_KEY` - Groq API key for AI conversation
- `ELEVENLABS_API_KEY` - ElevenLabs API key for TTS
- `ELEVENLABS_VOICE_ID` - ElevenLabs voice ID
- `GOOGLE_APPLICATION_CREDENTIALS` - Path to Google Cloud credentials (optional)
- `MCP_ENABLED` - Enable MCP integrations (true/false)

## Deployment Options

### Option 1: Vercel (Frontend) + Railway (Backend) - Recommended

#### Frontend on Vercel

1. **Connect Repository**:
   - Go to [Vercel](https://vercel.com)
   - Import your GitHub repository
   - Select `frontend` as the root directory

2. **Configure Environment Variables**:
   - `NEXT_PUBLIC_API_URL`: Your backend URL (e.g., `https://your-backend.railway.app/api`)

3. **Deploy**:
   - Vercel will automatically deploy on every push to `main`
   - Or manually trigger from Vercel dashboard

#### Backend on Railway

1. **Create Railway Project**:
   - Go to [Railway](https://railway.app)
   - Create new project from GitHub repository
   - Select `backend` as the root directory

2. **Configure Environment Variables**:
   - Add all required backend environment variables
   - Set `PORT` to Railway's provided port (or use their default)

3. **Configure Build Settings**:
   - Build Command: `npm run build`
   - Start Command: `node dist/server.js`

4. **Deploy**:
   - Railway auto-deploys on push to `main`

### Option 2: Netlify (Frontend) + Render (Backend)

#### Frontend on Netlify

1. **Connect Repository**:
   - Go to [Netlify](https://netlify.com)
   - Add new site from Git
   - Select your repository

2. **Build Settings**:
   - Base directory: `frontend`
   - Build command: `npm run build`
   - Publish directory: `frontend/.next`

3. **Environment Variables**:
   - Add `NEXT_PUBLIC_API_URL`

#### Backend on Render

1. **Create Web Service**:
   - Go to [Render](https://render.com)
   - Create new Web Service from GitHub
   - Select your repository

2. **Configure**:
   - Root Directory: `backend`
   - Build Command: `npm install && npm run build`
   - Start Command: `node dist/server.js`
   - Environment: Node

3. **Environment Variables**:
   - Add all required backend variables

### Option 3: GitHub Actions + Self-Hosted

Use the provided GitHub Actions workflows (`.github/workflows/`) to:
- Build and test on every push
- Deploy to your preferred platform
- Configure secrets in GitHub repository settings

## GitHub Secrets Configuration

Add the following secrets in your GitHub repository settings (Settings → Secrets and variables → Actions):

### Frontend Secrets
- `NEXT_PUBLIC_API_URL` - Backend API URL

### Backend Secrets
- `GROQ_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID`
- `GOOGLE_APPLICATION_CREDENTIALS` (if using Google Cloud)
- `MCP_ENABLED`

### Deployment Platform Secrets (if using GitHub Actions)
- `VERCEL_TOKEN`, `VERCEL_ORG_ID`, `VERCEL_PROJECT_ID` (for Vercel)
- `RAILWAY_TOKEN` (for Railway)
- `RENDER_API_KEY`, `RENDER_SERVICE_ID` (for Render)
- `HEROKU_API_KEY`, `HEROKU_APP_NAME` (for Heroku)

## Post-Deployment Checklist

- [ ] Frontend is accessible and loads correctly
- [ ] Backend health endpoint responds (`/api/health/health`)
- [ ] Frontend can connect to backend API
- [ ] WebSocket connection works for voice streaming
- [ ] Environment variables are set correctly
- [ ] CORS is configured to allow frontend domain
- [ ] Logs are accessible and working
- [ ] Booking storage is working (check `backend/data/bookings.json`)

## Troubleshooting

### Frontend can't connect to backend
- Verify `NEXT_PUBLIC_API_URL` is set correctly
- Check CORS configuration in backend
- Verify backend is running and accessible

### WebSocket connection fails
- Ensure WebSocket URL uses `wss://` for HTTPS
- Check firewall/security group settings
- Verify WebSocket server is running on backend

### Build failures
- Check Node.js version (should be 20+)
- Verify all dependencies are installed
- Check TypeScript compilation errors

## Monitoring

- **Frontend**: Monitor via Vercel/Netlify dashboards
- **Backend**: Check application logs in deployment platform
- **Errors**: Review `backend/logs/error-*.log` files

## Continuous Deployment

The GitHub Actions workflows are configured to:
- Run on every push to `main`
- Build and test both frontend and backend
- Deploy automatically (when configured)

To enable automatic deployment, uncomment the deployment steps in:
- `.github/workflows/frontend.yml`
- `.github/workflows/backend.yml`

