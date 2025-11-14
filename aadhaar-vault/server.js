// server.js — Updated to match frontend API expectations
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");
const fs = require("fs");
const path = require("path");
const { ethers } = require("ethers");

const RPC = process.env.RPC_URL || "http://127.0.0.1:8545";
const RELAYER_PRIVATE_KEY = (process.env.RELAYER_PRIVATE_KEY || "").trim();
const ADMIN_PRIVATE_KEY = (process.env.ADMIN_PRIVATE_KEY || "").trim();
const CONTRACT_ADDRESS = (process.env.CONTRACT_ADDRESS || "").trim();
// Always use port 3001 to match frontend configuration
const PORT = 3001;

if (!CONTRACT_ADDRESS) {
  console.error("Set CONTRACT_ADDRESS in .env (deployed contract address)");
  process.exit(1);
}
if (!RELAYER_PRIVATE_KEY) {
  console.error("Set RELAYER_PRIVATE_KEY in .env");
  process.exit(1);
}

const provider = new ethers.providers.JsonRpcProvider(RPC);
const relayerWallet = new ethers.Wallet(RELAYER_PRIVATE_KEY, provider);
const adminWallet = ADMIN_PRIVATE_KEY
  ? new ethers.Wallet(ADMIN_PRIVATE_KEY, provider)
  : null;

const ABI = [
  "function submitApplication(bytes32, bytes32, string)",
  "function getApplication(bytes32) view returns (bytes32,bytes32,string,address,address,uint8,uint256)",
  "function verifyApplication(bytes32)",
  "function rejectApplication(bytes32)",
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, relayerWallet);
const app = express();

// CORS configuration for frontend - allow all origins for development
app.use(cors({ origin: '*', methods: ['GET', 'POST'], allowedHeaders: ['Content-Type'] }));
app.use(bodyParser.json({ limit: "2mb" })); // reduced from 10mb to prevent DoS attacks
app.use(express.static("public"));

const UPLOADS_DIR = path.join(__dirname, "uploads");
if (!fs.existsSync(UPLOADS_DIR)) fs.mkdirSync(UPLOADS_DIR);

// In-memory store for applications (for demo - use database in production)
const applicationsStore = new Map(); // Map<did, Array<application>>

/**
 * POST /api/apply - Frontend expects this endpoint
 * Payload: { did, name, dob, address, photo?, type }
 * Returns: { success: true, txHash: "0x...", message: "..." }
 */
