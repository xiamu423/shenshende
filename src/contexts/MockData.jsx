// src/contexts/MockData.jsx (Upgraded to point to Real Express Backend)
import { createContext, useState, useContext, useEffect, useCallback, useRef } from 'react';

const MockContext = createContext();

export function MockProvider({ children }) {
  const storedToken = localStorage.getItem('token');
  const storedUser = localStorage.getItem('user');
  const [currentUser, setCurrentUser] = useState(() => storedUser ? JSON.parse(storedUser) : null);
  const [isLoggedIn, setIsLoggedIn] = useState(() => Boolean(storedToken && storedUser));
  const [posts, setPosts] = useState([]);
  const [postsHasMore, setPostsHasMore] = useState(true);
  const [postsLoading, setPostsLoading] = useState(false);
  const [postsTotal, setPostsTotal] = useState(0);
  const postsPageRef = useRef(0);
  const postsQueryRef = useRef('');
  const postsLoadingRef = useRef(false);
  const postsRequestRef = useRef(0);
  const [myCards, setMyCards] = useState([]);
  const [favoriteCards, setFavoriteCards] = useState([]);
  const [chats, setChats] = useState([]);

  const getAuthHeaders = () => ({
    'Authorization': `Bearer ${localStorage.getItem('token')}`
  });

  const loginAuth = async (phone, password) => {
    const res = await fetch('/api/auth/login', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      return true;
    }
    const error = await res.json().catch(() => ({}));
    return error.error || false;
  };

  const registerAuth = async (phone, password) => {
    const res = await fetch('/api/auth/register', {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ phone, password })
    });
    if (res.ok) {
      const data = await res.json();
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      setCurrentUser(data.user);
      setIsLoggedIn(true);
      return true;
    }
    const err = await res.json();
    return err.error || false;
  };

  const logout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setCurrentUser(null);
    setIsLoggedIn(false);
  };

  const fetchPosts = useCallback(async (filters = {}, reset = false) => {
    const queryKey = JSON.stringify(filters);
    const shouldReset = reset || queryKey !== postsQueryRef.current;
    if (postsLoadingRef.current && !shouldReset) return;
    const requestId = ++postsRequestRef.current;
    postsLoadingRef.current = true; setPostsLoading(true);
    const page = shouldReset ? 1 : postsPageRef.current + 1;
    const params = new URLSearchParams({ page: String(page), limit: '20' });
    if (filters.status && filters.status !== '全部') params.set('status', filters.status);
    if (filters.method && filters.method !== '全部') params.set('method', filters.method);
    if (filters.tags?.length) params.set('tags', filters.tags.join(','));
    if (filters.startTime && filters.endTime) { params.set('startTime', filters.startTime); params.set('endTime', filters.endTime); }
    try {
      const res = await fetch(`/api/posts?${params}`);
      if (res.ok && requestId === postsRequestRef.current) {
        const data = await res.json();
        setPosts((current) => shouldReset ? data.items : [...current, ...data.items.filter((item) => !current.some((post) => post.id === item.id))]);
        setPostsHasMore(data.hasMore); setPostsTotal(data.total); postsPageRef.current = page; postsQueryRef.current = queryKey;
      }
    } finally { if(requestId===postsRequestRef.current){postsLoadingRef.current=false;setPostsLoading(false);} }
  }, []);

  const getPostById = useCallback(async (id) => { const res = await fetch(`/api/posts/${id}`); return res.ok ? res.json() : null; }, []);
  const getMyPosts = useCallback(async () => { const res = await fetch('/api/users/me/posts', { headers: getAuthHeaders() }); return res.ok ? res.json() : []; }, []);
  const getMySummary = useCallback(async () => { const res = await fetch('/api/users/me/summary', { headers: getAuthHeaders() }); return res.ok ? res.json() : { postCount: 0 }; }, []);

  const fetchCards = useCallback(async () => {
    if (!isLoggedIn) return;
    const res = await fetch('/api/cards', { headers: getAuthHeaders() });
    if (res.ok) setMyCards(await res.json());
  }, [isLoggedIn]);

  const fetchFavoriteCards = useCallback(async () => {
    if (!isLoggedIn) return;
    const res = await fetch('/api/favorite-cards', { headers: getAuthHeaders() });
    if (res.ok) setFavoriteCards(await res.json());
  }, [isLoggedIn]);

  const fetchChats = useCallback(async () => {
    if (!isLoggedIn) return;
    const res = await fetch('/api/chats', { headers: getAuthHeaders() });
    if (res.ok) setChats(await res.json());
  }, [isLoggedIn]);

  useEffect(() => {
    fetchCards();
    fetchFavoriteCards();
    fetchChats();
  }, [fetchCards, fetchFavoriteCards, fetchChats]);

  const isCardFavorite = useCallback((card) => {
    const id = card?.sourceCardId || card?.id;
    return Boolean(id && favoriteCards.some((item) => (item.sourceCardId || item.id) === id));
  }, [favoriteCards]);

  const toggleFavoriteCard = async (card) => {
    const id = card?.sourceCardId || card?.id;
    if (!id) return false;
    const favorite = isCardFavorite(card);
    const res = await fetch(`/api/favorite-cards${favorite ? `/${encodeURIComponent(id)}` : ''}`, {
      method: favorite ? 'DELETE' : 'POST',
      headers: favorite ? getAuthHeaders() : { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: favorite ? undefined : JSON.stringify({ sourceCardId: id, card })
    });
    if (res.ok) { await fetchFavoriteCards(); return !favorite; }
    return favorite;
  };

  const updateFavoriteRemark = async (id, remark) => {
    const res = await fetch(`/api/favorite-cards/${encodeURIComponent(id)}/remark`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ remark })
    });
    if (res.ok) { await fetchFavoriteCards(); return true; }
    return false;
  };

  const addPost = async (postData) => {
    const res = await fetch('/api/posts', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(postData)
    });
    if (res.ok) await fetchPosts({}, true);
  };

  const togglePostStatus = async (id) => {
    const res = await fetch(`/api/posts/${id}/status`, { method: 'PATCH', headers: getAuthHeaders() });
    if (res.ok) await fetchPosts({}, true);
  };

  const deletePost = async (id) => {
    const res = await fetch(`/api/posts/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) {
      await fetchPosts({}, true);
      return true;
    }
    return false;
  };

  const addCard = async (cardData) => {
    const res = await fetch('/api/cards', {
      method: 'POST', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
      body: JSON.stringify(cardData)
    });
    if (res.ok) {
      const data = await res.json();
      setMyCards((cards) => [{
        ...cardData,
        id: data.id,
        image: cardData.images?.[0] || '',
        created_at: new Date().toISOString()
      }, ...cards]);
      fetchCards();
      return { ok: true, ...data };
    }
    return { ok: false, error: (await res.json()).error || '保存失败' };
  };

  const updateCard = async (id, cardData) => {
    try {
      const res = await fetch(`/api/cards/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify(cardData)
      });
      if (res.ok) {
        setMyCards((cards) => cards.map((card) => card.id === id ? {
          ...card,
          ...cardData,
          image: cardData.images?.[0] || card.image,
          updated_at: new Date().toISOString()
        } : card));
        fetchCards();
        return { ok: true };
      }
      const errorData = await res.json().catch(() => ({}));
      return { ok: false, error: errorData.error || `保存失败（${res.status}）` };
    } catch {
      return { ok: false, error: '无法连接服务器，请稍后重试' };
    }
  };

  const deleteCard = async (id) => {
    const res = await fetch(`/api/cards/${id}`, { method: 'DELETE', headers: getAuthHeaders() });
    if (res.ok) {
      await fetchCards();
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
    if (res.ok) {
      const data = await res.json();
      await fetchChats();
      return data;
    }
    return { success: false };
  };

  const updateChatRemark = async (chatId, remark) => {
    const res = await fetch(`/api/chats/${chatId}/remark`, {
      method: 'PATCH', headers: { 'Content-Type': 'application/json', ...getAuthHeaders() }, body: JSON.stringify({ remark })
    });
    if (res.ok) { await fetchChats(); return true; }
    return false;
  };

  const toggleBlockChat = async (chatId) => {
    const res = await fetch(`/api/chats/${chatId}/block`, { method: 'PATCH', headers: getAuthHeaders() });
    if (res.ok) { const data = await res.json(); await fetchChats(); return data.isBlocked; }
    return null;
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

  const getChatMessages = useCallback(async (chatId) => {
    const res = await fetch(`/api/chats/${chatId}/messages`, { headers: getAuthHeaders() });
    if (res.ok) return res.json();
    return [];
  }, []);

  const markChatRead = useCallback(async (chatId) => {
    const res = await fetch(`/api/chats/${chatId}/read`, { method: 'PATCH', headers: getAuthHeaders() });
    if (res.ok) {
      setChats((items) => items.map((chat) => chat.id === chatId ? { ...chat, unreadCount: 0 } : chat));
      return true;
    }
    return false;
  }, []);

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
      fetchPosts({}, true); // refresh to show new user avatar on authored posts
      fetchChats(); 
      return true;
    }
    return false;
  };

  return (
    <MockContext.Provider value={{
      currentUser, isLoggedIn, loginAuth, registerAuth, logout,
      posts, postsHasMore, postsLoading, postsTotal, fetchPosts, getPostById, getMyPosts, getMySummary, addPost, togglePostStatus, deletePost,
      myCards, addCard, updateCard, deleteCard,
      favoriteCards, isCardFavorite, toggleFavoriteCard, updateFavoriteRemark,
      chats, togglePinChat, sendMessage, updateChatRemark, toggleBlockChat, findOrCreateChat, getChatMessages, markChatRead, refreshChats: fetchChats,
      uploadFile, updateProfile
    }}>
      {children}
    </MockContext.Provider>
  );
}

export const useMockData = () => useContext(MockContext);
