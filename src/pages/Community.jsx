import TopHeader from '../components/TopHeader';
import PostCard from '../components/PostCard';
import { useMockData } from '../contexts/MockData';
import { useNavigate } from 'react-router-dom';
import { useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { ArrowUp, CalendarRange, CircleDot, Filter, Repeat2, RotateCcw, Tags, X } from 'lucide-react';
import { MATERIAL_EVENT_TAGS } from '../constants/materialCard';
import LoginPrompt from '../components/LoginPrompt';
import './Community.css';

let communityViewState = {
  exchangeStatus: '全部',
  startTime: '',
  endTime: '',
  selectedTags: [],
  exchangeMethod: '全部',
  scrollY: 0
};

export default function Community() {
  const { posts, postsHasMore, postsLoading, fetchPosts, isLoggedIn } = useMockData();
  const nav = useNavigate();
  const [exchangeStatus, setExchangeStatus] = useState(communityViewState.exchangeStatus);
  const [startTime, setStartTime] = useState(communityViewState.startTime);
  const [endTime, setEndTime] = useState(communityViewState.endTime);
  const [selectedTags, setSelectedTags] = useState(() => [...communityViewState.selectedTags]);
  const [exchangeMethod, setExchangeMethod] = useState(communityViewState.exchangeMethod);
  const [activeFilter, setActiveFilter] = useState(null);
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const loadMoreRef = useRef(null);
  const timeError = startTime && !endTime ? '请选择结束时间，时间筛选必须完整填写！' :
    !startTime && endTime ? '请选择开始时间，时间筛选必须完整填写！' :
    startTime && endTime && new Date(startTime) > new Date(endTime) ? '开始时间不得晚于结束时间！' : '';
  const filters = useMemo(() => ({ status: exchangeStatus, method: exchangeMethod, tags: selectedTags, startTime, endTime }), [exchangeStatus, exchangeMethod, selectedTags, startTime, endTime]);
  const toggleTag = (tag) => setSelectedTags((tags) => tags.includes(tag) ? tags.filter((item) => item !== tag) : [...tags, tag]);
  const resetFilters = () => { setExchangeStatus('全部'); setStartTime(''); setEndTime(''); setSelectedTags([]); setExchangeMethod('全部'); };
  const closeFilter = () => { if (activeFilter !== 'time' || !timeError) setActiveFilter(null); };

  useEffect(() => {
    communityViewState = { ...communityViewState, exchangeStatus, startTime, endTime, selectedTags: [...selectedTags], exchangeMethod };
    if (!timeError) fetchPosts(filters, true, true);
  }, [exchangeStatus, startTime, endTime, selectedTags, exchangeMethod, filters, timeError, fetchPosts]);

  useEffect(() => {
    const restoreY = communityViewState.scrollY;
    const restoreFrame = window.requestAnimationFrame(() => {
      window.requestAnimationFrame(() => window.scrollTo({ top: restoreY, behavior: 'auto' }));
    });
    const rememberPosition = () => { communityViewState.scrollY = window.scrollY; };
    window.addEventListener('scroll', rememberPosition, { passive: true });
    return () => {
      window.cancelAnimationFrame(restoreFrame);
      rememberPosition();
      window.removeEventListener('scroll', rememberPosition);
    };
  }, []);

  useEffect(() => {
    const target = loadMoreRef.current;
    if (!target || !postsHasMore || postsLoading || timeError) return;
    const observer = new IntersectionObserver(([entry]) => {
      if (entry.isIntersecting) fetchPosts(filters, false);
    }, { rootMargin: '0px 0px 80px' });
    observer.observe(target);
    return () => observer.disconnect();
  }, [postsHasMore, postsLoading, timeError, fetchPosts, filters]);

  return (
    <div className="page-container animate-fade-in">
      <TopHeader title="社区" showAdd={true} onAdd={() => isLoggedIn ? nav('/create-post') : setShowLoginPrompt(true)} />
      <section className="community-hero">
        <span className="hero-kicker">COMINO WORLD</span>
        <h2>万事米丽，坏事嫑来</h2>
        <p>让喜欢的物料，遇见喜欢它的人。</p>
      </section>
      <section className="community-filters" aria-label="帖子筛选">
        <div className="filter-bar-scroll">
          <button className={exchangeStatus!=='全部'?'active':''} onClick={()=>setActiveFilter('status')}><CircleDot size={14}/><span>交换状态</span>{exchangeStatus!=='全部'&&<small>{exchangeStatus}</small>}</button>
          <button className={(startTime||endTime)?'active':''} onClick={()=>setActiveFilter('time')}><CalendarRange size={14}/><span>交换时间</span>{startTime&&endTime&&<small>已选</small>}</button>
          <button className={selectedTags.length?'active':''} onClick={()=>setActiveFilter('tags')}><Tags size={14}/><span>活动标签</span>{selectedTags.length>0&&<small>{selectedTags.length}</small>}</button>
          <button className={exchangeMethod!=='全部'?'active':''} onClick={()=>setActiveFilter('method')}><Repeat2 size={14}/><span>互换方式</span>{exchangeMethod!=='全部'&&<small>{exchangeMethod}</small>}</button>
        </div>
        <div className="filter-toolbar-meta"><button className="filter-reset" onClick={resetFilters} aria-label="重置筛选"><RotateCcw size={14}/></button></div>
      </section>
      {activeFilter&&createPortal(<div className="filter-popover-overlay" onClick={closeFilter}>
        <section className="filter-popover" onClick={event=>event.stopPropagation()}>
          <header><div><small>FILTER</small><h2>{activeFilter==='status'?'交换状态':activeFilter==='time'?'交换时间':activeFilter==='tags'?'活动标签':'互换方式'}</h2></div><button onClick={closeFilter} aria-label="关闭筛选"><X size={18}/></button></header>
          {activeFilter==='status'&&<div className="filter-popover-options">{['全部','未换完','已换完'].map(item=><button className={exchangeStatus===item?'active':''} onClick={()=>setExchangeStatus(item)} key={item}>{item}</button>)}</div>}
          {activeFilter==='method'&&<div className="filter-popover-options">{['全部','伸手','互换'].map(item=><button className={exchangeMethod===item?'active':''} onClick={()=>setExchangeMethod(item)} key={item}>{item}</button>)}</div>}
          {activeFilter==='time'&&<div className="filter-popover-time"><div className="filter-label-row"><label>筛选时间段</label>{(startTime||endTime)&&<button onClick={()=>{setStartTime('');setEndTime('')}}><X size={12}/>清空</button>}</div><div className="filter-time-range"><label><span>开始时间</span><input type="datetime-local" aria-label="筛选开始时间" value={startTime} onClick={event=>event.currentTarget.showPicker?.()} onChange={event=>setStartTime(event.target.value)}/></label><i>至</i><label><span>结束时间</span><input type="datetime-local" aria-label="筛选结束时间" value={endTime} onClick={event=>event.currentTarget.showPicker?.()} onChange={event=>setEndTime(event.target.value)}/></label></div>{timeError&&<div className="filter-time-error" role="alert">{timeError}</div>}</div>}
          {activeFilter==='tags'&&<div className="filter-popover-tags"><div className="filter-label-row"><label>可多选</label>{selectedTags.length>0&&<button onClick={()=>setSelectedTags([])}><X size={12}/>清空</button>}</div><div className="filter-tags">{MATERIAL_EVENT_TAGS.map(tag=><button className={selectedTags.includes(tag)?'active':''} onClick={()=>toggleTag(tag)} key={tag}>{tag}</button>)}</div></div>}
          <button className="filter-done" onClick={closeFilter} disabled={activeFilter==='time'&&Boolean(timeError)}>完成</button>
        </section>
      </div>,document.body)}
      <div className="post-feed" style={{ padding: '12px' }}>
        {posts.map(post => (
          <PostCard key={post.id} post={post} />
        ))}
        {!timeError&&!postsLoading&&posts.length===0&&<div className="filter-empty"><Filter size={25}/><strong>没有符合条件的帖子</strong><span>换一组筛选条件试试</span></div>}
        {(postsHasMore||postsLoading)&&<div ref={loadMoreRef} className={`feed-load-more ${postsLoading?'loading':''}`}>{postsLoading?'正在加载…':'继续下滑加载更多'}</div>}
      </div>
      {createPortal(<button className="community-back-to-top" onClick={()=>window.scrollTo({top:0,behavior:'smooth'})} aria-label="返回页面顶部"><ArrowUp size={20}/></button>,document.body)}
      {showLoginPrompt&&<LoginPrompt message="登录后即可发布帖子" onClose={()=>setShowLoginPrompt(false)}/>} 
    </div>
  );
}
