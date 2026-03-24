import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockData';
import TopHeader from '../components/TopHeader';

export default function CreatePost() {
  const nav = useNavigate();
  const { addPost, currentUser, myCards, uploadFile } = useMockData();
  
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('未换完');
  const [content, setContent] = useState('');
  const [selectedCards, setSelectedCards] = useState([]);
  const [images, setImages] = useState([]); 

  const handlePublish = () => {
    if (!title.trim()) return alert('请输入标题');
    if (title.length > 15) return alert('标题最多15字');
    if (content.length > 1000) return alert('正文最多1000字');
    
    const newPost = {
      id: 'p' + Date.now(),
      author: currentUser,
      title,
      content,
      status,
      time: Date.now(),
      images,
      materialCards: selectedCards.map(id => myCards.find(c => c.id === id))
    };
    
    addPost(newPost);
    nav('/community');
  };

  const toggleCard = (id) => {
    if (selectedCards.includes(id)) {
      setSelectedCards(selectedCards.filter(cId => cId !== id));
    } else {
      if (selectedCards.length >= 3) return alert('最多选择3个物料卡');
      setSelectedCards([...selectedCards, id]);
    }
  };

  const handleAddImage = () => {
    if (images.length >= 9) return alert('最多9张图片');
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = await uploadFile(file);
        if (url) setImages(prev => [...prev, url]);
      }
    };
    input.click();
  };

  return (
    <div className="page-container animate-fade-in" style={{ backgroundColor: 'white', minHeight: '100vh', paddingBottom: '30px' }}>
      <header className="top-header" style={{ padding: '0 16px', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="header-left" style={{ width: '40px' }}>
          <button className="icon-btn" onClick={() => nav(-1)} style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>取消</button>
        </div>
        <h1 className="header-title" style={{ flex: 1, textAlign: 'center', fontSize: '16px', margin: 0 }}>发布帖子</h1>
        <div className="header-right" style={{ width: '40px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handlePublish} style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '6px 14px', borderRadius: '16px', fontSize: '14px', fontWeight: 'bold' }}>发布</button>
        </div>
      </header>

      <div style={{ padding: '16px' }}>
        <input 
          type="text" 
          placeholder="填写标题（必填，最多15字）" 
          value={title} 
          onChange={e => setTitle(e.target.value)}
          maxLength={15}
          style={{ width: '100%', fontSize: '18px', fontWeight: 'bold', border: 'none', borderBottom: '1px solid var(--border)', padding: '12px 0', marginBottom: '16px' }}
        />
        
        <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px' }}>
          <span style={{ fontSize: '14px', color: 'var(--text-secondary)' }}>物料状态 (必填):</span>
          <select value={status} onChange={e => setStatus(e.target.value)} style={{ padding: '6px 12px', borderRadius: '16px', border: '1px solid var(--border)', outline: 'none', backgroundColor: '#fcfaf0', fontSize: '14px', color: 'var(--primary)', fontWeight: 'bold' }}>
            <option value="未换完">未换完</option>
            <option value="已换完">已换完</option>
          </select>
        </div>

        <textarea 
          placeholder="添加正文（选填，最多1000字）"
          value={content}
          onChange={e => setContent(e.target.value)}
          maxLength={1000}
          rows={6}
          style={{ width: '100%', fontSize: '15px', border: 'none', resize: 'none', marginBottom: '16px', lineHeight: '1.6' }}
        />

        <div style={{ marginBottom: '24px' }}>
          <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>图片 ({images.length}/9)</div>
          <div style={{ display: 'flex', gap: '12px', flexWrap: 'wrap' }}>
            {images.map((img, i) => (
              <img key={i} src={img} alt="upload" style={{ width: '80px', height: '80px', objectFit: 'cover', borderRadius: '8px' }} />
            ))}
            {images.length < 9 && (
              <button onClick={handleAddImage} style={{ width: '80px', height: '80px', borderRadius: '8px', border: '1px dashed var(--border)', backgroundColor: 'var(--bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', color: 'var(--text-secondary)' }}>+</button>
            )}
          </div>
        </div>

        <div>
           <div style={{ fontSize: '14px', color: 'var(--text-secondary)', marginBottom: '12px' }}>关联物料卡 (选填，最多3个)</div>
           {myCards.length === 0 ? (
             <div style={{ fontSize: '13px', color: 'var(--text-secondary)', padding: '16px', backgroundColor: 'var(--bg)', borderRadius: '8px', textAlign: 'center' }}>
               您还没有物料卡，可前往“我的”页面创建
             </div>
           ) : (
             <div style={{ display: 'flex', gap: '12px', overflowX: 'auto', paddingBottom: '8px' }}>
               {myCards.map(card => (
                 <div 
                   key={card.id} 
                   onClick={() => toggleCard(card.id)}
                   style={{ width: '110px', flexShrink: 0, border: selectedCards.includes(card.id) ? '2px solid var(--primary)' : '1px solid var(--border)', borderRadius: '8px', overflow: 'hidden', cursor: 'pointer', position: 'relative' }}
                 >
                   <img src={card.image} style={{ width: '100%', height: '80px', objectFit: 'cover' }} />
                   <div style={{ padding: '6px', fontSize: '12px', textAlign: 'center' }}>{card.name}</div>
                   {selectedCards.includes(card.id) && (
                     <div style={{ position: 'absolute', top: '4px', right: '4px', width: '20px', height: '20px', backgroundColor: 'var(--primary)', color: 'white', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '12px', fontWeight: 'bold' }}>✓</div>
                   )}
                 </div>
               ))}
             </div>
           )}
        </div>
      </div>
    </div>
  );
}
