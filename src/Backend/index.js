const express = require('express');
const path = require('path');
const ejs = require('ejs');
const puppeteer = require('puppeteer');

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.set('view engine', 'ejs');
app.set('views', path.join(__dirname, 'views'));
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.urlencoded({ extended: true })); // To parse form data
app.use(express.json()); // To parse JSON data (if you plan to use it)

// Routes
app.get('/', (req, res) => {
    res.render('index');
});

app.post('/generate-resume', async (req, res) => {
    const resumeData = req.body; // This will contain all form data

    try {
        // 1. Render the EJS template with user data
        const htmlContent = await ejs.renderFile(
            path.join(__dirname, 'views', 'resume-template.ejs'),
            { data: resumeData } // Pass data as an object
        );

        // 2. Launch Puppeteer
        const browser = await puppeteer.launch({
            headless: true, // Use 'new' for newer versions, true for older
            args: ['--no-sandbox', '--disable-setuid-sandbox'] // Important for running in some environments (like Docker)
        });
        const page = await browser.newPage();

        // 3. Set content and generate PDF
        await page.setContent(htmlContent, { waitUntil: 'networkidle0' });

        // Optional: Add CSS from your public folder if not directly in template
        // await page.addStyleTag({ path: path.join(__dirname, 'public', 'css', 'style.css') });

        const pdfBuffer = await page.pdf({
            format: 'A4',
            printBackground: true, // Important for styles to be applied
            margin: {
                top: '20mm',
                right: '20mm',
                bottom: '20mm',
                left: '20mm'
            }
        });

        await browser.close();

        // 4. Send PDF to client
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', `attachment; filename=${resumeData.name || 'resume'}.pdf`);
        res.send(pdfBuffer);

    } catch (error) {
        console.error('Error generating PDF:', error);
        res.status(500).send('Error generating PDF. Check server logs.');
    }
});

app.listen(PORT, () => {
    console.log(`Server is running on http://localhost:${PORT}`);
});