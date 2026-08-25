import { NavLink } from 'react-router-dom';
import { useEffect } from 'react';
import { Home, MessageCircle, User } from 'lucide-react';
import { useMockData } from '../contexts/MockData';
import './BottomNav.css';
import './BottomNavUnread.css';

export default function BottomNav() {
  const { chats, refreshChats, isLoggedIn } = useMockData();
  const unreadCount = chats.reduce((total, chat) => total + Number(chat.unreadCount || 0), 0);
  useEffect(() => {
    if (!isLoggedIn) return undefined;
    refreshChats();
    const timer = window.setInterval(refreshChats, 3000);
    return () => window.clearInterval(timer);
  }, [refreshChats, isLoggedIn]);
  const tabs = [
    { path: '/community', label: '社区', icon: Home },
    { path: '/chat', label: '聊天', icon: MessageCircle },
    { path: '/profile', label: '我的', icon: User }
  ];

  return (
    <nav className="bottom-nav">
      <div className="nav-brand">
        <span className="brand-mark">米</span>
        <div><strong>COMINO WORLD</strong><small>交换热爱与纪念</small></div>
      </div>
      {tabs.map(tab => (
        <NavLink 
          key={tab.path} 
          to={tab.path} 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <span className="nav-icon-wrap"><tab.icon className="nav-icon" size={24} />{tab.path === '/chat' && unreadCount > 0 && <span className="nav-unread-badge">{unreadCount > 99 ? '99+' : unreadCount}</span>}</span>
          <span className="nav-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
