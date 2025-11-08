import React, { createContext, useContext, useState, useEffect } from 'react';
import { toast } from 'react-toastify';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: string;
}

interface Session {
  _id: string;
  title: string;
  metadata: {
    lastMessageAt: string;
    totalMessages: number;
  };
  messages: Message[];
}

interface ChatContextType {
  sessions: Session[];
  currentSessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  createSession: () => Promise<void>;
  selectSession: (id: string) => void;
  updateSessionTitle: (id: string, title: string) => void;
  deleteSession: (id: string) => void;
  sendMessage: (content: string) => void;
}

const ChatContext = createContext<ChatContextType>({} as ChatContextType);

export const ChatProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  const messages = currentSessionId ? sessions.find(s => s._id === currentSessionId)?.messages || [] : [];

  const createSession = async () => {
    setIsLoading(true);
    try {
      // Mock API call
      const newSession: Session = {
        _id: Math.random().toString(36).substr(2, 9),
        title: 'New Conversation',
        metadata: { lastMessageAt: new Date().toISOString(), totalMessages: 0 },
        messages: []
      };
      setSessions(prev => [newSession, ...prev]);
      setCurrentSessionId(newSession._id);
    } catch (err) {
      toast.error('Failed to create session.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectSession = (id: string) => setCurrentSessionId(id);

  const updateSessionTitle = (id: string, title: string) => {
    setSessions(prev => prev.map(s => s._id === id ? { ...s, title } : s));
  };

  const deleteSession = (id: string) => {
    setSessions(prev => prev.filter(s => s._id !== id));
    if (currentSessionId === id) setCurrentSessionId(null);
  };

  const sendMessage = (content: string) => {
    if (!currentSessionId) return;
    const newMessage: Message = { id: Math.random().toString(36), role: 'user', content, timestamp: new Date().toISOString() };
    setSessions(prev =>
      prev.map(s => s._id === currentSessionId ? {
        ...s,
        messages: [...s.messages, newMessage],
        metadata: { ...s.metadata, lastMessageAt: new Date().toISOString(), totalMessages: s.metadata.totalMessages + 1 }
      } : s)
    );
  };

  // Auto-create a session if none exists
  useEffect(() => {
    if (!currentSessionId && sessions.length === 0) createSession();
  }, []);

  return (
    <ChatContext.Provider value={{ sessions, currentSessionId, messages, isLoading, createSession, selectSession, updateSessionTitle, deleteSession, sendMessage }}>
      {children}
    </ChatContext.Provider>
  );
};

export const useChat = () => useContext(ChatContext);
