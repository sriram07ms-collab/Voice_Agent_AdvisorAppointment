# GitHub Hosting Guide

This guide explains how to host the Voice Agent Advisor Appointment App using GitHub's native hosting capabilities.

## Overview

- **Frontend**: Hosted on **GitHub Pages** (free static hosting)
- **Backend**: Self-hosted (GitHub provides build artifacts and releases)

## Important Note

GitHub **does not** provide hosting for Node.js servers or long-running applications. The backend needs to be self-hosted on:
- Your own server (VPS, dedicated server)
- Home computer/server
- Cloud VM (AWS EC2, DigitalOcean Droplet, etc.)
- Any machine with Node.js 20+ installed

## Frontend Deployment (GitHub Pages)

The frontend is automatically deployed to GitHub Pages on every push to the `main` branch.

### Access Your Frontend

After the first successful deployment:
- **GitHub Pages URL**: `https://sriram07ms-collab.github.io/Voice_Agent_AdvisorAppointment/`
- Or: `https://<your-username>.github.io/Voice_Agent_AdvisorAppointment/`

### Configuration

1. **Enable GitHub Pages**:
   - Go to repository Settings → Pages
   - Source: Deploy from a branch
   - Branch: `gh-pages` (auto-created) or select `main` → `/docs`

2. **Set Frontend API URL**:
   - Go to repository Settings → Secrets and variables → Actions
   - Add secret: `NEXT_PUBLIC_API_URL` with your backend URL
   - Example: `http://your-backend-ip:3001/api` or `https://your-domain.com/api`

### How It Works

1. Push to `main` branch triggers GitHub Actions
2. Workflow builds Next.js as static site
3. Deploys to GitHub Pages automatically
4. Site is live in ~2-5 minutes

## Backend Deployment (Self-Hosting)

### Option 1: Download Latest Build Artifact

1. Go to repository **Actions** tab
2. Find the latest successful workflow run
3. Download `backend-deployment-package` artifact
4. Extract on your server
5. Follow instructions in `BACKEND_DEPLOYMENT.md`

### Option 2: Create Release Package

Create a GitHub release to get a downloadable package:

```bash
# Create a tag for backend release
git tag backend-v1.0.0
git push origin backend-v1.0.0
```

Or use GitHub Actions workflow_dispatch:
1. Go to **Actions** → **Backend Release Package**
2. Click **Run workflow**
3. Enter version number
4. Download from the created release

### Self-Hosting Setup

#### On Your Server/Computer

1. **Extract the package**:
   ```bash
   tar -xzf voice-agent-backend-1.0.0.tar.gz
   cd voice-agent-backend-1.0.0
   ```

2. **Create `.env` file**:
   ```env
   PORT=3001
   GROQ_API_KEY=your_groq_api_key
   ELEVENLABS_API_KEY=your_elevenlabs_api_key
   ELEVENLABS_VOICE_ID=your_voice_id
   NEXT_PUBLIC_API_URL=https://sriram07ms-collab.github.io/Voice_Agent_AdvisorAppointment
   ```

3. **Run the backend**:
   ```bash
   # Linux/Mac
   ./start.sh
   
   # Windows
   start.bat
   
   # Or manually
   npm install --production
   node dist/server.js
   ```

4. **Keep it running**:
   - Use `screen` or `tmux` for persistent sessions
   - Or use `pm2` for process management:
     ```bash
     npm install -g pm2
     pm2 start dist/server.js --name voice-agent-backend
     pm2 save
     pm2 startup
     ```

#### Firewall Configuration

If hosting on a server, ensure:
- Port 3001 is open (or your configured PORT)
- Firewall allows incoming connections
- Security groups (if using cloud) allow the port

#### Accessing from Internet

1. **Get your public IP** (if hosting at home):
   - Use services like `whatismyip.com`
   - Update router port forwarding (forward port 3001)

2. **Or use a domain**:
   - Point DNS to your server IP
   - Use reverse proxy (nginx) for HTTPS

3. **Update frontend URL**:
   - Update `NEXT_PUBLIC_API_URL` secret in GitHub
   - Point to your backend URL: `http://your-ip:3001/api` or `https://your-domain.com/api`

## Security Considerations

### For Production

1. **Use HTTPS**:
   - Set up reverse proxy (nginx/Apache) with SSL certificate
   - Use Let's Encrypt for free SSL

2. **Environment Variables**:
   - Never commit `.env` file
   - Use secure storage for API keys
   - Rotate keys periodically

3. **CORS Configuration**:
   - Update backend CORS to only allow your GitHub Pages domain
   - Add proper origin whitelist

4. **Firewall**:
   - Restrict backend port access
   - Use fail2ban for brute force protection
   - Keep system updated

## Monitoring

### Backend Health Check

Test your backend is running:
```bash
curl http://your-backend-url:3001/api/health/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-01T00:00:00.000Z",
  "service": "voice-agent-backend"
}
```

### View Logs

Backend logs are stored in `logs/` directory:
- `error-YYYY-MM-DD.log` - Error logs
- `combined-YYYY-MM-DD.log` - All logs

## Troubleshooting

### Frontend can't connect to backend

1. Check backend is running: `curl http://backend-url:3001/api/health/health`
2. Verify `NEXT_PUBLIC_API_URL` is correct in GitHub Secrets
3. Check CORS configuration in backend
4. Verify firewall/security groups allow connections

### GitHub Pages shows 404

1. Check Pages settings in repository
2. Verify workflow completed successfully
3. Wait 5-10 minutes for propagation
4. Clear browser cache

### Backend won't start

1. Check Node.js version (20+ required): `node --version`
2. Verify all environment variables are set
3. Check port isn't already in use: `lsof -i :3001`
4. Review logs in `logs/` directory

## Alternative: Using GitHub Codespaces (Development Only)

GitHub Codespaces can run the backend for development/testing:
1. Open repository in Codespace
2. Backend runs in the cloud environment
3. Not suitable for production (time-limited sessions)

## Summary

✅ **Frontend**: Fully hosted on GitHub Pages (automatic deployment)  
⚠️ **Backend**: Self-hosted (GitHub provides build artifacts only)  
📦 **Releases**: GitHub Releases for downloadable backend packages  
🔧 **CI/CD**: GitHub Actions for automated builds and deployments

