import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { CalendarDays, MapPin, MessageSquare, Package, RefreshCw, Trash2 } from 'lucide-react';
import { useMockData } from '../contexts/MockData';
import { formatCardTime } from '../constants/materialCard';
import TopHeader from '../components/TopHeader';
import MaterialModal from '../components/MaterialModal';
import './PostDetail.css';
import LoginPrompt from '../components/LoginPrompt';
import ConfirmDialog from '../components/ConfirmDialog';

export default function PostDetail() {
  const { id } = useParams();
  const nav = useNavigate();
  const { posts, getPostById, currentUser, isLoggedIn, togglePostStatus, deletePost, findOrCreateChat } = useMockData();
  const [post,setPost]=useState(()=>posts.find(item=>item.id===id)||null); const [loading,setLoading]=useState(!post);
  const [selectedCard, setSelectedCard] = useState(null);
  const [changingStatus, setChangingStatus] = useState(false);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [deletingPost, setDeletingPost] = useState(false);
  const [deleteError, setDeleteError] = useState('');
  useEffect(()=>{if(post)return;let active=true;getPostById(id).then(item=>{if(active){setPost(item);setLoading(false)}});return()=>{active=false}},[id,getPostById,post]);

  if (loading) return <div className="page-container post-not-found">正在加载…</div>;
  if (!post) return <div className="page-container post-not-found">帖子不存在</div>;
  const isMine = Boolean(currentUser && post.author.id === currentUser.id);
  const finished = post.status === '已换完';

  const handleStatusChange = async () => {
    if (!isMine || changingStatus) return;
    const previousStatus = post.status;
    const nextStatus = finished ? '未换完' : '已换完';
    setChangingStatus(true);
    setPost((current) => ({ ...current, status: nextStatus }));
    const result = await togglePostStatus(post.id);
    if (!result.ok) {
      setPost((current) => ({ ...current, status: previousStatus }));
      alert('状态更新失败，请稍后重试');
    } else if (result.status !== nextStatus) {
      setPost((current) => ({ ...current, status: result.status }));
    }
    setChangingStatus(false);
  };
  const handleDelete = async () => {
    if (deletingPost) return;
    setDeletingPost(true); setDeleteError('');
    if (await deletePost(post.id)) nav('/community', { replace: true });
    else { setDeletingPost(false); setDeleteError('删除失败，请稍后重试'); }
  };
  const handleDM = async () => {
    if (!isLoggedIn) { setShowLoginPrompt(true); return; }
    const chatId = await findOrCreateChat(post.author.id);
    nav(`/chat/${chatId}`);
  };

  return <div className="page-container post-detail-page animate-fade-in">
    <TopHeader title="帖子详情" showBack/>
    <main className="post-detail-content">
      <article className="post-detail-sheet">
        <header className="post-detail-author">
          <div className="author-identity"><img src={post.author.avatar} alt={post.author.name}/><div><strong>{post.author.name}</strong></div></div>
          {!isMine && <button className="dm-button" onClick={handleDM}><MessageSquare size={15}/>私信</button>}
        </header>

        <div className="post-detail-heading">
          <button className={`post-status-pill ${finished ? 'finished' : 'active'} ${isMine ? 'editable' : ''}`} onClick={handleStatusChange} disabled={!isMine || changingStatus}>
            <i/>{finished ? '换完了' : '交换中'}{isMine && <RefreshCw size={11} className={changingStatus ? 'spin' : ''}/>} 
          </button>
          <h1>{post.title}</h1>
        </div>

        {post.content && <div className="post-detail-body">{post.content}</div>}

        {post.images?.length > 0 && <div className={`post-detail-images images-${Math.min(post.images.length,3)}`}>{post.images.map((image,index)=><img key={image+index} src={image} alt={`帖子图片 ${index+1}`}/>)}</div>}

        {post.materialCards?.length > 0 && <section className="detail-material-section">
          <div className="detail-section-title"><div><small>MATERIAL SNAPSHOT</small><h2>关联物料卡</h2></div><span>{post.materialCards.length} 张</span></div>
          <div className={`detail-material-grid count-${post.materialCards.length}`}>
            {post.materialCards.map(card => <button className="detail-material-card" key={card.sourceCardId || card.id} onClick={() => setSelectedCard(card)}>
              <div className="detail-material-cover"><img src={card.images?.[0] || card.image} alt={card.name}/><div className="detail-cover-tags"><span>{card.eventTag || '其他'}</span><b>{card.exchangeMethod || '互换'}</b></div></div>
              <div className="detail-material-copy"><div className="detail-material-name"><strong>{card.name}</strong><span>{card.quantity || 1}<small>份</small></span></div>
                <p><CalendarDays size={13}/>{card.startTime ? `${formatCardTime(card.startTime)} — ${formatCardTime(card.endTime)}` : card.time || '时间未填写'}</p>
                <p><MapPin size={13}/>{card.location}</p>
              </div>
            </button>)}
          </div>
        </section>}
      </article>

      {isMine && <aside className="owner-actions"><div><Package size={17}/><span>这是你发布的帖子</span></div><button className="owner-status-button" onClick={handleStatusChange} disabled={changingStatus}><RefreshCw size={14}/>{finished ? '恢复为交换中' : '标记为换完了'}</button><button className="delete-post-button" onClick={()=>{setShowDeleteConfirm(true);setDeleteError('')}}><Trash2 size={14}/>删除帖子</button></aside>}
    </main>
    <MaterialModal card={selectedCard} onClose={() => setSelectedCard(null)}/>
    {showLoginPrompt&&<LoginPrompt message="登录后即可发私信" onClose={()=>setShowLoginPrompt(false)}/>} 
    {showDeleteConfirm&&<ConfirmDialog title="删除帖子？" message={`确定删除“${post.title}”吗？`} description="删除后无法撤销，其他人也将无法继续查看这条帖子。" loading={deletingPost} error={deleteError} onCancel={()=>setShowDeleteConfirm(false)} onConfirm={handleDelete}/>}
  </div>;
}
