"use client";
/* filepath: e:\연습\react\my-comunity\src\components\auth\Terms.tsx */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './Terms.css';

interface TermsState {
  allAgreed: boolean;
  serviceTerms: boolean;
  privacyPolicy: boolean;
}

const Terms: React.FC = () => {
  const router = useRouter();
  const [termsState, setTermsState] = useState<TermsState>({
    allAgreed: false,
    serviceTerms: false,
    privacyPolicy: false
  });

  const handleCheckboxChange = (name: keyof TermsState): void => {
    if (name === 'allAgreed') {
      const newValue = !termsState.allAgreed;
      setTermsState({
        allAgreed: newValue,
        serviceTerms: newValue,
        privacyPolicy: newValue
      });
    } else {
      const newState = {
        ...termsState,
        [name]: !termsState[name]
      };
      
      newState.allAgreed = newState.serviceTerms && newState.privacyPolicy;
      setTermsState(newState);
    }
  };

  const handleNext = (): void => {
    if (termsState.serviceTerms && termsState.privacyPolicy) {
  router.push('/auth/register');
    } else {
      alert('필수 약관에 모두 동의해주세요.');
    }
  };

  const handlePrevious = (): void => {
  router.push('/auth/login');
  };

  const isNextEnabled = termsState.serviceTerms && termsState.privacyPolicy;

  return (
    <div className="terms">
      <div className="container">
        <div className="terms__wrapper">
          <h1 className="title title--large terms__title">약관동의</h1>

          <div className="terms__content">
            {/* 전체 약관동의 */}
            <div className="terms__all-agree">
              <div className="checkbox">
                <input
                  type="checkbox"
                  id="allAgreed"
                  className="checkbox__input"
                  checked={termsState.allAgreed}
                  onChange={() => handleCheckboxChange('allAgreed')}
                />
                <label htmlFor="allAgreed" className="checkbox__label">
                  <span className="checkbox__text">전체 약관에 동의합니다</span>
                </label>
              </div>
            </div>

            {/* 이용약관 */}
            <div className="terms__section">
              <div className="terms__header">
                <div className="checkbox">
                  <input
                    type="checkbox"
                    id="serviceTerms"
                    className="checkbox__input"
                    checked={termsState.serviceTerms}
                    onChange={() => handleCheckboxChange('serviceTerms')}
                  />
                  <label htmlFor="serviceTerms" className="checkbox__label">
                    <span className="checkbox__text">이용약관 동의 (필수)</span>
                  </label>
                </div>
              </div>
              <div className="terms__scroll-box">
                <div className="terms__text">
                  <h4>제1조 (목적)</h4>
                  <p>이 약관은 회사가 운영하는 웹사이트에서 제공하는 인터넷 관련 서비스(이하 "서비스"라 한다)를 이용함에 있어 사이트와 이용자의 권리․의무 및 책임사항을 규정함을 목적으로 합니다.</p>
                  
                  <h4>제2조 (정의)</h4>
                  <p>① "사이트"란 회사가 재화 또는 용역을 이용자에게 제공하기 위하여 컴퓨터 등 정보통신설비를 이용하여 재화 또는 용역을 거래할 수 있도록 설정한 가상의 영업장을 말하며, 아울러 사이트를 운영하는 사업자의 의미로도 사용합니다.</p>
                  <p>② "이용자"란 "사이트"에 접속하여 이 약관에 따라 "사이트"가 제공하는 서비스를 받는 회원 및 비회원을 말합니다.</p>
                  
                  <h4>제3조 (약관 등의 명시와 설명 및 개정)</h4>
                  <p>① "사이트"는 이 약관의 내용과 상호 및 대표자 성명, 영업소 소재지 주소(소비자의 불만을 처리할 수 있는 곳의 주소를 포함), 전화번호․모사전송번호․전자우편주소, 사업자등록번호 등을 이용자가 쉽게 알 수 있도록 "사이트"의 초기 서비스화면(전면)에 게시합니다.</p>
                </div>
              </div>
            </div>

            {/* 개인정보처리방침 */}
            <div className="terms__section">
              <div className="terms__header">
                <div className="checkbox">
                  <input
                    type="checkbox"
                    id="privacyPolicy"
                    className="checkbox__input"
                    checked={termsState.privacyPolicy}
                    onChange={() => handleCheckboxChange('privacyPolicy')}
                  />
                  <label htmlFor="privacyPolicy" className="checkbox__label">
                    <span className="checkbox__text">개인정보처리방침 동의 (필수)</span>
                  </label>
                </div>
              </div>
              <div className="terms__scroll-box">
                <div className="terms__text">
                  <h4>1. 개인정보의 처리 목적</h4>
                  <p>회사는 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며 이용 목적이 변경되는 경우에는 「개인정보 보호법」 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.</p>
                  
                  <h4>2. 개인정보의 처리 및 보유 기간</h4>
                  <p>① 회사는 정보주체로부터 개인정보를 수집할 때 동의받은 개인정보 보유․이용기간 또는 법령에 따른 개인정보 보유․이용기간 내에서 개인정보를 처리․보유합니다.</p>
                  
                  <h4>3. 처리하는 개인정보의 항목</h4>
                  <p>① 회사는 다음의 개인정보 항목을 처리하고 있습니다.</p>
                  <p>- 필수항목: 이름, 아이디, 비밀번호, 이메일</p>
                  <p>- 선택항목: 전화번호, 주소</p>
                </div>
              </div>
            </div>
          </div>

          <div className="terms__actions">
            <button
              type="button"
              className="btn btn--secondary"
              onClick={handlePrevious}
            >
              이전
            </button>
            <button
              type="button"
              className={`btn ${isNextEnabled ? 'btn--primary' : 'btn--secondary'}`}
              onClick={handleNext}
              disabled={!isNextEnabled}
            >
              다음
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Terms;