const { GoogleGenerativeAI } = require('@google/generative-ai');
require('dotenv').config();

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const model = genAI.getGenerativeModel({ model: 'gemini-pro' });

const generateResume = async ({ name, jobTitle, skills, experience, targetCompany }) => {
  const prompt = `
Generate a professional resume for ${name}, applying as a ${jobTitle} at ${targetCompany}.
Skills: ${skills.join(', ')}
Experience: ${experience}
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

const generateCoverLetter = async ({ name, jobTitle, skills, experience, targetCompany }) => {
  const prompt = `
Write a personalized cover letter for ${name} applying as a ${jobTitle} at ${targetCompany}.
Mention these skills: ${skills.join(', ')}
Mention this experience: ${experience}
`;

  const result = await model.generateContent(prompt);
  return result.response.text();
};

module.exports = { generateResume, generateCoverLetter };
