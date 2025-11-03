import { Menu, Send, Sparkles, Plus, History, Settings, LogOut, CreditCard, User, ChevronDown, Trash2, Edit2, X } from 'lucide-react';
import { PiPhoneCall } from 'react-icons/pi';
import 'react-toastify/dist/ReactToastify.css';
import { toast } from 'react-toastify';

import { AuthProvider, useAuth } from '../contexts/AuthContext';
import { ChatProvider, useChat } from '../contexts/ChatContext';
import { useRef, useState, useEffect } from 'react';

const convertMarkdownToHtml = (text: string): string => {
  let html = text
    .replace(/^(#{1,6})\s*(.*)$/gm, '<strong class="text-lg block mb-2">$2</strong>')
    .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
    .replace(/\*(.*?)\*/g, '<em>$1</em>')
    .replace(/\n/g, '<br />');
  return html;
};

const formatDate = (date: string | Date | undefined) => {
  if (!date) return '';
  const d = new Date(date as string);
  const now = new Date();
  const diffMs = now.getTime() - d.getTime();
  const diffMins = Math.floor(diffMs / 60000);
  const diffHours = Math.floor(diffMs / 3600000);
  const diffDays = Math.floor(diffMs / 86400000);
  if (diffMins < 1) return 'Just now';
  if (diffMins < 60) return `${diffMins}m ago`;
  if (diffHours < 24) return `${diffHours}h ago`;
  if (diffDays < 7) return `${diffDays}d ago`;
  return d.toLocaleDateString();
};

// Presentation component that uses contexts
const ChatbotUI = () => {
  const { user, logout, isLoadingUser } = useAuth();
  const {
    sessions,
    currentSessionId,
    messages,
    isLoading,
    createSession,
    selectSession,
    updateSessionTitle,
    deleteSession,
    sendMessage,
  } = useChat();

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [inputValue, setInputValue] = useState('');

  const chatAreaRef = useRef<HTMLDivElement | null>(null);
  const userMenuRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (chatAreaRef.current) {
      setTimeout(() => {
        chatAreaRef.current?.scrollTo({ top: chatAreaRef.current.scrollHeight, behavior: 'smooth' });
      }, 50);
    }
  }, [messages, currentSessionId]);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) setShowUserMenu(false);
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!inputValue.trim()) return;
      sendMessage(inputValue.trim());
      setInputValue('');
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-gray-900 to-purple-900">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-white">Checking authentication...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`}>
        <div className="p-4 border-b border-gray-200">
          <button onClick={createSession} disabled={isLoading} className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition disabled:bg-gray-400">
            <Plus size={20} />
            <span className="font-medium">{isLoading ? 'Creating...' : 'New Chat'}</span>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <History size={14} />
            Recent Conversations
          </h3>

          {sessions.map((session) => (
            <div key={session._id} className={`group relative p-3 rounded-lg cursor-pointer transition ${currentSessionId === session._id ? 'bg-blue-50 border border-blue-200' : 'hover:bg-gray-100'}`}>
              {editingSessionId === session._id ? (
                <div className="flex items-center gap-2">
                  <input type="text" value={editTitle} onChange={(e) => setEditTitle(e.target.value)} onKeyDown={(e) => {
                    if (e.key === 'Enter') updateSessionTitle(session._id, editTitle);
                    if (e.key === 'Escape') setEditingSessionId(null);
                  }} className="flex-1 px-2 py-1 text-sm border rounded" autoFocus />
                  <button onClick={() => updateSessionTitle(session._id, editTitle)} className="p-1 text-green-600 hover:bg-green-50 rounded">✓</button>
                  <button onClick={() => setEditingSessionId(null)} className="p-1 text-red-600 hover:bg-red-50 rounded"><X size={14} /></button>
                </div>
              ) : (
                <>
                  <div onClick={() => selectSession(session._id)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1 flex-1">{session.title}</p>
                      <span className="text-xs text-gray-500 whitespace-nowrap">{formatDate(session.metadata.lastMessageAt)}</span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">{session.metadata.totalMessages} messages</p>
                  </div>

                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition flex gap-1 bg-gray-50 p-1 rounded-md">
                    <button onClick={(e) => { e.stopPropagation(); setEditingSessionId(session._id); setEditTitle(session.title); }} className="p-1 hover:bg-blue-100 rounded"><Edit2 size={14} className="text-blue-600" /></button>
                    <button onClick={(e) => { e.stopPropagation(); if (confirm('Are you sure you want to permanently delete this conversation?')) deleteSession(session._id); }} className="p-1 hover:bg-red-100 rounded"><Trash2 size={14} className="text-red-600" /></button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {user && (
          <div className="p-4 border-t border-gray-200 relative" ref={userMenuRef}>
            <button onClick={() => setShowUserMenu(!showUserMenu)} className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition">
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {user.profile?.avatar ? <img src={user.profile.avatar} alt={user.name} className="w-full h-full rounded-full" /> : <span className="text-white font-medium">{user.name.charAt(0)}</span>}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.plan} Plan</p>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden z-10">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500">AI Credits</p>
                  <p className="text-lg font-bold text-blue-600">{user.aiCredits}</p>
                </div>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"><User size={16} className="text-gray-600" /><span className="text-sm">Profile</span></button>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"><CreditCard size={16} className="text-gray-600" /><span className="text-sm">Upgrade Plan</span></button>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left"><Settings size={16} className="text-gray-600" /><span className="text-sm">Settings</span></button>
                <button onClick={logout} className="w-full flex items-center gap-3 p-3 hover:bg-red-50 transition text-left border-t border-gray-100"><LogOut size={16} className="text-red-600" /><span className="text-sm text-red-600">Logout</span></button>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="flex-1 flex flex-col">
        <div className="bg-white border-b border-gray-200 p-6 flex items-center gap-4">
          {!isSidebarOpen ? (
            <button onClick={() => setIsSidebarOpen(true)} className="p-2 hover:bg-gray-100 rounded-xl transition"><Menu size={20} /></button>
          ) : (
            <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-gray-100 rounded-xl transition"><X size={20} /></button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center"><Sparkles size={16} className="text-white" /></div>
            <h2 className="text-lg font-semibold text-gray-900">{currentSessionId ? sessions.find(s => s._id === currentSessionId)?.title || 'Conversation' : 'Welcome to ApexoAI'}</h2>
          </div>
        </div>

        <div ref={chatAreaRef} className="flex-1 overflow-y-auto p-6">
          <div className="max-w-4xl mx-auto space-y-6">
            {messages.length === 0 && !currentSessionId && (
              <div className="text-center py-12">
                <Sparkles className="w-16 h-16 mx-auto mb-4 text-gray-300" />
                <h3 className="text-2xl font-bold text-gray-900 mb-2">Start a conversation</h3>
                <p className="text-gray-500">Ask me anything about your career, resume, or job search!</p>
              </div>
            )}

            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`flex items-start gap-3 max-w-3xl ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${msg.role === 'user' ? 'bg-blue-600' : 'bg-gradient-to-br from-gray-700 to-gray-900'}`}>
                    {msg.role === 'user' ? <span className="text-white text-sm font-medium">{user?.name.charAt(0)}</span> : <Sparkles size={16} className="text-white" />}
                  </div>
                  <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div className={`p-4 rounded-2xl ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-tr-lg' : 'bg-gray-50 text-gray-800 rounded-tl-lg border border-gray-100'}`} dangerouslySetInnerHTML={{ __html: msg.role === 'assistant' ? convertMarkdownToHtml(msg.content) : msg.content }} />
                    <p className="text-xs text-gray-500 mt-1">{new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea value={inputValue} onChange={(e) => setInputValue(e.target.value)} onKeyDown={handleKeyDown} placeholder={currentSessionId ? "What's on your mind..." : 'Start a new chat to begin...'} className="w-full p-4 pr-24 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition" rows={1} style={{ minHeight: '56px', maxHeight: '200px' }} disabled={isLoading || !currentSessionId} />

              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                <a href="https://elevenlabs.io/app/talk-to?agent_id=agent_01jwtxv08bexrt4f6yqvxyyx83" target="_blank" rel="noopener noreferrer" className="p-2 text-gray-600 hover:text-blue-600 transition"><PiPhoneCall size={20} /></a>
                <button onClick={() => { if (inputValue.trim()) { sendMessage(inputValue.trim()); setInputValue(''); } }} disabled={!inputValue.trim() || isLoading || !currentSessionId} className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition">{isLoading ? <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div> : <Send size={16} />}</button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">ApexoAI can make mistakes. Check important info. {user && `• ${user.aiCredits} credits remaining`}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

// Wrap UI in providers so token and chat state are available
const ChatbotApp = () => (
  <AuthProvider>
    <ChatProvider>
      <ChatbotUI />
    </ChatProvider>
  </AuthProvider>
);

export default ChatbotApp;