import mongoose from "mongoose";

const experienceSchema = new mongoose.Schema({
  jobTitle: { type: String, required: true },
  company: { type: String, required: true },
  startDate: { type: String, required: true },
  endDate: { type: String },
  description: { type: String },
});

const educationSchema = new mongoose.Schema({
  school: { type: String, required: true },
  degree: { type: String },
  fieldOfStudy: { type: String },
  startDate: { type: String },
  endDate: { type: String },
});

const skillSchema = new mongoose.Schema({
  name: { type: String, required: true },
  level: { type: String, enum: ["beginner", "intermediate", "advanced"], default: "intermediate" },
});

const resumeSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },

    title: {
      type: String,
      default: "Untitled Resume",
    },

    summary: {
      type: String,
    },

    experiences: [experienceSchema],
    education: [educationSchema],
    skills: [skillSchema],

    // For AI-enhanced resumes
    aiGenerated: {
      type: Boolean,
      default: false,
    },

    // Optional AI prompt tracking
    aiPrompt: {
      type: String,
    },

    // Template for frontend rendering
    template: {
      type: String,
      enum: ["modern", "classic", "minimal", "dark"],
      default: "modern",
    },

    lastEdited: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

const Resume = mongoose.model("Resume", resumeSchema);

export default Resume;
