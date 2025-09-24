// routes/pdf.js
import express from "express";
import PDFDocument from "pdfkit";
import fs from "fs";
import path from "path";

const router = express.Router();

// POST /pdf/generate
router.post("/generate", async (req, res) => {
  try {
    const { content, filename } = req.body; // AI/chat content
    if (!content) {
      return res.status(400).json({ error: "Content is required" });
    }

    // Ensure uploads folder exists
    const uploadsDir = path.join(process.cwd(), "uploads");
    if (!fs.existsSync(uploadsDir)) {
      fs.mkdirSync(uploadsDir);
    }

    const safeFilename = `${filename || "document"}-${Date.now()}.pdf`;
    const filePath = path.join(uploadsDir, safeFilename);

    // Create a PDF document
    const doc = new PDFDocument();

    // Pipe to both file + response
    const fileStream = fs.createWriteStream(filePath);
    doc.pipe(fileStream);
    doc.pipe(res);

    // PDF content
    doc.font("Times-Roman").fontSize(12).text(content, {
      align: "left",
    });

    doc.end();

    // Respond after saving file
    fileStream.on("finish", () => {
      res.setHeader("Content-Disposition", `attachment; filename=${safeFilename}`);
      res.setHeader("Content-Type", "application/pdf");
      // If frontend needs saved link:
      res.json({ url: `/uploads/${safeFilename}` });
    });
  } catch (err) {
    console.error("PDF generation error:", err);
    res.status(500).json({ error: "Failed to generate PDF" });
  }
});

export default router;
