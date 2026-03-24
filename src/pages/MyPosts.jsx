// src/pages/MyPosts.jsx
import TopHeader from '../components/TopHeader';
import PostCard from '../components/PostCard';
import { useMockData } from '../contexts/MockData';

export default function MyPosts() {
  const { posts, currentUser } = useMockData();
  const myPosts = posts.filter(p => p.author.id === currentUser.id);

  return (
    <div className="page-container animate-fade-in" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <TopHeader title="我的帖子" showBack={true} />
      <div style={{ padding: '12px' }}>
        {myPosts.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-secondary)' }}>您还没有发布过帖子</div>
        ) : (
          myPosts.map(post => (
            <PostCard key={post.id} post={post} />
          ))
        )}
      </div>
    </div>
  );
}
