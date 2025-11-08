// models/ChatSession.model.ts
import mongoose from "mongoose";

if (mongoose.models.ChatSession) {
  delete mongoose.models.ChatSession;
}

const messageSchema = new mongoose.Schema(
  {
    role: { type: String, enum: ["user", "assistant", "system"], required: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now },
    metadata: {
      model: String,
      totalTokens: Number,
      promptTokens: Number,
      completionTokens: Number
    }
  },
  { _id: true }
);

const chatSessionSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
    title: { type: String, default: "New Conversation" },
    messages: [messageSchema],
    context: {
      type: { type: String, enum: ["general", "resume_building", "cover_letter", "job_search", "interview_prep", "career_advice"], default: "general" },
      data: { type: mongoose.Schema.Types.Mixed }
    },
    status: { type: String, enum: ["active", "archived", "deleted"], default: "active" },
    metadata: {
      lastMessageAt: { type: Date },
      totalMessages: { type: Number, default: 0 },
      totalTokens: { type: Number, default: 0 }
    }
  },
  { 
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
  }
);

// Indexes
chatSessionSchema.index({ userId: 1, status: 1, 'metadata.lastMessageAt': -1 });
chatSessionSchema.index({ userId: 1, title: "text", "messages.content": "text" });

// Virtual: AI context (last N messages)
chatSessionSchema.methods.getAIContext = function(limit = 10) {
  return this.messages
    .slice(-limit)
    .map(m => ({ role: m.role, content: m.content }));
};

// Add message helper
chatSessionSchema.methods.addMessage = async function(role, content, metadata = {}) {
  this.messages.push({ role, content, metadata });
  this.metadata.lastMessageAt = new Date();
  this.metadata.totalMessages += 1;
  if (metadata.totalTokens) {
    this.metadata.totalTokens += metadata.totalTokens;
  }
  return this.save();
};

const ChatSession = mongoose.models.ChatSession || mongoose.model("ChatSession", chatSessionSchema);
export default ChatSession;