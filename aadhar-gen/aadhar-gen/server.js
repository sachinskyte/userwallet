// Aadhaar to IPFS Upload Server
const express = require("express");
const cors = require("cors");
const multer = require("multer");
const path = require("path");
const crypto = require("crypto");

const app = express();
const PORT = 3005;

// Pinata JWT (same as in ipfs.ts)
const PINATA_JWT =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJ1c2VySW5mb3JtYXRpb24iOnsiaWQiOiJhN2Y4MGQ3Ny1kMTgwLTQxODYtYTdmNC00NGNlYjZkZmJlYTYiLCJlbWFpbCI6InByYWFqd2FsLjA1QGdtYWlsLmNvbSIsImVtYWlsX3ZlcmlmaWVkIjp0cnVlLCJwaW5fcG9saWN5Ijp7InJlZ2lvbnMiOlt7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6IkZSQTEifSx7ImRlc2lyZWRSZXBsaWNhdGlvbkNvdW50IjoxLCJpZCI6Ik5ZQzEifV0sInZlcnNpb24iOjF9LCJtZmFfZW5hYmxlZCI6ZmFsc2UsInN0YXR1cyI6IkFDVElWRSJ9LCJhdXRoZW50aWNhdGlvblR5cGUiOiJzY29wZWRLZXkiLCJzY29wZWRLZXlLZXkiOiI5ODdjY2ZiZDcyMjNkOTEzNTY0NiIsInNjb3BlZEtleVNlY3JldCI6IjU1ZDAyOTZhNTAwYzAxY2RjMTE3ZjNjODVmNjRiODEzNjYwZTAwZjZjOTZjYWM5YmNkYzllYmNlZTFmYmIwYTciLCJleHAiOjE3OTQ1NzU3OTF9.tsq_jFQs9dwtw6kUmG2ID6EDtyGPtI-BL137u4xBKxk";

// Middleware
app.use(cors());
app.use(express.json({ limit: "50mb" }));
app.use(express.static(__dirname));

