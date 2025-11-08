import React, { useState, useRef, useEffect } from 'react';
import { Search, Image, Music, MoreVertical, Plus } from 'lucide-react';
import 'react-toastify/dist/ReactToastify.css';
import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ChatProvider, useChat } from '../contexts/ChatContext';

// Helper Components
const FeatureCard = ({ icon: Icon, title, description, actionLabel }: { icon: any, title: string, description: string, actionLabel: string }) => (
  <div className="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm hover:shadow-md transition-all">
    <Icon className="w-8 h-8 text-blue-500 mb-4" />
    <h3 className="text-lg font-semibold mb-2">{title}</h3>
    <p className="text-gray-600 dark:text-gray-300 mb-4 text-sm">{description}</p>
    <span className="text-sm text-blue-500 font-medium">{actionLabel}</span>
  </div>
);

const CommandPalette = () => (
  <div className="flex items-center gap-1.5 text-xs text-gray-500">
    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">⌘</kbd>
    <span>+</span>
    <kbd className="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded">K</kbd>
    <span className="ml-1">to search</span>
  </div>
);

// Utils
const convertMarkdownToHtml = (text: string) =>
  text.replace(/^(#{1,6})\s*(.*)$/gm, '<strong class="text-lg block mb-2">$2</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');

const formatDate = (date?: string | Date) => {
  if (!date) return '';
  const d = new Date(date);
  const diff = Date.now() - d.getTime();
  const mins = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1) return 'Just now';
  if (mins < 60) return `${mins}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return d.toLocaleDateString();
};

const ChatbotUI = () => {
  const { user, isLoadingUser } = useAuth();
  const { messages, sendMessage } = useChat();

  const [query, setQuery] = useState('');
  const [isDarkMode, setIsDarkMode] = useState(false);

  const chatAreaRef = useRef<HTMLDivElement | null>(null);

  // Scroll to bottom on new messages
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTo({ top: chatAreaRef.current.scrollHeight, behavior: 'smooth' });
    }
  }, [messages]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (query.trim()) {
        sendMessage(query.trim());
        setQuery('');
      }
    }
  };

  if (isLoadingUser) {
    return <div className="flex items-center justify-center h-screen bg-gray-900 text-white">Checking authentication...</div>;
  }

  return (
    <div className="h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-8">
      <div className="max-w-7xl mx-auto bg-white dark:bg-gray-800 rounded-2xl shadow-xl h-full flex flex-col">
        {/* Header */}
        <div className="p-6 flex items-center justify-between border-b dark:border-gray-700">
          <div className="flex items-center gap-3">
            <img src="/src/assets/logo.png" alt="ApexoAI" className="h-8 w-8" />
            <span className="text-lg font-medium">Assistant v2.6</span>
          </div>
          <div className="flex items-center gap-4">
            <span className="text-sm font-medium">Daily Nixtio</span>
            <button className="px-4 py-1.5 bg-black text-white text-sm font-medium rounded-full">Upgrade</button>
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-8" ref={chatAreaRef}>
          {/* Welcome Section */}
          <div className="mb-12">
            <h1 className="text-4xl font-bold mb-2">Hi Nixtio, Ready to <br />Achieve Great Things?</h1>
            
            <div className="absolute top-24 right-12">
              <div className="relative">
                <img src="/robot-avatar.png" alt="AI Assistant" className="w-32 h-32" />
                <div className="absolute -top-8 right-0 bg-white dark:bg-gray-700 rounded-2xl p-3 shadow-lg">
                  <p className="text-sm">Hey there! 👋<br />Need a boost?</p>
                </div>
              </div>
            </div>
          </div>

          {/* Feature Cards Grid */}
          <div className="grid grid-cols-3 gap-6 mb-8">
            <FeatureCard
              icon={Image}
              title="Contribute ideas"
              description="Work together seamlessly with your team on documents, projects and more."
              actionLabel="Fast Start"
            />
            <FeatureCard
              icon={Search}
              title="Stay connected"
              description="Connect with teammates, share updates, and collaborate efficiently."
              actionLabel="Collaborate with Team"
            />
            <FeatureCard
              icon={Music}
              title="Organize work"
              description="Keep your tasks, documents, and conversations organized and accessible."
              actionLabel="Planning"
            />
          </div>

          {/* Messages */}
          {messages.length > 0 && (
            <div className="max-w-4xl mx-auto mt-8">
              <div className="space-y-6">
                {messages.map(msg => (
                  <div key={msg.id} className={`flex ${msg.role==='user'?'justify-end':'justify-start'}`}>
                    <div className={`flex items-start gap-3 max-w-3xl ${msg.role==='user'?'flex-row-reverse':''}`}>
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role==='user'?'bg-blue-600':'bg-gray-700'}`}>
                        {msg.role==='user' ? (
                          <span className="text-white text-sm font-medium">{user?.name.charAt(0)}</span>
                        ) : (
                          <img src="/robot-avatar.png" alt="AI" className="w-6 h-6" />
                        )}
                      </div>
                      <div className={`flex-1 ${msg.role==='user'?'text-right':''}`}>
                        <div
                          className={`p-4 rounded-2xl ${msg.role==='user' ? 'rounded-tr-lg bg-blue-600 text-white' : 'rounded-tl-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700'}`}
                          dangerouslySetInnerHTML={{ __html: convertMarkdownToHtml(msg.content) }}
                        />
                        <span className="text-xs text-gray-500 dark:text-gray-400 mt-1 block">{formatDate(msg.createdAt)}</span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Command Bar */}
          <div className="relative mt-8">
            <div className="max-w-3xl mx-auto bg-white dark:bg-gray-800 rounded-xl shadow-sm border dark:border-gray-700 p-4">
              <div className="flex items-center gap-2 mb-4">
                <Plus className="w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder='Example: "Explain quantum computing in simple terms"'
                  className="flex-1 bg-transparent border-none outline-none text-sm"
                />
              </div>
              
              <div className="flex items-center gap-3 border-t dark:border-gray-700 pt-4">
                <button onClick={() => { if(query.trim()) { sendMessage(query.trim()); setQuery(''); } }} className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Deep Research
                </button>
                <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg flex items-center gap-2">
                  <Image className="w-4 h-4" />
                  Make an Image
                </button>
                <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg flex items-center gap-2">
                  <Search className="w-4 h-4" />
                  Search
                </button>
                <button className="px-4 py-2 bg-gray-900 text-white text-sm rounded-lg flex items-center gap-2">
                  <Music className="w-4 h-4" />
                  Create music
                </button>
                <button className="p-2 text-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg">
                  <MoreVertical className="w-4 h-4" />
                </button>
              </div>
            </div>
            
            {/* Pro Plan Label */}
            <div className="mt-4 text-center">
              <div className="inline-flex items-center gap-2">
                <CommandPalette />
                <span className="text-gray-300">|</span>
                <span className="text-xs text-gray-500 dark:text-gray-400">Unlock more with</span>
                <button className="text-xs text-blue-500 font-medium hover:underline">Pro Plan</button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function ChatbotWrapper() {
  return (
    <AuthProvider>
      <ChatProvider>
        <ChatbotUI />
      </ChatProvider>
    </AuthProvider>
  );
}