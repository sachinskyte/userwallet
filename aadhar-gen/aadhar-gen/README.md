# Aadhaar + IPFS Integration

This connects the Aadhaar generator with IPFS automatic upload.

## 🎯 What It Does

When you generate an Aadhaar card:
1. ✅ Creates a PDF with your details
2. ✅ **Automatically uploads to IPFS** (Pinata)
3. ✅ **Returns the CID** to you instantly
4. ✅ Shows IPFS gateway link
5. ✅ Allows download of PDF locally

## 🚀 Quick Start

### Step 1: Install Dependencies

```bash
cd aadhar-gen
npm install
```

### Step 2: Start the Backend Server

```bash
npm start
```

Server will run on: **http://localhost:3001**

### Step 3: Open in Browser

Open: **http://localhost:3001** in your browser

### Step 4: Generate Aadhaar

1. Fill in the form (Name, DOB, Address, etc.)
2. Upload photo (optional)
3. Upload QR code (optional)
4. Click **"Generate Aadhaar Card"**

### 🎉 Result

You'll get:
- ✅ Preview of front & back cards
- ✅ **IPFS CID** displayed prominently
- ✅ Link to view on IPFS gateway
- ✅ Download button for local PDF copy

## 📁 Files

```
aadhar-gen/
├── server.js           # Backend API server
├── generation.html     # Frontend with auto IPFS upload
├── package.json        # Dependencies
└── README.md          # This file
```

## 🔗 Integration with IPS App

The `ips` folder already has the IPFS download functionality. To integrate:

### Option 1: Use the CID directly
Copy the CID from the Aadhaar generator and paste it into the IPS app to download.

### Option 2: Share via API (Future Enhancement)
Create a shared database or API endpoint that both apps can access.

## 🌐 API Endpoints

### POST `/api/upload-aadhaar`
Uploads Aadhaar PDF to IPFS

**Request:**
```json
{
  "pdfBase64": "base64_encoded_pdf_data",
  "filename": "Aadhaar_1234.pdf",
  "metadata": {
    "name": "John Doe",
    "timestamp": "2025-11-14T..."
  }
}
```

**Response:**
```json
{
  "success": true,
  "cid": "QmXxxx...",
  "url": "https://gateway.pinata.cloud/ipfs/QmXxxx...",
  "metadata": {...},
  "timestamp": "2025-11-14T..."
}
```

### GET `/api/health`
Health check endpoint

## 🔧 Configuration

### Change Port
Edit `server.js`:
```javascript
const PORT = 3001; // Change to your preferred port
```

Then update in `generation.html`:
```javascript
const API_URL = 'http://localhost:3001';
```

### Use Different IPFS Provider
Replace `PINATA_JWT` in `server.js` with your own Pinata API key.

## 🐛 Troubleshooting

### "Upload failed" error
- ✅ Make sure server is running: `npm start`
- ✅ Check console for errors
- ✅ Verify Pinata JWT is valid

### CORS errors
- ✅ Server includes CORS middleware
- ✅ Make sure you're accessing via `localhost`, not `127.0.0.1`

### PDF not generating
- ✅ Fill in required fields (Name, DOB)
- ✅ Check browser console for errors

## 📱 Mobile Integration

To use with mobile app (`ips` folder):
1. Generate Aadhaar on web
2. Copy the CID
3. Open IPS mobile app
4. Paste CID in download field
5. Download from IPFS

## 🎨 Customization

### Change UI Colors
Edit the gradient in `generation.html`:
```css
background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
```

### Add More Fields
1. Add input in HTML form
2. Update `createAadhaarPDF()` function
3. Pass to API in `uploadToIPFSAuto()`

## 📝 Notes

- ⚠️ This generates **SAMPLE** Aadhaar cards (not official)
- 🔒 All uploads use Pinata IPFS pinning service
- 🌍 Files are publicly accessible via IPFS gateways
- 💾 PDFs are stored permanently on IPFS

## 🚀 Future Enhancements

- [ ] Add database to store CID mappings
- [ ] QR code auto-generation from data
- [ ] Bulk upload support
- [ ] Mobile-responsive design
- [ ] Encryption for sensitive data
- [ ] Integration with blockchain for verification

## 📞 Support

If you encounter issues:
1. Check server is running: `http://localhost:3001/api/health`
2. Look at browser console for errors
3. Check server terminal for logs