// Upload to IPFS using Pinata
async function uploadToIPFS(base64Data, filename) {
  const FormData = require("form-data");
  const fetch = require("node-fetch");

  try {
    // Convert base64 to buffer
    const buffer = Buffer.from(base64Data, "base64");

    // Create form data
    const formData = new FormData();
    formData.append("file", buffer, {
      filename: filename,
      contentType: "application/pdf",
    });
    formData.append(
      "pinataMetadata",
      JSON.stringify({
        name: filename,
      })
    );

    const response = await fetch(
      "https://api.pinata.cloud/pinning/pinFileToIPFS",
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${PINATA_JWT}`,
          ...formData.getHeaders(),
        },
        body: formData,
      }
    );

    const json = await response.json();

    if (response.ok && json.IpfsHash) {
      console.log("✓ Pinata Upload Success → CID:", json.IpfsHash);
      return json.IpfsHash;
    } else {
      const errorMsg =
        json.error?.reason || json.error?.details || "Upload failed";
      console.error("Pinata Error:", json);
      throw new Error(errorMsg);
    }
  } catch (error) {
    console.error("Pinata Upload Failed:", error);
    throw error;
  }
}

// API endpoint to upload Aadhaar PDF to IPFS
app.post("/api/upload-aadhaar", async (req, res) => {
  try {
    const { pdfBase64, filename, metadata } = req.body;

    if (!pdfBase64) {
      return res.status(400).json({
        success: false,
        error: "No PDF data provided",
      });
    }

    console.log("📄 Uploading Aadhaar PDF to IPFS...");
    console.log("   Filename:", filename || "aadhaar.pdf");
    console.log("   Metadata:", metadata);

    // Upload to IPFS
    const cid = await uploadToIPFS(
      pdfBase64,
      filename || `aadhaar_${Date.now()}.pdf`
    );

    // Generate gateway URL
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

    console.log("✓ Upload complete!");
    console.log("   CID:", cid);
    console.log("   URL:", gatewayUrl);

    res.json({
      success: true,
      cid: cid,
      url: gatewayUrl,
      metadata: metadata,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    console.error("Upload failed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Upload failed",
    });
  }
});

// Helper function to generate hash
function generateHash(text) {
  return crypto.createHash("sha256").update(text).digest("hex");
}

// API endpoint to generate Aadhaar PDF (for download/print) using pdf-lib
app.post("/api/generate-aadhaar-pdf", async (req, res) => {
  try {
    const { name, dob, address, photo, aadhaarNumber } = req.body;

    if (!name || !dob || !address) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, dob, address",
      });
    }

    console.log("📄 Generating Aadhaar PDF for:", name);
    console.log(
      "📷 Photo received:",
      !!photo ? `YES (${photo.substring(0, 50)}...)` : "NO"
    );
    console.log("📍 DOB:", dob);
    console.log("📍 Address:", address);

    const { PDFDocument, rgb, degrees, StandardFonts } = require("pdf-lib");

    // Create PDF
    const pdfDoc = await PDFDocument.create();

    // Card-sized page (similar to Aadhaar card dimensions)
    const cardWidth = 600;
    const cardHeight = 380;
    const page = pdfDoc.addPage([cardWidth, cardHeight]);
    const { width, height } = page.getSize();

    // Embed fonts
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Generate Aadhaar number display
    const aadhaarLast4 = (aadhaarNumber || "").slice(-4).padStart(4, "0");
    const aadhaarFirst8 = Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, "0");
    const aadhaarDisplay = `XXXX XXXX ${aadhaarLast4}`;
    const fullAadhaarNum = aadhaarFirst8 + aadhaarLast4;

    // Generate hash for QR data
    const dataString = `${name}|${dob}|${address}|${fullAadhaarNum}`;
    const uidHash = generateHash(dataString);

    // White background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(1, 1, 1),
    });

    // Orange header band (Indian flag saffron)
    page.drawRectangle({
      x: 0,
      y: height - 40,
      width: width,
      height: 40,
      color: rgb(1, 0.6, 0.2),
    });

    // Green band (Indian flag green)
    page.drawRectangle({
      x: 0,
      y: height - 70,
      width: width,
      height: 30,
      color: rgb(0.08, 0.53, 0.03),
    });

    // Header text - Government of India
    const headerText = "Government of India";
    const headerWidth = boldFont.widthOfTextAtSize(headerText, 16);
    page.drawText(headerText, {
      x: width / 2 - headerWidth / 2,
      y: height - 28,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // UIDAI text
    const uidaiText = "Unique Identification Authority of India";
    const uidaiWidth = regularFont.widthOfTextAtSize(uidaiText, 11);
    page.drawText(uidaiText, {
      x: width / 2 - uidaiWidth / 2,
      y: height - 58,
      size: 11,
      font: regularFont,
      color: rgb(1, 1, 1),
    });

    // Photo box
    const photoX = 30;
    const photoY = height - 240;
    const photoW = 100;
    const photoH = 120;

    page.drawRectangle({
      x: photoX,
      y: photoY,
      width: photoW,
      height: photoH,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 2,
    });

    // Embed photo if provided
    if (photo) {
      try {
        const photoData = photo.replace(/^data:image\/\w+;base64,/, "");
        const photoBytes = Buffer.from(photoData, "base64");

        console.log(
          "🖼️  Attempting to embed photo, size:",
          photoBytes.length,
          "bytes"
        );

        let photoImage;
        // Try to detect format from data URL or try both formats
        if (photo.includes("image/png") || photo.includes("PNG")) {
          console.log("🖼️  Detected PNG format");
          photoImage = await pdfDoc.embedPng(photoBytes);
        } else if (
          photo.includes("image/jpeg") ||
          photo.includes("image/jpg") ||
          photo.includes("JPG") ||
          photo.includes("JPEG")
        ) {
          console.log("🖼️  Detected JPEG format");
          photoImage = await pdfDoc.embedJpg(photoBytes);
        } else {
          // Try JPEG first (most common), then PNG
          console.log("🖼️  Unknown format, trying JPEG first");
          try {
            photoImage = await pdfDoc.embedJpg(photoBytes);
            console.log("🖼️  Successfully embedded as JPEG");
          } catch (jpgErr) {
            console.log("🖼️  JPEG failed, trying PNG");
            photoImage = await pdfDoc.embedPng(photoBytes);
            console.log("🖼️  Successfully embedded as PNG");
          }
        }

        page.drawImage(photoImage, {
          x: photoX + 2,
          y: photoY + 2,
          width: photoW - 4,
          height: photoH - 4,
        });
        console.log("✅ Photo embedded successfully");
      } catch (err) {
        console.error("❌ Photo embedding error:", err.message);
        console.error(
          "   Photo starts with:",
          photo ? photo.substring(0, 50) : "null"
        );
        // Draw placeholder
        page.drawText("PHOTO", {
          x: photoX + 25,
          y: photoY + 50,
          size: 12,
          font: boldFont,
          color: rgb(0.7, 0.7, 0.7),
        });
      }
    } else {
      page.drawText("PHOTO", {
        x: photoX + 25,
        y: photoY + 50,
        size: 12,
        font: boldFont,
        color: rgb(0.7, 0.7, 0.7),
      });
    }

    // Details section
    const detailsX = photoX + photoW + 25;
    let detailsY = height - 100;

    // Name (bold and uppercase)
    page.drawText(name.toUpperCase(), {
      x: detailsX,
      y: detailsY,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    detailsY -= 25;

    // DOB
    page.drawText(`DOB: ${dob}`, {
      x: detailsX,
      y: detailsY,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    detailsY -= 20;

    // Address (word wrap)
    const maxLineWidth = 280;
    const words = address.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = regularFont.widthOfTextAtSize(testLine, 10);

      if (textWidth > maxLineWidth && currentLine) {
        page.drawText(currentLine, {
          x: detailsX,
          y: detailsY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        detailsY -= 14;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      page.drawText(currentLine, {
        x: detailsX,
        y: detailsY,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
    }

    // Aadhaar number (centered, large, bold)
    const aadhaarY = 80;
    const aadhaarTextWidth = boldFont.widthOfTextAtSize(aadhaarDisplay, 28);

    page.drawText(aadhaarDisplay, {
      x: (width - aadhaarTextWidth) / 2,
      y: aadhaarY,
      size: 28,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Footer border
    page.drawRectangle({
      x: 20,
      y: 50,
      width: width - 40,
      height: 0,
      borderColor: rgb(0.83, 0.18, 0.18),
      borderWidth: 2,
    });

    // Footer text (using English to avoid font encoding issues)
    const footerText = "My Aadhaar, My Identity";
    const footerWidth = regularFont.widthOfTextAtSize(footerText, 12);
    page.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 25,
      size: 12,
      font: boldFont,
      color: rgb(0.83, 0.18, 0.18),
    });

    // Save PDF
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    console.log("✓ PDF generated successfully");

    res.json({
      success: true,
      pdfBase64: pdfBase64,
      filename: `aadhaar_${name.replace(/\s+/g, "_")}.pdf`,
    });
  } catch (error) {
    console.error("PDF generation failed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "PDF generation failed",
    });
  }
});

// API endpoint to generate AND upload Aadhaar PDF to IPFS
app.post("/api/generate-and-upload-aadhaar", async (req, res) => {
  try {
    const { name, dob, address, photo, aadhaarNumber, did, recordId } =
      req.body;

    if (!name || !dob || !address) {
      return res.status(400).json({
        success: false,
        error: "Missing required fields: name, dob, address",
      });
    }

    console.log("📄 Generating Aadhaar PDF and uploading to IPFS for:", name);

    const { PDFDocument, rgb, StandardFonts } = require("pdf-lib");

    // Create PDF
    const pdfDoc = await PDFDocument.create();

    // Card-sized page
    const cardWidth = 600;
    const cardHeight = 380;
    const page = pdfDoc.addPage([cardWidth, cardHeight]);
    const { width, height } = page.getSize();

    // Embed fonts
    const regularFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    // Generate Aadhaar number display
    const aadhaarLast4 = (aadhaarNumber || recordId || "")
      .slice(-4)
      .padStart(4, "0");
    const aadhaarFirst8 = Math.floor(Math.random() * 100000000)
      .toString()
      .padStart(8, "0");
    const aadhaarDisplay = `XXXX XXXX ${aadhaarLast4}`;
    const fullAadhaarNum = aadhaarFirst8 + aadhaarLast4;

    // Generate hash
    const dataString = `${name}|${dob}|${address}|${fullAadhaarNum}`;
    const uidHash = generateHash(dataString);

    // White background
    page.drawRectangle({
      x: 0,
      y: 0,
      width: width,
      height: height,
      color: rgb(1, 1, 1),
    });

    // Orange header band
    page.drawRectangle({
      x: 0,
      y: height - 40,
      width: width,
      height: 40,
      color: rgb(1, 0.6, 0.2),
    });

    // Green band
    page.drawRectangle({
      x: 0,
      y: height - 70,
      width: width,
      height: 30,
      color: rgb(0.08, 0.53, 0.03),
    });

    // Header text
    const headerText = "Government of India";
    const headerWidth = boldFont.widthOfTextAtSize(headerText, 16);
    page.drawText(headerText, {
      x: width / 2 - headerWidth / 2,
      y: height - 28,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    const uidaiText = "Unique Identification Authority of India";
    const uidaiWidth = regularFont.widthOfTextAtSize(uidaiText, 11);
    page.drawText(uidaiText, {
      x: width / 2 - uidaiWidth / 2,
      y: height - 58,
      size: 11,
      font: regularFont,
      color: rgb(1, 1, 1),
    });

    // Photo box
    const photoX = 30;
    const photoY = height - 240;
    const photoW = 100;
    const photoH = 120;

    page.drawRectangle({
      x: photoX,
      y: photoY,
      width: photoW,
      height: photoH,
      borderColor: rgb(0.2, 0.2, 0.2),
      borderWidth: 2,
    });

    // Embed photo
    if (photo) {
      try {
        const photoData = photo.replace(/^data:image\/\w+;base64,/, "");
        const photoBytes = Buffer.from(photoData, "base64");

        console.log(
          "🖼️  Attempting to embed photo for IPFS, size:",
          photoBytes.length,
          "bytes"
        );

        let photoImage;
        // Try to detect format from data URL or try both formats
        if (photo.includes("image/png") || photo.includes("PNG")) {
          console.log("🖼️  Detected PNG format");
          photoImage = await pdfDoc.embedPng(photoBytes);
        } else if (
          photo.includes("image/jpeg") ||
          photo.includes("image/jpg") ||
          photo.includes("JPG") ||
          photo.includes("JPEG")
        ) {
          console.log("🖼️  Detected JPEG format");
          photoImage = await pdfDoc.embedJpg(photoBytes);
        } else {
          // Try JPEG first (most common), then PNG
          console.log("🖼️  Unknown format, trying JPEG first");
          try {
            photoImage = await pdfDoc.embedJpg(photoBytes);
            console.log("🖼️  Successfully embedded as JPEG");
          } catch (jpgErr) {
            console.log("🖼️  JPEG failed, trying PNG");
            photoImage = await pdfDoc.embedPng(photoBytes);
            console.log("🖼️  Successfully embedded as PNG");
          }
        }

        page.drawImage(photoImage, {
          x: photoX + 2,
          y: photoY + 2,
          width: photoW - 4,
          height: photoH - 4,
        });
        console.log("✅ Photo embedded successfully for IPFS upload");
      } catch (err) {
        console.error("❌ Photo embedding error for IPFS:", err.message);
        console.error(
          "   Photo starts with:",
          photo ? photo.substring(0, 50) : "null"
        );
      }
    }

    // Details
    const detailsX = photoX + photoW + 25;
    let detailsY = height - 100;

    page.drawText(name.toUpperCase(), {
      x: detailsX,
      y: detailsY,
      size: 16,
      font: boldFont,
      color: rgb(0, 0, 0),
    });
    detailsY -= 25;

    page.drawText(`DOB: ${dob}`, {
      x: detailsX,
      y: detailsY,
      size: 12,
      font: regularFont,
      color: rgb(0, 0, 0),
    });
    detailsY -= 20;

    // Address word wrap
    const maxLineWidth = 280;
    const words = address.split(" ");
    let currentLine = "";

    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word;
      const textWidth = regularFont.widthOfTextAtSize(testLine, 10);

      if (textWidth > maxLineWidth && currentLine) {
        page.drawText(currentLine, {
          x: detailsX,
          y: detailsY,
          size: 10,
          font: regularFont,
          color: rgb(0, 0, 0),
        });
        detailsY -= 14;
        currentLine = word;
      } else {
        currentLine = testLine;
      }
    }
    if (currentLine) {
      page.drawText(currentLine, {
        x: detailsX,
        y: detailsY,
        size: 10,
        font: regularFont,
        color: rgb(0, 0, 0),
      });
    }

    // Aadhaar number
    const aadhaarY = 80;
    const aadhaarTextWidth = boldFont.widthOfTextAtSize(aadhaarDisplay, 28);
    page.drawText(aadhaarDisplay, {
      x: (width - aadhaarTextWidth) / 2,
      y: aadhaarY,
      size: 28,
      font: boldFont,
      color: rgb(0, 0, 0),
    });

    // Footer (using English to avoid font encoding issues)
    const footerText = "My Aadhaar, My Identity";
    const footerWidth = regularFont.widthOfTextAtSize(footerText, 12);
    page.drawText(footerText, {
      x: (width - footerWidth) / 2,
      y: 25,
      size: 12,
      font: boldFont,
      color: rgb(0.83, 0.18, 0.18),
    });

    // Save and upload
    const pdfBytes = await pdfDoc.save();
    const pdfBase64 = Buffer.from(pdfBytes).toString("base64");

    console.log("✓ PDF generated, uploading to IPFS...");

    const filename = `aadhaar_${name.replace(/\s+/g, "_")}_${Date.now()}.pdf`;
    const cid = await uploadToIPFS(pdfBase64, filename);
    const gatewayUrl = `https://gateway.pinata.cloud/ipfs/${cid}`;

    console.log("✓ Upload complete! CID:", cid);

    res.json({
      success: true,
      cid: cid,
      url: gatewayUrl,
      filename: filename,
      metadata: { name, dob, address, did, recordId },
    });
  } catch (error) {
    console.error("PDF generation/upload failed:", error);
    res.status(500).json({
      success: false,
      error: error.message || "PDF generation/upload failed",
    });
  }
});

// Health check endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "Aadhaar IPFS Upload Server",
    timestamp: new Date().toISOString(),
  });
});

// Serve the HTML file
app.get("/", (req, res) => {
  res.sendFile(path.join(__dirname, "generation.html"));
});

app.listen(PORT, () => {
  console.log("\n🚀 Aadhaar IPFS Upload Server started!");
  console.log(`   URL: http://localhost:${PORT}`);
  console.log(`   API: http://localhost:${PORT}/api/upload-aadhaar`);
  console.log("\n✓ Ready to upload Aadhaar cards to IPFS\n");
});
