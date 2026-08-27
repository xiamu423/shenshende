import { useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams } from 'react-router-dom';
import { Ban, CalendarDays, ChevronLeft, CreditCard, Image as ImageIcon, MapPin, MoreHorizontal, Pin, Send, UserRound, X } from 'lucide-react';
import { useMockData } from '../contexts/MockData';
import { formatCardTime } from '../constants/materialCard';
import MaterialModal from '../components/MaterialModal';
import LazyThumbnail from '../components/LazyThumbnail';
import './ChatDetail.css';

export default function ChatDetail() {
  const { id } = useParams(); const nav = useNavigate();
  const { chats, sendMessage, togglePinChat, updateChatRemark, toggleBlockChat, currentUser, getChatById, getChatMessages, markChatRead, uploadFile, myCards } = useMockData();
  const listedChat = chats.find(item => item.id === id);
  const [directChat,setDirectChat]=useState(null); const [loadingChat,setLoadingChat]=useState(!listedChat);
  const chat = listedChat || directChat;
  const [inputText,setInputText]=useState(''); const [messages,setMessages]=useState([]);
  const [menuOpen,setMenuOpen]=useState(false); const [remarkOpen,setRemarkOpen]=useState(false); const [remark,setRemark]=useState('');
  const [cardPickerOpen,setCardPickerOpen]=useState(false); const [selectedCard,setSelectedCard]=useState(null);
  const messagesEndRef=useRef(null); const fileInputRef=useRef(null);

  useEffect(()=>{if(listedChat){setLoadingChat(false);return}let active=true;setLoadingChat(true);getChatById(id).then(item=>{if(active){setDirectChat(item);setLoadingChat(false)}});return()=>{active=false}},[id,listedChat,getChatById]);
  useEffect(()=>{if(!chat)return;markChatRead(chat.id);getChatMessages(chat.id).then(setMessages);const timer=setInterval(()=>getChatMessages(chat.id).then(setMessages),3000);return()=>clearInterval(timer)},[chat?.id,getChatMessages,markChatRead]);
  useEffect(()=>{
    messagesEndRef.current?.scrollIntoView({behavior:'smooth'});
  },[messages]);
  if(loadingChat)return <div className="page-container chat-missing">正在打开会话…</div>;
  if(!chat)return <div className="page-container chat-missing">会话不存在</div>;

  const refresh=()=>getChatMessages(chat.id).then(setMessages);
  const handleSend=async()=>{if(!inputText.trim())return;const text=inputText;setInputText('');await sendMessage(chat.id,{type:'text',content:text});refresh()};
  const handleImage=async(event)=>{const file=event.target.files[0];event.target.value='';if(!file)return;const url=await uploadFile(file);if(url){await sendMessage(chat.id,{type:'image',content:url});refresh()}};
  const handleCard=async(card)=>{setCardPickerOpen(false);await sendMessage(chat.id,{type:'card',content:JSON.stringify(card)});refresh()};
  const openRemark=()=>{setRemark(chat.user.name||'');setMenuOpen(false);setRemarkOpen(true)};
  const saveRemark=async()=>{await updateChatRemark(chat.id,remark.trim());setRemarkOpen(false)};
  const pinChat=async()=>{await togglePinChat(chat.id);setMenuOpen(false)};
  const blockChat=async()=>{await toggleBlockChat(chat.id);setMenuOpen(false)};

  return <div className="chat-detail-page animate-fade-in">
    <header className="chat-detail-header"><button onClick={()=>nav('/chat',{replace:true})}><ChevronLeft size={23}/></button><h1>{chat.user.name}</h1><button className="chat-more-button" onClick={()=>setMenuOpen(value=>!value)} aria-label="更多操作"><MoreHorizontal size={21}/></button>
      {menuOpen&&<div className="chat-more-menu"><button onClick={openRemark}><UserRound size={15}/>修改备注</button><button onClick={pinChat}><Pin size={15}/>{chat.isPinned?'取消置顶':'置顶'}</button><button className={chat.isBlocked?'active-block':''} onClick={blockChat}><Ban size={15}/>{chat.isBlocked?'取消拉黑':'拉黑'}</button></div>}
    </header>

    <main className="chat-message-list">{messages.length===0&&<div className="chat-start-hint"><span>开始聊天</span><p>友好沟通，让每一份心意顺利抵达。</p></div>}
      {messages.map(message=><MessageRow key={message.id} message={message} isMe={message.senderId===currentUser.id} myAvatar={currentUser.avatar} otherAvatar={chat.user.avatar} onCard={setSelectedCard}/>) }
      <div ref={messagesEndRef}/>
    </main>

    {cardPickerOpen&&createPortal(<div className="chat-picker-overlay" onClick={()=>setCardPickerOpen(false)}><div className="chat-card-picker-panel" onClick={event=>event.stopPropagation()}><div className="chat-picker-heading"><div><small>MATERIAL CARDS</small><h2>选择要发送的物料卡</h2></div><button onClick={()=>setCardPickerOpen(false)}><X size={19}/></button></div><div className="chat-material-list">{myCards.map(card=><button className="chat-material-option" key={card.id} onClick={()=>handleCard(card)}><div><LazyThumbnail src={card.images?.[0]||card.image} alt={card.name}/><span>{card.eventTag||'其他'}</span></div><strong>{card.name}</strong></button>)}{myCards.length===0&&<p className="no-chat-cards">暂无物料卡</p>}</div></div></div>,document.body)}

    <footer className="chat-composer"><input type="file" ref={fileInputRef} hidden accept="image/*" onChange={handleImage}/><button className="composer-tool" onClick={()=>fileInputRef.current?.click()}><ImageIcon size={21}/></button><button className={`composer-tool ${cardPickerOpen?'active':''}`} onClick={()=>setCardPickerOpen(true)}><CreditCard size={21}/></button><textarea value={inputText} onChange={event=>setInputText(event.target.value)} onKeyDown={event=>{if(event.key==='Enter'&&!event.shiftKey){event.preventDefault();handleSend()}}} placeholder="发送消息" rows={1}/><button className="send-button" onClick={handleSend} disabled={!inputText.trim()}><Send size={17}/></button></footer>

    {remarkOpen&&createPortal(<div className="remark-overlay" onClick={()=>setRemarkOpen(false)}><div className="remark-modal" onClick={event=>event.stopPropagation()}><small>PERSONAL REMARK</small><h2>修改备注</h2><input autoFocus value={remark} maxLength={15} onChange={event=>setRemark(event.target.value)}/><div><button onClick={()=>setRemarkOpen(false)}>取消</button><button className="save" onClick={saveRemark}>保存</button></div></div></div>,document.body)}
    <MaterialModal card={selectedCard} onClose={()=>setSelectedCard(null)}/>
  </div>;
}

