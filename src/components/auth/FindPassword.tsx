"use client";
/* filepath: e:\연습\react\my-comunity\src\components\auth\FindPassword.tsx */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './FindPassword.css';

interface FindPasswordState {
  email: string;
  username: string;
  isEmailSent: boolean;
  isLoading: boolean;
  error: string;
}

const FindPassword: React.FC = () => {
  const router = useRouter();
  const [state, setState] = useState<FindPasswordState>({
    email: '',
    username: '',
    isEmailSent: false,
    isLoading: false,
    error: ''
  });

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setState(prev => ({
      ...prev,
      [name]: value,
      error: ''
    }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    
    if (!state.email.trim()) {
      setState(prev => ({ ...prev, error: '이메일을 입력해주세요.' }));
      return;
    }

    if (!state.username.trim()) {
      setState(prev => ({ ...prev, error: '아이디를 입력해주세요.' }));
      return;
    }

    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(state.email)) {
      setState(prev => ({ ...prev, error: '올바른 이메일 형식이 아닙니다.' }));
      return;
    }

    setState(prev => ({ ...prev, isLoading: true, error: '' }));

    try {
      const res = await fetch('/api/auth/find-password', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: state.email, userid: state.username })
      });
      const data = await res.json();
      if (res.ok && data.success && data.tempPassword) {
        setState(prev => ({
          ...prev,
          isEmailSent: true,
          isLoading: false,
          error: ''
        }));
        // 실제 서비스에서는 이메일로 임시 비밀번호를 안내해야 함
        alert(`임시 비밀번호: ${data.tempPassword}`);
      } else {
        setState(prev => ({
          ...prev,
          isEmailSent: false,
          isLoading: false,
          error: data.error || '입력하신 정보와 일치하는 계정을 찾을 수 없습니다.'
        }));
      }
    } catch (err) {
      setState(prev => ({
        ...prev,
        isEmailSent: false,
        isLoading: false,
        error: '서버 오류가 발생했습니다.'
      }));
    }
  };

  const handlePrevious = (): void => {
    router.push('/auth/login');
  };

  const handleReset = (): void => {
    setState({
      email: '',
      username: '',
      isEmailSent: false,
      isLoading: false,
      error: ''
    });
  };

  return (
    <div className="find-password">
      <div className="container">
        <div className="find-password__wrapper">
          <h1 className="title title--large find-password__title">비밀번호 찾기</h1>

          {!state.isEmailSent ? (
            <>
              <div className="find-password__description">
                가입시 등록한 이메일과 아이디를 입력해주세요.<br/>
                임시 비밀번호를 이메일로 발송해드립니다.
              </div>

              <form className="find-password__form" onSubmit={handleSubmit}>
                <div className="find-password__field">
                  <label className="label" htmlFor="email">이메일</label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className={`input find-password__input ${state.error ? 'input--error' : ''}`}
                    placeholder="가입시 등록한 이메일을 입력하세요"
                    value={state.email}
                    onChange={handleInputChange}
                    disabled={state.isLoading}
                    required
                  />
                </div>

                <div className="find-password__field">
                  <label className="label" htmlFor="username">아이디</label>
                  <input
                    type="text"
                    id="username"
                    name="username"
                    className={`input find-password__input ${state.error ? 'input--error' : ''}`}
                    placeholder="가입시 등록한 아이디를 입력하세요"
                    value={state.username}
                    onChange={handleInputChange}
                    disabled={state.isLoading}
                    required
                  />
                  {state.error && <span className="find-password__error">{state.error}</span>}
                </div>

                <div className="find-password__actions">
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
                    {state.isLoading ? '발송 중...' : '비밀번호 찾기'}
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="find-password__result">
              <div className="find-password__success-icon">
                <svg viewBox="0 0 24 24" fill="currentColor">
                  <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
                </svg>
              </div>
              
              <div className="find-password__success-message">
                임시 비밀번호가 이메일로 발송되었습니다.
              </div>

              <div className="find-password__email-info">
                <span className="find-password__email-label">발송된 이메일:</span>
                <span className="find-password__email-value">{state.email}</span>
              </div>

              <div className="find-password__notice">
                <p>• 이메일이 도착하지 않았다면 스팸함을 확인해주세요.</p>
                <p>• 임시 비밀번호로 로그인 후 반드시 비밀번호를 변경해주세요.</p>
              </div>

              <div className="find-password__result-actions">
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
                  onClick={handlePrevious}
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

export default FindPassword;