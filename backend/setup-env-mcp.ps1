# PowerShell script to setup MCP environment variables
# This script helps configure Step 5 of Phase 2 setup

Write-Host "=== Phase 2: MCP Environment Setup ===" -ForegroundColor Cyan
Write-Host ""

# Check if .env already exists
$envFile = "backend\.env"
$templateFile = "backend\env.template"

if (Test-Path $envFile) {
    Write-Host "⚠️  backend\.env already exists!" -ForegroundColor Yellow
    $overwrite = Read-Host "Do you want to overwrite it? (y/N)"
    if ($overwrite -ne "y" -and $overwrite -ne "Y") {
        Write-Host "Skipping .env creation. Please update it manually." -ForegroundColor Yellow
        exit 0
    }
}

# Check if service account file exists
$serviceAccountFile = "backend\config\google-service-account.json"
if (-not (Test-Path $serviceAccountFile)) {
    Write-Host "⚠️  WARNING: Service account file not found!" -ForegroundColor Red
    Write-Host "   Expected location: $serviceAccountFile" -ForegroundColor Yellow
    Write-Host "   Please download the service account JSON from Google Cloud Console" -ForegroundColor Yellow
    Write-Host "   and place it in backend\config\ directory" -ForegroundColor Yellow
    Write-Host ""
}

# Copy template to .env
if (Test-Path $templateFile) {
    Copy-Item $templateFile $envFile
    Write-Host "✅ Created backend\.env from template" -ForegroundColor Green
} else {
    Write-Host "❌ Template file not found: $templateFile" -ForegroundColor Red
    exit 1
}

Write-Host ""
Write-Host "📝 Next steps:" -ForegroundColor Cyan
Write-Host ""
Write-Host "1. Edit backend\.env and update the following values:" -ForegroundColor White
Write-Host ""
Write-Host "   MCP_ENABLED=true" -ForegroundColor Yellow
Write-Host "   GOOGLE_CALENDAR_ID=your_calendar_id@group.calendar.google.com" -ForegroundColor Yellow
Write-Host "   GOOGLE_SHEET_ID=your_sheet_id_here" -ForegroundColor Yellow
Write-Host "   GMAIL_USER_EMAIL=advisor@groww.in" -ForegroundColor Yellow
Write-Host "   GMAIL_FROM_EMAIL=noreply@groww.in" -ForegroundColor Yellow
Write-Host ""
Write-Host "2. Ensure google-service-account.json is in backend\config\" -ForegroundColor White
Write-Host ""
Write-Host "3. Get your values from:" -ForegroundColor White
Write-Host "   - Calendar ID: Google Calendar settings" -ForegroundColor Gray
Write-Host "   - Sheet ID: From Google Sheets URL" -ForegroundColor Gray
Write-Host ""
Write-Host "✅ Environment setup complete!" -ForegroundColor Green
Write-Host ""











