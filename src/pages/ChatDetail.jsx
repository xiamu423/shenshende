import { useParams, useNavigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockData';
import { useState, useRef, useEffect } from 'react';
import { ChevronLeft, Send, Image as ImageIcon, CreditCard, X } from 'lucide-react';
import MaterialModal from '../components/MaterialModal';
import '../components/TopHeader.css';

export default function ChatDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { chats, sendMessage, togglePinChat, currentUser, getChatMessages, uploadFile, myCards } = useMockData();
  const chat = chats.find(c => c.id === id);
  const [inputText, setInputText] = useState('');
  const [messages, setMessages] = useState([]);
  const [isCardPickerOpen, setIsCardPickerOpen] = useState(false);
  const [selectedCardForView, setSelectedCardForView] = useState(null);
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    if (chat) {
      getChatMessages(chat.id).then(setMessages);
      const timer = setInterval(() => {
        getChatMessages(chat.id).then(setMessages);
      }, 3000);
      return () => clearInterval(timer);
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

  const handleImageSelect = async (e) => {
    const file = e.target.files[0];
    if (file) {
      const url = await uploadFile(file);
      if (url) {
        await sendMessage(chat.id, {
          type: 'image',
          content: url
        });
        getChatMessages(chat.id).then(setMessages);
      }
    }
  };

  const handleSendCard = async (card) => {
    await sendMessage(chat.id, {
      type: 'card',
      content: JSON.stringify(card)
    });
    setIsCardPickerOpen(false);
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
          <button onClick={() => togglePinChat(chat.id)} style={{ fontSize: '12px', padding: '4px 8px', borderRadius: '12px', border: '1px solid', color: chat.isPinned ? 'white' : 'var(--text-secondary)', backgroundColor: chat.isPinned ? 'var(--primary)' : 'transparent', fontWeight: 'bold' }}>
            {chat.isPinned ? '取消置顶' : '置顶'}
          </button>
        </div>
      </header>

      <div style={{ flex: 1, padding: '16px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px' }}>
        {messages.map(msg => {
          const isMe = msg.senderId === currentUser.id;
          let content;
          if (msg.type === 'image') {
            content = <img src={msg.content} alt="sent" style={{ maxWidth: '100%', borderRadius: '12px', cursor: 'pointer' }} onClick={() => window.open(msg.content)} />;
          } else if (msg.type === 'card') {
            try {
              const cardData = JSON.parse(msg.content);
              content = (
                <div 
                  onClick={() => setSelectedCardForView(cardData)}
                  style={{ width: '180px', backgroundColor: 'white', borderRadius: '12px', overflow: 'hidden', border: '1px solid var(--border)', cursor: 'pointer' }}
                >
                  <img src={cardData.image} style={{ width: '100%', height: '120px', objectFit: 'cover' }} />
                  <div style={{ padding: '8px', fontSize: '13px', textAlign: 'center', color: 'var(--primary)', fontWeight: 'bold', backgroundColor: '#fcfaf0' }}>
                    {cardData.name}
                  </div>
                </div>
              );
            } catch (e) {
              content = '[无效卡片数据]';
            }
          } else {
            content = msg.content;
          }

          return (
            <div key={msg.id} style={{ display: 'flex', flexDirection: isMe ? 'row-reverse' : 'row', gap: '12px', alignItems: 'flex-start' }}>
              <img src={isMe ? currentUser.avatar : chat.user.avatar} style={{ width: '40px', height: '40px', borderRadius: '50%', objectFit: 'cover' }} />
              <div style={{ maxWidth: '75%' }}>
                <div style={{ 
                  padding: msg.type === 'text' ? '10px 14px' : '4px', 
                  borderRadius: '16px', 
                  borderTopRightRadius: isMe ? '4px' : '16px', 
                  borderTopLeftRadius: !isMe ? '4px' : '16px', 
                  backgroundColor: isMe ? 'var(--primary)' : 'white', 
                  color: isMe ? 'white' : 'var(--text-main)', 
                  fontSize: '15px', 
                  lineHeight: '1.5', 
                  wordBreak: 'break-word', 
                  boxShadow: '0 2px 6px rgba(0,0,0,0.04)' 
                }}>
                  {content}
                </div>
              </div>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {isCardPickerOpen && (
        <div style={{ position: 'fixed', bottom: '80px', left: '16px', right: '16px', backgroundColor: 'white', borderRadius: '16px', boxShadow: '0 -4px 20px rgba(0,0,0,0.15)', zIndex: 200, padding: '16px', maxHeight: '50vh', overflowY: 'auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
            <span style={{ fontWeight: 'bold' }}>选择要发送的物料卡</span>
            <button onClick={() => setIsCardPickerOpen(false)} style={{ border: 'none', background: 'none' }}><X size={20} /></button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px' }}>
            {myCards.map(card => (
              <div key={card.id} onClick={() => handleSendCard(card)} style={{ cursor: 'pointer', textAlign: 'center' }}>
                <img src={card.image} style={{ width: '100%', aspectRatio: '1', borderRadius: '8px', objectFit: 'cover', border: '1px solid var(--border)' }} />
                <div style={{ fontSize: '11px', marginTop: '4px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{card.name}</div>
              </div>
            ))}
            {myCards.length === 0 && <div style={{ gridColumn: 'span 3', padding: '20px', color: 'var(--text-secondary)', fontSize: '13px' }}>暂无物料卡</div>}
          </div>
        </div>
      )}

      <div style={{ position: 'fixed', bottom: 0, left: 0, right: 0, backgroundColor: 'white', borderTop: '1px solid var(--border)', padding: '12px 16px', paddingBottom: 'calc(12px + env(safe-area-inset-bottom))', display: 'flex', alignItems: 'flex-end', gap: '12px', zIndex: 100 }}>
        <input type="file" ref={fileInputRef} onChange={handleImageSelect} accept="image/*" style={{ display: 'none' }} />
        <button className="icon-btn" onClick={() => fileInputRef.current.click()}><ImageIcon size={24} color="var(--text-secondary)" /></button>
        <button className="icon-btn" onClick={() => setIsCardPickerOpen(!isCardPickerOpen)}><CreditCard size={24} color="var(--text-secondary)" /></button>
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

      <MaterialModal card={selectedCardForView} onClose={() => setSelectedCardForView(null)} />
    </div>
  );
}
