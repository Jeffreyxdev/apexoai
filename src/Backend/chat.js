import dotenv from "dotenv";
dotenv.config();

import express from "express";
import path from "path";
import fs from "fs";
import cors from "cors";
import multer from "multer";
import Database from "better-sqlite3";
import nodemailer from "nodemailer";
import cron from "node-cron";
import { spawn } from "child_process";


import { fileURLToPath } from "url";

// Fix __dirname and __filename in ESM
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);


// Office file generators
import PDFDocument from "pdfkit";

import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";



import express from "express";
import cors from "cors";
import fs from "fs";
import path from "path";
import multer from "multer";
import PDFDocument from "pdfkit";
import { Document, Packer, Paragraph, TextRun, HeadingLevel } from "docx";
import Database from "better-sqlite3";
import nodemailer from "nodemailer";

// Vertex AI
import { PredictionServiceClient } from "@google-cloud/aiplatform";

// --- Vertex AI Setup ---
const projectId = "glassy-clarity-445309-a5";
const location = "africa-south1";
const endpointId = "<YOUR_ENDPOINT_ID>"; // replace with your actual endpoint ID
const client = new PredictionServiceClient();

// Helper to call Vertex AI
async function vertexChat(prompt) {
  const request = {
    endpoint: `projects/${projectId}/locations/${location}/endpoints/${endpointId}`,
    instances: [
      {
        content: prompt,
        // Optionally, add parameters like temperature, max output tokens
        // For Gemini 1.5 or 2.0:
        // parameters: { temperature: 0.7, maxOutputTokens: 1024 }
      },
    ],
  };

  const [response] = await client.predict(request);
  // Vertex AI returns array of predictions
  const output = response.predictions?.[0]?.content || "";
  return output;
}

const app = express();
const PORT = process.env.PORT || 3000;

// --- File upload configuration ---
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        cb(null, Date.now() + '-' + file.originalname);
    }
});
const upload = multer({ storage: storage });

// --- Database Setup for Job Scraper ---
const db = new Database('./jobs.db');
db.pragma("journal_mode = WAL");

db.exec(`
    CREATE TABLE IF NOT EXISTS job_postings (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tweet_id TEXT UNIQUE,
        content TEXT,
        author TEXT,
        url TEXT,
        created_at DATETIME,
        keywords TEXT,
        scraped_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS canvas_projects (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        type TEXT NOT NULL,
        canvas_data TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
    
    CREATE TABLE IF NOT EXISTS user_preferences (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        email TEXT,
        keywords TEXT,
        notifications BOOLEAN DEFAULT 1,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
`);

// --- Email Configuration ---
let transporter;
if (process.env.SMTP_HOST && process.env.SMTP_USERNAME && process.env.SMTP_PASSWORD) {
    transporter = nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: parseInt(process.env.SMTP_PORT || "465"),
    secure: false,
    auth: {
        user: process.env.SMTP_USERNAME,
        pass: process.env.SMTP_PASSWORD,
    },
});
    console.log("Email transporter initialized.");
}

// --- Gemini AI Initialization ---
let genAI;
let geminiProModel;

if (process.env.GOOGLE_GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    geminiProModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash-latest",
        safetySettings: [
            { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
            { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
        ],
    });
    console.log("Google Gemini SDK Initialized (gemini-2.0-flash-001).");
} else {
    console.warn("GOOGLE_GEMINI_API_KEY not found in .env file. AI features will be disabled.");
}

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json({ limit: '50mb' }));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));;

// Ensure directories exist
['uploads', 'canvas_exports'].forEach(dir => {
    if (!fs.existsSync(dir)) {
        fs.mkdirSync(dir, { recursive: true });
    }
});

// --- Default Route ---
app.get('/', (req, res) => {
    res.json({ 
        message: 'ApexoAI Backend v2.0 is running!',
        features: [
            'AI Chat Assistant',
            'Document Generation (PDF, DOCX, Excel, PPT)',
            'Canvas-based Resume Builder',
            'Job Tweet Scraper',
            'Email Notifications'
        ]
    });
});

// --- Canvas Routes ---
app.post('/api/canvas/save', (req, res) => {
    const { name, type, canvasData } = req.body;
    
    if (!name || !type || !canvasData) {
        return res.status(400).json({ error: 'Name, type, and canvas data are required' });
    }
    
    const stmt = db.prepare(`
        INSERT INTO canvas_projects (name, type, canvas_data, updated_at) 
        VALUES (?, ?, ?, CURRENT_TIMESTAMP)
    `);
    
    stmt.run([name, type, JSON.stringify(canvasData)], function(err) {
        if (err) {
            console.error('Error saving canvas project:', err);
            return res.status(500).json({ error: 'Failed to save project' });
        }
        
        res.json({ 
            success: true, 
            id: this.lastID,
            message: 'Canvas project saved successfully' 
        });
    });
});

