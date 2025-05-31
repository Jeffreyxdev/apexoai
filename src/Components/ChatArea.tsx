import React, { useState, useEffect, useRef } from 'react';
import { Menu, Send, Sparkles } from 'lucide-react';
import MessageBubble from './MessageBubble';

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
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setMessages([]);
  }, [chatId]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // UPDATED: Function to convert Markdown asterisks and hashtags to bold/italic HTML
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
          const rawAiContent = data.enhancedSummary || 'No response from AI.';

          // --- APPLY MARKDOWN TO HTML CONVERSION HERE ---
          const formattedAiContent = convertMarkdownToHtml(rawAiContent); // Use the updated function
          // --- END MARKDOWN TO HTML CONVERSION ---

          const assistantMessage: Message = {
            id: Date.now().toString() + '-assistant',
            type: 'assistant',
            content: formattedAiContent, // Store the HTML content
            timestamp: new Date(),
          };
          setMessages((prevMessages) => [...prevMessages, assistantMessage]);
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
        </div>
      </div>

      {/* Input Area */}
      <div className="border-t border-gray-100 p-6 bg-white/80 backdrop-blur-xl">
        <div className="max-w-4xl mx-auto relative">
          <textarea
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="What is on your mind..."
            className="w-full p-4 pr-14 border text-black border-b-blue-800 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
            rows={1}
            style={{ minHeight: '56px', maxHeight: '200px' }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 bg-grey-500 text-[#000] rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-b-blue-800"></div> : <Send size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          ApaxoAI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};

export default ChatArea;