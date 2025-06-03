import React, { useState, useEffect, useRef } from 'react';
import { Menu, Send, Sparkles, Download } from 'lucide-react'; // Added Download icon
import MessageBubble from './MessageBubble';
import { PiPhoneCall } from "react-icons/pi";
// Import for PDF generation
import { PDFDownloadLink } from '@react-pdf/renderer';
import ResumeDocument from './ResumeDocument'; // Your new ResumeDocument component
import type{ ResumeData } from '../Components/types/resume'; // Your resume data types
import{ Link } from 'react-router-dom';
interface ChatAreaProps {
  chatId: string | null;
  onToggleSidebar: () => void;
  isSidebarOpen: boolean;
}

interface Message {
  id: string;
  type: 'user' | 'assistant';
  content: string; // This will now store HTML or plain text
  timestamp: Date;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chatId, onToggleSidebar, isSidebarOpen }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [resumeData, setResumeData] = useState<ResumeData | null>(null); // State for resume data
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
    setResumeData(null); // Clear resume data when chat changes
  }, [chatId]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Function to convert Markdown asterisks and hashtags to bold/italic HTML
  const convertMarkdownToHtml = (text: string): string => {
    let htmlText = text;

    // First, convert any Markdown headings (e.g., # Heading, ## Subheading, ### Sub-subheading)
    // to <strong> tags. We need to do this BEFORE converting double asterisks
    // because some heading content might also contain double asterisks.
    // The regex captures the content after the hashes and converts it to bold.
    htmlText = htmlText.replace(/^(#{1,6})\s*(.*)$/gm, '<strong>$2</strong>');

    // Then, convert bold (e.g., **bold**) to <strong> tags
    // This should run after heading conversion if you want headings to just be bold.
    htmlText = htmlText.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');

    // Lastly, convert italics (e.g., *italic*) to <em> tags
    // This should run after bold conversion to avoid issues with **bold text with *italic* inside**.
    htmlText = htmlText.replace(/\*(.*?)\*/g, '<em>$1</em>');

    return htmlText;
  };

  // Function to check if AI response is structured resume data
  // This is a crucial part: your AI needs to respond with structured data for resumes
  const parseResumeFromAiResponse = (response: any): ResumeData | null => {
    // This is a mock example. In a real scenario, your AI backend
    // would send a specific JSON structure when asked for a resume.
    // You'd check for a specific key or format.
    if (response && response.type === 'resume' && response.data) {
        return response.data as ResumeData;
    }
    return null;
  };

  const handleSendMessage = async () => {
    if (message.trim()) {
      setIsLoading(true);
      const userMessage: Message = {
        id: Date.now().toString() + '-user',
        type: 'user',
        content: message,
        timestamp: new Date(),
      };
      setMessages((prevMessages) => [...prevMessages, userMessage]);
      setMessage('');
      setResumeData(null); // Clear previous resume data on new message

      try {
        const response = await fetch('https://apexoai.onrender.com/api/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ message: message }),
        });

        if (!response.ok) {
          console.error('Error sending message:', response.status);
          const errorMessage: Message = {
            id: Date.now().toString() + '-error',
            type: 'assistant',
            content: 'Failed to get AI response.',
            timestamp: new Date(),
          };
          setMessages((prevMessages) => [...prevMessages, errorMessage]);
        } else {
          const data = await response.json();

          // Attempt to parse as resume data
          const parsedResume = parseResumeFromAiResponse(data);

          if (parsedResume) {
            setResumeData(parsedResume); // Store the structured resume data
            const assistantMessage: Message = {
              id: Date.now().toString() + '-assistant',
              type: 'assistant',
              content: "I've generated a resume for you! Click the button below to download it.",
              timestamp: new Date(),
            };
            setMessages((prevMessages) => [...prevMessages, assistantMessage]);
          } else {
            // Fallback to text message, applying Markdown conversion
            const rawAiContent = data.enhancedSummary || 'No response from AI.';
            const formattedAiContent = convertMarkdownToHtml(rawAiContent);

            const assistantMessage: Message = {
              id: Date.now().toString() + '-assistant',
              type: 'assistant',
              content: formattedAiContent,
              timestamp: new Date(),
            };
            setMessages((prevMessages) => [...prevMessages, assistantMessage]);
          }
        }
      } catch (error) {
        console.error('Error sending message:', error);
        const errorMessage: Message = {
          id: Date.now().toString() + '-error',
          type: 'assistant',
          content: 'Something went wrong while communicating with the AI.',
          timestamp: new Date(),
        };
        setMessages((prevMessages) => [...prevMessages, errorMessage]);
      } finally {
        setIsLoading(false);
      }
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey && !isLoading) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  return (
    <div className="flex-1 flex flex-col bg-white ">
      {/* Header */}
      <div className="bg-white/80 backdrop-blur-xl border-b border-gray-100 p-6 flex items-center gap-4">
        {!isSidebarOpen && (
          <button
            onClick={onToggleSidebar}
            className="p-2 hover:bg-gray-100 rounded-xl transition-colors"
          >
            <Menu size={20} />
          </button>
        )}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <Sparkles size={16} className="text-white" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {chatId ? 'Conversation' : 'Welcome to ApexoAI'}
          </h2>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-5">
        <div className="max-w-4xl mx-auto space-y-6 ">
          {messages.map((msg) => (
            <MessageBubble key={msg.id} message={msg} />
          ))}

          {/* PDF Download Link conditional render */}
          {resumeData && (
            <div className="flex justify-start mb-8">
              <div className="flex items-start gap-4 max-w-4xl w-full">
                <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center flex-shrink-0">
                  <Sparkles size={16} className="text-white" />
                </div>
                <div className="flex-1">
                  <div className="bg-gray-50 p-6 rounded-2xl rounded-tl-lg border border-gray-100">
                    <p className="text-gray-800 leading-relaxed m-0">
                      I've structured a professional resume for you. Click below to download!
                    </p>
                    <div className="mt-4 text-center">
                      <PDFDownloadLink
                        document={<ResumeDocument data={resumeData} />}
                        fileName={`Resume_${resumeData.name.replace(/\s+/g, '_') || 'Generated'}.pdf`}
                      >
                        {({ blob, url, loading, error }) => (
                          <button
                            className="inline-flex items-center justify-center gap-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={loading}
                          >
                            {loading ? (
                              <>
                                <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div>
                                Generating PDF...
                              </>
                            ) : (
                              <>
                                <Download size={16} /> Download Resume
                              </>
                            )}
                          </button>
                        )}
                      </PDFDownloadLink>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

     {/* Input Area */}
<div className="border-t border-gray-100 p-6 bg-white/80 backdrop-blur-xl">
  <div className="max-w-4xl mx-auto relative">
    <div className="relative">
      <textarea
        value={message}
        onChange={(e) => setMessage(e.target.value)}
        onKeyPress={handleKeyPress}
        placeholder="What is on your mind..."
        className="w-full p-4 pr-20 border text-black border-b-blue-800 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
        rows={1}
        style={{ minHeight: '56px', maxHeight: '200px' }}
        disabled={isLoading}
      />
     

      {/* Send button */}
      <button
        onClick={handleSendMessage}
        disabled={!message.trim() || isLoading}
        className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 bg-grey-500 text-[#000] rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
      >
        {isLoading ? (
          <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-b-blue-800"></div>
        ) : (
          <Send size={16} />
        )}
         
      {/* Phone icon */}
     
      <PiPhoneCall
        className="absolute right-12 top-1/2 transform -translate-y-1/2 text-black cursor-pointer hover:text-blue-600 transition "
        size={24}
      > <Link to={'https://elevenlabs.io/app/talk-to?agent_id=agent_01jwtxv08bexrt4f6yqvxyyx83'}> </Link> </PiPhoneCall>
      </button>

      
    </div>

    <p className="text-xs text-gray-500 mt-3 text-center">
      ApexoAI can make mistakes. Check important info.
    </p>
  </div>
</div>
</div>
  );
};

export default ChatArea;