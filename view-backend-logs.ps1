# Script to view backend server logs
# Run this in PowerShell to start the backend server in the foreground

Write-Host "Starting backend server..." -ForegroundColor Green
Write-Host "Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

Set-Location "$PSScriptRoot\backend"
npm run dev






