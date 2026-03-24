// src/pages/ChatList.jsx
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import { useMockData } from '../contexts/MockData';
import { useRef } from 'react';

export default function ChatList() {
  const { chats, togglePinChat } = useMockData();
  const nav = useNavigate();
  const timerRef = useRef(null);

  const handlePointerDown = (id, e) => {
    e.stopPropagation();
    timerRef.current = setTimeout(() => {
      togglePinChat(id);
      timerRef.current = null;
    }, 600); // 600ms long press
  };

  const handlePointerUp = () => {
    if (timerRef.current) {
      clearTimeout(timerRef.current);
      timerRef.current = null;
    }
  };

  const handleClick = (id) => {
    nav(`/chat/${id}`);
  };

  const sortedChats = [...chats].sort((a,b) => (b.isPinned ? 1 : 0) - (a.isPinned ? 1 : 0));

  return (
    <div className="page-container animate-fade-in" style={{ backgroundColor: 'white', minHeight: '100vh', userSelect: 'none' }}>
      <TopHeader title="聊天" />
      <div>
        {sortedChats.length === 0 ? (
          <div style={{ padding: '40px 20px', textAlign: 'center', color: 'var(--text-secondary)' }}>暂无私信</div>
        ) : (
          sortedChats.map(chat => {
            const lastMsg = chat.messages[chat.messages.length - 1];
            return (
              <div 
                key={chat.id} 
                onClick={() => handleClick(chat.id)}
                onPointerDown={e => handlePointerDown(chat.id, e)}
                onPointerUp={handlePointerUp}
                onPointerLeave={handlePointerUp}
                style={{ display: 'flex', alignItems: 'center', padding: '16px', borderBottom: '1px solid var(--border)', backgroundColor: chat.isPinned ? '#f8fafd' : 'white', cursor: 'pointer' }}
              >
                <img src={chat.user.avatar} style={{ width: '48px', height: '48px', borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--border)' }} draggable="false" />
                <div style={{ marginLeft: '12px', flex: 1, overflow: 'hidden' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
                    <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{chat.user.name}</span>
                    {chat.isPinned && <span style={{ fontSize: '11px', color: 'var(--primary)', backgroundColor: '#e5edff', padding: '2px 6px', borderRadius: '4px' }}>置顶</span>}
                  </div>
                  <div style={{ fontSize: '14px', color: 'var(--text-secondary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                    {lastMsg ? lastMsg.content : '开始聊天吧'}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
      <div style={{ textAlign: 'center', padding: '20px', fontSize: '12px', color: 'var(--text-secondary)' }}>长按一条聊天记录可实现置顶/取消置顶操作</div>
    </div>
  );
}
