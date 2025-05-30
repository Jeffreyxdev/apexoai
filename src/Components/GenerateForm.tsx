'use client';

import { useState, useRef, useEffect } from 'react';
import { FaReact, FaPaperclip } from 'react-icons/fa';
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';

// Tell PDF.js where to find the worker.
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export default function ResumeChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async (messageToSend: string = input) => {
    if (!messageToSend.trim()) return;

    const userMessage = { role: 'user', content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput(''); // Clear input after sending (whether typed or uploaded)

    try {
      const res = await fetch('http://localhost:3000/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: messageToSend }),
      });

      const data = await res.json();
      const aiMessage = { role: 'assistant', content: data.enhancedSummary };
      setMessages((prev) => [...prev, aiMessage]);
    } catch (error) {
      console.error('AI Error:', error);
      setMessages((prev) => [
        ...prev,
        { role: 'assistant', content: 'Something went wrong. Please try again.' },
      ]);
    }
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async () => {
      if (file.type === 'application/pdf') {
        try {
          const pdf = await pdfjsLib.getDocument(new Uint8Array(reader.result as ArrayBuffer)).promise;
          let fullText = '';
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fullText += pageText + '\n';
          }
          sendMessage(fullText);
        } catch (error) {
          console.error("Error reading PDF:", error);
          sendMessage('Could not read the content of the PDF.');
        }
      } else {
        reader.readAsText(file);
        reader.onloadend = () => {
          sendMessage(reader.result as string);
        };
      }
    };

    if (file.type === 'application/pdf') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }

    // Clear the file input so the same file can be uploaded again
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-[#121212] min-h-[80vh] rounded-2xl p-6 shadow-lg max-w-3xl mx-auto flex flex-col justify-between">
      <div className="space-y-4 overflow-y-auto max-h-[70vh] scrollbar-hide">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-4 rounded-xl max-w-[85%] ${
              msg.role === 'user' ? 'bg-[#1f1f1f] self-end' : 'bg-[#3a3a3a] self-start'
            }`}
          >
            <p className="text-sm text-white whitespace-pre-wrap">{msg.content}</p>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      {/* Input Area like Ask Gemini */}
      <div className="mt-4 rounded-lg border border-gray-700 bg-[#1a1a1a] p-3 flex items-center">
        <button
          onClick={triggerFileUpload}
          className="text-gray-400 hover:text-gray-300 mr-3 focus:outline-none"
        >
          <FaPaperclip size={20} />
        </button>
        <input
          type="text"
          className="flex-1 bg-transparent text-white outline-none"
          placeholder="Ask to enhance your resume summary..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
        />
        <button
          onClick={() => sendMessage()}
          className="bg-gradient-to-r from-[#6e34ff] to-[#a855f7] text-white px-4 py-2 rounded-xl hover:opacity-90 flex items-center gap-2 ml-3"
        >
          <FaReact />
          Send
        </button>
        <input
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
          ref={fileInputRef}
        />
      </div>
    </div>
  );
}