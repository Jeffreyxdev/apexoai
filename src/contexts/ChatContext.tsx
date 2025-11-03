import { createContext, useContext, useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { toast } from 'react-toastify';
import { useAuth } from './AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL;

export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: Date;
  metadata?: { tokens?: number; model?: string };
}

export interface ChatSession {
  _id: string;
  title: string;
  metadata: { lastMessageAt: string | Date; totalMessages: number };
  createdAt: string | Date;
}

type ChatContextType = {
  sessions: ChatSession[];
  currentSessionId: string | null;
  messages: Message[];
  isLoading: boolean;
  isStreaming: boolean;
  fetchSessions: () => Promise<void>;
  createSession: () => Promise<void>;
  selectSession: (id: string | null) => void;
  fetchSessionMessages: (id: string) => Promise<void>;
  updateSessionTitle: (id: string, title: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
};

const ChatContext = createContext<ChatContextType | undefined>(undefined);

export const useChat = () => {
  const ctx = useContext(ChatContext);
  if (!ctx) throw new Error('useChat must be used within ChatProvider');
  return ctx;
};

export const ChatProvider = ({ children }: { children: ReactNode }) => {
  const { token, authFetch } = useAuth();
  const [sessions, setSessions] = useState<ChatSession[]>([]);
  const [currentSessionId, setCurrentSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const isStreaming = false;

  // Fetch sessions for authenticated user
  const fetchSessions = async () => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/chat/sessions?limit=50`);
      if (res.ok) {
        const data = await res.json();
        setSessions(Array.isArray(data.sessions) ? data.sessions : []);
      } else {
        console.error('Failed fetch sessions', res.status);
      }
    } catch (err) {
      console.error('fetchSessions error', err);
    }
  };

  useEffect(() => {
    if (token) fetchSessions();
    else {
      setSessions([]);
      setCurrentSessionId(null);
      setMessages([]);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  const createSession = async () => {
    if (!token) return;
    setIsLoading(true);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/chat/sessions`, {
        method: 'POST',
        body: JSON.stringify({ title: 'New Chat' }),
      });
      if (res.ok) {
        const newSession = await res.json();
        setSessions((s) => [newSession, ...s]);
        setCurrentSessionId(newSession._id);
        setMessages([]);
        toast.success('New chat started!');
      } else {
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to create chat');
      }
    } catch (err) {
      console.error('createSession error', err);
      toast.error('Network error while creating chat.');
    } finally {
      setIsLoading(false);
    }
  };

  const selectSession = (id: string | null) => {
    setCurrentSessionId(id);
  };

  const fetchSessionMessages = async (id: string) => {
    if (!token) return;
    try {
      const res = await authFetch(`${API_BASE_URL}/chat/sessions/${id}`);
      if (res.ok) {
        const data = await res.json();
        const mapped = (data.session?.messages || []).map((m: any) => ({
          id: m.id || m._id || Date.now().toString(),
          role: m.role || 'assistant',
          content: m.content || '',
          timestamp: new Date(m.timestamp || m.createdAt || Date.now()),
          metadata: m.metadata || {},
        }));
        setMessages(mapped);
      } else {
        console.error('Failed to load session messages', res.status);
        setMessages([]);
      }
    } catch (err) {
      console.error('fetchSessionMessages error', err);
      setMessages([]);
    }
  };

  useEffect(() => {
    if (currentSessionId) fetchSessionMessages(currentSessionId);
    else setMessages([]);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentSessionId]);

  const updateSessionTitle = async (sessionId: string, newTitle: string) => {
    if (!token || !newTitle.trim()) return;
    const original = sessions.find((s) => s._id === sessionId)?.title || '';
    if (original === newTitle) return;
    setSessions((prev) => prev.map((s) => (s._id === sessionId ? { ...s, title: newTitle } : s)));
    try {
      const res = await authFetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, {
        method: 'PATCH',
        body: JSON.stringify({ title: newTitle }),
      });
      if (!res.ok) {
        setSessions((prev) => prev.map((s) => (s._id === sessionId ? { ...s, title: original } : s)));
        const err = await res.json().catch(() => ({}));
        toast.error(err.message || 'Failed to update title');
      } else {
        toast.success('Title updated successfully.');
      }
    } catch (err) {
      console.error('updateSessionTitle error', err);
      setSessions((prev) => prev.map((s) => (s._id === sessionId ? { ...s, title: original } : s)));
      toast.error('Network error while updating title.');
    }
  };

  const deleteSession = async (sessionId: string) => {
    if (!token) return;
    // optimistic
    const prev = sessions;
    setSessions((s) => s.filter((x) => x._id !== sessionId));
    if (currentSessionId === sessionId) {
      setCurrentSessionId(null);
      setMessages([]);
    }
    try {
      const res = await authFetch(`${API_BASE_URL}/api/chat/sessions/${sessionId}`, { method: 'DELETE' });
      if (!res.ok) {
        toast.error('Failed to delete chat on server.');
        setSessions(prev);
        await fetchSessions();
      } else {
        toast.info('Conversation deleted...');
      }
    } catch (err) {
      console.error('deleteSession error', err);
      toast.error('Network error while deleting chat.');
      setSessions(prev);
      fetchSessions();
    }
  };

  const sendMessage = async (content: string) => {
    if (!token || !currentSessionId || !content.trim()) {
      if (!currentSessionId) toast.info('Please start a new chat or select a conversation first.');
      return;
    }
    setIsLoading(true);
    const userMessage: Message = { id: Date.now().toString(), role: 'user', content, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    try {
      const res = await authFetch(`${API_BASE_URL}/api/chat/sessions/${currentSessionId}/messages`, {
        method: 'POST',
        body: JSON.stringify({ content }),
      });
      if (res.ok) {
        const assistantResponse = await res.json();
        const aiMessage: Message = {
          id: assistantResponse.id || Date.now().toString(),
          role: 'assistant',
          content: assistantResponse.content || 'No response from server.',
          timestamp: new Date(),
          metadata: assistantResponse.metadata || {},
        };
        setMessages((prev) => [...prev, aiMessage]);
        fetchSessions();
      } else {
        toast.error('Failed to send message to AI.');
        setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
      }
    } catch (err) {
      console.error('sendMessage error', err);
      toast.error('Network error while sending message.');
      setMessages((prev) => prev.filter((m) => m.id !== userMessage.id));
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <ChatContext.Provider
      value={{
        sessions,
        currentSessionId,
        messages,
        isLoading,
        isStreaming,
        fetchSessions,
        createSession,
        selectSession,
        fetchSessionMessages,
        updateSessionTitle,
        deleteSession,
        sendMessage,
      }}
    >
      {children}
    </ChatContext.Provider>
  );
};

export default ChatContext;
