import { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { CalendarDays, ChevronLeft, ChevronRight, MapPin, Package, Star, UserRound, X } from 'lucide-react';
import { formatCardTime } from '../constants/materialCard';
import { useMockData } from '../contexts/MockData';
import './MaterialModal.css';
import './MaterialModalLightbox.css';

export default function MaterialModal({ card, onClose }) {
  const { isLoggedIn, isCardFavorite, toggleFavoriteCard } = useMockData();
  const [activeImage, setActiveImage] = useState(0);
  const [fullImage, setFullImage] = useState('');
  const [savingFavorite, setSavingFavorite] = useState(false);
  useEffect(() => setActiveImage(0), [card?.id]);
  if (!card) return null;
  const images = card.images?.length ? card.images : [card.image].filter(Boolean);
  const changeImage = (direction) => setActiveImage((current) => (current + direction + images.length) % images.length);
  const timeText = card.startTime ? `${formatCardTime(card.startTime)} — ${formatCardTime(card.endTime)}` : card.time;
  const favorite = isCardFavorite(card);
  const handleFavorite = async (event) => {
    event.stopPropagation();
    if (savingFavorite) return;
    setSavingFavorite(true); await toggleFavoriteCard(card); setSavingFavorite(false);
  };

  return createPortal(<div className="modal-overlay animate-fade-in" onClick={()=>fullImage?setFullImage(''):onClose()}>
    <article className="material-modal animate-pop" onClick={event => event.stopPropagation()}>
      <button className="modal-close" onClick={onClose} aria-label="关闭"><X size={18}/></button>

      <div className="ticket-hero" onClick={()=>setFullImage(images[activeImage])}>
        <img src={images[activeImage]} alt={card.name}/>
        <div className="ticket-hero-shade"/>
        <div className="ticket-badges"><span>{card.eventTag || '其他'}</span><b>{card.exchangeMethod || '互换'}</b></div>
        {images.length > 1 && <>
          <button className="image-arrow previous" onClick={(event) => { event.stopPropagation(); changeImage(-1); }} aria-label="上一张"><ChevronLeft size={20}/></button>
          <button className="image-arrow next" onClick={(event) => { event.stopPropagation(); changeImage(1); }} aria-label="下一张"><ChevronRight size={20}/></button>
          <span className="image-count">{activeImage + 1} / {images.length}</span>
        </>}
        {isLoggedIn&&<button className={`ticket-favorite ${favorite ? 'active' : ''}`} onClick={handleFavorite} disabled={savingFavorite} aria-label={favorite ? '取消收藏' : '收藏物料卡'}><Star size={19} fill={favorite ? 'currentColor' : 'none'}/></button>}
        <div className="ticket-hero-title"><small>MATERIAL COLLECTION</small><h2>{card.name}</h2></div>
      </div>

      {images.length > 1 && <div className="modal-thumbnails">{images.map((image,index)=><button className={activeImage===index?'active':''} onClick={()=>setActiveImage(index)} key={`${image}-${index}`}><img src={image} alt={`第 ${index+1} 张`}/></button>)}</div>}

      <div className="ticket-divider"><i/><span>EXCHANGE PASS</span><i/></div>

      <div className="ticket-body">
        <div className="ticket-info-grid">
          <Info icon={<CalendarDays size={17}/>} label="活动时间" value={timeText || '未填写'}/>
          <Info icon={<MapPin size={17}/>} label="交换地点" value={card.location}/>
        </div>
        <div className="ticket-meta">
          <div className="quantity-card"><Package size={19}/><span><small>物料份数</small><strong>{card.quantity || 1}</strong><em>份</em></span></div>
          <div className="owner-card"><UserRound size={18}/><span><small>物料主cn</small><strong>{card.ownerCn || card.owner || '未填写'}</strong></span></div>
        </div>
        {card.notes && <div className="ticket-notes"><small>备注</small><p>{card.notes}</p></div>}
      </div>
    </article>
    {fullImage&&<div className="image-lightbox" onClick={event=>{event.stopPropagation();setFullImage('')}}><button aria-label="关闭大图"><X size={22}/></button><img src={fullImage} alt={`${card.name} 完整图片`} onClick={event=>event.stopPropagation()}/></div>}
  </div>, document.body);
}

function Info({icon,label,value}) { return <div className="ticket-info"><span>{icon}</span><div><small>{label}</small><p>{value}</p></div></div>; }