function MessageRow({message,isMe,myAvatar,otherAvatar,onCard}){
  let content=message.content;
  if(message.type==='image')content=<img className="message-image" src={message.content} alt="聊天图片" onClick={()=>window.open(message.content)}/>;
  if(message.type==='card'){try{const card=JSON.parse(message.content);content=<SentMaterialCard card={card} onClick={()=>onCard(card)}/> }catch{content='[无效物料卡]'}}
  return <div className={`message-row ${isMe?'mine':'theirs'}`}><img className="message-avatar" src={isMe?myAvatar:otherAvatar} alt=""/><div className={`message-bubble ${message.type!=='text'?'media-bubble':''}`}>{content}</div>{message.deliveryStatus==='failed'&&<span className="delivery-failed" title="对方拒收了这条消息">!</span>}</div>
}

function SentMaterialCard({card,onClick}){return <button className="sent-material-card" onClick={onClick}><div className="sent-card-cover"><LazyThumbnail src={card.images?.[0]||card.image} alt={card.name}/><div><span>{card.eventTag||'其他'}</span><b>{card.exchangeMethod||'互换'}</b></div></div><div className="sent-card-copy"><header><strong>{card.name}</strong><em>{card.quantity||1}<small>份</small></em></header><p><CalendarDays size={11}/>{card.startTime?`${formatCardTime(card.startTime)} — ${formatCardTime(card.endTime)}`:card.time||'时间未填写'}</p><p><MapPin size={11}/>{card.location}</p></div></button>}
