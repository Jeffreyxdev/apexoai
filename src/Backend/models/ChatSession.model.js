import mongoose from "mongoose";

if (mongoose.models.ChatSession) {
  delete mongoose.models.ChatSession;
}

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
  },
  { _id: false }
);

const chatSessionSchema = new mongoose.Schema(
  {
    user: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    sessionTitle: { type: String, default: "Untitled Chat" },
    messages: [messageSchema],
    contextType: {
      type: String,
      enum: ["resume", "coverLetter", "jobSearch", "general"],
      default: "general",
    },
    aiModel: { type: String, default: "gemini-1.5-pro" },
    lastActivity: { type: Date, default: Date.now },
  },
  { timestamps: true }
);

const ChatSession = mongoose.models.ChatSession || mongoose.model("ChatSession", chatSessionSchema);
export default ChatSession;
