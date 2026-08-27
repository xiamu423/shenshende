import { useNavigate } from 'react-router-dom';
import { useState } from 'react';
import { ArrowUpRight } from 'lucide-react';
import './PostCard.css';
import './PostCardMaterials.css';
import './PostCardMaterialTags.css';
import StatusStamp from './StatusStamp';
import MaterialModal from './MaterialModal';
import LazyThumbnail from './LazyThumbnail';

export default function PostCard({ post }) {
  const navigate = useNavigate();
  const [selectedCard, setSelectedCard] = useState(null);

  return <>
    <article className="postcard card" onClick={() => navigate(`/post/${post.id}`)}>
      <div className="postcard-header">
        <div className="postcard-user">
          <img src={post.author.avatar} alt="avatar" className="avatar" />
          <span className="username">{post.author.name}</span>
        </div>
        <StatusStamp finished={post.status === '已换完'} />
      </div>
      
      <h3 className="postcard-title">{post.title}</h3>
      <p className="postcard-content">{post.content}</p>
      
      {post.images && post.images.length > 0 && (
        <div className="postcard-images">
          {post.images.slice(0, 3).map((img, idx) => (
            <div key={idx} className="img-wrapper">
              <img src={img} alt="post" />
            </div>
          ))}
          {post.images.length > 3 && (
            <div className="img-more-overlay">+{post.images.length - 3}</div>
          )}
        </div>
      )}
      {post.materialCards?.length > 0 && (
        <div className={`postcard-materials materials-${Math.min(post.materialCards.length, 3)}`}>
          {post.materialCards.slice(0, 3).map((card) => (
            <button type="button" className="postcard-material" key={card.sourceCardId || card.id} onClick={(event) => { event.stopPropagation(); setSelectedCard(card); }}>
              <LazyThumbnail src={card.images?.[0] || card.image} alt={card.name}/><div className="material-shade"/>
              <div className="material-top-tags"><span>{card.eventTag || '其他'}</span><b>{card.exchangeMethod || '互换'}</b></div>
              <span className="material-method">{card.exchangeMethod || '互换'}</span>
              <div className="material-copy"><small>{card.eventTag || '其他'}</small><strong>{card.name}</strong><em>{card.quantity || 1} 份</em></div>
            </button>
          ))}
        </div>
      )}
      <div className="postcard-footer"><span>查看交换详情</span><ArrowUpRight size={15} /></div>
    </article>
    <MaterialModal card={selectedCard} onClose={() => setSelectedCard(null)}/>
  </>;
}
