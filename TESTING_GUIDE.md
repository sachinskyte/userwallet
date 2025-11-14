# 🧪 Complete Testing Guide for Aadhaar Vault Integration

## Prerequisites

Before testing, ensure you have:
1. ✅ Node.js installed
2. ✅ All dependencies installed (`npm install` in both projects)
3. ✅ Hardhat node running
4. ✅ Smart contract deployed
5. ✅ Backend server running
6. ✅ Frontend apps running

## 🚀 Step-by-Step Testing Process

### Step 1: Start Hardhat Node (Terminal 1)

```bash
cd aadhaar-vault
npx hardhat node
```

**Expected Output:**
```
Started HTTP and WebSocket JSON-RPC server at http://127.0.0.1:8545/

Account #0: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 (10000 ETH)
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
...
```

**⚠️ Keep this terminal running!**

### Step 2: Deploy Smart Contract (Terminal 2) - One-time

```bash
cd aadhaar-vault
node scripts/deploy.js
```

**Expected Output:**
```
Using admin: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
AadhaarApplications deployed to: 0x5FbDB2315678afecb367f032d93F642f64180aa3
```

**📋 Copy the contract address and add to `aadhaar-vault/.env`:**
```env
CONTRACT_ADDRESS=0x5FbDB2315678afecb367f032d93F642f64180aa3
RELAYER_PRIVATE_KEY=0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80
RPC_URL=http://127.0.0.1:8545
PORT=3001
```

### Step 3: Start Backend Server (Terminal 3)

```bash
cd aadhaar-vault
node server.js
```

**Expected Output:**
```
Server listening at http://localhost:3001
Contract deployed at: 0x5FbDB2315678afecb367f032d93F642f64180aa3
Relayer wallet: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266

Frontend API endpoints:
  POST /api/apply
  GET  /api/applications?did=<did>
  GET  /api/status?tx=<txHash>
```

**⚠️ Keep this terminal running!**

### Step 4: Start Userwallet Frontend (Terminal 4)

```bash
npm run dev
```

**Expected Output:**
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5173/
```

**Open in browser:** `http://localhost:5173`

### Step 5: Start Govweb Frontend (Terminal 5)

```bash
cd govweb
npm run dev
```

**Expected Output:**
```
VITE v7.x.x  ready in xxx ms
➜  Local:   http://localhost:5174/
```

**Open in browser:** `http://localhost:5174`

**Create `govweb/.env` if not exists:**
```env
VITE_BACKEND_URL=http://localhost:3001
```

## 🧪 Testing Scenarios

### Test 1: Submit Aadhaar Application

**In Userwallet App (`http://localhost:5173`):**

1. ✅ Login with MetaMask
   - Click "Login with MetaMask"
   - Approve connection
   - Sign message
   - Should redirect to home page

2. ✅ Navigate to Apply page
   - Click "Apply" in navigation
   - Should see application cards

3. ✅ Submit Aadhaar Application
   - Click "Begin application" on Aadhaar card
   - Fill in form:
     - Full Name: "John Doe"
     - Date of Birth: "1990-01-01"
     - Address: "123 Main St, City"
   - Optionally capture photo
   - Click "Submit application"

4. ✅ Verify Submission
   - Should see: "Submitting application to Aadhaar Vault backend..."
   - Should see: "Submitted. Transaction: 0x..."
   - Should see: "Waiting for chain confirmation..."
   - Should see: "Confirmed on chain at block X"
   - Should see "Blockchain Transaction Hash" card with real transaction hash

5. ✅ Check Backend Logs (Terminal 3)
   ```
   === AADHAAR APPLICATION SUBMISSION ===
   DID: did:pkh:...
   Name: John Doe
   ...
   --- BLOCKCHAIN SUBMISSION ---
   Transaction sent! Hash: 0x...
   ✅ Transaction confirmed!
   Block number: 123
   ```

6. ✅ Check Hardhat Node (Terminal 1)
   - Should see transaction in block
   - Transaction hash should match what's shown in frontend

### Test 2: View Application in Govweb

**In Govweb App (`http://localhost:5174`):**

1. ✅ Application Should Appear
   - Application should appear automatically (or within 10 seconds)
   - Should see in "Pending Applications" section
   - Should display:
     - Name: "John Doe"
     - DID: (from MetaMask)
     - Status: "Submitted"
     - TX: (real transaction hash)
     - BLOCK: (real block number)

2. ✅ Verify Real Blockchain Data
   - Transaction hash should match backend logs
   - Block number should match backend logs
   - CID should be displayed

### Test 3: Review Application in Govweb

1. ✅ Click "Review" on application card
   - Should open review dialog
   - Should show:
     - Applicant Data (name, DOB, address)
     - Captured Photo (if provided)
     - Metadata (DID, submitted date)
     - Transaction hash
     - Block number

2. ✅ Check Verification Tab
   - Should show verification steps
   - Can approve/reject individual steps

### Test 4: Approve Application

1. ✅ Approve Application
   - In review dialog, click "Approve Application"
   - Should see toast notifications:
     - "Submitting approval to blockchain…"
     - "Waiting for transaction confirmation…"
     - "Generating Verifiable Credential…"
     - "VC issued successfully."

