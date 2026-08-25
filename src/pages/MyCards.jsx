import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { ArrowRight, CalendarDays, Images, MapPin, Package, Pencil, Trash2 } from 'lucide-react';
import TopHeader from '../components/TopHeader';
import MaterialModal from '../components/MaterialModal';
import { useMockData } from '../contexts/MockData';
import { formatCardTime } from '../constants/materialCard';
import './MyCards.css';

export default function MyCards(){
  const {myCards,deleteCard}=useMockData(); const nav=useNavigate(); const [selectedCard,setSelectedCard]=useState(null);
  const remove=async(card)=>{if(window.confirm(`确定删除“${card.name}”吗？\n\n历史帖子中已经发布的物料卡快照会继续保留。`)){setSelectedCard(null);await deleteCard(card.id)}};
  const timeRange=(card)=>card.startTime&&card.endTime?`${formatCardTime(card.startTime)}  →  ${formatCardTime(card.endTime)}`:card.time||'时间待补充';
  return <div className="page-container my-cards-page animate-fade-in"><TopHeader title="我的物料卡" showBack showAdd onBack={()=>nav('/profile',{replace:true})} onAdd={()=>nav('/create-card')}/><div className="my-cards-intro"><div><strong>{myCards.length}</strong><span>张物料卡</span></div></div>
    <div className="my-cards-grid">{myCards.length===0?<div className="cards-empty"><Package size={34}/><h3>还没有物料卡</h3><p>创建后可在发布帖子时快速引用。</p><button onClick={()=>nav('/create-card')}>新建物料卡</button></div>:myCards.map(card=><article className="my-material-card" key={card.id}>
      <button className="card-main" onClick={()=>setSelectedCard(card)}>
        <div className="card-cover"><img src={card.images?.[0]||card.image} alt={card.name}/><div className="cover-shade"/><div className="cover-badges"><b>{card.exchangeMethod||'互换'}</b>{(card.images?.length||0)>1&&<span><Images size={12}/>{card.images.length}</span>}</div><span className="preview-hint">查看详情 <ArrowRight size={14}/></span></div>
        <div className="card-summary"><div className="card-title-row"><div><span className="event-tag">{card.eventTag||'其他'}</span><h3>{card.name}</h3></div><div className="quantity-badge"><strong>{card.quantity||1}</strong><small>份</small></div></div>
          <div className="card-fact"><span><CalendarDays size={15}/></span><div><small>交换时间</small><p>{timeRange(card)}</p></div></div>
          <div className="card-fact"><span><MapPin size={15}/></span><div><small>交换地点</small><p>{card.location}</p></div></div>
        </div>
      </button>
      <div className="card-actions"><button onClick={()=>nav(`/edit-card/${card.id}`)}><Pencil size={15}/>编辑物料卡</button><button className="danger" aria-label={`删除 ${card.name}`} onClick={()=>remove(card)}><Trash2 size={15}/></button></div>
    </article>)}</div><MaterialModal card={selectedCard} onClose={()=>setSelectedCard(null)}/>
  </div>;
}
