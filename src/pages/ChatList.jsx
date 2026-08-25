import { useNavigate } from 'react-router-dom';
import { MessageCircle, Pin } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import { useMockData } from '../contexts/MockData';
import './ChatList.css';
import './CommunityPageBackground.css';
import './ChatUnread.css';

export default function ChatList() {
  const { chats } = useMockData();
  const nav = useNavigate();
  const sortedChats = [...chats].sort((a,b) => Number(b.isPinned) - Number(a.isPinned));
  const totalUnread = chats.reduce((total, chat) => total + Number(chat.unreadCount || 0), 0);


  return <div className="page-container chat-list-page animate-fade-in">
    <TopHeader title="聊天"/>
    <main className="chat-inbox">
      <section className="chat-inbox-heading"><div><small>MESSAGES</small><h1>私信</h1></div>{totalUnread > 0 && <span>{totalUnread > 99 ? '99+' : totalUnread}</span>}</section>
      {sortedChats.length === 0 ? <div className="chat-empty"><span><MessageCircle size={28}/></span><h2>暂时没有私信</h2><p>从帖子详情页联系物料主后，会话会显示在这里。</p></div> : <section className="chat-list-card">
        {sortedChats.map(chat => {
          const lastMessage = chat.lastMessage || chat.messages?.[chat.messages.length - 1];
          return <button className={`chat-conversation ${chat.isPinned ? 'is-pinned' : ''}`} key={chat.id} onClick={() => nav(`/chat/${chat.id}`)}>
            <div className="conversation-avatar"><img src={chat.user.avatar} alt={chat.user.name}/></div>
            <div className="conversation-main"><div className="conversation-title"><strong>{chat.user.name}</strong>{chat.isPinned && <span><Pin size={9} fill="currentColor"/>置顶</span>}</div><p>{previewMessage(lastMessage)}</p></div>
            {chat.unreadCount > 0 ? <span className="conversation-unread">{chat.unreadCount > 99 ? '99+' : chat.unreadCount}</span> : <span className="conversation-arrow">›</span>}
          </button>;
        })}
      </section>}
    </main>
  </div>;
}

function previewMessage(message) {
  if (!message) return '还没有消息，去打个招呼吧';
  if (message.type === 'image') return '[图片]';
  if (message.type === 'card') return '[物料卡]';
  return message.content || '还没有消息';
}
