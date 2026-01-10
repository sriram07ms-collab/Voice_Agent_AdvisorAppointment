#!/bin/bash

# Bash script to setup MCP environment variables
# This script helps configure Step 5 of Phase 2 setup

echo "=== Phase 2: MCP Environment Setup ==="
echo ""

# Check if .env already exists
ENV_FILE="backend/.env"
TEMPLATE_FILE="backend/env.template"

if [ -f "$ENV_FILE" ]; then
    echo "⚠️  backend/.env already exists!"
    read -p "Do you want to overwrite it? (y/N) " overwrite
    if [ "$overwrite" != "y" ] && [ "$overwrite" != "Y" ]; then
        echo "Skipping .env creation. Please update it manually."
        exit 0
    fi
fi

# Check if service account file exists
SERVICE_ACCOUNT_FILE="backend/config/google-service-account.json"
if [ ! -f "$SERVICE_ACCOUNT_FILE" ]; then
    echo "⚠️  WARNING: Service account file not found!"
    echo "   Expected location: $SERVICE_ACCOUNT_FILE"
    echo "   Please download the service account JSON from Google Cloud Console"
    echo "   and place it in backend/config/ directory"
    echo ""
fi

# Copy template to .env
if [ -f "$TEMPLATE_FILE" ]; then
    cp "$TEMPLATE_FILE" "$ENV_FILE"
    echo "✅ Created backend/.env from template"
else
    echo "❌ Template file not found: $TEMPLATE_FILE"
    exit 1
fi

echo ""
echo "📝 Next steps:"
echo ""
echo "1. Edit backend/.env and update the following values:"
echo ""
echo "   MCP_ENABLED=true"
echo "   GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com"
echo "   GOOGLE_SHEET_ID=your_sheet_id_here"
echo "   GMAIL_USER_EMAIL=advisor@groww.in"
echo "   GMAIL_FROM_EMAIL=noreply@groww.in"
echo ""
echo "2. Ensure google-service-account.json is in backend/config/"
echo ""
echo "3. Get your values from:"
echo "   - Calendar ID: Google Calendar settings"
echo "   - Sheet ID: From Google Sheets URL"
echo ""
echo "✅ Environment setup complete!"
echo ""











