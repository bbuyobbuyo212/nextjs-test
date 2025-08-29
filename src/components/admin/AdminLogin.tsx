"use client";
import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import '../../../styles/admin.css';

const AdminLogin = () => {
  const [adminid, setAdminid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  // 이미 로그인된 상태인지 확인
  useEffect(() => {
    // 쿠키에서 토큰 확인
    const cookies = document.cookie;
    console.log('[AdminLogin] 쿠키 확인:', cookies);
    
    const hasAdminToken = cookies.includes('admin_token') || 
                          cookies.includes('admin_token_access');
    
    if (hasAdminToken) {
      console.log('[AdminLogin] 이미 로그인된 상태, 관리자 대시보드로 이동');
      router.replace('/admin');
    }
  }, [router]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setIsLoading(true);
    
    try {
      console.log('[AdminLogin] 로그인 시도:', adminid);
      
      const res = await fetch('/api/admin/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminid, password })
      });
      
      const data = await res.json();
      console.log('[AdminLogin] 로그인 응답:', data);
      
      if (!res.ok) {
        throw new Error(data.error || '로그인 실패');
      }
      
      // 로그인 성공 후 쿠키 확인을 위한 지연
      setTimeout(() => {
        console.log('[AdminLogin] 로그인 후 쿠키 확인:', document.cookie);
        
        // 관리자 페이지로 이동
        console.log('[AdminLogin] 관리자 페이지로 이동');
        window.location.href = '/admin';
      }, 500);
    } catch (err: any) {
      console.error('[AdminLogin] 로그인 오류:', err);
      setError(err.message || '로그인 실패');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="admin-login">
      <div className="container">
        <div className="login__wrapper">
          <h1 className="title title--large login__title">관리자 로그인</h1>
          {error && <div className="login-error" style={{ color: '#e74c3c', background: '#fff0f0', borderRadius: '0.7rem', padding: '1rem', margin: '1rem 0', fontSize: '1rem', textAlign: 'center' }}>{error}</div>}
          <form className="login-form" onSubmit={handleLogin}>
            <div className="login__field">
              <input
                type="text"
                className="input login__input"
                placeholder="관리자 아이디"
                value={adminid}
                onChange={e => setAdminid(e.target.value)}
                disabled={isLoading}
                required                
              />
            </div>
            <div className="login__field" style={{ width: '100%' }}>
              <input
                type="password"
                className="input login__input"
                placeholder="비밀번호"
                value={password}
                onChange={e => setPassword(e.target.value)}
                disabled={isLoading}
                required
              />
            </div>
            <button 
              type="submit" 
              className="btn btn--primary login__submit"
              disabled={isLoading}
            >
              {isLoading ? '로그인 중...' : '로그인'}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
