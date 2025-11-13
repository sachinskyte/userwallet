@echo off
echo Starting Aadhaar Vault Backend Server...
echo.

REM Check if .env exists
if not exist .env (
    echo ERROR: .env file not found!
    echo Please create .env file with CONTRACT_ADDRESS and RELAYER_PRIVATE_KEY
    pause
    exit /b 1
)

echo Starting server on http://localhost:3001...
echo.

REM Start the server
node server.js

pause

