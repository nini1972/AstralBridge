# AstralBridge — Start All Services
# Run this from the AstralBridge root: .\start.ps1

$root = $PSScriptRoot

Write-Host ""
Write-Host "  AstralBridge — Starting all services..." -ForegroundColor Cyan
Write-Host ""

# Backend
Write-Host "  [1/4] Backend        (port 3001)" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\backend'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 2

# SummarizerAgent
Write-Host "  [2/5] SummarizerAgent (port 4001)" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\agents\summarizer'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 1

# SentimentAgent
Write-Host "  [3/5] SentimentAgent  (port 4002)" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\agents\sentiment'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 1

# TranslatorAgent
Write-Host "  [4/5] TranslatorAgent (port 4003)" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\agents\translator'; npm run dev" -WindowStyle Normal

Start-Sleep -Seconds 3

# Frontend (last — agents need time to register first)
Write-Host "  [5/5] Frontend        (port 3000)" -ForegroundColor Yellow
Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$root\frontend'; npm run dev" -WindowStyle Normal

Write-Host ""
Write-Host "  All services started! Opening browser in 5 seconds..." -ForegroundColor Green
Start-Sleep -Seconds 5
Start-Process "http://localhost:3000"
Write-Host ""
Write-Host "  URLs:" -ForegroundColor Cyan
Write-Host "    Frontend:        http://localhost:3000"
Write-Host "    Backend API:     http://localhost:3001"
Write-Host "    SummarizerAgent: http://localhost:4001"
Write-Host "    SentimentAgent:  http://localhost:4002"
Write-Host ""