app.post("/api/apply", async (req, res) => {
  console.log("=== Received /api/apply request ===");
  console.log("Body:", JSON.stringify(req.body, null, 2));
  console.log("Headers:", req.headers);
  try {
    const { did, name, dob, address, photo, type, privateKey, publicKey } =
      req.body;

    console.log("\n=== AADHAAR APPLICATION SUBMISSION ===");
    console.log("DID:", did);
    console.log("Name:", name);
    console.log("DOB:", dob);
    console.log("Address:", address);
    console.log("Type:", type || "AADHAAR_APPLICATION");
    console.log("Photo provided:", !!photo);
    console.log("Keys provided:", !!privateKey && !!publicKey);

    if (!did || !name || !dob || !address) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: did, name, dob, address",
      });
    }

    // Create identifier from DID
    const identifier = did;
    const recordId = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(identifier + name + dob)
    );
    console.log("Generated Record ID:", recordId);

    // Prepare application data
    const applicationData = {
      did,
      name,
      dob,
      address,
      type: type || "AADHAAR_APPLICATION",
      submittedAt: Date.now(),
    };

    // Save photo if provided
    let cid = null;
    if (photo) {
      console.log("Processing photo...");
      // Remove data URL prefix if present
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, "");
      const photoBuffer = Buffer.from(base64Data, "base64");
      const hash = ethers.utils.keccak256("0x" + photoBuffer.toString("hex"));
      const filename = path.join(UPLOADS_DIR, hash.replace(/^0x/, "") + ".enc");
      fs.writeFileSync(filename, photoBuffer);
      cid = "local:" + path.basename(filename);
      console.log("Photo saved:", cid);
    }

    // Hash the application data for blockchain storage
    // IMPORTANT: Only the hash is stored on-chain, not the actual data
    // This ensures privacy while providing proof of submission
    const applicationJson = JSON.stringify(applicationData);
    const encryptedHex = "0x" + Buffer.from(applicationJson).toString("hex");
    const hash = ethers.utils.keccak256(encryptedHex);
    console.log("Application data hash (stored on blockchain):", hash);
    console.log(
      "Note: Only hash is stored on-chain, actual data remains private"
    );

    // Submit to blockchain
    const cidLike = cid || "local:no-photo";
    console.log("\n--- BLOCKCHAIN SUBMISSION ---");
    console.log("Submitting to contract:", CONTRACT_ADDRESS);
    console.log("Record ID:", recordId);
    console.log("Hash:", hash);
    console.log("CID:", cidLike);

    const tx = await contract.submitApplication(recordId, hash, cidLike, {
      gasLimit: 300000,
    });
    console.log("Transaction sent! Hash:", tx.hash);
    console.log("Waiting for confirmation...");

    const receipt = await tx.wait();
    console.log("✅ Transaction confirmed!");
    console.log("Block number:", receipt.blockNumber);
    console.log("Gas used:", receipt.gasUsed.toString());
    console.log("--- END BLOCKCHAIN SUBMISSION ---\n");

    // Store application in memory (keyed by DID)
    const application = {
      id: recordId,
      did,
      type: type || "AADHAAR_APPLICATION",
      name,
      dob,
      address,
      status: "Submitted",
      txHash: tx.hash,
      cid: cidLike,
      blockNumber: receipt.blockNumber,
      submittedAt: Date.now(),
      privateKey: privateKey || null,
      publicKey: publicKey || null,
    };

    if (!applicationsStore.has(did)) {
      applicationsStore.set(did, []);
    }
    applicationsStore.get(did).push(application);
    console.log("Application stored in memory for DID:", did);
    console.log(
      "Total applications for this DID:",
      applicationsStore.get(did).length
    );
    console.log("=== END APPLICATION SUBMISSION ===\n");

    return res.json({
      success: true,
      txHash: tx.hash,
      recordId: recordId,
      hash: hash,
      did: did,
      // privateKey removed for security - never send private keys in responses
      publicKey: publicKey || null,
      message: "Application submitted successfully",
      blockNumber: receipt.blockNumber,
    });
  } catch (e) {
    console.error("\n❌ ERROR in /api/apply:", e);
    console.error("Stack:", e.stack);
    return res.status(500).json({
      success: false,
      error: e.message || String(e),
    });
  }
});

/**
 * GET /api/applications?did=<did> - Frontend expects this endpoint
 * Returns: Array of applications for the given DID
 * GET /api/applications (no did) - Returns ALL applications (for govweb)
 * GET /api/applications?hash=<hash> - Get application by hash
 * GET /api/applications?recordId=<recordId> - Get application by recordId
 */
