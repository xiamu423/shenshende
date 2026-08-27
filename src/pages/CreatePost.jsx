import { useEffect, useMemo, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { Check, LoaderCircle, Plus } from 'lucide-react';
import { useMockData } from '../contexts/MockData';
import LazyThumbnail from '../components/LazyThumbnail';
import './CreatePost.css';
import './PostEditing.css';

const DRAFT_KEY = 'create-post-draft';

export default function CreatePost() {
  const nav = useNavigate();
  const { id } = useParams();
  const editing = Boolean(id);
  const draftKey = editing ? `${DRAFT_KEY}-${id}` : DRAFT_KEY;
  const { addPost, updatePost, getPostById, currentUser, myCards } = useMockData();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('未换完');
  const [content, setContent] = useState('');
  const [selectedCards, setSelectedCards] = useState([]);
  const [snapshotCards, setSnapshotCards] = useState([]);
  const [publishing, setPublishing] = useState(false);
  const [loading, setLoading] = useState(editing);
  const [loadError, setLoadError] = useState('');

  useEffect(() => {
    let active = true;
    const load = async () => {
      if (editing) {
        const post = await getPostById(id);
        if (!active) return;
        if (!post) { setLoadError('帖子不存在'); setLoading(false); return; }
        if (!currentUser || post.author?.id !== currentUser.id) { setLoadError('你无权编辑这条帖子'); setLoading(false); return; }
        setTitle(post.title || ''); setStatus(post.status || '未换完'); setContent(post.content || '');
        setSnapshotCards(post.materialCards || []);
        setSelectedCards((post.materialCards || []).map(card => card.sourceCardId || card.id).filter(Boolean));
      }
      const saved = sessionStorage.getItem(draftKey);
      if (saved) {
        try {
          const draft = JSON.parse(saved);
          setTitle(draft.title || ''); setStatus(draft.status || '未换完');
          setContent(draft.content || ''); setSelectedCards(draft.selectedCards || []);
        } finally { sessionStorage.removeItem(draftKey); }
      }
      setLoading(false);
    };
    load();
    return () => { active = false; };
  }, [currentUser, draftKey, editing, getPostById, id]);

  const availableCards = useMemo(() => {
    const currentIds = new Set(myCards.map(card => card.id));
    const archived = snapshotCards.filter(card => !currentIds.has(card.sourceCardId || card.id)).map(card => ({ ...card, id: card.sourceCardId || card.id, archivedSnapshot: true }));
    return [...myCards, ...archived];
  }, [myCards, snapshotCards]);

  const handlePublish = async () => {
    if (!title.trim()) return alert('请输入标题');
    if (title.length > 15) return alert('标题最多15字');
    if (content.length > 1000) return alert('正文最多1000字');
    setPublishing(true);
    const payload = { title: title.trim(), content, status, images: [], materialCardIds: selectedCards };
    const result = editing ? await updatePost(id, payload) : await addPost(payload);
    setPublishing(false);
    if (editing && !result.ok) return alert(result.error);
    sessionStorage.removeItem(draftKey);
    nav(editing ? `/post/${id}` : '/community', { replace: true });
  };

  const toggleCard = (id) => {
    if (selectedCards.includes(id)) return setSelectedCards(selectedCards.filter(cardId => cardId !== id));
    if (selectedCards.length >= 3) return alert('最多选择3个物料卡');
    setSelectedCards([...selectedCards, id]);
  };

  const createMaterialCard = () => {
    sessionStorage.setItem(draftKey, JSON.stringify({ title, status, content, selectedCards }));
    nav(`/create-card?returnTo=${encodeURIComponent(editing ? `/edit-post/${id}` : '/create-post')}`);
  };

  if (loading) return <div className="page-container post-editor-loading">正在加载帖子…</div>;
  if (loadError) return <div className="page-container post-editor-loading"><strong>{loadError}</strong><button onClick={()=>nav(-1)}>返回</button></div>;

  return <div className="page-container post-editor-page animate-fade-in">
    <header className="top-header post-editor-header">
      <button className="post-editor-cancel" onClick={() => nav(-1)}>取消</button>
      <h1 className="header-title">{editing ? '编辑帖子' : '发布帖子'}</h1>
      <button className="post-editor-publish" onClick={handlePublish} disabled={publishing}>{publishing ? <LoaderCircle size={16} className="spin"/> : editing ? '保存' : '发布'}</button>
    </header>

    <main className="post-editor-content">
      <section className="post-editor-section">
        <label className="post-field"><span className="post-required">标题</span><input value={title} maxLength={15} onChange={event => setTitle(event.target.value)}/></label>
        <div className="post-field"><span className="post-required">状态</span><div className="post-status-options"><button type="button" className={status === '未换完' ? 'active' : ''} onClick={() => setStatus('未换完')}>交换中</button><button type="button" className={status === '已换完' ? 'active' : ''} onClick={() => setStatus('已换完')}>换完了</button></div></div>
        <label className="post-field"><span>正文</span><textarea value={content} maxLength={1000} rows={7} onChange={event => setContent(event.target.value)}/></label>
      </section>

      <section className="post-editor-section material-selector-section">
        <div className="post-section-heading"><div><h2>勾选关联的物料卡（最多3个）</h2><p>已选择 {selectedCards.length} 个</p></div></div>
        <div className="post-material-list">
          <button type="button" className="post-material-add" onClick={createMaterialCard}><span><Plus size={25}/></span><strong>新建物料卡</strong></button>
          {availableCards.map(card => {
            const selected = selectedCards.includes(card.id);
            return <button type="button" className={`post-material-option ${selected ? 'selected' : ''}`} key={card.id} onClick={() => toggleCard(card.id)}>
              <div className="post-material-cover"><LazyThumbnail src={card.images?.[0] || card.image} alt={card.name}/>{selected && <span className="selected-check"><Check size={13} strokeWidth={3}/></span>}</div>
              <div className="post-material-copy"><small>{card.archivedSnapshot ? '历史快照' : card.eventTag || '其他'}</small><strong>{card.name}</strong></div>
            </button>;
          })}
        </div>
      </section>
    </main>
  </div>;
}
