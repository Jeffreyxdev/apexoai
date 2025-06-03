import React, { useState } from 'react';
import axios from 'axios';

interface FormData {
  name: string;
  email: string;
  summary: string;
  experience: string;
  education: string;
  skills: string;
}

const ResumeForm: React.FC = () => {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    summary: '',
    experience: '',
    education: '',
    skills: ''
  });

  const [loading, setLoading] = useState(false);
  const [audioUrl, setAudioUrl] = useState<string | null>(null);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setAudioUrl(null);

    try {
      const response = await axios.post('/api/gemini-voice', { text: formData.summary });
      const blob = new Blob([response.data], { type: 'audio/mpeg' });
      const url = URL.createObjectURL(blob);
      setAudioUrl(url);
    } catch (error) {
      console.error('Error generating voice:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Apexo AI Resume Assistant</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input
          type="text"
          name="name"
          placeholder="Your Name"
          value={formData.name}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <input
          type="email"
          name="email"
          placeholder="Your Email"
          value={formData.email}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          required
        />
        <textarea
          name="summary"
          placeholder="Professional Summary"
          value={formData.summary}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          rows={3}
        />
        <textarea
          name="experience"
          placeholder="Work Experience"
          value={formData.experience}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          rows={3}
        />
        <textarea
          name="education"
          placeholder="Education"
          value={formData.education}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          rows={3}
        />
        <textarea
          name="skills"
          placeholder="Skills"
          value={formData.skills}
          onChange={handleChange}
          className="w-full p-2 border rounded"
          rows={2}
        />
        <button
          type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Generating...' : 'Generate Voice'}
        </button>
      </form>

      {audioUrl && (
        <div className="mt-6">
          <h2 className="text-lg font-semibold">AI Voice Response</h2>
          <audio controls src={audioUrl} className="w-full mt-2" />
        </div>
      )}
    </div>
  );
};

export default ResumeForm;
