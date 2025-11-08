'use client';

import React, { useState, useRef, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { 
  Home, Compass, BookOpen, Clock, 
  Lightbulb, Image, Send, Menu, X, 
  Sparkles, Search 
} from 'lucide-react';

// ============================================
// 1. IMPORT THE NEW API FUNCTIONS
// ============================================
import { userAPI, chatHistoryAPI } from '../lib/chat';

// ============================================
// 2. TYPES
// ============================================
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  createdAt: Date;
}

// ============================================
// 3. MAIN COMPONENT
// ============================================
export default function BeeBotUI() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [inputValue, setInputValue] = useState('');
  const [messages, setMessages] = useState<Message[]>([]);
  const [isTyping, setIsTyping] = useState(false);
  const [selectedModel, setSelectedModel] = useState('iBeeBot 4.0');

  // NEW: Backend-driven state
  const [firstName, setFirstName] = useState('there');
  const [chatHistory, setChatHistory] = useState<any>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any>(null);
  const [suggestions, setSuggestions] = useState<any>({
    today: [],
    pastWeek: [],
    popular: []
  });

  const chatAreaRef = useRef<HTMLDivElement>(null);

  // ============================================
  // 4. FETCH DATA ON MOUNT
  // ============================================
  useEffect(() => {
    fetchUserProfile();
    fetchChatHistory();
    fetchSuggestions();
  }, []);

  const fetchUserProfile = async () => {
    try {
      const data = await userAPI.getProfile();
      const name = data.user.firstname || data.user.firstName || data.user.name?.split(' ')[0] || 'there';
      setFirstName(name);
    } catch (error) {
      console.error('Failed to fetch profile:', error);
    }
  };

  const fetchChatHistory = async () => {
    try {
      const data = await chatHistoryAPI.getHistory();
      setChatHistory(data.history);
    } catch (error) {
      console.error('Failed to fetch history:', error);
    }
  };

  const fetchSuggestions = async () => {
    try {
      const data = await chatHistoryAPI.getSuggestions();
      setSuggestions(data.suggestions || { today: [], pastWeek: [], popular: [] });
    } catch (error) {
      console.error('Failed to fetch suggestions:', error);
    }
  };

  // ============================================
  // 5. SEARCH FUNCTIONALITY
  // ============================================
  const handleSearch = async (query: string) => {
    setSearchQuery(query);
    
    if (!query.trim()) {
      setSearchResults(null);
      return;
    }

    try {
      const data = await chatHistoryAPI.search(query);
      setSearchResults(data.results);
    } catch (error) {
      console.error('Search failed:', error);
    }
  };

  // ============================================
  // 6. AUTO-SCROLL
  // ============================================
  useEffect(() => {
    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTop = chatAreaRef.current.scrollHeight;
    }
  }, [messages]);

  // ============================================
  // 7. SEND MESSAGE (SIMULATED)
  // ============================================
  const handleSend = () => {
    if (!inputValue.trim()) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: inputValue,
      createdAt: new Date(),
    };

    setMessages(prev => [...prev, userMsg]);
    setInputValue('');
    setIsTyping(true);

    // Simulate AI response
    setTimeout(() => {
      const aiMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `You said: "${userMsg.content}"\n\nThis is a simulated response from **${selectedModel}**. In production, this would call your AI backend.`,
        createdAt: new Date(),
      };
      setMessages(prev => [...prev, aiMsg]);
      setIsTyping(false);
    }, 1200);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleSuggestionClick = (text: string) => {
    setInputValue(text);
  };

  const renderMarkdown = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong class="font-bold">$1</strong>')
      .replace(/\*(.*?)\*/g, '<em class="italic">$1</em>')
      .replace(/\n/g, '<br />');
  };

  // ============================================
  // 8. RENDER UI (100% UNCHANGED)
  // ============================================
  return (
    <>
      <div className="flex h-screen bg-gray-50 text-gray-900">
        {/* Sidebar */}
        <aside className={`${
          isSidebarOpen ? 'w-80' : 'w-0'
        } transition-all duration-300 bg-white border-r border-gray-200 flex flex-col overflow-hidden`}>
          
          {/* Logo */}
          <div className="p-4 border-b border-gray-200">
            <div className="flex items-center">
              <div className="flex items-center justify-center h-8 w-8 rounded-full bg-white/10">
                <div className="h-5 w-5 rounded-full bg-black" />
              </div>
              <span className="text-black text-xl font-semibold">ApexoAI</span>
            </div>
          </div>

          {/* Search - NOW FUNCTIONAL */}
          <div className="p-3">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder="Search"
                value={searchQuery}
                onChange={(e) => handleSearch(e.target.value)}
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            
            {/* SEARCH RESULTS */}
            {searchResults && (
              <div className="mt-2 bg-gray-50 rounded-lg p-2 max-h-64 overflow-y-auto">
                {searchResults.titleMatches?.length > 0 && (
                  <div className="mb-2">
                    <p className="text-xs font-semibold text-gray-500 mb-1">Title Matches</p>
                    {searchResults.titleMatches.map((session: any) => (
                      <div key={session._id} className="text-xs p-2 hover:bg-white rounded cursor-pointer">
                        {session.title}
                      </div>
                    ))}
                  </div>
                )}
                {searchResults.messageMatches?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 mb-1">Message Matches</p>
                    {searchResults.messageMatches.map((match: any) => (
                      <div key={match.sessionId} className="text-xs p-2 hover:bg-white rounded cursor-pointer">
                        <p className="font-medium">{match.title}</p>
                        <p className="text-gray-600 truncate">{match.matchingMessages[0]?.snippet}</p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-3">
            {[
              { icon: Home, label: 'Home', active: true },
              { icon: Compass, label: 'Explore' },
              { icon: BookOpen, label: 'Library' },
              { icon: Clock, label: 'History' },
            ].map((item) => (
              <button
                key={item.label}
                className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg transition ${
                  item.active
                    ? 'bg-blue-50 text-blue-600'
                    : 'hover:bg-gray-100 text-gray-700'
                }`}
              >
                <item.icon className="w-5 h-5" />
                <span className="text-sm font-medium">{item.label}</span>
              </button>
            ))}
          </nav>

          {/* Suggestions & History - DYNAMIC FROM BACKEND */}
          <div className="p-4 border-t border-gray-200 space-y-6">
            {/* Today's Suggestions */}
            {suggestions.today?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Today</p>
                <div className="space-y-2">
                  {suggestions.today.map((text: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(text)}
                      className="text-left text-sm text-gray-600 hover:text-gray-900 line-clamp-2"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Past Week Suggestions */}
            {suggestions.pastWeek?.length > 0 && (
              <div>
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">This Week</p>
                <div className="space-y-2">
                  {suggestions.pastWeek.map((text: string, i: number) => (
                    <button
                      key={i}
                      onClick={() => handleSuggestionClick(text)}
                      className="text-left text-sm text-gray-600 hover:text-gray-900 line-clamp-2"
                    >
                      {text}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Chat History - FROM BACKEND */}
            {chatHistory && (
              <div>
                {chatHistory.today?.length > 0 && (
                  <div className="mb-4">
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Today</p>
                    {chatHistory.today.slice(0, 3).map((session: any) => (
                      <div key={session._id} className="text-sm text-gray-600 hover:text-gray-900 py-1 cursor-pointer truncate">
                        {session.title}
                      </div>
                    ))}
                  </div>
                )}
                
                {chatHistory.last7Days?.length > 0 && (
                  <div>
                    <p className="text-xs font-semibold text-gray-500 uppercase mb-2">7 Days Ago</p>
                    {chatHistory.last7Days.slice(0, 3).map((session: any) => (
                      <div key={session._id} className="text-sm text-gray-600 hover:text-gray-900 py-1 cursor-pointer truncate">
                        {session.title}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </aside>

        {/* Main Area */}
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="p-2 hover:bg-gray-100 rounded-lg transition"
              >
                {isSidebarOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </button>
            </div>
          </header>

          {/* Chat Area */}
          <div ref={chatAreaRef} className="flex-1 overflow-y-auto bg-gray-50 p-6">
            <div className="max-w-4xl mx-auto">
              {messages.length === 0 ? (
                <div className="text-center py-20">
                  <div className="w-24 h-24 mx-auto mb-6 bg-gradient-to-br from-blue-400 to-purple-600 rounded-full opacity-20 blur-3xl"></div>
                  <h1 className="text-3xl font-bold mb-2">Good Morning, {firstName}</h1>
                  <p className="text-xl text-gray-600">How Can I Assist You Today?</p>
                </div>
              ) : (
                <div className="space-y-6">
                  {messages.map((msg) => (
                    <div
                      key={msg.id}
                      className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                      <div className={`flex items-start gap-3 max-w-2xl ${msg.role === 'user' ? 'flex-row-reverse' : ''}`}>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                          msg.role === 'user' ? 'bg-black/60' : 'bg-gray-700'
                        }`}>
                          {msg.role === 'user' ? (
                            <span className="text-white text-sm font-bold">{firstName[0]}</span>
                          ) : (
                            <Sparkles className="w-5 h-5 text-white" />
                          )}
                        </div>
                        <div>
                          <div
                            className={`p-2 px-4 rounded-2xl ${
                              msg.role === 'user'
                                ? 'bg-black/90 text-white rounded-tr-none'
                                : 'bg-white border border-gray-200 rounded-tl-none'
                            }`}
                            dangerouslySetInnerHTML={{ __html: renderMarkdown(msg.content) }}
                          />
                          <p className="text-xs text-gray-500 mt-1">
                            {formatDistanceToNow(msg.createdAt, { addSuffix: true })}
                          </p>
                        </div>
                      </div>
                    </div>
                  ))}
                  {isTyping && (
                    <div className="flex justify-start">
                      <div className="bg-white p-4 rounded-2xl border border-gray-200">
                        <div className="flex gap-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Input Bar */}
          <div className="bg-white border-t border-gray-200 p-4">
            <div className="max-w-4xl mx-auto">
              <div className="relative">
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Initiate a query or send a command to the AI..."
                  className="w-full px-5 py-4 pr-32 bg-gray-50 border border-gray-200 rounded-2xl focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
                <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-2">
                  <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition">
                    <Lightbulb className="w-4 h-4" /> Reasoning
                  </button>
                  <button className="flex items-center gap-2 px-3 py-2 bg-gray-100 hover:bg-gray-200 rounded-lg text-xs font-medium text-gray-700 transition">
                    <Image className="w-4 h-4" /> Create Image
                  </button>
                  <button
                    onClick={handleSend}
                    disabled={!inputValue.trim()}
                    className="p-2 bg-black hover:bg-black/70 text-white rounded-lg transition disabled:opacity-80 disabled:cursor-not-allowed"
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}