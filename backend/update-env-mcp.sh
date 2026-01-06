#!/bin/bash

# Bash script to update backend/.env with MCP configuration
# This script adds/updates MCP environment variables

CALENDAR_ID="${1:-your_calendar_id@group.calendar.google.com}"
SHEET_ID="${2:-your_sheet_id_here}"
GMAIL_USER_EMAIL="${3:-advisor@groww.in}"
GMAIL_FROM_EMAIL="${4:-noreply@groww.in}"
ENABLE_MCP="${5:-false}"

ENV_FILE="backend/.env"

if [ ! -f "$ENV_FILE" ]; then
    echo "❌ backend/.env not found!"
    echo "   Run setup-env-mcp.sh first to create it."
    exit 1
fi

echo "=== Updating MCP Configuration in backend/.env ==="
echo ""

# Function to update or add environment variable
update_env_var() {
    local name=$1
    local value=$2
    local comment=$3
    
    if grep -q "^[[:space:]]*${name}[[:space:]]*=" "$ENV_FILE"; then
        # Update existing
        if [[ "$OSTYPE" == "darwin"* ]]; then
            # macOS
            sed -i '' "s|^[[:space:]]*${name}[[:space:]]*=.*|${name}=${value}|" "$ENV_FILE"
        else
            # Linux
            sed -i "s|^[[:space:]]*${name}[[:space:]]*=.*|${name}=${value}|" "$ENV_FILE"
        fi
        echo "✅ Updated $name"
    else
        # Add new
        if [ -n "$comment" ]; then
            echo "" >> "$ENV_FILE"
            echo "# $comment" >> "$ENV_FILE"
        fi
        echo "${name}=${value}" >> "$ENV_FILE"
        echo "✅ Added $name"
    fi
}

# Update MCP configuration
update_env_var "MCP_ENABLED" "$ENABLE_MCP" "MCP Integration (Phase 2) - Set to 'true' to enable MCP integrations"
update_env_var "GOOGLE_SERVICE_ACCOUNT_PATH" "./config/google-service-account.json" "Google Cloud Configuration - Path to service account JSON file"
update_env_var "GOOGLE_CALENDAR_ID" "$CALENDAR_ID" "Google Calendar Configuration - Calendar ID"
update_env_var "GOOGLE_SHEET_ID" "$SHEET_ID" "Google Sheets Configuration - Sheet ID"
update_env_var "GOOGLE_SHEET_NAME" "Sheet1" "Google Sheets Configuration - Sheet name"
update_env_var "GMAIL_USER_EMAIL" "$GMAIL_USER_EMAIL" "Gmail Configuration - Advisor email"
update_env_var "GMAIL_FROM_EMAIL" "$GMAIL_FROM_EMAIL" "Gmail Configuration - From email"

echo ""
echo "✅ MCP configuration updated in backend/.env"
echo ""
echo "📝 Next steps:"
echo "   1. Edit backend/.env and update placeholder values:"
echo "      - GOOGLE_CALENDAR_ID"
echo "      - GOOGLE_SHEET_ID"
echo "   2. Set MCP_ENABLED=true when ready to enable MCP"
echo ""










