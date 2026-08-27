import { useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, MapPin, Pencil, Star, Trash2 } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import TopHeader from '../components/TopHeader';
import MaterialModal from '../components/MaterialModal';
import LazyThumbnail from '../components/LazyThumbnail';
import { useMockData } from '../contexts/MockData';
import { formatCardTime } from '../constants/materialCard';
import './FavoriteCards.css';

export default function FavoriteCards(){
  const nav=useNavigate();
  const {favoriteCards,toggleFavoriteCard,updateFavoriteRemark}=useMockData();
  const [selectedCard,setSelectedCard]=useState(null);
  const [editing,setEditing]=useState(null);
  const [remark,setRemark]=useState('');
  const openRemark=(card)=>{setEditing(card);setRemark(card.favoriteRemark||'')};
  const saveRemark=async()=>{if(await updateFavoriteRemark(editing.sourceCardId||editing.id,remark)){setEditing(null)}};
  return <div className="page-container favorite-cards-page animate-fade-in">
    <TopHeader title="收藏的物料卡" showBack onBack={()=>nav('/profile',{replace:true})}/>
    <main className="favorite-cards-content">
      {favoriteCards.length===0?<div className="favorite-empty"><span><Star size={27}/></span><h2>还没有收藏</h2><p>在物料卡预览图片右下角点击星标，即可收藏。</p></div>:
      <div className="favorite-grid">{favoriteCards.map(card=><article className="favorite-card" key={card.sourceCardId||card.id}>
        <button className="favorite-card-main" onClick={()=>setSelectedCard(card)}>
          <div className="favorite-cover"><LazyThumbnail src={card.images?.[0]||card.image} alt={card.name}/><span><Star size={13} fill="currentColor"/></span><div><small>{card.eventTag||'其他'}</small><strong>{card.name}</strong></div></div>
          <div className="favorite-facts"><p><CalendarDays size={13}/>{card.startTime?`${formatCardTime(card.startTime)} — ${formatCardTime(card.endTime)}`:card.time||'时间未填写'}</p><p><MapPin size={13}/>{card.location}</p></div>
          {card.favoriteRemark&&<div className="favorite-remark"><small>我的备注</small><p>{card.favoriteRemark}</p></div>}
        </button>
        <div className="favorite-actions"><button onClick={()=>openRemark(card)}><Pencil size={13}/>编辑备注</button><button className="remove" onClick={()=>toggleFavoriteCard(card)} aria-label="取消收藏"><Trash2 size={13}/></button></div>
      </article>)}</div>}
    </main>
    <MaterialModal card={selectedCard} onClose={()=>setSelectedCard(null)}/>
    {editing&&createPortal(<div className="favorite-remark-overlay" onClick={()=>setEditing(null)}><section className="favorite-remark-modal" onClick={event=>event.stopPropagation()}><small>PERSONAL NOTE</small><h2>编辑收藏备注</h2><textarea autoFocus value={remark} maxLength={30} rows={4} onChange={event=>setRemark(event.target.value)}/><div className="remark-count">{remark.length}/30</div><footer><button onClick={()=>setEditing(null)}>取消</button><button className="save" onClick={saveRemark}>保存</button></footer></section></div>,document.body)}
  </div>;
}
