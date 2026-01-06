# PowerShell script to update backend/.env with MCP configuration
# This script adds/updates MCP environment variables without overwriting existing values

param(
    [string]$CalendarId = "",
    [string]$SheetId = "",
    [string]$GmailUserEmail = "advisor@groww.in",
    [string]$GmailFromEmail = "noreply@groww.in",
    [switch]$EnableMCP = $false
)

$envFile = "backend\.env"

if (-not (Test-Path $envFile)) {
    Write-Host "❌ backend\.env not found!" -ForegroundColor Red
    Write-Host "   Run setup-env-mcp.ps1 first to create it." -ForegroundColor Yellow
    exit 1
}

Write-Host "=== Updating MCP Configuration in backend/.env ===" -ForegroundColor Cyan
Write-Host ""

# Read current .env content
$content = Get-Content $envFile -Raw

# Function to update or add environment variable
function Update-EnvVar {
    param(
        [string]$Name,
        [string]$Value,
        [string]$Comment = ""
    )
    
    $pattern = "(?m)^\s*$Name\s*=.*$"
    $replacement = "$Name=$Value"
    if ($Comment) {
        $replacement = "# $Comment`n$replacement"
    }
    
    if ($content -match $pattern) {
        $content = $content -replace $pattern, $replacement
        Write-Host "✅ Updated $Name" -ForegroundColor Green
    } else {
        # Add at the end
        if ($Comment) {
            $content += "`n# $Comment`n"
        }
        $content += "$Name=$Value`n"
        Write-Host "✅ Added $Name" -ForegroundColor Green
    }
}

# Update MCP configuration
if ($EnableMCP) {
    Update-EnvVar "MCP_ENABLED" "true" "MCP Integration (Phase 2) - Set to 'true' to enable MCP integrations"
} else {
    Update-EnvVar "MCP_ENABLED" "false" "MCP Integration (Phase 2) - Set to 'true' to enable MCP integrations"
}

Update-EnvVar "GOOGLE_SERVICE_ACCOUNT_PATH" "./config/google-service-account.json" "Google Cloud Configuration - Path to service account JSON file"

if ($CalendarId) {
    Update-EnvVar "GOOGLE_CALENDAR_ID" $CalendarId "Google Calendar Configuration - Calendar ID"
} else {
    Update-EnvVar "GOOGLE_CALENDAR_ID" "your_calendar_id@group.calendar.google.com" "Google Calendar Configuration - Calendar ID"
}

if ($SheetId) {
    Update-EnvVar "GOOGLE_SHEET_ID" $SheetId "Google Sheets Configuration - Sheet ID"
} else {
    Update-EnvVar "GOOGLE_SHEET_ID" "your_sheet_id_here" "Google Sheets Configuration - Sheet ID"
}

Update-EnvVar "GOOGLE_SHEET_NAME" "Sheet1" "Google Sheets Configuration - Sheet name"
Update-EnvVar "GMAIL_USER_EMAIL" $GmailUserEmail "Gmail Configuration - Advisor email"
Update-EnvVar "GMAIL_FROM_EMAIL" $GmailFromEmail "Gmail Configuration - From email"

# Write updated content
Set-Content -Path $envFile -Value $content -NoNewline

Write-Host ""
Write-Host "✅ MCP configuration updated in backend/.env" -ForegroundColor Green
Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host "   1. Edit backend/.env and update placeholder values:" -ForegroundColor White
Write-Host "      - GOOGLE_CALENDAR_ID" -ForegroundColor Yellow
Write-Host "      - GOOGLE_SHEET_ID" -ForegroundColor Yellow
Write-Host "   2. Set MCP_ENABLED=true when ready to enable MCP" -ForegroundColor White
Write-Host ""










