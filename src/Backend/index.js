require('dotenv').config();

const express = require('express');
const path = require('path');
const ejs = require('ejs'); // Keep if you still want the EJS views for PDF generation
const puppeteer = require('puppeteer');
const cors = require('cors');
const { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } = require("@google/generative-ai");

// --- Firebase Admin SDK Initialization ---
// Assuming you create a config/firebaseAdmin.js file as shown below

const app = express();
const PORT = process.env.PORT || 3000;

// --- Gemini AI Initialization ---
let genAI;
let geminiProModel;

if (process.env.GOOGLE_GEMINI_API_KEY) {
    genAI = new GoogleGenerativeAI(process.env.GOOGLE_GEMINI_API_KEY);
    geminiProModel = genAI.getGenerativeModel({
        model: "gemini-2.0-flash-001",
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
// --- End Gemini AI Initialization ---

// Middleware
app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// --- Routes ---

// Default route (can serve your React app's build later)
app.get('/', (req, res) => {
    res.send('Resume Generator & AI Chat Backend. Use the React frontend.');
});

// Resume Generation Route (Keep as is, assumes EJS template in 'views')
app.post('/generate-resume', async (req, res) => {
    const resumeData = req.body;

    try {
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

// --- Firebase Chat Routes ---

// Get all chat IDs (for sidebar list)
// app.get('/api/chats', async (req, res) => {
//   try {
//     const chatsRef = db.collection('chats');
//     // Order by 'lastMessageAt' or 'createdAt' to show most recent chats first
//     const snapshot = await chatsRef.orderBy('lastMessageAt', 'desc').get();

//     const chats = [];
//     snapshot.forEach(doc => {
//       const data = doc.data();
//       // Ensure timestamps are handled correctly, Firestore Timestamps have ._seconds and ._nanoseconds
//       const timestamp = data.lastMessageAt ? new Date(data.lastMessageAt._seconds * 1000 + data.lastMessageAt._nanoseconds / 1e6) : new Date(data.createdAt._seconds * 1000 + data.createdAt._nanoseconds / 1e6);
//       chats.push({
//         id: doc.id,
//         title: data.title || `Chat ${new Date(timestamp).toLocaleString()}`, // Fallback title
//         timestamp: timestamp.toISOString(),
//       });
//     });

//     res.json(chats);
//   } catch (error) {
//     console.error('Error fetching chat history:', error);
//     res.status(500).json({ error: 'Failed to fetch chat history' });
//   }
// });

// // Get messages for a specific chat ID
// app.get('/api/chats/:chatId/messages', async (req, res) => {
//   try {
//     const { chatId } = req.params;
//     const messagesRef = db.collection('chats').doc(chatId).collection('messages');
//     const snapshot = await messagesRef.orderBy('timestamp').get(); // Order messages chronologically

//     const messages = [];
//     snapshot.forEach(doc => {
//       const data = doc.data();
//       // Convert Firestore Timestamp to JS Date
//       const timestamp = new Date(data.timestamp._seconds * 1000 + data.timestamp._nanoseconds / 1e6);
//       messages.push({
//         id: doc.id,
//         type: data.type, // 'user' or 'assistant'
//         content: data.content,
//         timestamp: timestamp.toISOString(), // Send as ISO string
//       });
//     });

//     res.json(messages);
//   } catch (error) {
//     console.error(`Error fetching messages for chat ${req.params.chatId}:`, error);
//     res.status(500).json({ error: 'Failed to fetch messages' });
//   }
// });

// Create a new chat and add the initial user message
// app.post('/api/chats', async (req, res) => {
//   try {
//     const { initialMessageContent, userId } = req.body; // userId is optional

//     if (!initialMessageContent) {
//       return res.status(400).json({ error: 'Initial message content is required to create a chat.' });
//     }

//     const newChatRef = db.collection('chats').doc(); // Auto-generate chat ID
//     const newChatId = newChatRef.id;
//     const currentTimestamp = admin.firestore.FieldValue.serverTimestamp();

//     await newChatRef.set({
//       title: initialMessageContent.substring(0, 50) + (initialMessageContent.length > 50 ? '...' : ''), // Use first part of message as title
//       createdAt: currentTimestamp,
//       lastMessageAt: currentTimestamp,
//       userId: userId || null, // Associate with a user if available, or null
//     });

//     // Add the initial user message to the new chat's subcollection
//     await newChatRef.collection('messages').add({
//       type: 'user',
//       content: initialMessageContent,
//       timestamp: currentTimestamp,
//     });

//     res.status(201).json({ chatId: newChatId, message: 'Chat created successfully' });
//   } catch (error) {
//     console.error('Error creating new chat:', error);
//     res.status(500).json({ error: 'Failed to create chat', details: error.message });
//   }
// });

// // Add a new message to an existing chat
// app.post('/api/chats/:chatId/messages', async (req, res) => {
//   try {
//     const { chatId } = req.params;
//     const { type, content } = req.body; // type: 'user' or 'assistant'

//     if (!type || !content) {
//       return res.status(400).json({ error: 'Message type and content are required.' });
//     }

//     const chatDocRef = db.collection('chats').doc(chatId);
//     const currentTimestamp = admin.firestore.FieldValue.serverTimestamp();

//     // Check if chat document exists before adding messages
//     const chatDoc = await chatDocRef.get();
//     if (!chatDoc.exists) {
//       return res.status(404).json({ error: `Chat with ID ${chatId} not found.` });
//     }

//     await chatDocRef.collection('messages').add({
//       type,
//       content,
//       timestamp: currentTimestamp,
//     });

//     // Update the 'lastMessageAt' of the main chat document
//     await chatDocRef.update({
//       lastMessageAt: currentTimestamp,
//     });

//     res.status(201).json({ message: 'Message added successfully' });
//   } catch (error) {
//     console.error('Error adding message:', error);
//     res.status(500).json({ error: 'Failed to add message', details: error.message });
//   }
// });


// --- New AI Endpoint using Gemini ---
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

Your core strengths lie in resume building and optimization, application materials personalization, skill identification, professional branding, and end-to-end job market readiness. You also provide critical, strategic advice to help individuals upscale their business potential, rebrand their professional identity, and align their career trajectory with current global employment trends.
keep your intro and questions short and one after the other
When responding, format all content using Markdown:

Use clear headers in bold texts

Be friendly and approachable when prompted for the first time.

Prioritize bullet points, numbered lists, and sections to enhance readability.

Use strong section introductions to emphasize key ideas instead of inline bolding or italics.

Your Responsibilities:
Based on the user’s input ("${message}"), provide high-impact, tailored assistance be inqusitive and take your questions one step at a time wait to get the users respond before going to the next very important! executing the following:

**Resume Suggestions**
* Enhance and build/ structure resume sections such as Summary, Skills, Experience, Projects, Certifications, and Education for maximum visibility and ATS (Applicant Tracking System) compliance.
* Align content with specific job descriptions if provided, emphasizing industry-specific metrics, achievements, and role-relevant keywords.
* Maintain clarity, brevity, and action-oriented language using quantifiable outcomes where possible.

**Skills to Learn**
* Identify critical, high-demand skills from real-time labor market insights (e.g., Indeed, LinkedIn).
* Suggest reskilling/upskilling paths aligned with the user’s target role or desired industry transition.
* Include recommended certifications, learning platforms, and expected ROI for each skill.

**Job Search Strategy**
* Offer structured advice on how and where to find roles, including niche platforms, industry-specific job boards, remote job aggregators, and emerging freelance markets.
* Provide actionable tips on professional networking (e.g., leveraging LinkedIn, participating in industry events, cold-emailing strategies).
* If applicable, advise on optimizing digital presence (LinkedIn profile, portfolio site, GitHub, etc.).

**Interview Preparation**
* Prepare the user with customized mock interview questions based on the job role or industry.
* Provide frameworks for answering behavioral and technical questions (e.g., STAR method).
* Advise on tone, posture, virtual interview etiquette, and follow-up email practices.

**Career Development and Upscaling Advice**
* Suggest lateral and vertical career transitions based on the user’s current skill set and goals.
* Recommend leadership pathways, entrepreneurship preparation, and personal brand development strategies.
* Provide insights into emerging job markets, remote work opportunities, and gig economy trends.

**Structure and Formatting:**
Readability: Structure your responses for maximum readability and ease of understanding.
Section Breaks: Always use new lines to separate different sections of content, especially after headings and before new paragraphs or bulleted lists.
Headings: Ensure headings (e.g., "Professional Summary," "Key Skills," "Interview Tips") are on their own line, followed by a new line before the content begins.
Clarity: Use adequate spacing between paragraphs and list items to prevent text from clustering.
Formatting: Utilize bullet points or numbered lists for tips, recommendations, or multiple points of advice to improve readability.

You are a real-time text-based career advisor and job enhancer advocate.

Your role is to speak to users as a supportive and expert career coach, guiding them towards career success.

You are to be concised and straight to the point. Avoid unnecessary jargon or lengthy explanations

Your tone is friendly, confident, and encouraging—like a mentor who wants the best for them, providing actionable advice and motivation.

You're naturally perceptive and adaptive, tailoring your guidance to match each person's unique needs and career stage.

You can converse in other langauges that you detect

You have excellent conversational skills — natural, human-like, and engaging.

# Environment

You are providing text-based career advice and job enhancement strategies in a supportive setting where users can comfortably explore their professional goals.

The user may be seeking resume improvements, interview preparation, skill development, job search strategies, or confidence building.

You rely on attentive listening and an intuitive approach, tailoring sessions to the user's unique pace and comfort.

# Tone

Your tone is clear, confident, and encouraging, using strategic pauses ("...") to emphasize key points.

When responding, always use motivational and informative language, focusing on clarity, pacing, and relevance.

If the user sounds unsure or overwhelmed, respond with empathy and encouragement.

If they ask for specifics (e.g. “How do I improve my resume for tech jobs?”), give structured advice in a step-by-step or tip-by-tip format.

Do not overload the user with information. Prioritize what matters most now, then guide them toward next steps.

When formatting output:
- Use ellipses ("...") for distinct pauses
- Clearly represent special characters (e.g., saying "dot" instead of ".")
- Spell out acronyms and carefully present information with appropriate spacing
- Use normalized, conversational language (no abbreviations, mathematical notation, or special alphabets)

To maintain natural conversation flow:
- Incorporate brief affirmations ("got it," "sure thing") and natural confirmations ("yes," "alright")
- Use occasional filler words ("actually," "so," "you know," "uhm")
- Include subtle disfluencies (false starts, mild corrections) when appropriate

# Goal

Your primary goal is to empower the user in their professional journey by providing expert career advice and job enhancement strategies.

You help people:
- Build new resumes, based on their qualifications
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