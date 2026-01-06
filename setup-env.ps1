# PowerShell script to create .env files from templates

Write-Host "Setting up environment files..." -ForegroundColor Cyan

# Backend .env
if (-not (Test-Path "backend\.env")) {
    Copy-Item "backend\env.template" "backend\.env"
    Write-Host "[OK] Created backend\.env - Please add your GROQ_API_KEY" -ForegroundColor Green
} else {
    Write-Host "[WARN] backend\.env already exists, skipping..." -ForegroundColor Yellow
}

# Frontend .env.local
if (-not (Test-Path "frontend\.env.local")) {
    Copy-Item "frontend\env.template" "frontend\.env.local"
    Write-Host "[OK] Created frontend\.env.local" -ForegroundColor Green
} else {
    Write-Host "[WARN] frontend\.env.local already exists, skipping..." -ForegroundColor Yellow
}

Write-Host ""
Write-Host "Next steps:" -ForegroundColor Cyan
Write-Host "1. Edit backend\.env and add your GROQ_API_KEY"
Write-Host "2. Get your API key from: https://console.groq.com/"
Write-Host ""
Write-Host "Done!" -ForegroundColor Green

