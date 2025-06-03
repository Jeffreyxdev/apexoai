// components/ResumeCanvasPreview.tsx
import React from 'react';
import type { ResumeData } from '../Components/types/resume';

interface Props {
  data: ResumeData;
}

const ResumeCanvasPreview: React.FC<Props> = ({ data }) => {
  return (
    <div className="bg-white shadow-md rounded-lg p-6 border max-w-2xl mx-auto text-left">
      <h1 className="text-2xl font-bold text-gray-800">{data.name}</h1>
      <p className="text-sm text-gray-600">{data.email} | {data.phone}</p>

      <section className="mt-4">
        <h2 className="text-lg font-semibold text-blue-700">Summary</h2>
        <p className="text-gray-700">{data.summary}</p>
      </section>

      <section className="mt-4">
        <h2 className="text-lg font-semibold text-blue-700">Experience</h2>
        {data.experience.map((exp, i) => (
          <div key={i} className="mt-2">
            <p className="font-bold text-gray-800">{exp.role} - {exp.company}</p>
            <p className="text-sm text-gray-600">{exp.duration}</p>
            <p className="text-gray-700">{exp.description}</p>
          </div>
        ))}
      </section>

      <section className="mt-4">
        <h2 className="text-lg font-semibold text-blue-700">Education</h2>
        {data.education.map((edu, i) => (
          <div key={i} className="mt-2">
            <p className="font-bold text-gray-800">{edu.degree} - {edu.school}</p>
            <p className="text-sm text-gray-600">{edu.year}</p>
          </div>
        ))}
      </section>

      <section className="mt-4">
        <h2 className="text-lg font-semibold text-blue-700">Skills</h2>
        <p className="text-gray-700">{data.skills.join(', ')}</p>
      </section>
    </div>
  );
};

export default ResumeCanvasPreview;
