import { useEffect, useState } from 'react';
import { Navigate, useNavigate } from 'react-router-dom';
import { Eye, EyeOff, LoaderCircle, LockKeyhole, Sparkles, UserRound } from 'lucide-react';
import { useMockData } from '../contexts/MockData';
import './Login.css';

export default function Login() {
  const { isLoggedIn, loginAuth, registerAuth } = useMockData();
  const nav = useNavigate();
  const [account, setAccount] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState('');
  const [checking, setChecking] = useState(false);
  const [available, setAvailable] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setError(''); setAvailable(null);
    if (!isRegister || !/^[a-zA-Z0-9]{6,}$/.test(account)) return;
    setChecking(true);
    const timer = setTimeout(async () => {
      try { const res = await fetch(`/api/auth/check-account?account=${encodeURIComponent(account)}`); const data = await res.json(); setAvailable(data.available); }
      catch { setAvailable(null); }
      finally { setChecking(false); }
    }, 350);
    return () => { clearTimeout(timer); setChecking(false); };
  }, [account, isRegister]);

  if (isLoggedIn) return <Navigate to="/" replace />;

  const switchMode = (register) => { setIsRegister(register); setError(''); setAvailable(null); };
  const handleSubmit = async (event) => {
    event.preventDefault(); setError('');
    if (!account || !password) return setError('请输入账号和密码');
    if (!/^[a-zA-Z0-9]+$/.test(account)) return setError('账号仅支持字母和数字');
    if (isRegister && account.length < 6) return setError('账号至少需要六位');
    if (password.length < 6) return setError('密码至少需要六位');
    if (isRegister && available === false) return setError('该账号已被使用，请更换账号');
    setSubmitting(true);
    const result = isRegister ? await registerAuth(account, password) : await loginAuth(account, password);
    setSubmitting(false);
    if (result === true) nav('/', { replace: true });
    else setError(result || (isRegister ? '注册失败，请稍后重试' : '账号或密码错误'));
  };

  return <main className="auth-page animate-fade-in">
    <div className="auth-orb auth-orb-one"/><div className="auth-orb auth-orb-two"/>
    <section className="auth-shell">
      <aside className="auth-story">
        <div className="auth-brand"><span>米</span><div><strong>COMINO WORLD</strong><small>交换热爱与纪念</small></div></div>
        <div className="auth-story-copy"><span><Sparkles size={14}/> EXCHANGE &amp; TREASURE</span><h1>万事米丽，<br/>坏事嫑来</h1><p>分享现场记忆，交换每一份认真准备的心意。</p></div>
        <div className="auth-grains"><i/><i/><i/><i/><i/></div>
      </aside>
      <section className="auth-panel">
        <header><small>{isRegister ? 'CREATE ACCOUNT' : 'WELCOME BACK'}</small><h2>{isRegister ? '注册 COMINO WORLD 账号' : '欢迎回来'}</h2><p>{isRegister ? '创建账号，开始分享与交换' : '登录后继续你的物料旅程'}</p></header>
        <div className="auth-tabs"><button className={!isRegister?'active':''} onClick={()=>switchMode(false)}>登录</button><button className={isRegister?'active':''} onClick={()=>switchMode(true)}>注册</button></div>
        <form onSubmit={handleSubmit} noValidate>
          <label className="auth-field"><span>账号</span><div className={available===false?'invalid':available===true?'valid':''}><UserRound size={17}/><input autoFocus type="text" autoComplete="username" placeholder={isRegister?'账号（仅支持字母、数字）':'账号'} value={account} maxLength={30} onChange={event=>setAccount(event.target.value)} />{isRegister&&checking&&<LoaderCircle className="spin" size={15}/>}</div>{isRegister&&account&&<small className={available===false?'bad':available===true?'good':''}>{account.length<6?'账号至少六位':checking?'正在检查账号…':available===false?'该账号已被使用':available===true?'该账号可以使用':''}</small>}</label>
          <label className="auth-field"><span>密码</span><div><LockKeyhole size={17}/><input type={showPassword?'text':'password'} autoComplete={isRegister?'new-password':'current-password'} placeholder="密码" value={password} onChange={event=>setPassword(event.target.value)}/><button type="button" onClick={()=>setShowPassword(value=>!value)} aria-label={showPassword?'隐藏密码':'显示密码'}>{showPassword?<EyeOff size={17}/>:<Eye size={17}/>}</button></div>{isRegister&&password&&<small className={password.length>=6?'good':''}>{password.length>=6?'密码长度符合要求':'密码至少六位'}</small>}</label>
          {error&&<div className="auth-error" role="alert">{error}</div>}
          <button className="auth-submit" disabled={submitting||checking}>{submitting?<LoaderCircle className="spin" size={18}/>:isRegister?'注册并进入社区':'登录'}</button>
        </form>
        <p className="auth-switch">{isRegister?'已有账号？':'还没有账号？'}<button onClick={()=>switchMode(!isRegister)}>{isRegister?'去登录':'立即注册'}</button></p>
      </section>
    </section>
  </main>;
}
