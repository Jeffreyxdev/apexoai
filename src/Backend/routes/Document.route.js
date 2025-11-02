import express from 'express';
import { protect } from '../middleware/auth.js';
import pdf from 'pdfkit';
import fs from 'fs';
import path from 'path';

const router = express.Router();

// Ensure exports folder exists
const exportsDir = path.join(process.cwd(), 'exports');
if (!fs.existsSync(exportsDir)) fs.mkdirSync(exportsDir);

router.post('/export', protect, async (req, res) => {
  try {
    const { content, fileName } = req.body;
    if (!content || !fileName) {
      return res.status(400).json({ success: false, message: 'Missing content or fileName' });
    }

    // Sanitize fileName
    const safeFileName = fileName.replace(/[^a-z0-9_\-]/gi, '_');
    const filePath = path.join(exportsDir, `${safeFileName}.pdf`);

    const doc = new pdf();
    doc.pipe(fs.createWriteStream(filePath));
    doc.text(content);
    doc.end();

    res.json({ success: true, path: filePath });
  } catch (err) {
    console.error(err);
    res.status(500).json({ success: false, message: 'Failed to generate PDF' });
  }
});

export default router;
