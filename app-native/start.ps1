# Fitness Deal - Auto Setup & Start
Set-Location $PSScriptRoot

Write-Host "=== Fitness Deal Setup ===" -ForegroundColor Cyan

# Pull latest code
Write-Host "Pulling latest code..." -ForegroundColor Yellow
git pull origin main

# Clean install
if (Test-Path node_modules) {
    Write-Host "Cleaning old modules..." -ForegroundColor Yellow
    Remove-Item -Recurse -Force node_modules
}
if (Test-Path package-lock.json) {
    Remove-Item -Force package-lock.json
}

Write-Host "Installing dependencies..." -ForegroundColor Yellow
npm install --legacy-peer-deps

if ($LASTEXITCODE -ne 0) {
    Write-Host "npm install failed, retrying..." -ForegroundColor Red
    npm install --legacy-peer-deps --force
}

# Start Expo
Write-Host "Starting Expo..." -ForegroundColor Green
npx expo start
