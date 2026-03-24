import { useParams, useNavigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockData';
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Image as ImageIcon, CreditCard } from 'lucide-react';
import '../components/TopHeader.css';

export default function ChatDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { chats, sendMessage, togglePinChat, currentUser, getChatMessages } = useMockData();
  const chat = chats.find(c => c.id === id);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (chat) {
      getChatMessages(chat.id).then(setMessages);
    }
  }, [chat, getChatMessages]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  if (!chat) return <div className="page-container" style={{padding:'20px'}}>会话不存在</div>;

  const handleSend = async () => {
    if (!inputText.trim()) return;
    await sendMessage(chat.id, {
      type: 'text',
      content: inputText
    });
    getChatMessages(chat.id).then(setMessages);
    setInputText('');
  };

  const handleTogglePin = () => {
    togglePinChat(chat.id);
  };

  const handleSendMockedCard = async () => {
    await sendMessage(chat.id, {
      type: 'card',
      content: '[物料卡分享] 新建物料'
    });
    getChatMessages(chat.id).then(setMessages);
  };

  return (
    <div className="page-container animate-fade-in" style={{ backgroundColor: '#f5f7fa', minHeight: '100vh', paddingBottom: '70px', display: 'flex', flexDirection: 'column' }}>
      <header className="top-header" style={{ padding: '0 16px', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="header-left" style={{ width: '60px' }}>
          <button className="icon-btn" onClick={() => nav(-1)}>
            <ChevronLeft size={24} />
          </button>
        </div>
        <div className="header-title" style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}>
          <img src={chat.user.avatar} style={{ width: '28px', height: '28px', borderRadius: '50%', objectFit: 'cover' }} />
          <span>{chat.user.name}</span>
        </div>
        <div className="header-right" style={{ width: '60px', justifyContent: 'flex-end' }}>
          <button onClick={handleTogglePin} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', border: '1px solid', color: chat.isPinned ? 'white' : 'var(--text-secondary)', backgroundColor: chat.isPinned ? 'var(--primary)' : 'transparent', fontWeight: 'bold' }}>
            {chat.isPinned ? '取消置顶' : '置顶'}
          </button>
        </div>
      </header>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map(msg => {
          const isMe = msg.senderId === currentUser.id;
          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '12px', alignItems: 'flex-start' }}>
              <img src={isMe ? currentUser.avatar : chat.user.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ maxWidth: '70%' }}>
                <div style={{ padding: '10px 14px', borderRadius: '16px', borderTopRightRadius: isMe ? '4px' : '16px', borderTopLeftRadius: !isMe ? '4px' : '16px', backgroundColor: isMe ? 'var(--primary)' : 'white', color: isMe ? 'white' : 'var(--text-main)', fontSize: '15px', lineHeight: '1.5', wordBreak: 'break-word', boxShadow: '0 2px 6px rgba(0,0,0,0.04)' }}>
                  {msg.content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid var(--border)', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', display: 'flex', alignItems: 'flex-end', gap: '12px', zIndex: 100 }}>
        <button className="icon-btn" onClick={handleSendMockedCard}><ImageIcon size={24} color="var(--text-secondary)" /></button>
        <button className="icon-btn" onClick={handleSendMockedCard}><CreditCard size={24} color="var(--text-secondary)" /></button>
        <textarea 
          value={inputText}
          onChange={e => setInputText(e.target.value)}
          placeholder="发送消息..."
          rows={1}
          style={{ flex: 1, border: 'none', backgroundColor: '#f0f2f5', borderRadius: '18px', padding: '10px 16px', fontSize: '15px', resize: 'none', maxHeight: '80px', outline: 'none' }}
        />
        <button onClick={handleSend} style={{ backgroundColor: inputText.trim() ? 'var(--primary)' : '#c0c4cc', color: 'white', width: '38px', height: '38px', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background-color 0.2s', padding: 0, border: 'none' }}>
          <Send size={18} style={{ transform: 'translateX(-1px) translateY(1px)' }} />
        </button>
      </div>
    </div>
  );
}
