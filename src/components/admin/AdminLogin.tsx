"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import '../../../styles/admin.css';

const AdminLogin = () => {
  const [adminid, setAdminid] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');    
    try {
      const res = await fetch('/api/admin/admin-login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ adminid, password })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '로그인 실패');
      router.replace('/admin/admin-users');
    } catch (err: any) {
      setError(err.message || '로그인 실패');
    }
  };

  return (
    <div className="admin-login">
      <div className="container">
        <div className="login__wrapper">
          <h1 className="title title--large login__title">관리자 로그인</h1>
          <form className="login-form" onSubmit={handleLogin}>
            <div className="login__field">
              <input
                type="text"
                className="input login__input"
                placeholder="관리자 아이디"
                value={adminid}
                onChange={e => setAdminid(e.target.value)}
                required
              />
            </div>
            <div className="login__field">
              <input
                type="password"
                className="input login__input"
                placeholder="비밀번호"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
              />
            </div>
            <button type="submit" className="btn btn--primary login__submit">로그인</button>
            {error && <div className="login-error">{error}</div>}
          </form>
        </div>
      </div>
    </div>
  );
};

export default AdminLogin;
