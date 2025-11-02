import { GoogleGenerativeAI } from "@google/generative-ai";

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

const aiService = {
  async getResponse(message, history = []) {
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-1.5-pro" });

      // Format chat history into a single prompt (Gemini doesn't use role-based messages the same way OpenAI does)
      const historyText = history
        .map((h) => `${h.role === "user" ? "User" : "AI"}: ${h.content}`)
        .join("\n");

      const prompt = `${historyText}\nUser: ${message}\nAI:`;

      const result = await model.generateContent(prompt);
      const response = await result.response.text();

      return response.trim();
    } catch (error) {
      console.error("Gemini Service Error:", error);
      throw new Error("Gemini AI request failed");
    }
  },
};

export default aiService;
