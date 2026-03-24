import { useParams, useNavigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockData';
import TopHeader from '../components/TopHeader';
import { useState } from 'react';
import { MessageSquare } from 'lucide-react';
import MaterialModal from '../components/MaterialModal';

export default function PostDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { posts, currentUser, togglePostStatus, deletePost, findOrCreateChat } = useMockData();
  const post = posts.find(p => p.id === id);
  const [selectedCard, setSelectedCard] = useState(null);

  if (!post) return <div className="page-container" style={{padding:'20px'}}>帖子不存在</div>;

  const isMine = post.author.id === currentUser.id;

  const handleStatusChange = () => {
    if (isMine) togglePostStatus(post.id);
  };

  const handleDelete = async () => {
    if (window.confirm('确定要永久删除这条帖子吗？所有的照片和评论关联都会被清空。')) {
      const success = await deletePost(post.id);
      if (success) {
        nav(-1);
      } else {
        alert('删除失败，请稍后重试');
      }
    }
  };

  const handleDM = async () => {
    const chatId = await findOrCreateChat(post.author.id);
    nav(`/chat/${chatId}`);
  };

  return (
    <div className="page-container animate-fade-in" style={{ backgroundColor: 'white', minHeight: '100vh', paddingBottom: '30px' }}>
      <TopHeader title="帖子详情" showBack={true} />
      
      <div style={{ padding: '16px' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '20px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img src={post.author.avatar} alt="avatar" style={{ width: '48px', height: '48px', borderRadius: '50%', border: '1px solid var(--border)', objectFit: 'cover' }} />
            <span style={{ fontWeight: 'bold', fontSize: '15px' }}>{post.author.name}</span>
          </div>
          {!isMine && (
            <button onClick={handleDM} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '8px 16px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '24px', fontSize: '13px', boxShadow: '0 2px 8px rgba(34,66,148,0.2)' }}>
              <MessageSquare size={16} /> 私信
            </button>
          )}
        </div>
        
        <h1 style={{ fontSize: '19px', marginBottom: '16px', lineHeight: '1.4', fontWeight: 'bold' }}>{post.title}</h1>
        
        <div style={{ display: 'flex', gap: '12px', marginBottom: '20px' }}>
          <button 
            onClick={handleStatusChange} 
            style={{ flex: 1, padding: '6px 14px', borderRadius: '16px', fontSize: '13px', border: isMine ? '1px solid var(--primary)' : 'none', backgroundColor: post.status === '已换完' ? 'var(--border)' : '#e5edff', color: post.status === '已换完' ? 'var(--text-secondary)' : 'var(--primary)', fontWeight: 'bold' }}
          >
            状态：{post.status} {isMine && '(点击切换)'}
          </button>
          
          {isMine && (
            <button
              onClick={handleDelete}
              style={{ padding: '6px 14px', borderRadius: '16px', fontSize: '13px', border: '1px solid #ef4444', backgroundColor: '#fef2f2', color: '#ef4444', fontWeight: 'bold' }}
            >
              删除帖子
            </button>
          )}
        </div>
        
        <p style={{ fontSize: '15.5px', color: 'var(--text-main)', lineHeight: '1.7', marginBottom: '24px', whiteSpace: 'pre-wrap' }}>
          {post.content}
        </p>
        
        {post.images && post.images.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {post.images.map((img, idx) => (
              <img key={idx} src={img} alt="post content" style={{ width: '100%', borderRadius: '12px', boxShadow: '0 2px 8px rgba(0,0,0,0.05)' }} />
            ))}
          </div>
        )}

        {post.materialCards && post.materialCards.length > 0 && (
          <div style={{ marginTop: '32px', paddingTop: '20px', borderTop: '1px solid var(--border)' }}>
            <h3 style={{ fontSize: '15px', marginBottom: '16px', color: 'var(--text-main)', fontWeight: 'bold' }}>附带物料卡</h3>
            <div style={{ display: 'flex', gap: '16px', overflowX: 'auto', paddingBottom: '12px', WebkitOverflowScrolling: 'touch' }}>
              {post.materialCards.map(card => (
                <div key={card.id} onClick={() => setSelectedCard(card)} style={{ width: '130px', flexShrink: 0, border: '1px solid var(--border)', borderRadius: '12px', overflow: 'hidden', cursor: 'pointer', boxShadow: '0 2px 6px rgba(0,0,0,0.06)' }}>
                  <img src={card.image} style={{ width: '100%', height: '130px', objectFit: 'cover' }} />
                  <div style={{ padding: '10px 8px', fontSize: '12px', textAlign: 'center', backgroundColor: '#fcfaf0', color: 'var(--primary)', fontWeight: 'bold' }}>{card.name}</div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <MaterialModal card={selectedCard} onClose={() => setSelectedCard(null)} />
    </div>
  );
}
