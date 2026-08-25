import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { CalendarDays, Clock, ImagePlus, LoaderCircle, Star, Trash2 } from 'lucide-react';
import { useMockData } from '../contexts/MockData';
import { MATERIAL_EVENT_TAGS } from '../constants/materialCard';
import './CreateCard.css';
import './CreateCardEnhancements.css';

const emptyForm = { name:'',startTime:'',endTime:'',location:'',ownerCn:'',quantity:'1',eventTag:'其他',exchangeMethod:'互换',notes:'' };

export default function CreateCard() {
  const nav=useNavigate(); const { id }=useParams(); const [searchParams]=useSearchParams();
  const { myCards,addCard,updateCard,uploadFile }=useMockData();
  const editingCard=useMemo(()=>myCards.find(card=>card.id===id),[myCards,id]);
  const [form,setForm]=useState(emptyForm); const [images,setImages]=useState([]);
  const [uploading,setUploading]=useState(false); const [saving,setSaving]=useState(false); const [error,setError]=useState('');
  const [timePicker,setTimePicker]=useState(null);
  const timeRangeError=Boolean(form.startTime&&form.endTime&&new Date(form.endTime)<new Date(form.startTime));
  const fileInputRef=useRef(null);

  useEffect(()=>{ if(!editingCard)return; setForm({name:editingCard.name||'',startTime:editingCard.startTime||'',endTime:editingCard.endTime||'',location:editingCard.location||'',ownerCn:editingCard.ownerCn||'',quantity:String(editingCard.quantity||1),eventTag:editingCard.eventTag||'其他',exchangeMethod:editingCard.exchangeMethod||'互换',notes:editingCard.notes||''}); setImages(editingCard.images?.length?editingCard.images:[editingCard.image].filter(Boolean)); },[editingCard]);
  const update=(key,value)=>setForm(current=>({...current,[key]:value}));
  const openTimePicker=(key,label)=>{const [date='',time='']=form[key].split('T');setTimePicker({key,label,date,time})};
  const confirmTime=()=>{if(!timePicker?.date||!timePicker?.time)return;update(timePicker.key,`${timePicker.date}T${timePicker.time}`);setTimePicker(null)};
  const handleImageChange=async(event)=>{const files=[...event.target.files];event.target.value='';if(!files.length)return;setUploading(true);setError('');const uploaded=[];for(const file of files){const url=await uploadFile(file);if(url)uploaded.push(url)}setImages(current=>[...current,...uploaded]);if(uploaded.length!==files.length)setError('部分图片上传失败，请重试');setUploading(false)};
  const validate=()=>{if(!images.length)return'请至少上传一张物料图片';if(!form.name.trim())return'请填写物料名称';if(!form.startTime||!form.endTime)return'请选择完整的开始和结束时间';if(new Date(form.endTime)<new Date(form.startTime))return'结束时间不能早于开始时间';if(!form.location.trim())return'请填写地点';if(!Number.isInteger(Number(form.quantity))||Number(form.quantity)<=0)return'物料份数必须是大于0的整数';return''};
  const handleSave=async()=>{const message=validate();if(message)return setError(message);setSaving(true);setError('');const payload={...form,name:form.name.trim(),location:form.location.trim(),ownerCn:form.ownerCn.trim(),notes:form.notes.trim(),quantity:Number(form.quantity),images};const result=id?await updateCard(id,payload):await addCard(payload);setSaving(false);if(!result?.ok)return setError(result?.error||'保存失败，请稍后重试');const returnTo=searchParams.get('returnTo');nav(returnTo||'/my-cards',{replace:true})};

  return <div className="page-container card-editor-page animate-fade-in">
    <header className="top-header card-editor-header"><button className="card-editor-cancel" onClick={()=>nav(-1)}>取消</button><h1 className="header-title">{id?'编辑物料卡':'新建物料卡'}</h1><button className="card-editor-save" onClick={handleSave} disabled={saving||uploading}>{saving?<LoaderCircle size={16} className="spin"/>:'保存'}</button></header>
    <main className="card-editor-content">
      <section className="editor-section"><div className="section-heading"><div><span className="required-label">物料图片</span></div><span>{images.length} 张</span></div><input ref={fileInputRef} type="file" hidden multiple accept="image/*" onChange={handleImageChange}/><div className="image-picker-grid">
        {images.map((image,index)=><div className="image-preview" key={`${image}-${index}`}><img src={image} alt={`物料图片 ${index+1}`}/>{index===0&&<span className="cover-badge"><Star size={11} fill="currentColor"/>封面</span>}<button type="button" aria-label="移除图片" onClick={()=>setImages(current=>current.filter((_,i)=>i!==index))}><Trash2 size={15}/></button></div>)}
        <button type="button" className="add-image-tile" onClick={()=>fileInputRef.current?.click()} disabled={uploading}>{uploading?<LoaderCircle className="spin" size={25}/>:<ImagePlus size={27}/>}<span>{uploading?'上传中':'添加图片'}</span></button>
      </div></section>
      <section className="editor-section fields-section">
        <Field label="物料名称" required><input value={form.name} maxLength={15} onChange={e=>update('name',e.target.value)} placeholder="例如：巡演纪念手幅"/></Field>
        <div className="field-row"><Field label="开始时间" required><DateTimeTrigger value={form.startTime} onClick={()=>openTimePicker('startTime','开始时间')}/></Field><Field label="结束时间" required error={timeRangeError?'结束时间不得早于开始时间！':''}><DateTimeTrigger value={form.endTime} onClick={()=>openTimePicker('endTime','结束时间')}/></Field></div>
        <Field label="地点" required><input maxLength={30} value={form.location} onChange={e=>update('location',e.target.value)} placeholder="具体交换地点"/></Field>
        <div className="field-row"><Field label="物料主cn"><input value={form.ownerCn} maxLength={15} onChange={e=>update('ownerCn',e.target.value)} placeholder="选填"/></Field><Field label="物料份数" required><input type="number" inputMode="numeric" min="1" step="1" value={form.quantity} onChange={e=>update('quantity',e.target.value)}/></Field></div>
        <Field label="活动标签" required><select value={form.eventTag} onChange={e=>update('eventTag',e.target.value)}>{MATERIAL_EVENT_TAGS.map(tag=><option key={tag}>{tag}</option>)}</select></Field>
        <Field label="互换方式" required><div className="exchange-options">{['伸手','互换'].map(method=><button type="button" className={form.exchangeMethod===method?'active':''} onClick={()=>update('exchangeMethod',method)} key={method}>{method}</button>)}</div></Field>
        <Field label="备注" counter={`${form.notes.length}/50`}><textarea maxLength={50} rows={3} value={form.notes} onChange={e=>update('notes',e.target.value)}/></Field>
      </section>
      {error&&<div className="form-error" role="alert">{error}</div>}{id&&<p className="snapshot-tip">编辑只会更新这张物料卡，不会改变历史帖子里已发布的物料信息。</p>}
    </main>
    {timePicker&&createPortal(<div className="datetime-picker-overlay"><div className="datetime-picker-panel" role="dialog" aria-modal="true" aria-label={`选择${timePicker.label}`}><div className="datetime-picker-heading"><div><small>选择日期和时间</small><h3>{timePicker.label}</h3></div><CalendarDays size={22}/></div><div className="datetime-picker-inputs"><label><span>日期</span><input type="date" value={timePicker.date} onClick={event=>event.currentTarget.showPicker?.()} onChange={event=>setTimePicker(current=>({...current,date:event.target.value}))}/></label><label><span>时间</span><input type="time" value={timePicker.time} onClick={event=>event.currentTarget.showPicker?.()} onChange={event=>setTimePicker(current=>({...current,time:event.target.value}))}/></label></div><div className="datetime-picker-actions"><button type="button" onClick={()=>setTimePicker(null)}>取消</button><button type="button" className="confirm" disabled={!timePicker.date||!timePicker.time} onClick={confirmTime}>确定</button></div></div></div>,document.body)}
  </div>;
}

function Field({label,required,counter,error,children}){return <label className="editor-field"><span className={required?'required-label':''}>{label}{error?<small className="field-inline-error">{error}</small>:counter&&<small>{counter}</small>}</span>{children}</label>}
function DateTimeTrigger({value,onClick}){const text=value?value.replace('T','  '):'请选择日期和时间';return <button type="button" className={`datetime-trigger ${value?'has-value':''}`} onClick={onClick}><span>{text}</span><Clock size={17}/></button>}
