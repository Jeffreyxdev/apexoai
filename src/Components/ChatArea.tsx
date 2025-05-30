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
  content: string;
  timestamp: Date;
}

const ChatArea: React.FC<ChatAreaProps> = ({ chatId, onToggleSidebar, isSidebarOpen }) => {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatAreaRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // In a real application, you would fetch the message history
    // for the current chatId here. For this example, we'll just
    // clear the messages when the chatId changes.
    setMessages([]);
  }, [chatId]);

  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

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
          body: JSON.stringify({ message: message }), // Sending just the message to your current backend
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
          const assistantMessage: Message = {
            id: Date.now().toString() + '-assistant',
            type: 'assistant',
            content: data.enhancedSummary || 'No response from AI.', // Assuming 'enhancedSummary' is the key in your backend response
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
    <div className="flex-1 flex flex-col bg-white">
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
            <Sparkles size={16} className="text-black" />
          </div>
          <h2 className="text-lg font-semibold text-gray-900">
            {chatId ? 'Conversation' : 'Welcome to ApexoAI'}
          </h2>
        </div>
      </div>

      {/* Messages Area */}
      <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-6">
        <div className="max-w-4xl mx-auto space-y-6">
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
            className="w-full p-4 pr-14 border border-gray-200 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition-all duration-200"
            rows={1}
            style={{ minHeight: '56px', maxHeight: '200px' }}
            disabled={isLoading}
          />
          <button
            onClick={handleSendMessage}
            disabled={!message.trim() || isLoading}
            className={`absolute right-3 top-1/2 transform -translate-y-1/2 p-2.5 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition-all duration-200 shadow-sm hover:shadow-md ${isLoading ? 'opacity-50 cursor-wait' : ''}`}
          >
            {isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-b-2 border-white"></div> : <Send size={16} />}
          </button>
        </div>
        <p className="text-xs text-gray-500 mt-3 text-center">
          ApexoAI can make mistakes. Check important info.
        </p>
      </div>
    </div>
  );
};

export default ChatArea;