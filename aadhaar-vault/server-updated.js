// server.js — Updated to match frontend API expectations
require('dotenv').config();
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
const PORT = process.env.PORT || 3001; // Changed to 3001 to match frontend

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
const adminWallet = ADMIN_PRIVATE_KEY ? new ethers.Wallet(ADMIN_PRIVATE_KEY, provider) : null;

const ABI = [
  "function submitApplication(bytes32, bytes32, string)",
  "function getApplication(bytes32) view returns (bytes32,bytes32,string,address,address,uint8,uint256)",
  "function verifyApplication(bytes32)",
  "function rejectApplication(bytes32)"
];

const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, relayerWallet);
const app = express();

// CORS configuration for frontend
app.use(cors({
  origin: 'http://localhost:5173', // Vite default port
  credentials: true
}));
app.use(bodyParser.json({ limit: '10mb' })); // allow large base64 photos
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
  try {
    const { did, name, dob, address, photo, type } = req.body;
    
    if (!did || !name || !dob || !address) {
      return res.status(400).json({ 
        success: false,
        error: "Missing required fields: did, name, dob, address" 
      });
    }

    // Create identifier from DID
    const identifier = did;
    const recordId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(identifier + name + dob));

    // Prepare application data
    const applicationData = {
      did,
      name,
      dob,
      address,
      type: type || "AADHAAR_APPLICATION",
      submittedAt: Date.now()
    };

    // Save photo if provided
    let cid = null;
    if (photo) {
      // Remove data URL prefix if present
      const base64Data = photo.replace(/^data:image\/\w+;base64,/, '');
      const photoBuffer = Buffer.from(base64Data, 'base64');
      const hash = ethers.utils.keccak256("0x" + photoBuffer.toString('hex'));
      const filename = path.join(UPLOADS_DIR, hash.replace(/^0x/, "") + ".enc");
      fs.writeFileSync(filename, photoBuffer);
      cid = "local:" + path.basename(filename);
    }

    // Create encrypted data (for demo, we'll just hash the application data)
    // In production, encrypt this properly
    const applicationJson = JSON.stringify(applicationData);
    const encryptedHex = "0x" + Buffer.from(applicationJson).toString('hex');
    const hash = ethers.utils.keccak256(encryptedHex);

    // Submit to blockchain
    const cidLike = cid || "local:no-photo";
    const tx = await contract.submitApplication(recordId, hash, cidLike, { gasLimit: 300000 });
    const receipt = await tx.wait();

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
      submittedAt: Date.now()
    };

    if (!applicationsStore.has(did)) {
      applicationsStore.set(did, []);
    }
    applicationsStore.get(did).push(application);

    return res.json({
      success: true,
      txHash: tx.hash,
      message: "Application submitted successfully",
      blockNumber: receipt.blockNumber
    });

  } catch (e) {
    console.error("Error in /api/apply:", e);
    return res.status(500).json({ 
      success: false,
      error: e.message || String(e) 
    });
  }
});

/**
 * GET /api/applications?did=<did> - Frontend expects this endpoint
 * Returns: Array of applications for the given DID
 */
app.get("/api/applications", async (req, res) => {
  try {
    const did = req.query.did;
    if (!did) {
      return res.status(400).json({ error: "did query parameter required" });
    }

    const apps = applicationsStore.get(did) || [];
    
    // Also check blockchain for any additional applications
    // For now, return in-memory store
    return res.json(apps);

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

    const receipt = await provider.getTransactionReceipt(txHash);
    
    if (receipt && receipt.blockNumber) {
      return res.json({
        confirmed: true,
        blockNumber: receipt.blockNumber
      });
    } else {
      return res.json({
        confirmed: false
      });
    }

  } catch (e) {
    console.error("Error in /api/status:", e);
    // Transaction might not be mined yet
    return res.json({
      confirmed: false
    });
  }
});

// Keep original endpoints for backward compatibility
app.post("/api/submit", async (req, res) => {
  try {
    const { identifier, encryptedHex } = req.body;
    if (!identifier || !encryptedHex) return res.status(400).json({ error: "identifier and encryptedHex required" });

    let hex = encryptedHex;
    if (hex.startsWith("0x")) hex = hex.slice(2);
    const bytes = Buffer.from(hex, "hex");

    const hash = ethers.utils.keccak256("0x" + bytes.toString("hex"));
    const recordId = ethers.utils.keccak256(ethers.utils.toUtf8Bytes(identifier));

    const filename = path.join(UPLOADS_DIR, hash.replace(/^0x/, "") + ".enc");
    fs.writeFileSync(filename, bytes);

    const cidLike = "local:" + path.basename(filename);

    const tx = await contract.submitApplication(recordId, hash, cidLike, { gasLimit: 300000 });
    const receipt = await tx.wait();

    return res.json({
      ok: true,
      txHash: tx.hash,
      blockNumber: receipt.blockNumber,
      recordId,
      hash,
      cid: cidLike
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
      timestamp: data[6] && data[6].toNumber ? data[6].toNumber() : data[6]
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: e.message || String(e) });
  }
});

// Admin endpoints
app.post("/api/admin/verify", async (req, res) => {
  if (!adminWallet) return res.status(403).json({ error: "admin key not configured" });
  try {
    const { recordId } = req.body;
    if (!recordId) return res.status(400).json({ error: "recordId required" });
    const adminContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, adminWallet);
    const tx = await adminContract.verifyApplication(recordId);
    const receipt = await tx.wait();
    res.json({ ok: true, txHash: tx.hash, blockNumber: receipt.blockNumber });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || String(e) }); }
});

app.post("/api/admin/reject", async (req, res) => {
  if (!adminWallet) return res.status(403).json({ error: "admin key not configured" });
  try {
    const { recordId } = req.body;
    if (!recordId) return res.status(400).json({ error: "recordId required" });
    const adminContract = new ethers.Contract(CONTRACT_ADDRESS, ABI, adminWallet);
    const tx = await adminContract.rejectApplication(recordId);
    const receipt = await tx.wait();
    res.json({ ok: true, txHash: tx.hash, blockNumber: receipt.blockNumber });
  } catch (e) { console.error(e); res.status(500).json({ error: e.message || String(e) }); }
});

app.listen(PORT, () => {
  console.log(`Server listening at http://localhost:${PORT}`);
  console.log("Contract deployed at:", CONTRACT_ADDRESS);
  console.log("Relayer wallet:", relayerWallet.address);
  if (adminWallet) console.log("Admin wallet:", adminWallet.address);
  console.log("\nFrontend API endpoints:");
  console.log("  POST /api/apply");
  console.log("  GET  /api/applications?did=<did>");
  console.log("  GET  /api/status?tx=<txHash>");
});

