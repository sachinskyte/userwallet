// Aadhaar to IPFS Upload Server
const express = require('express');
const cors = require('cors');
const multer = require('multer');
const path = require('path');

const app = express();
const PORT = 3001;

// Pinata JWT (same as in ipfs.ts)
const PINATA_JWT = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhN2Y4MGQ3Ny1kMTgwLTQxODYtYTdmNC00NGNlYjZkZmJlYTYiLCJlbWFpbCI6InByYWFqd2FsLjA1QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI5ODdjY2ZiZDcyMjNkOTEzNTY0NiIsInNjb3BlZEtleVNlY3JldCI6IjU1ZDAyOTZhNTAwYzAxY2RjMTE3ZjNjODVmNjRiODEzNjYwZTAwZjZjOTZjYWM5YmNkYzllYmNlZTFmYmIwYTciLCJleHAiOjE3OTQ1NzU3OTF9.tsq_jFQs9dwtw6kUmG2ID6EDtyGPtI-BL137u4xBKxk';

// Middleware
app.use(cors());
app.use(express.json({ limit: '50mb' }));
app.use(express.static(__dirname));

// Storage for multer
const storage = multer.memoryStorage();
const upload = multer({ storage });

// Upload to IPFS using Pinata
async function uploadToIPFS(base64Data, filename) {
  const FormData = require('form-data');
  const fetch = require('node-fetch');
  
  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, 'base64');
    
    // Create form data
    const formData = new FormData();
    formData.append('file', buffer, {
      filename: filename,
      contentType: 'application/pdf',
    });
    formData.append('pinataMetadata', JSON.stringify({ 
      name: filename 
    }));

    const response = await fetch('https://api.pinata.cloud/pinning/pinFileToIPFS', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${PINATA_JWT}`,
        ...formData.getHeaders(),
      },
      body: formData,
    });

    const json = await response.json();

    if (response.ok && json.IpfsHash) {
      console.log('✓ Pinata Upload Success → CID:', json.IpfsHash);
      return json.IpfsHash;
    } else {
      const errorMsg = json.error?.reason || json.error?.details || 'Upload failed';
      console.error('Pinata Error:', json);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error('Pinata Upload Failed:', error);
    throw error;
  }
}

// API endpoint to upload Aadhaar PDF to IPFS
app.post('/api/upload-aadhaar', async (req, res) => {
  try {
    const { pdfBase64, filename, metadata } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({ 
        success: false, 
        error: 'No PDF data provided' 
      });
    }

    console.log('📄 Uploading Aadhaar PDF to IPFS...');
    console.log('   Filename:', filename || 'aadhaar.pdf');
    console.log('   Metadata:', metadata);

    // Upload to IPFS
    const cid = await uploadToIPFS(
      pdfBase64, 
      filename || `aadhaar_${Date.now()}.pdf`
    );

    // Generate gateway URL
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

    console.log('✓ Upload complete!');
    console.log('   CID:', cid);
    console.log('   URL:', gatewayUrl);

    res.json({
      success: true,
      cid: cid,
      url: gatewayUrl,
      metadata: metadata,
      timestamp: new Date().toISOString(),
    });

  } catch (error) {
    console.error('Upload failed:', error);
    res.status(500).json({
      success: false,
      error: error.message || 'Upload failed',
    });
  }
});

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({ 
    status: 'ok', 
    service: 'Aadhaar IPFS Upload Server',
    timestamp: new Date().toISOString(),
  });
});

// Serve the HTML file
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'generation.html'));
});

app.listen(PORT, () => {
  console.log('\n🚀 Aadhaar IPFS Upload Server started!');
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/upload-aadhaar`);
  console.log('\n✓ Ready to upload Aadhaar cards to IPFS\n');
});
