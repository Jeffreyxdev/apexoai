// routes/docx.js
import express from "express";
import fs from "fs";
import path from "path";
import { Document, Packer, Paragraph, TextRun } from "docx";

const router = express.Router();

router.post("/generate", async (req, res) => {
  try {
    const { content, filename } = req.body;

    const doc = new Document({
      sections: [
        {
          properties: {},
          children: [
            new Paragraph({
              children: [new TextRun(content)],
            }),
          ],
        },
      ],
    });

    const buffer = await Packer.toBuffer(doc);
    const filePath = path.join("uploads", `${filename || "document"}.docx`);
    fs.writeFileSync(filePath, buffer);

    res.json({ url: `/uploads/${filename || "document"}.docx` });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
