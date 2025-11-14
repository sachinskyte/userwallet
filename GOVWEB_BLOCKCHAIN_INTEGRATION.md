# GovWeb Blockchain Integration

## Overview

This integration connects the user wallet application with the govweb (government web portal) folder, enabling govweb to access blockchain data using the applicant's DID and private key for verification and approval/decline decisions.

## Flow Summary

### 1. User Application Submission

When a user applies for Aadhaar through the wallet:

1. **Generate Keys**: Private key and public key are generated for blockchain access
2. **Submit Application**: Application is submitted to backend with:
   - User's DID (Decentralized Identifier)
   - Private key (for govweb to access blockchain data)
   - Public key
   - Application data (name, DOB, address, photo)
3. **Blockchain Transaction**: Backend creates transaction on blockchain and returns:
   - Transaction hash (txHash)
   - Record ID
   - Block number

### 2. Backend Storage (aadhaar-vault/server.js)

The backend now:

- **Stores keys**: Saves privateKey and publicKey with each application
- **Returns keys**: Includes keys in API response for govweb access
- **Provides access endpoint**: New `/api/blockchain/access` endpoint for secure data retrieval

### 3. GovWeb Integration

When govweb receives applications:

#### A. Fetching Applications

- GovWeb fetches all applications from backend
- Each application includes DID, privateKey, and publicKey
- Applications are mapped to GovWeb's Application format

#### B. Accessing Blockchain Data

- GovWeb can call `accessBlockchainData(did, privateKey, recordId)` to retrieve:
  - Blockchain record data
  - Application status from smart contract
  - Verification status
  - Timestamp and block information

#### C. Approve Flow

When government officer approves an application:

1. **Access Blockchain**: Uses DID + private key to fetch blockchain data
2. **Verify Data**: Confirms application data matches blockchain records
3. **Approve on Blockchain**: Calls smart contract to mark application as "Verified"
4. **Issue VC**: Generates Verifiable Credential with blockchain transaction details

#### D. Decline Flow

When government officer rejects an application:

1. **Access Blockchain**: Uses DID + private key to verify application exists
2. **Reject on Blockchain**: Calls smart contract to mark application as "Rejected"
3. **Audit Trail**: Records rejection with blockchain transaction hash

## API Endpoints

### Backend (aadhaar-vault) - Port 3001

#### POST /api/apply

Submit new application with blockchain keys

```json
{
  "did": "did:pkh:eip155:1:0x...",
  "name": "John Doe",
  "dob": "1990-01-01",
  "address": "123 Main St",
  "photo": "base64...",
  "privateKey": "0x...",
  "publicKey": "0x..."
}
```

**Response:**

```json
{
  "success": true,
  "txHash": "0x...",
  "recordId": "0x...",
  "hash": "0x...",
  "did": "did:pkh:eip155:1:0x...",
  "privateKey": "0x...",
  "publicKey": "0x...",
  "blockNumber": 12345
}
```

#### POST /api/blockchain/access

Access blockchain data using DID and private key (for govweb)

```json
{
  "did": "did:pkh:eip155:1:0x...",
  "privateKey": "0x...",
  "recordId": "0x..."
}
```

**Response:**

```json
{
  "success": true,
  "application": {
    "id": "0x...",
    "did": "did:pkh:eip155:1:0x...",
    "name": "John Doe",
    "blockchainData": {
      "recordId": "0x...",
      "hash": "0x...",
      "cid": "local:...",
      "applicant": "0x...",
      "verifier": "0x...",
      "status": "Submitted",
      "timestamp": 1234567890
    }
  }
}
```

#### GET /api/applications

Get all applications (for govweb admin panel)

**Response:**

```json
[
  {
    "id": "0x...",
    "did": "did:pkh:eip155:1:0x...",
    "name": "John Doe",
    "dob": "1990-01-01",
    "address": "123 Main St",
    "status": "Submitted",
    "txHash": "0x...",
    "privateKey": "0x...",
    "publicKey": "0x...",
    "blockNumber": 12345,
    "submittedAt": 1234567890
  }
]
```

