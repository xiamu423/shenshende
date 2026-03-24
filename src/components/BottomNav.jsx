import { NavLink } from 'react-router-dom';
import { Home, MessageCircle, User } from 'lucide-react';
import './BottomNav.css';

export default function BottomNav() {
  const tabs = [
    { path: '/community', label: '社区', icon: Home },
    { path: '/chat', label: '聊天', icon: MessageCircle },
    { path: '/profile', label: '我的', icon: User }
  ];

  return (
    <nav className="bottom-nav">
      {tabs.map(tab => (
        <NavLink 
          key={tab.path} 
          to={tab.path} 
          className={({ isActive }) => `nav-item ${isActive ? 'active' : ''}`}
        >
          <tab.icon className="nav-icon" size={24} />
          <span className="nav-label">{tab.label}</span>
        </NavLink>
      ))}
    </nav>
  );
}
