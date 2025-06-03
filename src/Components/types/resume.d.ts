// src/types/resume.d.ts (or you can put this directly in ResumeDocument.tsx)

export interface ExperienceItem {
  title: string;
  company: string;
  duration: string;
  description: string;
  role:string;
  
}

export interface EducationItem {
  degree: string;
  institution: string;
  year: string;
  school:string;
}

export interface ResumeData {
  name: string;
  email: string;
  phone?: string; // Optional
  linkedin?: string; // Optional
  github?: string; // Optional
  summary: string;
  experience: ExperienceItem[];
  education: EducationItem[];
  skills: string[];
  projects?: { name: string; description: string; link?: string }[]; // Optional
}