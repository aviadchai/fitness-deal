@echo off
echo === Fitness Deal Setup ===
echo.

if exist node_modules (
    echo Cleaning old modules...
    rmdir /s /q node_modules
)
if exist package-lock.json del package-lock.json

echo Installing dependencies...
call npm install --legacy-peer-deps

if %errorlevel% neq 0 (
    echo Retrying install...
    call npm install --legacy-peer-deps --force
)

echo.
echo Starting Expo...
npx expo start
pause
