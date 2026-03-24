import { useNavigate } from 'react-router-dom';
import './PostCard.css';

export default function PostCard({ post }) {
  const navigate = useNavigate();

  return (
    <div className="postcard card animate-fade-in" onClick={() => navigate(`/post/${post.id}`)}>
      <div className="postcard-header">
        <div className="postcard-user">
          <img src={post.author.avatar} alt="avatar" className="avatar" />
          <span className="username">{post.author.name}</span>
        </div>
        <div className={`status-badge ${post.status === '已换完' ? 'finished' : 'active'}`}>
          {post.status}
        </div>
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
    </div>
  );
}
