import React, { useState, useEffect, useRef } from 'react';
import { Menu, Send, Sparkles,  Plus, History, Settings, LogOut, CreditCard, User, ChevronDown, Trash2, Archive, Edit2, X } from 'lucide-react';
import { PiPhoneCall } from "react-icons/pi";

// API Configuration
const API_BASE_URL = process.env.REACT_APP_API_URL || 'https://apexoai.onrender.com/api';
const FRONTEND_URL = process.env.REACT_APP_FRONTEND_URL || 'http://localhost:3000';

interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: {
    tokens?: number;
    model?: string;
  };
}

interface ChatSession {
  _id: string;
  title: string;
  metadata: {
    lastMessageAt: Date;
    totalMessages: number;
  };
  createdAt: Date;
}

interface UserData {
  id: string;
  name: string;
  email: string;
  plan: string;
  aiCredits: number;
  profile?: {
    avatar?: string;
  };
}

const ChatbotApp = () => {
  // State Management
  const [user, setUser] = useState<UserData | null>(null);
  const [token, setToken] = useState<string | null>(localStorage.getItem('apexoai_token'));
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [message, setMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const [isStreaming, setIsStreaming] = useState(false);
  const [editingSessionId, setEditingSessionId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  
  const chatAreaRef = useRef<HTMLDivElement>(null);
  const userMenuRef = useRef<HTMLDivElement>(null);
  const streamControllerRef = useRef<AbortController | null>(null);

  // Fetch user data on mount
  useEffect(() => {
    if (token) {
      fetchUserData();
      fetchChatSessions();
    }
  }, [token]);

  // Load messages when session changes
  useEffect(() => {
    if (currentSessionId) {
      fetchSessionMessages(currentSessionId);
    } else {
      setMessages([]);
    }
  }, [currentSessionId]);

  // Auto-scroll to bottom
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // Close user menu on outside click
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (userMenuRef.current && !userMenuRef.current.contains(event.target as Node)) {
        setShowUserMenu(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // API Functions
  const fetchUserData = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/auth/me`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        handleLogout();
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    }
  };

  const fetchChatSessions = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/sessions?limit=50`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setSessions(data.sessions);
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
    }
  };

  const fetchSessionMessages = async (sessionId: string) => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setMessages(data.session.messages.map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        })));
      }
    } catch (error) {
      console.error('Error fetching messages:', error);
    }
  };

  const createNewSession = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/chat/sessions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          title: 'New Conversation',
          context: { type: 'general' }
        })
      });
      
      if (response.ok) {
        const data = await response.json();
        setCurrentSessionId(data.session._id);
        await fetchChatSessions();
      }
    } catch (error) {
      console.error('Error creating session:', error);
    }
  };

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    try {
      await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ title: newTitle })
      });
      
      await fetchChatSessions();
      setEditingSessionId(null);
    } catch (error) {
      console.error('Error updating session:', error);
    }
  };

  const deleteSession = async (sessionId: string) => {
    try {
      await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      });
      
      if (currentSessionId === sessionId) {
        setCurrentSessionId(null);
      }
      await fetchChatSessions();
    } catch (error) {
      console.error('Error deleting session:', error);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() || isLoading) return;

    // Create or get session
    let sessionId = currentSessionId;
    if (!sessionId) {
      await createNewSession();
      // Wait for session to be created
      await new Promise(resolve => setTimeout(resolve, 500));
      sessionId = currentSessionId;
    }

    if (!sessionId) {
      alert('Failed to create chat session');
      return;
    }

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: message,
      timestamp: new Date()
    };

    setMessages(prev => [...prev, userMessage]);
    setMessage('');
    setIsLoading(true);
    setIsStreaming(true);

    // Create abort controller for streaming
    const controller = new AbortController();
    streamControllerRef.current = controller;

    try {
      const response = await fetch(`${API_BASE_URL}/chat/sessions/${sessionId}/messages`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ message: message }),
        signal: controller.signal
      });

      if (!response.ok) {
        throw new Error('Failed to send message');
      }

      // Handle SSE streaming
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let aiResponse = '';
      let aiMessageId = Date.now().toString() + '-ai';

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          const chunk = decoder.decode(value);
          const lines = chunk.split('\n');

          for (const line of lines) {
            if (line.startsWith('data: ')) {
              const data = line.slice(6);
              
              try {
                const parsed = JSON.parse(data);
                
                if (parsed.type === 'content' && parsed.chunk) {
                  aiResponse += parsed.chunk;
                  
                  // Update or add AI message
                  setMessages(prev => {
                    const lastMsg = prev[prev.length - 1];
                    if (lastMsg && lastMsg.role === 'assistant') {
                      return [
                        ...prev.slice(0, -1),
                        { ...lastMsg, content: aiResponse }
                      ];
                    } else {
                      return [
                        ...prev,
                        {
                          id: aiMessageId,
                          role: 'assistant' as const,
                          content: aiResponse,
                          timestamp: new Date()
                        }
                      ];
                    }
                  });
                } else if (parsed.type === 'credits') {
                  if (user) {
                    setUser({ ...user, aiCredits: parsed.remaining });
                  }
                } else if (parsed.type === 'done') {
                  break;
                } else if (parsed.type === 'error') {
                  throw new Error(parsed.message);
                }
              } catch (e) {
                // Ignore parsing errors for non-JSON lines
              }
            }
          }
        }
      }

      // Refresh sessions to update last message time
      await fetchChatSessions();

    } catch (error: any) {
      if (error.name !== 'AbortError') {
        console.error('Error sending message:', error);
        setMessages(prev => [...prev, {
          id: Date.now().toString(),
          role: 'assistant',
          content: 'Sorry, something went wrong. Please try again.',
          timestamp: new Date()
        }]);
      }
    } finally {
      setIsLoading(false);
      setIsStreaming(false);
      streamControllerRef.current = null;
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('apexoai_token');
    setToken(null);
    setUser(null);
    window.location.href = '/login';
  };

  const formatDate = (date: Date | string) => {
    const d = new Date(date);
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

  const convertMarkdownToHtml = (text: string): string => {
    let html = text
      .replace(/^(#{1,6})\s*(.*)$/gm, '<strong class="text-lg block mb-2">$2</strong>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/\n/g, '<br />');
    return html;
  };

  if (!token) {
    return (
      <div className="flex items-center justify-center h-screen bg-gradient-to-br from-blue-50 to-purple-50">
        <div className="text-center">
          <Sparkles className="w-16 h-16 mx-auto mb-4 text-blue-600" />
          <h1 className="text-3xl font-bold mb-2">ApexoAI</h1>
          <p className="text-gray-600 mb-6">Please log in to continue</p>
          <button
            onClick={() => window.location.href = '/login'}
            className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition"
          >
            Go to Login
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-white">
      {/* Sidebar */}
      <div className={`${isSidebarOpen ? 'w-80' : 'w-0'} transition-all duration-300 bg-gray-50 border-r border-gray-200 flex flex-col overflow-hidden`}>
        {/* Sidebar Header */}
        <div className="p-4 border-b border-gray-200">
          <button
            onClick={createNewSession}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-xl hover:bg-blue-700 transition"
          >
            <Plus size={20} />
            <span className="font-medium">New Chat</span>
          </button>
        </div>

        {/* Chat History */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          <h3 className="text-xs font-semibold text-gray-500 uppercase mb-3 flex items-center gap-2">
            <History size={14} />
            Recent Conversations
          </h3>
          
          {sessions.map(session => (
            <div
              key={session._id}
              className={`group relative p-3 rounded-lg cursor-pointer transition ${
                currentSessionId === session._id
                  ? 'bg-blue-50 border border-blue-200'
                  : 'hover:bg-gray-100'
              }`}
            >
              {editingSessionId === session._id ? (
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyPress={(e) => {
                      if (e.key === 'Enter') {
                        updateSessionTitle(session._id, editTitle);
                      }
                    }}
                    className="flex-1 px-2 py-1 text-sm border rounded"
                    autoFocus
                  />
                  <button
                    onClick={() => updateSessionTitle(session._id, editTitle)}
                    className="p-1 text-green-600 hover:bg-green-50 rounded"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => setEditingSessionId(null)}
                    className="p-1 text-red-600 hover:bg-red-50 rounded"
                  >
                    <X size={14} />
                  </button>
                </div>
              ) : (
                <>
                  <div onClick={() => setCurrentSessionId(session._id)}>
                    <div className="flex items-start justify-between gap-2">
                      <p className="text-sm font-medium text-gray-900 line-clamp-1 flex-1">
                        {session.title}
                      </p>
                      <span className="text-xs text-gray-500 whitespace-nowrap">
                        {formatDate(session.metadata.lastMessageAt)}
                      </span>
                    </div>
                    <p className="text-xs text-gray-500 mt-1">
                      {session.metadata.totalMessages} messages
                    </p>
                  </div>
                  
                  <div className="absolute right-2 top-2 opacity-0 group-hover:opacity-100 transition flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setEditingSessionId(session._id);
                        setEditTitle(session.title);
                      }}
                      className="p-1 hover:bg-blue-100 rounded"
                    >
                      <Edit2 size={14} className="text-blue-600" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        if (confirm('Delete this conversation?')) {
                          deleteSession(session._id);
                        }
                      }}
                      className="p-1 hover:bg-red-100 rounded"
                    >
                      <Trash2 size={14} className="text-red-600" />
                    </button>
                  </div>
                </>
              )}
            </div>
          ))}
        </div>

        {/* User Profile */}
        {user && (
          <div className="p-4 border-t border-gray-200 relative" ref={userMenuRef}>
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="w-full flex items-center gap-3 p-3 rounded-lg hover:bg-gray-100 transition"
            >
              <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
                {user.profile?.avatar ? (
                  <img src={user.profile.avatar} alt={user.name} className="w-full h-full rounded-full" />
                ) : (
                  <span className="text-white font-medium">{user.name.charAt(0)}</span>
                )}
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium text-gray-900">{user.name}</p>
                <p className="text-xs text-gray-500">{user.plan} Plan</p>
              </div>
              <ChevronDown size={16} className="text-gray-400" />
            </button>

            {showUserMenu && (
              <div className="absolute bottom-full left-4 right-4 mb-2 bg-white rounded-lg shadow-lg border border-gray-200 overflow-hidden">
                <div className="p-3 border-b border-gray-100">
                  <p className="text-xs text-gray-500">AI Credits</p>
                  <p className="text-lg font-bold text-blue-600">{user.aiCredits}</p>
                </div>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left">
                  <User size={16} className="text-gray-600" />
                  <span className="text-sm">Profile</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left">
                  <CreditCard size={16} className="text-gray-600" />
                  <span className="text-sm">Upgrade Plan</span>
                </button>
                <button className="w-full flex items-center gap-3 p-3 hover:bg-gray-50 transition text-left">
                  <Settings size={16} className="text-gray-600" />
                  <span className="text-sm">Settings</span>
                </button>
                <button
                  onClick={handleLogout}
                  className="w-full flex items-center gap-3 p-3 hover:bg-red-50 transition text-left border-t border-gray-100"
                >
                  <LogOut size={16} className="text-red-600" />
                  <span className="text-sm text-red-600">Logout</span>
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Main Chat Area */}
      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="bg-white border-b border-gray-200 p-6 flex items-center gap-4">
          {!isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <Menu size={20} />
            </button>
          )}
          {isSidebarOpen && (
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="p-2 hover:bg-gray-100 rounded-xl transition"
            >
              <X size={20} />
            </button>
          )}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center">
              <Sparkles size={16} className="text-white" />
            </div>
            <h2 className="text-lg font-semibold text-gray-900">
              {currentSessionId ? sessions.find(s => s._id === currentSessionId)?.title || 'Conversation' : 'Welcome to ApexoAI'}
            </h2>
          </div>
        </div>

        {/* Messages */}
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
                  <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                    msg.role === 'user'
                      ? 'bg-blue-600'
                      : 'bg-gradient-to-br from-gray-700 to-gray-900'
                  }`}>
                    {msg.role === 'user' ? (
                      <span className="text-white text-sm font-medium">{user?.name.charAt(0)}</span>
                    ) : (
                      <Sparkles size={16} className="text-white" />
                    )}
                  </div>
                  <div className={`flex-1 ${msg.role === 'user' ? 'text-right' : ''}`}>
                    <div
                      className={`p-4 rounded-2xl ${
                        msg.role === 'user'
                          ? 'bg-blue-600 text-white rounded-tr-lg'
                          : 'bg-gray-50 text-gray-800 rounded-tl-lg border border-gray-100'
                      }`}
                      dangerouslySetInnerHTML={{ 
                        __html: msg.role === 'assistant' ? convertMarkdownToHtml(msg.content) : msg.content 
                      }}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>
              </div>
            ))}

            {isStreaming && (
              <div className="flex justify-start">
                <div className="flex items-start gap-3 max-w-3xl">
                  <div className="w-8 h-8 bg-gradient-to-br from-gray-700 to-gray-900 rounded-full flex items-center justify-center">
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                  </div>
                  <div className="bg-gray-50 p-4 rounded-2xl rounded-tl-lg border border-gray-100">
                    <div className="flex gap-1">
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                      <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.4s' }}></div>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Input Area */}
        <div className="border-t border-gray-200 p-6 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="relative">
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="What's on your mind..."
                className="w-full p-4 pr-24 border border-gray-300 rounded-2xl resize-none focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-gray-50 transition"
                rows={1}
                style={{ minHeight: '56px', maxHeight: '200px' }}
                disabled={isLoading}
              />
              
              <div className="absolute right-3 top-1/2 transform -translate-y-1/2 flex gap-2">
                <a
                  href="https://elevenlabs.io/app/talk-to?agent_id=agent_01jwtxv08bexrt4f6yqvxyyx83"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-600 hover:text-blue-600 transition"
                >
                  <PiPhoneCall size={20} />
                </a>
                
                <button
                  onClick={handleSendMessage}
                  disabled={!message.trim() || isLoading}
                  className="p-2 bg-blue-600 text-white rounded-xl hover:bg-blue-700 disabled:bg-gray-300 disabled:cursor-not-allowed transition"
                >
                  {isLoading ? (
                    <div className="animate-spin rounded-full h-4 w-4 border-t-2 border-white"></div>
                  ) : (
                    <Send size={16} />
                  )}
                </button>
              </div>
            </div>

            <p className="text-xs text-gray-500 mt-3 text-center">
              ApexoAI can make mistakes. Check important info. {user && `• ${user.aiCredits} credits remaining`}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ChatbotApp;