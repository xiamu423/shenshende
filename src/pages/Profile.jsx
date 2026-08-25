import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate } from 'react-router-dom';
import { ChevronRight, FileText, Layers3, LoaderCircle, LogOut, SlidersHorizontal, Star } from 'lucide-react';
import { useMockData } from '../contexts/MockData';
import './Profile.css';
import './CommunityPageBackground.css';

export default function Profile() {
  const { currentUser, myCards, getMySummary, logout, updateProfile, uploadFile } = useMockData();
  const nav = useNavigate();
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(currentUser?.name || '');
  const [editAvatar, setEditAvatar] = useState(currentUser?.avatar || '');
  const [uploading, setUploading] = useState(false);
  const [saving, setSaving] = useState(false);
  const fileInputRef = useRef(null);
  const [myPostCount,setMyPostCount]=useState(0);
  useEffect(()=>{getMySummary().then(data=>setMyPostCount(data.postCount||0))},[getMySummary]);

  const handleEditOpen = () => {
    setEditName(currentUser.name); setEditAvatar(currentUser.avatar); setIsEditing(true);
  };
  const handleSaveProfile = async () => {
    if (!editName.trim()) return alert('昵称不能为空');
    setSaving(true); await updateProfile({ name: editName.trim(), avatar: editAvatar }); setSaving(false); setIsEditing(false);
  };
  const handleAvatarChange = async (event) => {
    const file = event.target.files[0]; event.target.value = '';
    if (!file) return;
    setUploading(true); const url = await uploadFile(file); if (url) setEditAvatar(url); setUploading(false);
  };
  const handleLogout = () => { logout(); };

  return <div className="page-container profile-page animate-fade-in">
    <main className="profile-content">
      <section className="profile-identity-card">
        <div className="profile-card-orb orb-one"/><div className="profile-card-orb orb-two"/>
        <div className="profile-kicker">COMINO WORLD</div>
        <div className="profile-person">
          <button className="profile-avatar-button" onClick={handleEditOpen} aria-label="编辑头像"><img src={currentUser.avatar} alt={currentUser.name}/></button>
          <div className="profile-name"><small>昵称</small><h1>{currentUser.name}</h1><span className="profile-account">账号&nbsp; {currentUser.phone}</span></div>
          <button className="profile-edit-button" onClick={handleEditOpen}><SlidersHorizontal size={14}/>编辑资料</button>
        </div>
        <div className="profile-stats"><div><strong>{myPostCount}</strong><span>我的帖子</span></div><i/><div><strong>{myCards.length}</strong><span>物料卡</span></div></div>
      </section>

      <section className="profile-navigation">
        <button className="profile-entry posts-entry" onClick={() => nav('/my-posts')}><span className="entry-icon"><FileText size={21}/></span><div><strong>我的帖子</strong><small>查看和管理已经发布的内容</small></div><ChevronRight size={18}/></button>
        <button className="profile-entry cards-entry" onClick={() => nav('/my-cards')}><span className="entry-icon"><Layers3 size={21}/></span><div><strong>我的物料卡</strong><small>创建、编辑和管理交换物料</small></div><ChevronRight size={18}/></button>
        <button className="profile-entry favorites-entry" onClick={() => nav('/favorite-cards')}><span className="entry-icon"><Star size={21}/></span><div><strong>收藏的物料卡</strong><small>查看收藏的交换物料</small></div><ChevronRight size={18}/></button>
      </section>

      <button className="profile-logout" onClick={handleLogout}><LogOut size={15}/>退出登录</button>
    </main>

    {isEditing && createPortal(<div className="profile-modal-overlay" onClick={() => setIsEditing(false)}><div className="profile-edit-modal" onClick={event => event.stopPropagation()}>
      <div className="profile-modal-heading"><small>PERSONAL PROFILE</small><h2>编辑个人资料</h2></div>
      <input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleAvatarChange}/>
      <button className="edit-avatar-button" onClick={() => fileInputRef.current?.click()} disabled={uploading}><img src={editAvatar} alt="新头像"/>{uploading && <span><LoaderCircle className="spin" size={22}/></span>}</button>
      <p className="avatar-helper">点击头像更换图片</p>
      <label className="profile-name-field"><span>昵称</span><input value={editName} maxLength={15} onChange={event => setEditName(event.target.value)}/></label>
      <div className="profile-modal-actions"><button onClick={() => setIsEditing(false)}>取消</button><button className="save" onClick={handleSaveProfile} disabled={saving || uploading}>{saving ? <LoaderCircle className="spin" size={17}/> : '保存修改'}</button></div>
    </div></div>, document.body)}
  </div>;
}
