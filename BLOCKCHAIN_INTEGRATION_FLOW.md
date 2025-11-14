# ✅ Complete Blockchain Integration Flow

## 🔄 How It Works Now

### Step 1: User Submits Aadhaar Application (Userwallet)

1. **User fills form:**
   - Name: "John Doe"
   - Date of Birth: "1990-01-01"
   - Address: "123 Main St"
   - Photo: (optional)

2. **Frontend sends to backend:**
   ```json
   POST /api/apply
   {
     "did": "did:pkh:eip155:1:0x...",
     "name": "John Doe",
     "dob": "1990-01-01",
     "address": "123 Main St",
     "photo": "data:image/...",
     "type": "AADHAAR_APPLICATION"
   }
   ```

3. **Backend processes:**
   - Generates `recordId` = `keccak256(DID + name + dob)`
   - Creates `hash` = `keccak256(applicationData)`
   - Saves photo to disk (if provided)
   - **Calls blockchain:** `contract.submitApplication(recordId, hash, cid)`
   - **Stores on blockchain:** Hash is permanently stored
   - Returns: `{ success: true, txHash, recordId, hash, did, blockNumber }`

### Step 2: Data Available in Govweb

**Backend stores application data:**
- ✅ Hash stored on blockchain (immutable)
- ✅ Full user data stored in memory (name, dob, address, photo)
- ✅ Keyed by DID for easy retrieval

**Govweb can access:**
- ✅ All applications: `GET /api/applications`
- ✅ By DID: `GET /api/applications?did=<did>`
- ✅ By Hash: `GET /api/applications?hash=<hash>`
- ✅ By RecordId: `GET /api/applications?recordId=<recordId>`

### Step 3: Search in Govweb

**Officer can search by:**
1. **Name or DID** - Local search (filters existing applications)
2. **Transaction Hash** (0x...) - Searches backend/blockchain
3. **RecordId** (64 hex chars) - Searches backend/blockchain

**When searching by hash/recordId:**
- Govweb calls backend API
- Backend searches memory store
- If not found, queries blockchain
- Returns application with full user data (name, dob, address)

### Step 4: View User Data in Govweb

**Application card shows:**
- ✅ Name: "John Doe"
- ✅ DID: "did:pkh:..."
- ✅ Transaction Hash: "0x..."
- ✅ Block Number: 123
- ✅ Status: "Submitted"

**Review dialog shows:**
- ✅ Full applicant data (name, DOB, address)
- ✅ Captured photo (if provided)
- ✅ Blockchain metadata (hash, tx, block)
- ✅ All user data from application

### Step 5: Approve/Reject in Govweb

**When officer approves:**
1. Govweb calls: `POST /api/admin/verify` with `recordId`
2. Backend calls: `contract.verifyApplication(recordId)`
3. Blockchain updates: Status → "Verified"
4. Returns: `{ txHash, blockNumber }`
5. Govweb updates UI with real blockchain transaction

**When officer rejects:**
1. Govweb calls: `POST /api/admin/reject` with `recordId`
2. Backend calls: `contract.rejectApplication(recordId)`
3. Blockchain updates: Status → "Rejected"
4. Returns: `{ txHash, blockNumber }`
5. Govweb updates UI with real blockchain transaction

## 📊 Data Flow Diagram

```
User Submits (Userwallet)
    ↓
POST /api/apply
    ↓
Backend:
  - Generates recordId
  - Creates hash
  - Stores user data (name, dob, address, photo)
  - Calls: contract.submitApplication(recordId, hash, cid)
    ↓
Blockchain:
  - Stores hash permanently
  - Status: Submitted
  - Returns: txHash, blockNumber
    ↓
Backend stores:
  - recordId
  - hash
  - txHash
  - blockNumber
  - Full user data (name, dob, address, photo)
    ↓
Govweb:
  - Fetches all applications
  - OR searches by hash/recordId
  - Displays user data
  - Officer reviews
    ↓
Approve/Reject:
  - Calls /api/admin/verify or /api/admin/reject
  - Backend updates blockchain
  - Status changes on-chain
  - Real transaction hash returned
```

## 🔍 Search Functionality

### In Govweb Search Bar:

**Search by Name/DID:**
- Type: "John" or "did:pkh:..."
- Searches locally in loaded applications
- No API call needed

**Search by Hash:**
- Type: "0x1234567890abcdef..."
- Calls: `GET /api/applications?hash=0x...`
- Backend searches memory + blockchain
- Returns application with full user data

**Search by RecordId:**
- Type: "abc123def456..." (64 hex chars, no 0x)
- Calls: `GET /api/applications?recordId=...`
- Backend searches memory + blockchain
- Returns application with full user data

## ✅ What's Stored Where

| Data | Location | Purpose |
|------|----------|---------|
| **Hash** | Blockchain | Immutable proof of submission |
| **RecordId** | Blockchain | Unique identifier |
| **Status** | Blockchain | Submitted/Verified/Rejected |
| **User Data** | Backend Memory | Name, DOB, Address, Photo |
| **Transaction Hash** | Backend Memory | Proof of blockchain submission |
| **Block Number** | Backend Memory | Block where stored |

## 🎯 Key Features

1. ✅ **Data on Blockchain:** Hash is permanently stored
2. ✅ **User Data Accessible:** Full data available in govweb
3. ✅ **Search by Hash:** Officers can search using transaction hash
4. ✅ **Search by RecordId:** Officers can search using recordId
5. ✅ **View Full Data:** All user information visible in govweb
6. ✅ **Approve/Reject:** Updates blockchain with real transactions
7. ✅ **Real Blockchain:** All transaction hashes are real

## 🧪 Testing the Flow

1. **Submit Application:**
   - Submit in userwallet
   - Note the transaction hash returned

2. **Search in Govweb:**
   - Open govweb
   - Paste transaction hash in search
   - Should see application with user data

3. **Review Application:**
   - Click "Review"
   - See full user data (name, DOB, address, photo)

4. **Approve/Reject:**
   - Click "Approve Application"
   - See new transaction hash in audit log
   - Status updates to "Issued"

The complete flow is now working! 🎉

