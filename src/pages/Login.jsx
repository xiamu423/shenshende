import { useNavigate, Navigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockData';
import { useState } from 'react';

export default function Login() {
  const { isLoggedIn, loginAuth, registerAuth } = useMockData();
  const nav = useNavigate();
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);

  if (isLoggedIn) return <Navigate to="/" replace />;

  const handleSubmit = async () => {
    if (!phone || !password) return alert('请输入账号和密码');
    
    if (isRegister) {
      if (!/^[a-zA-Z0-9_]{3,}$/.test(phone)) {
        return alert('账号最少三个字符，且只能包含字母、数字或下划线');
      }
      if (password.length < 6) {
        return alert('密码至少六位数');
      }
      const result = await registerAuth(phone, password);
      if (result === true) nav('/');
      else alert(result || '注册失败');
    } else {
      const success = await loginAuth(phone, password);
      if (success) nav('/');
      else alert('账号或密码错误');
    }
  };

  return (
    <div className="page-container animate-fade-in" style={{ backgroundColor: 'white', minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '24px' }}>
      <div style={{ width: '100%', maxWidth: '360px' }}>
        <h1 style={{ color: 'var(--primary)', marginBottom: '32px', fontSize: '22px', textAlign: 'center', fontWeight: 'bold' }}>
          {isRegister ? '注册生米账号' : '登录生米社区'}
        </h1>
        <input 
          type="text" 
          placeholder="账号 (字母、数字、下划线组合)" 
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={{ width: '100%', padding: '14px', marginBottom: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '15px', outline: 'none' }}
        />
        <input 
          type="password" 
          placeholder="密码" 
          value={password}
          onChange={e => setPassword(e.target.value)}
          style={{ width: '100%', padding: '14px', marginBottom: '24px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '15px', outline: 'none' }}
        />
        
        <button 
          type="button" 
          onClick={handleSubmit} 
          style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', fontSize: '16px', fontWeight: 'bold', marginBottom: '20px', border: 'none', boxShadow: '0 4px 12px rgba(34,66,148,0.2)' }}
        >
          {isRegister ? '立 即 注 册' : '登 录'}
        </button>

        <div style={{ textAlign: 'center' }}>
          <span 
            onClick={() => setIsRegister(!isRegister)} 
            style={{ color: 'var(--primary)', fontSize: '14px', cursor: 'pointer', opacity: 0.8, textDecoration: 'underline' }}
          >
            {isRegister ? '已有账号？点此去登录' : '没有账号？先注册一个'}
          </span>
        </div>
      </div>
    </div>
  );
}
