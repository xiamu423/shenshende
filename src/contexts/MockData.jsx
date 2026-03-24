// src/contexts/MockData.jsx (Upgraded to point to Real Express Backend)
import { createContext, useState, useContext, useEffect, useCallback } from 'react';

const MockContext = createContext();

export function MockProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [posts, setPosts] = useState([]);
  const [myCards, setMyCards] = useState([]);
  const [chats, setChats] = useState([]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    const userStr = localStorage.getItem('user');
    if (token && userStr) {
      setCurrentUser(JSON.parse(userStr));
      setIsLoggedIn(true);
    }
  }, []);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const loginAuth = async (phone) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone })
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  const fetchPosts = useCallback(async () => {
    if (!isLoggedIn) return;
    const res = await fetch('/api/posts', { headers: getAuthHeaders() });
    if (res.ok) setPosts(await res.json());
  }, [isLoggedIn]);

  const fetchCards = useCallback(async () => {
    if (!isLoggedIn) return;
    const res = await fetch('/api/cards', { headers: getAuthHeaders() });
    if (res.ok) setMyCards(await res.json());
  }, [isLoggedIn]);

  const fetchChats = useCallback(async () => {
    if (!isLoggedIn) return;
    const res = await fetch('/api/chats', { headers: getAuthHeaders() });
    if (res.ok) setChats(await res.json());
  }, [isLoggedIn]);

  useEffect(() => {
    fetchPosts();
    fetchCards();
    fetchChats();
  }, [fetchPosts, fetchCards, fetchChats]);

  const addPost = async (postData) => {
    const res = await fetch('/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(postData)
    });
    if (res.ok) await fetchPosts();
  };

  const togglePostStatus = async (id) => {
    const res = await fetch(`/api/posts/${id}/status`, { method: 'PATCH', headers: getAuthHeaders() });
    if (res.ok) await fetchPosts();
  };

  const deletePost = async (id) => {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) {
      await fetchPosts();
      return true;
    }
    return false;
  };

  const addCard = async (cardData) => {
    const res = await fetch('/api/cards', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(cardData)
    });
    if (res.ok) await fetchCards();
  };

  const deleteCard = async (id) => {
    const res = await fetch(`/api/cards/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) {
      await fetchCards();
      await fetchPosts(); // Since card may be removed from posts
      return true;
    }
    return false;
  };

  const togglePinChat = async (id) => {
    const res = await fetch(`/api/chats/${id}/pin`, { method: 'PATCH', headers: getAuthHeaders() });
    if (res.ok) await fetchChats();
  };

  const sendMessage = async (chatId, msgObj) => {
    const res = await fetch(`/api/chats/${chatId}/messages`, {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(msgObj)
    });
    if (res.ok) await fetchChats();
  };

  const findOrCreateChat = async (userId) => {
    const res = await fetch('/api/chats', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify({ targetUserId: userId })
    });
    const { id } = await res.json();
    await fetchChats();
    return id;
  };

  const uploadFile = async (file) => {
    const fd = new FormData();
    fd.append('file', file);
    const res = await fetch('/api/upload', {
      method: 'POST', headers: getAuthHeaders(), body: fd
    });
    if (res.ok) {
      const data = await res.json();
      return data.url;
    }
    return null;
  };

  const getChatMessages = async (chatId) => {
    const res = await fetch(`/api/chats/${chatId}/messages`, { headers: getAuthHeaders() });
    if (res.ok) return res.json();
    return [];
  };

  const updateProfile = async (profileData) => {
    const res = await fetch('/api/users/profile', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(profileData)
    });
    if (res.ok) {
      const updatedUser = await res.json();
      setCurrentUser(updatedUser);
      localStorage.setItem('user', JSON.stringify(updatedUser));
      fetchPosts(); // refresh to show new user avatar on authored posts
      fetchChats(); 
      return true;
    }
    return false;
  };

  return (
    <MockContext.Provider value={{
      currentUser, isLoggedIn, loginAuth, logout,
      posts, addPost, togglePostStatus, deletePost,
      myCards, addCard, deleteCard,
      chats, togglePinChat, sendMessage, findOrCreateChat, getChatMessages,
      uploadFile, updateProfile
    }}>
      {children}
    </MockContext.Provider>
  );
}

export const useMockData = () => useContext(MockContext);
