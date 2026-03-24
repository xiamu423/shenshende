// src/pages/Profile.jsx
import { useNavigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockData';
import { useState } from 'react';
import { ChevronRight, Image as ImageIcon, FileText, LogOut, Edit2 } from 'lucide-react';
import '../components/TopHeader.css';

export default function Profile() {
  const { currentUser, logout, updateProfile, uploadFile } = useMockData();
  const nav = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');

  const handleLogout = () => {
    logout();
    nav('/login');
  };

  const handleEditOpen = () => {
    setEditName(currentUser.name);
    setEditAvatar(currentUser.avatar);
    setIsEditing(true);
  };

  const handleSaveProfile = async () => {
    if (!editName.trim()) return alert('名字不能为空');
    await updateProfile({ name: editName, avatar: editAvatar });
    setIsEditing(false);
  };

  const handleAvatarClick = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = 'image/*';
    input.onchange = async (e) => {
      const file = e.target.files[0];
      if (file) {
        const url = await uploadFile(file);
        if (url) setEditAvatar(url);
      }
    };
    input.click();
  };

  return (
    <div className="page-container animate-fade-in" style={{ backgroundColor: '#f5f7fa', minHeight: '100vh', paddingTop: 0 }}>
      {/* Profile Header */}
      <div style={{ backgroundColor: 'white', padding: 'calc(env(safe-area-inset-top) + 20px) 0 0', position: 'relative' }}>
        <header className="top-header" style={{ position: 'absolute', top: 0, left: 0, right: 0, borderBottom: 'none', backgroundColor: 'transparent', zIndex: 10 }}>
          <div className="header-left"></div>
          <h1 className="header-title"></h1>
          <div className="header-right">
            <button className="icon-btn" onClick={handleLogout}><LogOut size={22} color="var(--text-secondary)" /></button>
          </div>
        </header>

        <div 
          onClick={handleEditOpen}
          style={{ display: 'flex', alignItems: 'center', padding: '30px 24px', paddingBottom: '36px', cursor: 'pointer', position: 'relative' }}
        >
          <img src={currentUser.avatar} style={{ width: '76px', height: '76px', borderRadius: '50%', objectFit: 'cover', border: '3px solid white', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }} />
          <div style={{ marginLeft: '16px', flex: 1 }}>
            <h2 style={{ fontSize: '22px', fontWeight: 'bold', marginBottom: '6px' }}>{currentUser.name}</h2>
            <div style={{ fontSize: '13px', color: 'var(--primary)', backgroundColor: '#e5edff', padding: '4px 10px', borderRadius: '12px', display: 'inline-block', fontWeight: 'bold' }}>点击编辑资料</div>
          </div>
          <Edit2 size={20} color="var(--text-secondary)" opacity={0.5} />
        </div>
      </div>

      {/* Menu Options */}
      <div style={{ padding: '16px', marginTop: '8px' }}>
        <div style={{ backgroundColor: 'white', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 16px rgba(0,0,0,0.03)' }}>
          <div 
            onClick={() => nav('/my-posts')}
            style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', borderBottom: '1px solid var(--border)', cursor: 'pointer' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#eef1fa', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '14px' }}>
              <FileText size={18} color="var(--primary)" />
            </div>
            <span style={{ flex: 1, fontSize: '16px', fontWeight: '500' }}>我的帖子</span>
            <ChevronRight size={20} color="#cbd5e1" />
          </div>

          <div 
            onClick={() => nav('/my-cards')}
            style={{ display: 'flex', alignItems: 'center', padding: '18px 20px', cursor: 'pointer' }}
          >
            <div style={{ width: '36px', height: '36px', borderRadius: '10px', backgroundColor: '#fff6e5', display: 'flex', alignItems: 'center', justifyContent: 'center', marginRight: '14px' }}>
              <ImageIcon size={18} color="#f59e0b" />
            </div>
            <span style={{ flex: 1, fontSize: '16px', fontWeight: '500' }}>我的物料卡</span>
            <ChevronRight size={20} color="#cbd5e1" />
          </div>
        </div>
      </div>

      {/* Edit Profile Modal */}
      {isEditing && (
        <div className="animate-fade-in" style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, backgroundColor: 'rgba(0,0,0,0.5)', zIndex: 1000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '20px', backdropFilter: 'blur(2px)' }}>
          <div style={{ backgroundColor: 'white', borderRadius: '20px', padding: '24px', width: '100%', maxWidth: '320px', position: 'relative', boxShadow: '0 10px 40px rgba(0,0,0,0.2)' }}>
            <h3 style={{ margin: '0 0 24px', textAlign: 'center', fontSize: '18px', color: 'var(--primary)' }}>编辑个人资料</h3>
            
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <img src={editAvatar} onClick={handleAvatarClick} style={{ width: '90px', height: '90px', borderRadius: '50%', objectFit: 'cover', border: '3px solid var(--border)', cursor: 'pointer', marginBottom: '10px', boxShadow: '0 4px 12px rgba(0,0,0,0.08)' }} />
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>点击更换头像</div>
            </div>
            
            <div style={{ marginBottom: '28px' }}>
              <div style={{ fontSize: '13px', color: 'var(--text-secondary)', marginBottom: '8px', fontWeight: 'bold' }}>用户名</div>
              <input 
                type="text" 
                value={editName} 
                onChange={e => setEditName(e.target.value)} 
                maxLength={15}
                style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', border: '1px solid var(--border)', outline: 'none', fontSize: '16px', fontWeight: 'bold', color: 'var(--primary)', backgroundColor: '#fcfaf0' }} 
              />
            </div>
            
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setIsEditing(false)} style={{ flex: 1, padding: '12px', borderRadius: '12px', border: '1px solid var(--border)', backgroundColor: 'transparent', fontSize: '15px', color: 'var(--text-secondary)', fontWeight: 'bold' }}>取消</button>
              <button onClick={handleSaveProfile} style={{ flex: 1, padding: '12px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '15px', boxShadow: '0 4px 12px rgba(34, 66, 148, 0.3)' }}>保存修改</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
