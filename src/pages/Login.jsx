import { useNavigate, Navigate } from 'react-router-dom';
import { useMockData } from '../contexts/MockData';
import { useState } from 'react';

export default function Login() {
  const { isLoggedIn, loginAuth } = useMockData();
  const nav = useNavigate();
  const [phone, setPhone] = useState('');

  if (isLoggedIn) return <Navigate to="/" replace />;

  const handleLogin = async () => {
    if (!phone) return alert('请输入手机号');
    const success = await loginAuth(phone);
    if (success) nav('/');
    else alert('登录失败');
  };

  return (
    <div className="page-container animate-fade-in" style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '16px', backgroundColor: 'var(--white)' }}>
      <div className="card" style={{ width: '100%', padding: '32px 24px', textAlign: 'center', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }}>
        <div style={{ width: '60px', height: '60px', borderRadius: '50%', backgroundColor: 'var(--primary)', margin: '0 auto 16px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <span style={{ color: 'white', fontSize: '24px', fontWeight: 'bold' }}>生</span>
        </div>
        <h1 style={{ color: 'var(--primary)', marginBottom: '32px', fontSize: '22px' }}>生米物料社区</h1>
        <input 
          type="tel" 
          placeholder="手机号 (自动注册或登录)" 
          value={phone}
          onChange={e => setPhone(e.target.value)}
          style={{ width: '100%', padding: '14px', marginBottom: '16px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '15px' }}
        />
        <div style={{ display: 'flex', gap: '8px', marginBottom: '32px' }}>
          <input 
            type="text" 
            placeholder="验证码 (随意输入)" 
            style={{ flex: 1, padding: '14px', borderRadius: '12px', border: '1px solid var(--border)', fontSize: '15px' }}
          />
          <button style={{ padding: '0 16px', backgroundColor: 'var(--border)', color: 'var(--text-secondary)', borderRadius: '12px', fontSize: '14px' }}>
            获取验证码
          </button>
        </div>
        <button 
          onClick={handleLogin}
          style={{ width: '100%', padding: '14px', borderRadius: '12px', backgroundColor: 'var(--primary)', color: 'white', fontWeight: 'bold', fontSize: '16px', boxShadow: '0 4px 12px rgba(34, 66, 148, 0.3)' }}
        >
          登录
        </button>
      </div>
    </div>
  );
}
