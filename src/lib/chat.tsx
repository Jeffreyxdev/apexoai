// ============================================
// API INTEGRATION - Add to your existing api.ts
// ============================================
import { useCallback } from 'react';
const API_BASE_URL =import.meta.env.VITE_API_URL ;

const getToken = () => localStorage.getItem('apexoai_token');

const apiFetch = async (endpoint: string, options: RequestInit = {}) => {
  const token = getToken();
  let headers: HeadersInit = {
    'Content-Type': 'application/json',
    ...(options.headers || {}),
  };

  if (token) {
    headers = Object.assign({}, headers, {
      'Authorization': `Bearer ${token}`
    });
  }

  const response = await fetch(`${API_BASE_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (response.status === 401) {
    localStorage.removeItem('apexoai_token');
    window.location.href = '/login';
    throw new Error('Unauthorized');
  }

  return response;
};

// ============================================
// USER PROFILE API
// ============================================
export const userAPI = {
  // Get user profile with firstname
  getProfile: async () => {
    const response = await apiFetch('/api/auth/profile');
    return response.json();
  },

  // Update profile (firstname, lastname, etc.)
  updateProfile: async (updates: {
    firstName?: string;
    lastName?: string;
    phone?: string;
    location?: string;
    bio?: string;
    title?: string;
    linkedinUrl?: string;
    githubUrl?: string;
    portfolioUrl?: string;
  }) => {
    const response = await apiFetch('/api/auth/profile', {
      method: 'PATCH',
      body: JSON.stringify(updates),
    });
    return response.json();
  },

  // Get settings
  getSettings: async () => {
    const response = await apiFetch('/api/auth/settings');
    return response.json();
  },

  // Update settings
  updateSettings: async (settings: {
    emailNotifications?: boolean;
    weeklyTips?: boolean;
    jobAlerts?: boolean;
  }) => {
    const response = await apiFetch('/api/auth/settings', {
      method: 'PATCH',
      body: JSON.stringify(settings),
    });
    return response.json();
  },
};

// ============================================
// CHAT HISTORY API
// ============================================
export const chatHistoryAPI = {
  // GET /api/chat/history
  getHistory: async () => {
    // The server is expected to return a grouped object (today, yesterday, etc.)
    const response = await apiFetch('/api/chat/history');
    return response.json();
  },

  // GET /api/chat/search
  search: async (query: string, limit = 20, page = 1) => {
    const response = await apiFetch(
      `/api/chat/search?query=${encodeURIComponent(query)}&limit=${limit}&page=${page}`
    );
    return response.json();
  },

  // GET /api/chat/suggestions
  getSuggestions: async () => {
    const response = await apiFetch('/api/chat/suggestions');
    return response.json();
  },

  // DELETE /api/chat/history/clear
  clearHistory: async () => {
    const response = await apiFetch('/api/chat/history/clear', {
      method: 'DELETE',
    });
    return response.json();
  },
};


// ============================================
// REACT HOOK - useUserProfile
// ============================================
import { useState, useEffect } from 'react';

export const useUserProfile = () => {
  const [profile, setProfile] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchProfile = useCallback(async () => {
    try {
      setLoading(true);
      const data = await userAPI.getProfile();
      setProfile(data.user);
      setError(null);
    } catch (err: any) {
      console.error('Error fetching profile:', err);
      setError(err.message || 'Failed to fetch profile');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchProfile();
  }, [fetchProfile]);

  const updateProfile = async (updates: any) => {
    try {
      // Assuming userAPI.updateProfile returns the updated user object
      const data = await userAPI.updateProfile(updates);
      setProfile((prev: any) => ({ ...prev, ...data.user }));
      return data;
    } catch (err: any) {
      console.error('Error updating profile:', err);
      throw err;
    }
  };

  return { profile, loading, error, updateProfile, refetch: fetchProfile };
};

// ============================================
// REACT HOOK - useChatHistory
// ============================================
export const useChatHistory = () => {
  const [history, setHistory] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchHistory();
  }, []);

  const fetchHistory = async () => {
    try {
      setLoading(true);
      const data = await chatHistoryAPI.getHistory();
      setHistory(data.history);
      setError(null);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return { history, loading, error, refetch: fetchHistory };
};

// ============================================
// REACT HOOK - useChatSearch
// ============================================
export const useChatSearch = () => {
  const [results, setResults] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const search = useCallback(async (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) {
      setResults(null);
      return;
    }

    try {
      setLoading(true);
      // chatHistoryAPI.search returns { success: true, results: {...} }
      const data = await chatHistoryAPI.search(trimmedQuery);
      setResults(data.results);
      setError(null);
    } catch (err: any) {
      console.error('Error during chat search:', err);
      setError(err.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }, []);

  const clearResults = () => {
    setResults(null);
    setError(null);
  };

  return { results, loading, error, search, clearResults };
};