app.get('/api/canvas/projects', (req, res) => {
    db.all(`
        SELECT id, name, type, created_at, updated_at 
        FROM canvas_projects 
        ORDER BY updated_at DESC
    `, (err, rows) => {
        if (err) {
            console.error('Error fetching projects:', err);
            return res.status(500).json({ error: 'Failed to fetch projects' });
        }
        
        res.json({ projects: rows });
    });
});

app.get('/api/canvas/projects/:id', (req, res) => {
    const { id } = req.params;
    
    db.get(`
        SELECT * FROM canvas_projects WHERE id = ?
    `, [id], (err, row) => {
        if (err) {
            console.error('Error fetching project:', err);
            return res.status(500).json({ error: 'Failed to fetch project' });
        }
        
        if (!row) {
            return res.status(404).json({ error: 'Project not found' });
        }
        
        try {
            row.canvas_data = JSON.parse(row.canvas_data);
        } catch (e) {
            console.error('Error parsing canvas data:', e);
        }
        
        res.json({ project: row });
    });
});

app.post('/api/canvas/export-pdf', async (req, res) => {
    try {
        const { canvasData, filename, projectType } = req.body;
        const filePath = path.join("uploads", `${filename || "canvas-export"}.pdf`);
        
        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(fs.createWriteStream(filePath));
        
        // Add title based on project type
        doc.fontSize(24).font('Helvetica-Bold');
        if (projectType === 'resume') {
            doc.text('RESUME', 50, 50, { align: 'center' });
        } else {
            doc.text('DOCUMENT', 50, 50, { align: 'center' });
        }
        
        doc.moveDown(2);
        
        // Process canvas elements
        if (canvasData && canvasData.elements) {
            canvasData.elements.forEach(element => {
                doc.fontSize(12).font('Helvetica');
                
                switch (element.type) {
                    case 'text':
                        doc.text(element.content || '', element.x || 50, element.y || doc.y);
                        break;
                    case 'header':
                        doc.fontSize(18).font('Helvetica-Bold');
                        doc.text(element.content || '', 50, doc.y);
                        doc.moveDown();
                        break;
                    case 'section':
                        doc.fontSize(14).font('Helvetica-Bold');
                        doc.text(element.title || '', 50, doc.y);
                        doc.fontSize(12).font('Helvetica');
                        doc.text(element.content || '', 50, doc.y);
                        doc.moveDown();
                        break;
                }
            });
        }
        
        doc.end();
        
        res.json({ 
            success: true,
            url: `/uploads/${filename || "canvas-export"}.pdf`,
            message: 'Canvas exported to PDF successfully'
        });
    } catch (err) {
        console.error('Canvas PDF export error:', err);
        res.status(500).json({ error: 'Failed to export canvas to PDF' });
    }
});

// --- Job Scraper Routes ---
app.get('/api/jobs/recent', (req, res) => {
    const limit = parseInt(req.query.limit) || 50;
    const keyword = req.query.keyword || '';
    
    let query = `
        SELECT * FROM job_postings 
        WHERE content LIKE ?
        ORDER BY created_at DESC 
        LIMIT ?
    `;
    
    db.all(query, [`%${keyword}%`, limit], (err, rows) => {
        if (err) {
            console.error('Error fetching jobs:', err);
            return res.status(500).json({ error: 'Failed to fetch job postings' });
        }
        
        res.json({ jobs: rows, total: rows.length });
    });
});

app.post('/api/jobs/subscribe', (req, res) => {
    const { email, keywords } = req.body;
    
    if (!email || !keywords) {
        return res.status(400).json({ error: 'Email and keywords are required' });
    }
    
    const stmt = db.prepare(`
        INSERT OR REPLACE INTO user_preferences (email, keywords) 
        VALUES (?, ?)
    `);
    
    stmt.run([email, keywords.join(',')], function(err) {
        if (err) {
            console.error('Error saving subscription:', err);
            return res.status(500).json({ error: 'Failed to save subscription' });
        }
        
        res.json({ 
            success: true,
            message: 'Subscription saved successfully' 
        });
    });
});

