// // routes/excel.js
// import express from "express";
// import fs from "fs";
// import path from "path";
// import ExcelJS from "exceljs";

// const router = express.Router();

// router.post("/generate", async (req, res) => {
//   try {
//     const { content, filename } = req.body;
//     // `content` could be a 2D array like: [["Name", "Age"], ["Jeff", 23], ["Mary", 30]]

//     const workbook = new ExcelJS.Workbook();
//     const sheet = workbook.addWorksheet("Sheet 1");

//     // Add rows
//     if (Array.isArray(content)) {
//       sheet.addRows(content);
//     } else {
//       sheet.addRow([content]); // fallback if plain text
//     }

//     const filePath = path.join("uploads", `${filename || "document"}.xlsx`);
//     await workbook.xlsx.writeFile(filePath);

//     res.json({ url: `/uploads/${filename || "document"}.xlsx` });
//   } catch (err) {
//     res.status(500).json({ error: err.message });
//   }
// });

// export default router;
