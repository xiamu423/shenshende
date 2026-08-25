import { createPortal } from 'react-dom';
import { LockKeyhole } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import './LoginPrompt.css';

export default function LoginPrompt({ message, onClose }) {
  const nav = useNavigate();
  return createPortal(<div className="login-prompt-overlay" onClick={onClose}>
    <section className="login-prompt" onClick={event=>event.stopPropagation()}>
      <span><LockKeyhole size={20}/></span><h2>{message}</h2>
      <div><button onClick={onClose}>再想想</button><button className="login-now" onClick={()=>nav('/login')}>去登录</button></div>
    </section>
  </div>,document.body);
}
