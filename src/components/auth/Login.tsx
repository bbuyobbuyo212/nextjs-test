"use client";
import React, { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { setCookie, setUserCookie } from '@/lib/cookie';
import './Login.css';

interface LoginFormData {
  userid: string;
  password: string;
  autoLogin: boolean;
}

const Login: React.FC = () => {
  const { user, loading } = require('@/hooks/useJWTUser').useJWTUser();
  React.useEffect(() => {
    if (!loading && user) {
      alert('이미 로그인된 상태입니다.');
      window.location.replace('/');
    }
  }, [user, loading]);
  const [formData, setFormData] = useState<LoginFormData>({
    userid: '',
    password: '',
    autoLogin: false
  });
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
  e.preventDefault();
  const { userid, password } = formData;
  if (!userid || !password) {
    alert('아이디와 비밀번호를 입력하세요.');
    return;
  }
  try {
    const res = await fetch('/api/auth/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ userid, password })
    });
    const data = await res.json();
    if (data.success) {
      // 토큰과 사용자 정보를 쿠키에 저장
      setCookie('token', data.token || '', formData.autoLogin ? 7 : 1); // 자동 로그인 시 7일, 아니면 1일
      setUserCookie(data.user);
      alert('로그인 되었습니다.');
      window.location.replace('/');
    } else {
      setError(data.error || '로그인에 실패했습니다.');
    }
  } catch (err) {
    setError('서버 오류가 발생했습니다.');
  }
  };

  const handleSocialLogin = (provider: string): void => {
    console.log(`${provider} 로그인`);
    // SNS 로그인 로직 구현
  };

  return (
    <div className="login">
      <div className="container">
        <div className="login__wrapper">
          <h1 className="title title--large login__title">로그인</h1>
          <form className="login__form" onSubmit={handleSubmit}>
            <div className="login__field">
              <label className="label" htmlFor="userid">아이디</label>
              <input
                type="text"
                id="userid"
                name="userid"
                className="input login__input"
                placeholder="아이디를 입력하세요"
                value={formData.userid}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="login__field">
              <label className="label" htmlFor="password">비밀번호</label>
              <input
                type="password"
                id="password"
                name="password"
                className="input login__input"
                placeholder="비밀번호를 입력하세요"
                value={formData.password}
                onChange={handleInputChange}
                required
              />
            </div>
            <div className="login__field">
              <div className="checkbox">
                <input
                  type="checkbox"
                  id="autoLogin"
                  name="autoLogin"
                  className="checkbox__input"
                  checked={formData.autoLogin}
                  onChange={handleInputChange}
                />
                <label htmlFor="autoLogin" className="checkbox__label">
                  <span className="checkbox__text">자동로그인</span>
                </label>
              </div>
            </div>
            <button type="submit" className="btn btn--primary login__submit">
              로그인
            </button>
            {error && <div className="login-error">{error}</div>}
          </form>

          <div className="login__links">
            <Link href="/auth/terms" className="login__link">회원가입</Link>
            <span className="login__separator">|</span>
            <Link href="/auth/find-id" className="login__link">아이디찾기</Link>
            <span className="login__separator">|</span>
            <Link href="/auth/find-password" className="login__link">비밀번호찾기</Link>
          </div>

          <div className="login__social">
            <h3 className="login__social-title">SNS 로그인</h3>
            <div className="login__social-buttons">
              <button
                type="button"
                className="login__social-button login__social-button--kakao"
                onClick={() => handleSocialLogin('kakao')}
              >
                <svg className="login__social-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M12 3c5.799 0 10.5 3.664 10.5 8.185 0 4.52-4.701 8.184-10.5 8.184a13.5 13.5 0 0 1-1.727-.11l-4.408 2.883c-.501.265-.678.236-.472-.413l.892-3.678c-2.88-1.46-4.785-3.99-4.785-6.866C1.5 6.665 6.201 3 12 3z"/>
                </svg>
                카카오
              </button>
              
              <button
                type="button"
                className="login__social-button login__social-button--naver"
                onClick={() => handleSocialLogin('naver')}
              >
                <svg className="login__social-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M16.273 12.845 7.376 0H0v24h7.726V11.156L16.624 24H24V0h-7.727v12.845z"/>
                </svg>
                네이버
              </button>
              
              <button
                type="button"
                className="login__social-button login__social-button--google"
                onClick={() => handleSocialLogin('google')}
              >
                <svg className="login__social-icon" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                  <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                  <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                  <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                </svg>
                구글
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Login;