#### POST /api/admin/verify

Approve application on blockchain

```json
{
  "recordId": "0x..."
}
```

#### POST /api/admin/reject

Reject application on blockchain

```json
{
  "recordId": "0x..."
}
```

## Security Considerations

### Private Key Management

1. **Storage**: Private keys are stored temporarily in backend memory for govweb access
2. **Access Control**: Backend verifies private key matches before granting access
3. **Production**: In production, implement proper encryption and key management:
   - Encrypt private keys at rest
   - Use HSM (Hardware Security Module) for key storage
   - Implement time-limited access tokens instead of storing raw keys

### Data Privacy

1. **On-Chain**: Only hash of application data is stored on blockchain
2. **Off-Chain**: Actual application data (name, DOB, address, photo) stored in backend
3. **Access**: GovWeb needs valid DID + private key to access data

## Testing the Integration

### 1. Start Backend

```bash
cd aadhaar-vault
node server.js
```

Backend runs on port 3001

### 2. Submit Application (User Wallet)

1. Login with MetaMask
2. Navigate to "Apply for Aadhaar"
3. Fill form and submit
4. Note the transaction hash and DID

### 3. View in GovWeb

```bash
cd govweb
npm run dev
```

1. Open govweb (port 5173)
2. View "Applications" tab
3. Click on an application to see details
4. Use "Approve" or "Reject" buttons
5. System will:
   - Access blockchain using DID + private key
   - Verify data on blockchain
   - Submit approval/rejection transaction
   - Display results with transaction hash

## File Changes

### Backend Changes

- `aadhaar-vault/server.js`
  - Added privateKey and publicKey to application storage
  - Added `/api/blockchain/access` endpoint
  - Updated `/api/apply` to accept and return keys

### User Wallet Changes

- `src/screens/apply/ApplyScreen.tsx`
  - Generate privateKey and publicKey on application submission
  - Send keys to backend with application

### GovWeb Changes

- `govweb/src/lib/api.ts`

  - Added `BackendApplication` interface with key fields
  - Added `accessBlockchainData()` function
  - Changed BASE_URL to port 3001

- `govweb/src/store/applications.ts`

  - Added privateKey and publicKey to Application type
  - Added blockchainData field to Application type
  - Added `accessBlockchainData()` store action
  - Updated mapping function to include keys
  - Updated approve/reject flows to access blockchain first

- `govweb/src/hooks/useIssuerFlow.ts`
  - Updated approve flow to access blockchain data before approval
  - Added blockchain verification step
  - Uses DID + private key to verify application

## Smart Contract Integration

### Contract Methods Used

1. **submitApplication(recordId, hash, cid)**

   - Called by backend when user submits application
   - Stores application hash on blockchain
   - Status: Submitted (1)

2. **verifyApplication(recordId)**

   - Called by govweb when officer approves
   - Updates status to Verified (2)
   - Only admin wallet can call

3. **rejectApplication(recordId)**

   - Called by govweb when officer rejects
   - Updates status to Rejected (3)
   - Only admin wallet can call

4. **getApplication(recordId)**
   - Called by govweb to retrieve blockchain data
   - Returns: recordId, hash, cid, applicant, verifier, status, timestamp

## Next Steps

### For Production

1. **Implement proper key encryption**
   - Encrypt private keys before storing
   - Use proper key derivation functions
2. **Add authentication**
   - Implement JWT tokens for API access
   - Add role-based access control for govweb
3. **Database integration**
   - Replace in-memory storage with database
   - Add proper indexing for DID lookups
4. **Key rotation**
   - Implement key expiration
   - Add key rotation mechanism
5. **Audit logging**
   - Log all blockchain access attempts
   - Track who accessed what data and when

### For Testing

1. Test with multiple applications
2. Test approve/reject flows
3. Verify blockchain transactions on block explorer
4. Test error handling (invalid keys, missing data)
5. Test concurrent access by multiple gov officers
