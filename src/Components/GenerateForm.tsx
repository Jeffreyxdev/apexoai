'use client';

import { useState, useRef, useEffect } from 'react';
import { FaPaperclip, FaCopy } from 'react-icons/fa';
import { IoIosSend } from "react-icons/io";
import * as pdfjsLib from 'pdfjs-dist';
import pdfjsWorker from 'pdfjs-dist/build/pdf.worker?url';
import { toast, ToastContainer } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { BeatLoader } from 'react-spinners'; // Import BeatLoader

// Tell PDF.js where to find the worker.
if (typeof window !== 'undefined') {
  pdfjsLib.GlobalWorkerOptions.workerSrc = pdfjsWorker;
}

export default function ResumeChat() {
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false); // State for loading
  const bottomRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const sendMessage = async (messageToSend: string = input) => {
    if (!messageToSend.trim() || isLoading) return;

    setIsLoading(true);
    const userMessage = { role: 'user', content: messageToSend };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');

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
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || isLoading) return;

    setIsLoading(true);
    const reader = new FileReader();
    reader.onload = async () => {
      let fileContent = '';
      if (file.type === 'application/pdf') {
        try {
          const pdf = await pdfjsLib.getDocument(new Uint8Array(reader.result as ArrayBuffer)).promise;
          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const textContent = await page.getTextContent();
            const pageText = textContent.items.map((item: any) => item.str).join(' ');
            fileContent += pageText + '\n';
          }
        } catch (error) {
          console.error("Error reading PDF:", error);
          toast.error('Could not read PDF content.');
          setIsLoading(false);
          return;
        }
      } else {
        fileContent = reader.result as string;
      }
      await sendMessage(fileContent);
      setIsLoading(false);
    };

    if (file.type === 'application/pdf') {
      reader.readAsArrayBuffer(file);
    } else {
      reader.readAsText(file);
    }

    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  };

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast.success('Copied to clipboard!', {
      autoClose: 2000,
      style: {
        background: '#333',
        color: '#fff',
      },
    });
  };

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  return (
    <div className="bg-[#000000] min-h-[80vh] rounded-2xl p-6 shadow-lg max-w-3xl mx-auto flex flex-col-reverse justify-end">
      <div className="mt-4 rounded-[34px] border border-gray-700 bg-[#f3f3f3] p-3 flex items-center ">
        <button
          onClick={triggerFileUpload}
          className="text-gray-400 hover:text-gray-300 mr-3 focus:outline-none"
        >
          <FaPaperclip size={20} />
        </button>
        <input
          type="text"
          className="flex-1 bg-transparent text-black outline-none"
          placeholder="Ask to enhance your resume summary..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && sendMessage()}
          disabled={isLoading}
        />
        <button
          onClick={() => sendMessage()}
          className={`text-black sm rounded-xl hover:opacity-90 flex items-center ml-3 ${
            isLoading ? 'opacity-50 cursor-wait' : ''
          } `}
          disabled={isLoading}
        >
          {isLoading ? (
            <BeatLoader color="#000" size={8} loading={true} />
          ) : (
            <IoIosSend size={20} />
          )}
        </button>
        <input
          type="file"
          accept=".txt,.pdf,.doc,.docx"
          onChange={handleFileUpload}
          className="hidden"
          ref={fileInputRef}
        />
      </div>

      <div className="space-y-4 overflow-y-auto max-h-[70vh] scrollbar-hide flex-grow">
        {isLoading && messages.length === 0 && (
          <div className="text-black text-sm italic text-center mt-4">
            Apexo AI is generating a response...
          </div>
        )}
        {messages.map((msg, i) => (
          <div key={i} className="flex flex-col">
            {msg.role === 'assistant' && (
              <div className="text-xs text-gray-400 mb-1 self-start">Apexo AI</div>
            )}
            <div
              className={`p-4 rounded-xl max-w-[90%] ${
                msg.role === 'user' ? 'bg-[#ffffff] self-end' : 'bg-[#ececec] self-start'
              } relative`}
            >
              <p className="text-sm text-black whitespace-pre-wrap">{msg.content}</p>
              <button
                onClick={() => copyToClipboard(msg.content)}
                className="absolute bottom-1 right-1 text-gray-500 focus:outline-none p-1"
              >
                <FaCopy size={10} />
              </button>
            </div>
          </div>
        ))}
        <div ref={bottomRef} />
      </div>

      <ToastContainer position="bottom-center" />
    </div>
  );
}