app.post('/api/jobs/manual-scrape', async (req, res) => {
    try {
        // Trigger the Python scraper
        const pythonProcess = spawn('python3', [path.join(__dirname, 'job_scraper.py')]);
        
        let output = '';
        pythonProcess.stdout.on('data', (data) => {
            output += data.toString();
        });
        
        pythonProcess.on('close', (code) => {
            if (code === 0) {
                res.json({ 
                    success: true, 
                    message: 'Job scraping completed',
                    output: output
                });
            } else {
                res.status(500).json({ 
                    error: 'Scraping failed', 
                    output: output 
                });
            }
        });
    } catch (err) {
        console.error('Manual scrape error:', err);
        res.status(500).json({ error: 'Failed to start job scraping' });
    }
});

// --- Enhanced Document Generation Routes ---
app.post("/api/documents/pdf/generate", async (req, res) => {
    try {
        const { content, filename, template } = req.body;
        const filePath = path.join("uploads", `${filename || "document"}.pdf`);

        const doc = new PDFDocument({ margin: 50 });
        doc.pipe(fs.createWriteStream(filePath));
        
        if (template === 'resume') {
            // Resume template
            doc.fontSize(24).font('Helvetica-Bold').text('RESUME', { align: 'center' });
            doc.moveDown(2);
            doc.fontSize(12).font('Helvetica').text(content, { align: 'left' });
        } else if (template === 'cover-letter') {
            // Cover letter template
            doc.fontSize(16).font('Helvetica-Bold').text('Cover Letter', { align: 'center' });
            doc.moveDown(2);
            doc.fontSize(12).font('Helvetica').text(content, { align: 'left' });
        } else {
            // Standard document
            doc.font("Helvetica").fontSize(12).text(content, { align: "left" });
        }
        
        doc.end();

        res.json({ 
            success: true,
            url: `/uploads/${filename || "document"}.pdf` 
        });
    } catch (err) {
        console.error('PDF generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

app.post("/api/documents/docx/generate", async (req, res) => {
    try {
        const { content, filename, template } = req.body;
        
        let doc;
        if (template === 'resume') {
            doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [
                                new TextRun({
                                    text: "RESUME",
                                    bold: true,
                                    size: 32
                                })
                            ],
                            heading: HeadingLevel.TITLE,
                            alignment: 'center'
                        }),
                        new Paragraph({
                            children: [new TextRun(content)],
                        }),
                    ],
                }],
            });
        } else {
            doc = new Document({
                sections: [{
                    properties: {},
                    children: [
                        new Paragraph({
                            children: [new TextRun(content)],
                        }),
                    ],
                }],
            });
        }

        const buffer = await Packer.toBuffer(doc);
        const filePath = path.join("uploads", `${filename || "document"}.docx`);
        fs.writeFileSync(filePath, buffer);

        res.json({ 
            success: true,
            url: `/uploads/${filename || "document"}.docx` 
        });
    } catch (err) {
        console.error('DOCX generation error:', err);
        res.status(500).json({ error: err.message });
    }
});