2. ✅ Verify Blockchain Update
   - Check backend logs (Terminal 3):
     ```
     POST /api/admin/verify
     Transaction sent! Hash: 0x...
     ✅ Transaction confirmed!
     ```
   - Check Hardhat node (Terminal 1):
     - Should see new transaction
     - Should see `verifyApplication` call

3. ✅ Verify UI Update
   - Application should move to "Issued Credentials" section
   - Status should be "Issued"
   - Should show new transaction hash in audit log
   - Should show real block number

### Test 5: Reject Application

1. ✅ Submit Another Application
   - Go back to userwallet
   - Submit another Aadhaar application
   - Wait for it to appear in govweb

2. ✅ Reject Application
   - In govweb, click "Review"
   - Add a comment or note
   - Reject the application (if reject button exists, or through verification steps)

3. ✅ Verify Blockchain Update
   - Check backend logs:
     ```
     POST /api/admin/reject
     Transaction sent! Hash: 0x...
     ✅ Transaction confirmed!
     ```
   - Application status should be "Rejected"
   - Should show transaction hash in audit log

### Test 6: Auto-Refresh

1. ✅ Submit New Application
   - In userwallet, submit a new application
   - Don't manually refresh govweb

2. ✅ Verify Auto-Appearance
   - Application should appear in govweb within 10 seconds
   - No manual refresh needed
   - Polling is working correctly

## 🔍 Verification Checklist

### Backend Verification

- [ ] Backend server starts without errors
- [ ] Backend shows "Server listening at http://localhost:3001"
- [ ] Backend logs show blockchain submissions
- [ ] Backend logs show transaction hashes
- [ ] Backend logs show block numbers

### Userwallet Verification

- [ ] Can login with MetaMask
- [ ] Can submit Aadhaar application
- [ ] Shows real transaction hash
- [ ] Shows real block number
- [ ] Shows confirmation status
- [ ] Application appears in "Backend Applications" section

### Govweb Verification

- [ ] Applications appear automatically
- [ ] Shows real transaction hashes
- [ ] Shows real block numbers
- [ ] Can review applications
- [ ] Can approve applications
- [ ] Approval updates blockchain
- [ ] Can reject applications
- [ ] Rejection updates blockchain
- [ ] Auto-refresh works (polls every 10 seconds)

### Blockchain Verification

- [ ] Hardhat node shows transactions
- [ ] Transaction hashes match between frontend and backend
- [ ] Block numbers match between frontend and backend
- [ ] Smart contract state is updated
- [ ] Can query contract directly to verify

## 🐛 Troubleshooting

### Issue: Backend won't start

**Error:** `SyntaxError: Missing initializer in const declaration`

**Fix:** Already fixed - removed TypeScript type annotations from JavaScript file.

**Error:** `Set CONTRACT_ADDRESS in .env`

**Fix:** Deploy contract and add address to `.env` file.

### Issue: Applications not appearing in govweb

**Check:**
1. Is backend running? (`http://localhost:3001/api/applications`)
2. Is `VITE_BACKEND_URL` set in `govweb/.env`?
3. Check browser console for errors
4. Wait 10 seconds for auto-refresh

### Issue: Approve/Reject not working

**Check:**
1. Is `ADMIN_PRIVATE_KEY` set in `aadhaar-vault/.env`?
2. Check backend logs for errors
3. Check browser console for API errors

### Issue: Transaction hashes not showing

**Check:**
1. Is Hardhat node running?
2. Is contract deployed?
3. Check backend logs for transaction submission
4. Verify transaction appears in Hardhat node

## 📊 Expected Results

### Successful Integration Shows:

1. **Real Transaction Hashes:**
   - Format: `0x` + 64 hex characters
   - Example: `0x1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef`

2. **Real Block Numbers:**
   - Incremental numbers
   - Example: `123`, `124`, `125`

3. **Real Blockchain Updates:**
   - Transactions appear in Hardhat node
   - Contract state changes
   - Audit logs include real transaction hashes

4. **Synchronized Data:**
   - Applications appear in both apps
   - Status updates reflect blockchain state
   - Transaction hashes match across all systems

## ✅ Success Criteria

The integration is working correctly if:

- ✅ Applications submitted in userwallet appear in govweb
- ✅ Transaction hashes are real (not random strings)
- ✅ Block numbers are real (from blockchain)
- ✅ Approve/reject actions update blockchain
- ✅ Real transaction hashes appear in audit logs
- ✅ Auto-refresh works (new applications appear automatically)
- ✅ All data is synchronized between apps

## 🎯 Quick Test Commands

```bash
# Test backend is running
curl http://localhost:3001/api/applications

# Test backend with specific DID
curl "http://localhost:3001/api/applications?did=did:pkh:eip155:1:0x..."

# Check transaction status
curl "http://localhost:3001/api/status?tx=0x..."
```

All tests should return JSON responses without errors.

## 🎉 You're Ready to Test!

Follow the steps above and verify each test scenario. The integration is complete and ready for testing!