app.get("/api/applications", async (req, res) => {
  try {
    const did = req.query.did;
    const hash = req.query.hash;
    const recordId = req.query.recordId;

    console.log("\n=== FETCHING APPLICATIONS ===");

    if (hash) {
      // Get application by hash
      console.log("Searching by hash:", hash);
      let foundApp = null;
      applicationsStore.forEach((apps) => {
        const app = apps.find((a) => a.txHash === hash || a.id === hash);
        if (app) foundApp = app;
      });

      if (foundApp) {
        console.log("Found application:", foundApp.id);
        console.log("=== END FETCH ===\n");
        return res.json([foundApp]);
      } else {
        // Try to get from blockchain
        try {
          const appData = await contract.getApplication(recordId || hash);
          if (
            appData &&
            appData[0] !==
              "0x0000000000000000000000000000000000000000000000000000000000000000"
          ) {
            console.log("Found on blockchain");
            return res.json([
              {
                id: appData[0],
                hash: appData[1],
                cid: appData[2],
                status:
                  appData[5] === 1
                    ? "Submitted"
                    : appData[5] === 2
                    ? "Verified"
                    : appData[5] === 3
                    ? "Rejected"
                    : "Unknown",
                blockNumber: null, // Would need to query events
              },
            ]);
          }
        } catch (e) {
          console.log("Not found on blockchain");
        }
        console.log("=== END FETCH ===\n");
        return res.json([]);
      }
    }

    if (recordId) {
      // Get application by recordId
      console.log("Searching by recordId:", recordId);
      let foundApp = null;
      applicationsStore.forEach((apps) => {
        const app = apps.find((a) => a.id === recordId);
        if (app) foundApp = app;
      });

      if (foundApp) {
        console.log("Found application");
        console.log("=== END FETCH ===\n");
        return res.json([foundApp]);
      } else {
        // Try blockchain
        try {
          const appData = await contract.getApplication(recordId);
          if (
            appData &&
            appData[0] !==
              "0x0000000000000000000000000000000000000000000000000000000000000000"
          ) {
            console.log("Found on blockchain");
            return res.json([
              {
                id: appData[0],
                hash: appData[1],
                cid: appData[2],
                status:
                  appData[5] === 1
                    ? "Submitted"
                    : appData[5] === 2
                    ? "Verified"
                    : appData[5] === 3
                    ? "Rejected"
                    : "Unknown",
              },
            ]);
          }
        } catch (e) {
          console.log("Not found on blockchain");
        }
        console.log("=== END FETCH ===\n");
        return res.json([]);
      }
    }

    if (did) {
      // Get applications for specific DID
      console.log("DID:", did);
      const apps = applicationsStore.get(did) || [];
      console.log("Found", apps.length, "applications in memory");
      console.log("=== END FETCH ===\n");
      return res.json(apps);
    } else {
      // Get ALL applications (for govweb admin panel)
      console.log("Fetching ALL applications for govweb");
      const allApps = [];
      applicationsStore.forEach((apps) => {
        allApps.push(...apps);
      });
      console.log("Found", allApps.length, "total applications");
      console.log("=== END FETCH ===\n");
      return res.json(allApps);
    }
  } catch (e) {
    console.error("Error in /api/applications:", e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

/**
 * GET /api/status?tx=<txHash> - Frontend expects this endpoint
 * Returns: { confirmed: boolean, blockNumber?: number }
 */
app.get("/api/status", async (req, res) => {
  try {
    const txHash = req.query.tx;
    if (!txHash) {
      return res.status(400).json({ error: "tx query parameter required" });
    }

    console.log("Checking transaction status:", txHash);
    const receipt = await provider.getTransactionReceipt(txHash);

    if (receipt && receipt.blockNumber) {
      console.log("✅ Transaction confirmed at block:", receipt.blockNumber);
      return res.json({
        confirmed: true,
        blockNumber: receipt.blockNumber,
      });
    } else {
      console.log("⏳ Transaction not yet confirmed");
      return res.json({
        confirmed: false,
      });
    }
  } catch (e) {
    console.error("Error in /api/status:", e);
    // Transaction might not be mined yet
    return res.json({
      confirmed: false,
    });
  }
});

// Keep original endpoints for backward compatibility
app.post("/api/submit", async (req, res) => {
  try {
    const { identifier, encryptedHex } = req.body;
    if (!identifier || !encryptedHex)
      return res
        .status(400)
        .json({ error: "identifier and encryptedHex required" });

    let hex = encryptedHex;
    if (hex.startsWith("0x")) hex = hex.slice(2);
    const bytes = Buffer.from(hex, "hex");

    const hash = ethers.utils.keccak256("0x" + bytes.toString("hex"));
    const recordId = ethers.utils.keccak256(
      ethers.utils.toUtf8Bytes(identifier)
    );

    const filename = path.join(UPLOADS_DIR, hash.replace(/^0x/, "") + ".enc");
    fs.writeFileSync(filename, bytes);

    const cidLike = "local:" + path.basename(filename);

    const tx = await contract.submitApplication(recordId, hash, cidLike, {
      gasLimit: 300000,
    });
    const receipt = await tx.wait();

    return res.json({
      ok: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      recordId,
      hash,
      cid: cidLike,
    });
  } catch (e) {
    console.error(e);
    return res.status(500).json({ error: e.message || String(e) });
  }
});

app.get("/api/application/:recordId", async (req, res) => {
  try {
    const rid = req.params.recordId;
    const data = await contract.getApplication(rid);
    return res.json({
      recordId: data[0],
      hash: data[1],
      cid: data[2],
      applicant: data[3],
      verifier: data[4],
      status: data[5],
      timestamp: data[6] && data[6].toNumber ? data[6].toNumber() : data[6],
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

/**
 * POST /api/blockchain/access - Access blockchain data using DID and private key
 * Payload: { did, privateKey, recordId }
 * Returns: Blockchain data for the application
 */
app.post("/api/blockchain/access", async (req, res) => {
  try {
    const { did, privateKey, recordId } = req.body;

    console.log("\n=== BLOCKCHAIN DATA ACCESS REQUEST ===");
    console.log("DID:", did);
    console.log("RecordId:", recordId);
    console.log("PrivateKey provided:", !!privateKey);

    if (!did || !privateKey || !recordId) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: did, privateKey, recordId",
      });
    }

    // Get application from blockchain
    const appData = await contract.getApplication(recordId);

    // Check if application exists
    if (
      appData[0] ===
      "0x0000000000000000000000000000000000000000000000000000000000000000"
    ) {
      return res.status(404).json({
        success: false,
        error: "Application not found on blockchain",
      });
    }

    // Retrieve application from memory store
    let application = null;
    applicationsStore.forEach((apps) => {
      const app = apps.find((a) => a.id === recordId && a.did === did);
      if (app) application = app;
    });

    if (!application) {
      return res.status(404).json({
        success: false,
        error: "Application not found in local store",
      });
    }

    // Verify private key matches (basic verification)
    if (application.privateKey && application.privateKey !== privateKey) {
      return res.status(403).json({
        success: false,
        error: "Invalid private key - access denied",
      });
    }

    console.log("✅ Access granted - returning application data");
    console.log("=== END BLOCKCHAIN ACCESS ===\n");

    return res.json({
      success: true,
      application: {
        ...application,
        blockchainData: {
          recordId: appData[0],
          hash: appData[1],
          cid: appData[2],
          applicant: appData[3],
          verifier: appData[4],
          status:
            appData[5] === 1
              ? "Submitted"
              : appData[5] === 2
              ? "Verified"
              : appData[5] === 3
              ? "Rejected"
              : "Unknown",
          timestamp:
            appData[6] && appData[6].toNumber
              ? appData[6].toNumber()
              : appData[6],
        },
      },
    });
  } catch (e) {
    console.error("\n❌ ERROR in /api/blockchain/access:", e);
    console.error("Stack:", e.stack);
    return res.status(500).json({
      success: false,
      error: e.message || String(e),
    });
  }
});

// Admin endpoints
app.post("/api/admin/verify", async (req, res) => {
  if (!adminWallet)
    return res.status(403).json({ error: "admin key not configured" });
  try {
    const { recordId } = req.body;
    if (!recordId) return res.status(400).json({ error: "recordId required" });
    const adminContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      adminWallet
    );
    const tx = await adminContract.verifyApplication(recordId);
    const receipt = await tx.wait();

    // Update in-memory store to sync with blockchain
    applicationsStore.forEach((apps) => {
      const app = apps.find((a) => a.id === recordId);
      if (app) {
        app.status = "Verified";
        app.verifiedAt = Date.now();
        app.verifyTxHash = tx.hash;
        app.verifyBlockNumber = receipt.blockNumber;

        console.log(`\n✅ Application VERIFIED:`);
        console.log(`   Record ID: ${recordId}`);
        console.log(`   DID: ${app.did}`);
        console.log(`   Name: ${app.name}`);
        console.log(`   TX Hash: ${tx.hash}`);
        console.log(`   Block: ${receipt.blockNumber}`);
      }
    });

    res.json({ ok: true, txHash: tx.hash, blockNumber: receipt.blockNumber });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post("/api/admin/reject", async (req, res) => {
  if (!adminWallet)
    return res.status(403).json({ error: "admin key not configured" });
  try {
    const { recordId } = req.body;
    if (!recordId) return res.status(400).json({ error: "recordId required" });
    const adminContract = new ethers.Contract(
      CONTRACT_ADDRESS,
      ABI,
      adminWallet
    );
    const tx = await adminContract.rejectApplication(recordId);
    const receipt = await tx.wait();

    // Update in-memory store to sync with blockchain
    applicationsStore.forEach((apps) => {
      const app = apps.find((a) => a.id === recordId);
      if (app) {
        app.status = "Rejected";
        app.rejectedAt = Date.now();
        app.rejectTxHash = tx.hash;
        app.rejectBlockNumber = receipt.blockNumber;

        console.log(`\n❌ Application REJECTED:`);
        console.log(`   Record ID: ${recordId}`);
        console.log(`   DID: ${app.did}`);
        console.log(`   Name: ${app.name}`);
        console.log(`   TX Hash: ${tx.hash}`);
        console.log(`   Block: ${receipt.blockNumber}`);
      }
    });

    res.json({ ok: true, txHash: tx.hash, blockNumber: receipt.blockNumber });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

app.post('/api/approve', async (req, res) => {
  console.log('>>> Incoming APPROVE request:', req.body);

  try {
    const { recordId, officer } = req.body;
    if (!recordId || !officer) {
      return res.status(400).json({ success: false, error: 'recordId or officer missing' });
    }

    // FIX: convert recordId to bytes32
    const recordIdBytes = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(recordId));

    // Blockchain call
    const tx = await contract.verifyApplication(recordIdBytes);
    await tx.wait();

    // Update in-memory DB (fallback for demo)
    if (!global.applications) global.applications = {};
    if (!global.applications[recordId]) global.applications[recordId] = {};

    global.applications[recordId].status = 'Verified';
    global.applications[recordId].verifier = officer;
    global.applications[recordId].txHash = tx.hash;

    console.log('>>> Application updated:', global.applications[recordId]);

    res.json({ success: true, txHash: tx.hash, status: 'Verified' });
  } catch (err) {
    console.error('>>> Approval error:', err);
    res.status(500).json({ success: false, error: err.toString() });
  }
});

app.listen(PORT, () => {
  console.log(`\n✅ Backend running on port ${PORT}`);
  console.log(`   Server listening at http://localhost:${PORT}`);
  console.log(`\n📋 Configuration:`);
  console.log(`   Contract deployed at: ${CONTRACT_ADDRESS}`);
  console.log(`   Relayer wallet: ${relayerWallet.address}`);
  if (adminWallet) console.log(`   Admin wallet: ${adminWallet.address}`);
  console.log(`\n🔗 Frontend API endpoints:`);
  console.log(`   POST http://localhost:${PORT}/api/apply`);
  console.log(`   GET  http://localhost:${PORT}/api/applications?did=<did>`);
  console.log(
    `   GET  http://localhost:${PORT}/api/applications (all apps for govweb)`
  );
  console.log(`   GET  http://localhost:${PORT}/api/status?tx=<txHash>`);
  console.log(
    `   POST http://localhost:${PORT}/api/blockchain/access (govweb access with DID+key)`
  );
  console.log(`   POST http://localhost:${PORT}/api/admin/verify`);
  console.log(`   POST http://localhost:${PORT}/api/admin/reject`);
  console.log(`\n🌐 CORS: Enabled for all origins\n`);
});
