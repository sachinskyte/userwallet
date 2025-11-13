# PowerShell script to start the backend server
# Run this after starting Hardhat node and deploying contract

Write-Host "Starting Aadhaar Vault Backend Server..." -ForegroundColor Green
Write-Host ""

# Check if .env exists
if (-not (Test-Path .env)) {
    Write-Host "ERROR: .env file not found!" -ForegroundColor Red
    Write-Host "Please create .env file with CONTRACT_ADDRESS and RELAYER_PRIVATE_KEY" -ForegroundColor Yellow
    exit 1
}

# Check if Hardhat node is running
try {
    $response = Invoke-WebRequest -Uri "http://127.0.0.1:8545" -Method POST -Body '{"jsonrpc":"2.0","method":"eth_blockNumber","params":[],"id":1}' -ContentType "application/json" -TimeoutSec 2 -ErrorAction Stop
    Write-Host "✓ Hardhat node is running" -ForegroundColor Green
} catch {
    Write-Host "⚠ WARNING: Hardhat node might not be running on http://127.0.0.1:8545" -ForegroundColor Yellow
    Write-Host "  Please start it first: npx hardhat node" -ForegroundColor Yellow
    Write-Host ""
}

Write-Host "Starting server on http://localhost:3001..." -ForegroundColor Cyan
Write-Host ""

# Start the server
node server.js

