require('dotenv').config();

const express = require('express');
const path = require('path');
// const ejs = require('ejs'); // Keep if you still want the EJS views for some reason
const puppeteer = require('puppeteer');
const cors = require('cors');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai"); // Import Gemini SDK

const app = express();
const PORT = process.env.PORT || 3000;

// --- Gemini AI Initialization ---
let genAI;
let geminiProModel;

if (process.env.GOOGLE_GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    geminiProModel = genAI.getGenerativeModel({
        model: "gemini-1.5-flash", 
        // Optional: Safety settings (adjust as needed)
        safetySettings: [
            {
                category: HarmCategory.HARM_CATEGORY_HARASSMENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
            {
                category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
                threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE,
            },
        ],
        // Optional: Generation config
        // generationConfig: {
        //   temperature: 0.7,
        //   topP: 1,
        //   topK: 1,
        //   maxOutputTokens: 2048,
        // },
    });
    console.log("Google Gemini SDK Initialized (gemini-pro).");
} else {
    console.warn("GOOGLE_GEMINI_API_KEY not found in .env file. AI features will be disabled.");
}
// --- End Gemini AI Initialization ---

// Middleware
app.use(cors());
// app.set('view engine', 'ejs'); // Not strictly needed if React is the main UI
// app.set('views', path.join(__dirname, 'views'));
// app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // For form data if any non-React forms remain
app.use(express.json()); // For JSON payloads from React

// --- Your Existing Routes (Keep the /generate-resume for PDF generation) ---
app.get('/', (req, res) => {
    // If you're fully on React, this might just serve the React build or a placeholder
    res.send('Resume Generator Backend. Use the React frontend.');
});

app.post('/generate-resume', async (req, res) => {
    const resumeData = req.body; // This will contain all form data from React

    try {
        // 1. Render the EJS template with user data
        //    Make sure you have a resume-template.ejs file in a 'views' directory
        //    Or, if your React app generates the full HTML for the resume,
        //    you might receive that HTML directly and skip EJS rendering here.
        //    For now, assuming you still use an EJS template on the backend:
        const ejs = require('ejs'); // require it here if only used in this route
        const htmlContent = await ejs.renderFile(
            path.join(__dirname, 'views', 'resume-template.ejs'), // Ensure this path is correct
            { data: resumeData }
        );

        const browser = await puppeteer.launch({
            headless: true,
            args: ['--no-sandbox', '--disable-setuid-sandbox']
        });
        const page = await browser.newPage();
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });
        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true,
            margin: { top: '20mm', right: '20mm', bottom: '20mm', left: '20mm' }
        });
        await browser.close();

        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${(resumeData.name || 'resume').replace(/\s+/g, '_')}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF. Check server logs.');
    }
});


// --- New AI Endpoints using Gemini ---

app.post('/api/chat', async (req, res) => {
    if (!geminiProModel) {
        return res.status(503).json({ error: 'AI service (Gemini) is not configured on the server.' });
    }

    const { message } = req.body;

    if (!message) {
        return res.status(400).json({ error: 'Message is required.' });
    }

    try {
       const prompt = `
You are a versatile AI Career Assistant named Apexo AI. Your expertise spans all aspects of job hunting, career development, and professional growth.

Based on the user's input, you can provide assistance with:

- Enhancing resume sections (summaries, experience, skills, etc.) for greater impact and tailoring them to specific job descriptions if provided.
- Offering advice on job searching strategies, including where to find opportunities and how to network effectively.
- Providing guidance on interview preparation, including common questions and how to present oneself confidently.
- Giving general career advice, such as identifying career paths, upskilling, and navigating workplace challenges.

Your goal is to provide helpful, professional, and actionable responses directly related to the user's query.

User input:
"${message}"
`;

        const result = await geminiProModel.generateContent({
            contents: [{ role: "user", parts: [{ text: prompt }] }]
        });

        const response = await result.response;
        const enhancedSummary = response.text();

        res.json({ enhancedSummary });
    } catch (error) {
        console.error('Error generating summary:', error);
        res.status(500).json({ error: 'Failed to generate summary', details: error.message });
    }
});




// --- Start Server ---
app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});
