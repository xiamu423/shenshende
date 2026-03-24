import TopHeader from '../components/TopHeader';
import PostCard from '../components/PostCard';
import { useMockData } from '../contexts/MockData';
import { useNavigate } from 'react-router-dom';

export default function Community() {
  const { posts } = useMockData();
  const nav = useNavigate();

  return (
    <div className="page-container animate-fade-in">
      <TopHeader title="社区" showAdd={true} onAdd={() => nav('/create-post')} />
      <div style={{ padding: '12px' }}>
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
      </div>
    </div>
  );
}
