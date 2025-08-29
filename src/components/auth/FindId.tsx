"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './FindId.css';

type FindIdState = {
  name: string;
  email: string;
  foundId: string | null;
  isLoading: boolean;
  error: string;
};

const FindId = () => {
  const router = useRouter();
  const [state, setState] = useState<FindIdState>({
    name: '',
    email: '',
    foundId: null,
    isLoading: false,
    error: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setState(prev => ({ ...prev, [name]: value, error: '' }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const name = state.name.trim();
    const email = state.email.trim();
    if (!name) {
      setState(prev => ({ ...prev, error: '이름을 입력해주세요.' }));
      return;
    }
    if (!email) {
      setState(prev => ({ ...prev, error: '이메일을 입력해주세요.' }));
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setState(prev => ({ ...prev, error: '올바른 이메일 형식이 아닙니다.' }));
      return;
    }
    setState(prev => ({ ...prev, isLoading: true, error: '' }));
    try {
      const res = await fetch('/api/auth/find-id', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, email })
      });
      const data = await res.json();
      if (res.ok && data.success && data.userid) {
        setState(prev => ({ ...prev, foundId: data.userid, isLoading: false }));
      } else {
        setState(prev => ({ ...prev, foundId: null, isLoading: false, error: data.error || '입력하신 정보로 가입된 계정을 찾을 수 없습니다.' }));
      }
    } catch (err) {
      setState(prev => ({ ...prev, foundId: null, isLoading: false, error: '서버 오류가 발생했습니다.' }));
    }
  };

  const handlePrevious = () => {
    router.push('/auth/login');
  };

  const handleReset = () => {
    setState({ name: '', email: '', foundId: null, isLoading: false, error: '' });
  };

  return (
    <div className="find-id">
      <div className="container">
        <div className="find-id__wrapper">
          <h1 className="title title--large find-id__title">아이디 찾기</h1>
          {!state.foundId ? (
            <>
              <div className="find-id__description">
                가입시 등록한 이름과 이메일 주소를 입력해주세요.
              </div>
              <form className="find-id__form" onSubmit={handleSubmit}>
                <div className="find-id__field">
                  <label className="label" htmlFor="name">이름</label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className={`input find-id__input ${state.error ? 'input--error' : ''}`}
                    placeholder="가입시 등록한 이름을 입력하세요"
                    value={state.name}
                    onChange={handleInputChange}
                    disabled={state.isLoading}
                    required
                  />
                </div>
                <div className="find-id__field">
                  <label className="label" htmlFor="email">이메일</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`input find-id__input ${state.error ? 'input--error' : ''}`}
                    placeholder="가입시 등록한 이메일을 입력하세요"
                    value={state.email}
                    onChange={handleInputChange}
                    disabled={state.isLoading}
                    required
                  />
                  {state.error && <span className="find-id__error">{state.error}</span>}
                </div>
                <div className="find-id__actions">
                  <button
                    type="button"
                    className="btn btn--secondary"
                    onClick={handlePrevious}
                    disabled={state.isLoading}
                  >
                    이전
                  </button>
                  <button
                    type="submit"
                    className="btn btn--primary"
                    disabled={state.isLoading}
                  >
                    {state.isLoading ? '검색 중...' : '아이디 찾기'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="find-id__result">
              <div className="find-id__success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                </svg>
              </div>
              <div className="find-id__success-message">
                입력하신 이름과 이메일로 가입된 아이디를 찾았습니다.
              </div>
              <div className="find-id__found-id">
                <span className="find-id__found-label">아이디:</span>
                <span className="find-id__found-value">{state.foundId}</span>
              </div>
              <div className="find-id__result-actions">
                <button
                  type="button"
                  className="btn btn--secondary"
                  onClick={handleReset}
                >
                  다시 찾기
                </button>
                <button
                  type="button"
                  className="btn btn--primary"
                  onClick={() => router.push('/auth/login')}
                >
                  로그인하기
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FindId;