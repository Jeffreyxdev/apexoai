import React, { useState, useEffect } from 'react';
import { Plus, Settings, User, Search } from 'lucide-react';

interface ChatSidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  selectedChatId: string | null;
  onSelectChat: (chatId: string) => void;
}

interface ChatHistoryItem {
  id: string;
  title: string;
  timestamp: string;
}

const ChatSidebar: React.FC<ChatSidebarProps> = ({
  isOpen,
  selectedChatId,
  onSelectChat,
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [chatHistory, setChatHistory] = useState<ChatHistoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchChatHistory = async () => {
      setLoading(true);
      setError(null);
      try {
        const response = await fetch('https://apexoai.onrender.com/api/chats'); // Your backend endpoint to get chat history
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setChatHistory(data);
      } catch (e: any) {
        console.error("Could not fetch chat history:", e);
        setError("Failed to load chat history.");
      } finally {
        setLoading(false);
      }
    };

    fetchChatHistory();
  }, []); // Fetch only once on component mount

  const groupedChats = chatHistory.reduce((acc, chat) => {
    const date = new Date(chat.timestamp);
    const today = new Date();
    const yesterday = new Date();
    yesterday.setDate(today.getDate() - 1);

    let displayDate: string;
    if (date.toDateString() === today.toDateString()) {
      displayDate = 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      displayDate = 'Yesterday';
    } else {
      // Format as "YYYY-MM-DD" or a more user-friendly format
      displayDate = date.toLocaleDateString();
    }

    if (!acc[displayDate]) {
      acc[displayDate] = [];
    }
    acc[displayDate].push(chat);
    return acc;
  }, {} as Record<string, ChatHistoryItem[]>);

  if (!isOpen) return null;

  if (loading) {
    return <div className="w-80 p-6">Loading chat history...</div>;
  }

  if (error) {
    return <div className="w-80 p-6 text-red-500">{error}</div>;
  }

  return (
    <div className="w-80 bg-white/80 backdrop-blur-xl border-r border-gray-200/50 flex flex-col h-full">
      {/* Header */}
      <div className="p-6 border-b border-gray-100">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-xl font-semibold text-gray-900 tracking-tight">ApexoAI</h1>
        </div>

        <button className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-xl flex items-center justify-center gap-2 transition-all duration-200 shadow-sm hover:shadow-md font-medium">
          <Plus size={16} />
          New chat
        </button>
      </div>

      {/* Search */}
      <div className="p-6 border-b border-gray-100">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" size={16} />
          <input
            type="text"
            placeholder="Search conversations..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-gray-50 text-gray-900 pl-10 pr-4 py-3 rounded-xl border-0 focus:ring-2 focus:ring-blue-500 focus:bg-white transition-all duration-200"
          />
        </div>
        <button className="text-sm text-gray-500 mt-3 hover:text-gray-700 transition-colors">Clear all</button>
      </div>

      {/* Chat History */}
      <div className="flex-1 overflow-y-auto">
        {Object.entries(groupedChats).map(([timestamp, chats]) => (
          <div key={timestamp} className="p-6">
            <h3 className="text-xs text-gray-500 uppercase tracking-wider mb-4 font-medium">{timestamp}</h3>
            {chats.map((chat) => (
              <button
                key={chat.id}
                onClick={() => onSelectChat(chat.id)}
                className={`w-full text-left p-3 rounded-xl mb-2 hover:bg-gray-50 transition-all duration-200 group ${
                  selectedChatId === chat.id ? 'bg-blue-50 border border-blue-200' : ''
                }`}
              >
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-gray-300 rounded-full mt-2 group-hover:bg-blue-500 transition-colors"></div>
                  <span className="text-sm text-gray-700 line-clamp-2 leading-relaxed">{chat.title}</span>
                </div>
              </button>
            ))}
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="p-6 border-t border-gray-100">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
            <User size={16} className="text-white" />
          </div>
          <span className="text-sm font-medium text-gray-900">Andrew Nelson</span>
        </div>
        <button className="flex items-center gap-3 text-gray-600 hover:text-gray-900 transition-colors">
          <Settings size={16} />
          <span className="text-sm">Settings</span>
        </button>
      </div>
    </div>
  );
};

export default ChatSidebar;