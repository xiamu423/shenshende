// src/pages/MyPosts.jsx
import TopHeader from '../components/TopHeader';
import PostCard from '../components/PostCard';
import { useMockData } from '../contexts/MockData';
import { useEffect, useState } from 'react';

export default function MyPosts() {
  const { getMyPosts } = useMockData();
  const [myPosts,setMyPosts]=useState([]); const [loading,setLoading]=useState(true);
  useEffect(()=>{let active=true;getMyPosts().then(items=>{if(active){setMyPosts(items);setLoading(false)}});return()=>{active=false}},[getMyPosts]);

  return (
    <div className="page-container animate-fade-in" style={{ minHeight: '100vh', backgroundColor: 'var(--bg)' }}>
      <TopHeader title="我的帖子" showBack={true} />
      <div className="post-feed" style={{ padding: '12px' }}>
        {loading ? <div style={{ textAlign:'center',padding:'40px',color:'var(--text-secondary)' }}>正在加载…</div> : myPosts.length === 0 ? (
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
