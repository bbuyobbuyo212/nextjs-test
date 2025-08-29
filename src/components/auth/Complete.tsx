"use client";
/* filepath: e:\연습\react\my-comunity\src\components\auth\Complete.tsx */
import React from 'react';
import { useRouter } from 'next/navigation';
import './Complete.css';

const Complete: React.FC = () => {
  const router = useRouter();

  const handleGoToMain = (): void => {
    router.push('/');
  };

  return (
    <div className="complete">
      <div className="container">
        <div className="complete__wrapper">
          <div className="complete__icon">
            <svg className="complete__check-icon" viewBox="0 0 24 24" fill="currentColor">
              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
            </svg>
          </div>
          
          <h1 className="title title--large complete__title">
            회원가입이 완료되었습니다!
          </h1>
          
          <div className="complete__message">
            <p className="complete__welcome">
              MY COMMUNITY에 오신 것을 환영합니다.
            </p>
            <p className="complete__description">
              이제 다양한 커뮤니티 서비스를 이용하실 수 있습니다.
            </p>
          </div>

          <button
            type="button"
            className="btn btn--primary complete__button"
            onClick={handleGoToMain}
          >
            메인으로 이동
          </button>
        </div>
      </div>
    </div>
  );
};

export default Complete;