// src/pages/CreateCard.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockData';
import { ImagePlus } from 'lucide-react';

export default function CreateCard() {
  const nav = useNavigate();
  const { addCard, currentUser, uploadFile } = useMockData();
  
  const [name, setName] = useState('');
  const [time, setTime] = useState('');
  const [location, setLocation] = useState('');
  const [owner, setOwner] = useState(currentUser.name);
  const [image, setImage] = useState(''); 

  const handleCreate = () => {
    if (!name.trim() || !time.trim() || !location.trim() || !owner.trim() || !image) {
      return alert('请填写全部内容并上传图片');
    }
    
    addCard({
      id: 'c' + Date.now(),
      name, time, location, owner, image
    });
    nav(-1);
  };

  const handleUploadMock = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = await uploadFile(file);
        if (url) setImage(url);
      }
    };
    input.click();
  };

  const inputStyle = { width: '100%', padding: '12px 16px', fontSize: '15px', border: '1px solid var(--border)', borderRadius: '12px', marginBottom: '16px', backgroundColor: '#f8fafd', color: 'var(--primary)', fontWeight: 'bold', outline: 'none' };

  return (
    <div className="page-container animate-fade-in" style={{ backgroundColor: 'white', minHeight: '100vh', paddingBottom: '30px' }}>
      <header className="top-header" style={{ padding: '0 16px', paddingTop: 'env(safe-area-inset-top)' }}>
        <div className="header-left" style={{ width: '60px' }}>
          <button className="icon-btn" onClick={() => nav(-1)} style={{ fontSize: '15px', color: 'var(--text-secondary)' }}>取消</button>
        </div>
        <h1 className="header-title" style={{ flex: 1, textAlign: 'center', fontSize: '16px', margin: 0 }}>新建物料卡</h1>
        <div className="header-right" style={{ width: '60px', display: 'flex', justifyContent: 'flex-end' }}>
          <button onClick={handleCreate} style={{ backgroundColor: 'var(--primary)', color: 'white', padding: '6px 14px', borderRadius: '16px', fontSize: '14px', fontWeight: 'bold' }}>完成</button>
        </div>
      </header>

      <div style={{ padding: '24px 20px' }}>
        <div style={{ textAlign: 'center', marginBottom: '30px' }}>
          {image ? (
            <img src={image} onClick={handleUploadMock} style={{ width: '120px', height: '120px', borderRadius: '12px', objectFit: 'cover', border: '2px solid var(--primary)', cursor: 'pointer', boxShadow: '0 4px 12px rgba(34, 66, 148, 0.2)' }} />
          ) : (
            <div onClick={handleUploadMock} style={{ width: '120px', height: '120px', borderRadius: '12px', backgroundColor: 'var(--bg)', border: '2px dashed #cbd5e1', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', margin: '0 auto', cursor: 'pointer', color: 'var(--primary)' }}>
              <ImagePlus size={32} style={{ marginBottom: '8px' }} />
              <span style={{ fontSize: '12px', fontWeight: 'bold' }}>上传封面图</span>
            </div>
          )}
        </div>

        <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>物料名称</div>
        <input style={inputStyle} value={name} onChange={e => setName(e.target.value)} placeholder="例：自制2026巡演手幅" />
        
        <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>时间</div>
        <input style={inputStyle} value={time} onChange={e => setTime(e.target.value)} placeholder="例：2026-05-20" />
        
        <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>地点</div>
        <input style={inputStyle} value={location} onChange={e => setLocation(e.target.value)} placeholder="例：上海体育场检票口" />
        
        <div style={{ marginBottom: '8px', fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>物料主昵称</div>
        <input style={inputStyle} value={owner} onChange={e => setOwner(e.target.value)} placeholder="您的昵称" />
      </div>
    </div>
  );
}
