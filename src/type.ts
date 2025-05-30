export interface ExperienceEntry {
    jobTitle: string;
    company: string;
    location: string;
    dates: string;
    responsibilities: string;
}

export interface EducationEntry {
    degree: string;
    school: string;
    gradYear: string;
    coursework: string;
}

export interface ProjectEntry {
    projectName: string;
    description: string;
    technologies: string;
    link: string;
}

export interface ResumeData {
    name: string;
    email: string;
    phone: string;
    linkedin: string;
    github: string;
    portfolio: string;
    summary: string;
    experience: ExperienceEntry[];
    education: EducationEntry[];
    skills: string; // Comma-separated
    projects: ProjectEntry[];
}

// Initial empty states for dynamic sections
export const initialExperienceEntry: ExperienceEntry = {
    jobTitle: '',
    company: '',
    location: '',
    dates: '',
    responsibilities: '',
};

export const initialEducationEntry: EducationEntry = {
    degree: '',
    school: '',
    gradYear: '',
    coursework: '',
};

export const initialProjectEntry: ProjectEntry = {
    projectName: '',
    description: '',
    technologies: '',
    link: '',
};

export const initialResumeData: ResumeData = {
    name: '',
    email: '',
    phone: '',
    linkedin: '',
    github: '',
    portfolio: '',
    summary: '',
    experience: [{ ...initialExperienceEntry }],
    education: [{ ...initialEducationEntry }],
    skills: '',
    projects: [{ ...initialProjectEntry }],
};