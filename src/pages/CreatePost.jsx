import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Check, LoaderCircle, Plus } from 'lucide-react';
import { useMockData } from '../contexts/MockData';
import './CreatePost.css';

const DRAFT_KEY = 'create-post-draft';

export default function CreatePost() {
  const nav = useNavigate();
  const { addPost, myCards } = useMockData();
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('未换完');
  const [content, setContent] = useState('');
  const [selectedCards, setSelectedCards] = useState([]);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const saved = sessionStorage.getItem(DRAFT_KEY);
    if (!saved) return;
    try {
      const draft = JSON.parse(saved);
      setTitle(draft.title || ''); setStatus(draft.status || '未换完');
      setContent(draft.content || ''); setSelectedCards(draft.selectedCards || []);
    } finally { sessionStorage.removeItem(DRAFT_KEY); }
  }, []);

  const handlePublish = async () => {
    if (!title.trim()) return alert('请输入标题');
    if (title.length > 15) return alert('标题最多15字');
    if (content.length > 1000) return alert('正文最多1000字');
    setPublishing(true);
    await addPost({ title: title.trim(), content, status, images: [], materialCardIds: selectedCards });
    setPublishing(false);
    sessionStorage.removeItem(DRAFT_KEY);
    nav('/community', { replace: true });
  };

  const toggleCard = (id) => {
    if (selectedCards.includes(id)) return setSelectedCards(selectedCards.filter(cardId => cardId !== id));
    if (selectedCards.length >= 3) return alert('最多选择3个物料卡');
    setSelectedCards([...selectedCards, id]);
  };

  const createMaterialCard = () => {
    sessionStorage.setItem(DRAFT_KEY, JSON.stringify({ title, status, content, selectedCards }));
    nav('/create-card?returnTo=/create-post');
  };

  return <div className="page-container post-editor-page animate-fade-in">
    <header className="top-header post-editor-header">
      <button className="post-editor-cancel" onClick={() => nav(-1)}>取消</button>
      <h1 className="header-title">发布帖子</h1>
      <button className="post-editor-publish" onClick={handlePublish} disabled={publishing}>{publishing ? <LoaderCircle size={16} className="spin"/> : '发布'}</button>
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
          {myCards.map(card => {
            const selected = selectedCards.includes(card.id);
            return <button type="button" className={`post-material-option ${selected ? 'selected' : ''}`} key={card.id} onClick={() => toggleCard(card.id)}>
              <div className="post-material-cover"><img src={card.images?.[0] || card.image} alt={card.name}/>{selected && <span className="selected-check"><Check size={13} strokeWidth={3}/></span>}</div>
              <div className="post-material-copy"><small>{card.eventTag || '其他'}</small><strong>{card.name}</strong></div>
            </button>;
          })}
        </div>
      </section>
    </main>
  </div>;
}
