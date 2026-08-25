import { LogIn } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './GuestFeature.css';

export default function GuestFeature({ feature }) {
  const nav=useNavigate();
  return <main className="guest-feature-page"><section><span><LogIn size={25}/></span><small>MEMBER FEATURE</small><h1>登录后使用{feature}</h1><p>登录账号后，即可查看和使用完整功能。</p><button onClick={()=>nav('/login')}>去登录</button></section></main>;
}
