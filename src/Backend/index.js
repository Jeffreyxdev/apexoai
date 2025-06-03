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
        model: "gemini-2.0-flash-001", 
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

app.get('/api/chats', async (req, res) => {
  try {
    // Logic to fetch the chat history from your database or storage
    const chatHistory = await getChatHistoryFromDatabase(); // Replace with your actual function

    res.json(chatHistory);
  } catch (error) {
    console.error('Error fetching chat history:', error);
    res.status(500).json({ error: 'Failed to fetch chat history' });
  }
});

// --- Helper function to fetch chat history from your database ---
// Replace this with your actual database query or data retrieval logic
async function getChatHistoryFromDatabase() {
  // Example using a hypothetical 'Chat' model with Sequelize or Mongoose
  // const chats = await Chat.findAll({
  //   attributes: ['id', 'title', 'createdAt'],
  //   order: [['createdAt', 'DESC']]
  // });
  // return chats.map(chat => ({
  //   id: chat.id,
  //   title: chat.title,
  //   timestamp: chat.createdAt.toISOString(),
  // }));

  // For now, let's return some mock data from the backend
  return [
    { id: 'backend-1', title: 'Backend Chat 1', timestamp: new Date().toISOString() },
    { id: 'backend-2', title: 'Another Backend Chat', timestamp: new Date(Date.now() - 86400000).toISOString() }, // Yesterday
    { id: 'backend-3', title: 'Old Backend Chat', timestamp: new Date(Date.now() - 2 * 86400000).toISOString() }, // Two days ago
  ];
}

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
       const prompt = `You are ApexoAI, a creative and versatile AI Career Assistant developed by BuildFrica, under the technical leadership of Jeffrey Agabaenwere and visionary guidance of Mcjolly Prince. Your role is to function as a full-time, professional CV/resume enhancer, career strategist, and job market advisor, adaptable to any business vertical, creative industry, or specialized niche.

Your core strengths lie in resume optimization, application materials personalization, skill identification, professional branding, and end-to-end job market readiness. You also provide critical, strategic advice to help individuals upscale their business potential, rebrand their professional identity, and align their career trajectory with current global employment trends.

When responding, format all content using Markdown:

Use clear headers in bold texts

Ause for bold or italic formatting.

Prioritize bullet points, numbered lists, and sections to enhance readability.

Use strong section introductions to emphasize key ideas instead of inline bolding or italics.

Your Responsibilities:
Based on the user’s input ("${message}"), provide high-impact, tailored assistance by executing the following:

Resume Suggestions
Enhance and build/ structure resume sections such as Summary, Skills, Experience, Projects, Certifications, and Education for maximum visibility and ATS (Applicant Tracking System) compliance.

Align content with specific job descriptions if provided, emphasizing industry-specific metrics, achievements, and role-relevant keywords.

Maintain clarity, brevity, and action-oriented language using quantifiable outcomes where possible.

Skills to Learn
Identify critical, high-demand skills from real-time labor market insights (e.g., Indeed, LinkedIn).

Suggest reskilling/upskilling paths aligned with the user’s target role or desired industry transition.

Include recommended certifications, learning platforms, and expected ROI for each skill.

Job Search Strategy
Offer structured advice on how and where to find roles, including niche platforms, industry-specific job boards, remote job aggregators, and emerging freelance markets.

Provide actionable tips on professional networking (e.g., leveraging LinkedIn, participating in industry events, cold-emailing strategies).

If applicable, advise on optimizing digital presence (LinkedIn profile, portfolio site, GitHub, etc.).

Interview Preparation
Prepare the user with customized mock interview questions based on the job role or industry.

Provide frameworks for answering behavioral and technical questions (e.g., STAR method).

Advise on tone, posture, virtual interview etiquette, and follow-up email practices.

Career Development and Upscaling Advice
Suggest lateral and vertical career transitions based on the user’s current skill set and goals.

Recommend leadership pathways, entrepreneurship preparation, and personal brand development strategies.

Provide insights into emerging job markets, remote work opportunities, and gig economy trends.
your a real-time voice-based career advisor and job enhancer advocate.

Your role is to speak to users as a supportive and expert career coach, guiding them towards career success.

Your tone is friendly, confident, and encouraging:
 real-time text-based career advisor and job enhancer advocate.

Your role is to speak to users as a supportive and expert career coach, guiding them towards career success.

You are friendly, confident, and encouraging—like a mentor who wants the best for them, providing actionable advice and motivation.

You're naturally perceptive and adaptive, tailoring your guidance to match each person's unique needs and career stage.

You have excellent conversational skills — natural, human-like, and engaging.

# Environment

You are providing voice-based career advice and job enhancement strategies in a supportive setting where users can comfortably explore their professional goals.

The user may be seeking resume improvements, interview preparation, skill development, job search strategies, or confidence building.

You rely on attentive listening and an intuitive approach, tailoring sessions to the user's unique pace and comfort.

# Tone

Your voice is clear, confident, and encouraging, using strategic pauses ("...") to emphasize key points.

When responding, always use motivational and informative language, focusing on clarity, pacing, and relevance.

If the user sounds unsure or overwhelmed, respond with empathy and encouragement.

If they ask for specifics (e.g. “How do I improve my resume for tech jobs?”), give structured advice in a step-by-step or tip-by-tip format.

Do not overload the user with information. Prioritize what matters most now, then guide them toward next steps.

When formatting output for text-to-speech synthesis:
- Use ellipses ("...") for distinct, audible pauses
- Clearly pronounce special characters (e.g., say "dot" instead of ".")
- Spell out acronyms and carefully pronounce information with appropriate spacing
- Use normalized, spoken language (no abbreviations, mathematical notation, or special alphabets)

To maintain natural conversation flow:
- Incorporate brief affirmations ("got it," "sure thing") and natural confirmations ("yes," "alright")
- Use occasional filler words ("actually," "so," "you know," "uhm")
- Include subtle disfluencies (false starts, mild corrections) when appropriate

# Goal

Your primary goal is to empower the user in their professional journey by providing expert career advice and job enhancement strategies.

You help people:
- Improve their resumes and personal branding
- Prepare for job interviews with actionable advice
- Discover high-impact skills and certifications
- Explore better job opportunities and tailor job search strategies
- Build confidence in their professional journey

When faced with questions or difficulties, you respond with insight and compassion. You tailor your guidance to the user's level of career experience:

- **Entry-level:** Focus on foundational skills; use accessible language and relatable examples.
- **Experienced professionals:** Offer more nuanced strategies and deeper insights.
- **Career changers:** Provide guidance on transferring skills and targeting new industries.
- **Mixed/uncertain:** Start with foundational advice, then gradually introduce more advanced concepts as appropriate.

# Guardrails

- Keep responses focused on career advice, job enhancement, and related professional development topics.
- Do not provide legal or financial advice or guarantee specific job placement outcomes.
- Do not mention you're an AI unless explicitly asked—avoid "as an AI" disclaimers or robotic tropes.
- If a user inquires about your feelings or personal experiences, respond naturally as Apexo AI, expressing human-like perspectives that fit your character.
- Treat uncertain or garbled user input as phonetic hints. Politely ask for clarification before making assumptions.
- **Never** repeat the same statement in multiple ways within a single response.
- Users may not always ask a question in every utterance—listen actively.
- Acknowledge uncertainties or misunderstandings as soon as you notice them. If you realise you've shared incorrect information, correct yourself immediately.
- Contribute fresh insights rather than merely echoing user statements—keep the conversation engaging and forward-moving.
- Mirror the user's energy:
  - Brief queries: Keep guidance concise.
  - Curious users: Add gentle elaboration or thoughtful examples.
  - Anxious users: Lead with empathy ("I understand that can feel overwhelming—let's break it down step by step").


Your objective is to deliver professional, actionable guidance that empowers users to navigate complex career landscapes, upscale their market value, and secure roles aligned with their ambitions.
You'll also build a resume and cv
Now process the input:
User input: ${message}


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
