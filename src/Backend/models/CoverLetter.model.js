    import mongoose from "mongoose";

const coverLetterSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      default: "Untitled Cover Letter",
    },

    recipientName: {
      type: String,
    },

    recipientCompany: {
      type: String,
    },

    position: {
      type: String,
      required: true,
    },

    body: {
      type: String,
      required: true,
    },

    // For AI-generated or assisted letters
    aiGenerated: {
      type: Boolean,
      default: false,
    },

    aiPrompt: {
      type: String,
    },

    // Template name for frontend rendering
    template: {
      type: String,
      enum: ["modern", "classic", "minimal", "corporate"],
      default: "modern",
    },

    lastEdited: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const CoverLetter = mongoose.model("CoverLetter", coverLetterSchema);

export default CoverLetter;
