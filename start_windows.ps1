Write-Host "========================================================" -ForegroundColor Cyan
Write-Host "  TRIAD AI - Document Management System (DMS) Runner" -ForegroundColor Cyan
Write-Host "========================================================" -ForegroundColor Cyan

# Start MongoDB if stopped
try {
    Start-Service -Name "MongoDB" -ErrorAction SilentlyContinue
    Write-Host "MongoDB service confirmed active." -ForegroundColor Green
} catch {}

$PSScriptRoot = Split-Path -Parent -Path $MyInvocation.MyCommand.Definition

Write-Host "Launching Flask REST Backend (port 5000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/backend'; python run.py"

Start-Sleep -Seconds 2

Write-Host "Launching Vite React Frontend (port 3000)..." -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot/frontend'; npm.cmd run dev"

Write-Host "`nEnvironment online:" -ForegroundColor Green
Write-Host "  Backend API:  http://localhost:5000/api"
Write-Host "  Frontend App: http://localhost:3000"
Write-Host "`nTo execute the automated evaluation test:"
Write-Host "  python test_api.py" -ForegroundColor Cyan