// --- AI Chat Routes ---
app.post('/api/chat', async (req, res) => {
    if (!geminiProModel) {
        return res.status(503).json({ error: 'AI service (Gemini) is not configured on the server.' });
    }

    const { message, context } = req.body;
    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    try {
        let prompt = `
        You are ApexoAI, an advanced AI career assistant with enhanced capabilities.
        
        Core Focus Areas:
        - Career advice and strategy
        - Resume writing and optimization
        - Job search techniques
        - Interview preparation
        - Workplace success
        - Document creation and editing
        - Canvas-based design guidance
        
        Additional Context: ${context || 'General career assistance'}
        
        Be professional, practical, and actionable in your responses.
        User input: ${message}
        `;

        const result = await geminiProModel.generateContentStream({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        res.setHeader('Content-Type', 'text/event-stream');
        res.setHeader('Cache-Control', 'no-cache');
        res.setHeader('Connection', 'keep-alive');

        for await (const chunk of result.stream) {
            const chunkText = chunk.text();
            if (chunkText) {
                res.write(`data: ${JSON.stringify({ text: chunkText })}\n\n`);
            }
        }

        res.write("data: [DONE]\n\n");
        res.end();

    } catch (error) {
        console.error('Error streaming chat response:', error);
        res.status(500).json({ error: 'Failed to stream response', details: error.message });
    }
});

app.post('/api/chat/analyze-resume', async (req, res) => {
    if (!geminiProModel) {
        return res.status(503).json({ error: 'AI service not configured' });
    }

    const { resumeContent } = req.body;
    if (!resumeContent) {
        return res.status(400).json({ error: 'Resume content is required' });
    }

    try {
        const prompt = `
        Analyze this resume and provide detailed feedback:
        
        ${resumeContent}
        
        Please provide:
        1. Overall assessment (score out of 10)
        2. Strengths
        3. Areas for improvement
        4. Specific suggestions for enhancement
        5. ATS optimization tips
        6. Industry-specific recommendations if applicable
        `;

        const result = await geminiProModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const analysis = result.response.text();
        res.json({ analysis });

    } catch (error) {
        console.error('Resume analysis error:', error);
        res.status(500).json({ error: 'Failed to analyze resume' });
    }
});

// --- Job Scraper Integration ---
function startJobScraper() {
    if (!fs.existsSync('job_scraper.py')) {
        console.warn('job_scraper.py not found. Creating basic scraper...');
        
        const scraperCode = `#!/usr/bin/env python3
import os
import time
import sqlite3
import requests
import json
from datetime import datetime

# Basic Twitter API v2 search (requires Bearer token)
BEARER_TOKEN = os.getenv('TWITTER_BEARER_TOKEN')
DATABASE = 'jobs.db'

def search_tweets(query, max_results=10):
    if not BEARER_TOKEN:
        print("Twitter Bearer Token not configured")
        return []
    
    url = "https://api.twitter.com/2/tweets/search/recent"
    headers = {"Authorization": f"Bearer {BEARER_TOKEN}"}
    params = {
        "query": query,
        "max_results": max_results,
        "tweet.fields": "created_at,author_id,public_metrics"
    }
    
    try:
        response = requests.get(url, headers=headers, params=params)
        if response.status_code == 200:
            return response.json().get('data', [])
        else:
            print(f"API Error: {response.status_code}")
            return []
    except Exception as e:
        print(f"Search error: {e}")
        return []

def save_jobs(tweets):
    conn = sqlite3.connect(DATABASE)
    cursor = conn.cursor()
    
    for tweet in tweets:
        try:
            cursor.execute("""
                INSERT OR IGNORE INTO job_postings 
                (tweet_id, content, author, url, created_at, keywords)
                VALUES (?, ?, ?, ?, ?, ?)
            """, (
                tweet['id'],
                tweet['text'],
                tweet.get('author_id', ''),
                f"https://twitter.com/i/status/{tweet['id']}",
                tweet.get('created_at', ''),
                'hiring,job,remote,developer'
            ))
        except Exception as e:
            print(f"Save error: {e}")
    
    conn.commit()
    conn.close()

if __name__ == "__main__":
    keywords = ["hiring", "job opening", "we're hiring", "remote job"]
    query = " OR ".join([f'"{kw}"' for kw in keywords])
    
    tweets = search_tweets(query)
    if tweets:
        save_jobs(tweets)
        print(f"Saved {len(tweets)} job postings")
    else:
        print("No tweets found")
`;
        
        fs.writeFileSync('job_scraper.py', scraperCode);
        console.log('Basic job scraper created. Configure TWITTER_BEARER_TOKEN for full functionality.');
    }
}

// Schedule job scraper to run every 15 minutes
cron.schedule('*/15 * * * *', () => {
    console.log('Running scheduled job scraper...');
    
    const pythonProcess = spawn('python3', ['job_scraper.py']);
    pythonProcess.on('close', (code) => {
        console.log(`Job scraper completed with code ${code}`);
    });
});

// Initialize job scraper on startup
startJobScraper();

// --- Error Handling ---
app.use((err, req, res, next) => {
    console.error('Unhandled error:', err);
    res.status(500).json({ 
        error: 'Internal server error',
        message: process.env.NODE_ENV === 'development' ? err.message : 'Something went wrong'
    });
});

// --- Start Server ---
app.listen(PORT, () => {
    console.log(`🚀 ApexoAI Backend v2.0 running at http://localhost:${PORT}`);
    console.log('📋 Features enabled:');
    console.log('  ✅ Document Generation');
    console.log('  ✅ Canvas-based Resume Builder');
    console.log('  ✅ Job Tweet Scraper');
    console.log('  ✅ AI Chat Assistant');
    console.log(geminiProModel ? '  ✅ AI Features' : '  ❌ AI Features (missing API key)');
    console.log(transporter ? '  ✅ Email Notifications' : '  ❌ Email (missing SMTP config)');
});

// Graceful shutdown
process.on('SIGINT', () => {
    console.log('\n🛑 Shutting down ApexoAI Backend...');
    db.close();
    process.exit(0);
});