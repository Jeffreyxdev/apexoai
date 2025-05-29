import React, { useState } from 'react';
import axios from 'axios';


// --- Interfaces for Data Structure ---
interface ExperienceEntry {
  id: string; // For React key
  jobTitle: string;
  company: string;
  dates: string;
  description: string;
}

interface EducationEntry {
  id: string; // For React key
  degree: string;
  institution: string;
  dates: string;
}

interface ResumeData {
  name: string;
  email: string;
  phone: string;
  linkedin: string;
  github: string;
  summary: string;
  experience: ExperienceEntry[];
  education: EducationEntry[];
  skills: string; // Comma-separated
}

const initialResumeData: ResumeData = {
  name: '',
  email: '',
  phone: '',
  linkedin: '',
  github: '',
  summary: '',
  experience: [{ id: Date.now().toString(), jobTitle: '', company: '', dates: '', description: '' }],
  education: [{ id: (Date.now() + 1).toString(), degree: '', institution: '', dates: '' }],
  skills: '',
};

const ResumeForm: React.FC = () => {
  const [formData, setFormData] = useState<ResumeData>(initialResumeData);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  // --- Experience Handlers ---
  const handleExperienceChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedExperience = formData.experience.map((item, i) =>
      i === index ? { ...item, [name]: value } : item
    );
    setFormData(prev => ({ ...prev, experience: updatedExperience }));
  };

  const addExperience = () => {
    setFormData(prev => ({
      ...prev,
      experience: [...prev.experience, { id: Date.now().toString(), jobTitle: '', company: '', dates: '', description: '' }],
    }));
  };

  const removeExperience = (id: string) => {
    setFormData(prev => ({
      ...prev,
      experience: prev.experience.filter(item => item.id !== id),
    }));
  };

  // --- Education Handlers ---
  const handleEducationChange = (index: number, e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    const updatedEducation = formData.education.map((item, i) =>
      i === index ? { ...item, [name]: value } : item
    );
    setFormData(prev => ({ ...prev, education: updatedEducation }));
  };

  const addEducation = () => {
    setFormData(prev => ({
      ...prev,
      education: [...prev.education, { id: Date.now().toString(), degree: '', institution: '', dates: '' }],
    }));
  };

  const removeEducation = (id: string) => {
    setFormData(prev => ({
      ...prev,
      education: prev.education.filter(item => item.id !== id),
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);

    // Filter out empty entries and remove 'id' property before sending to backend
    const payload = {
        ...formData,
        experience: formData.experience
            .filter(exp => exp.jobTitle || exp.company || exp.description)
            .map(({ id, ...rest }) => rest), // Remove id
        education: formData.education
            .filter(edu => edu.degree || edu.institution)
            .map(({ id, ...rest }) => rest), // Remove id
    };

    try {
      // If using Vite proxy, '/api/generate-resume' is correct.
      // Otherwise, use full URL: 'http://localhost:3001/api/generate-resume'
      const response = await axios.post('/api/generate-resume', payload, {
        responseType: 'blob', // Crucial for handling PDF file download
      });

      const file = new Blob([response.data], { type: 'application/pdf' });
      const fileURL = URL.createObjectURL(file);
      
      const link = document.createElement('a');
      link.href = fileURL;
      const safeName = (formData.name || 'resume').replace(/[^a-z0-9_.-]/gi, '_');
      link.setAttribute('download', `${safeName}.pdf`);
      document.body.appendChild(link);
      link.click();

      link.parentNode?.removeChild(link);
      URL.revokeObjectURL(fileURL);

    } catch (err: any) {
      console.error('Error generating resume:', err);
      let errorMessage = 'Failed to generate PDF. Please try again.';
      if (err.response && err.response.data) {
        // If the backend sends a JSON error with responseType: 'blob',
        // we need to parse the blob as text to get the message.
        if (err.response.data instanceof Blob && err.response.data.type === "application/json") {
            try {
                const errorJson = JSON.parse(await err.response.data.text());
                errorMessage = errorJson.message || errorMessage;
            } catch (parseError) { /* Could not parse error blob */ }
        } else if (typeof err.response.data === 'string') {
            errorMessage = err.response.data;
        }
      }
      setError(errorMessage);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="resume-form">
      <h2>Personal Information</h2>
      <label>Full Name:
        <input type="text" name="name" value={formData.name} onChange={handleChange} required />
      </label>
      <label>Email:
        <input type="email" name="email" value={formData.email} onChange={handleChange} required />
      </label>
      <label>Phone: <input type="tel" name="phone" value={formData.phone} onChange={handleChange} /></label>
      <label>LinkedIn: <input type="url" name="linkedin" value={formData.linkedin} onChange={handleChange} placeholder="https://linkedin.com/in/yourprofile" /></label>
      <label>GitHub: <input type="url" name="github" value={formData.github} onChange={handleChange} placeholder="https://github.com/yourusername" /></label>
      <label>Summary: <textarea name="summary" value={formData.summary} onChange={handleChange} rows={5}></textarea></label>

      <h2>Experience</h2>
      {formData.experience.map((exp, index) => (
        <div key={exp.id} className="form-section dynamic-section">
          <h4>Experience #{index + 1}</h4>
          <label>Job Title: <input type="text" name="jobTitle" value={exp.jobTitle} onChange={(e) => handleExperienceChange(index, e)} /></label>
          <label>Company: <input type="text" name="company" value={exp.company} onChange={(e) => handleExperienceChange(index, e)} /></label>
          <label>Dates: <input type="text" name="dates" value={exp.dates} onChange={(e) => handleExperienceChange(index, e)} placeholder="e.g., Jan 2020 - Present" /></label>
          <label>Description (use ; for bullet points in PDF): <textarea name="description" value={exp.description} onChange={(e) => handleExperienceChange(index, e)} rows={3}></textarea></label>
          {formData.experience.length > 1 && (
            <button type="button" onClick={() => removeExperience(exp.id)} className="remove-btn">Remove Experience</button>
          )}
        </div>
      ))}
      <button type="button" onClick={addExperience} className="add-btn">Add Experience</button>

      <h2>Education</h2>
      {formData.education.map((edu, index) => (
        <div key={edu.id} className="form-section dynamic-section">
          <h4>Education #{index + 1}</h4>
          <label>Degree/Certificate: <input type="text" name="degree" value={edu.degree} onChange={(e) => handleEducationChange(index, e)} /></label>
          <label>Institution: <input type="text" name="institution" value={edu.institution} onChange={(e) => handleEducationChange(index, e)} /></label>
          <label>Dates/Graduation Year: <input type="text" name="dates" value={edu.dates} onChange={(e) => handleEducationChange(index, e)} placeholder="e.g., May 2019" /></label>
          {formData.education.length > 1 && (
            <button type="button" onClick={() => removeEducation(edu.id)} className="remove-btn">Remove Education</button>
          )}
        </div>
      ))}
      <button type="button" onClick={addEducation} className="add-btn">Add Education</button>

      <h2>Skills</h2>
      <label>Skills (comma-separated):
        <input type="text" name="skills" value={formData.skills} onChange={handleChange} placeholder="e.g., JavaScript, React, Node.js, Project Management" />
      </label>

      {error && <p className="error-message">{error}</p>}
      <button type="submit" disabled={isLoading} className="submit-btn">
        {isLoading ? 'Generating PDF...' : 'Generate PDF Resume'}
      </button>
    </form>
  );
};

export default ResumeForm;