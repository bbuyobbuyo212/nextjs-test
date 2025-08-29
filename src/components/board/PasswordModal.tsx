"use client";

import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

// 비밀번호 모달 컴포넌트 타입
interface PasswordModalProps {
  type: 'edit' | 'delete';
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (password: string) => void;
}

// 비밀번호 모달 컴포넌트
const PasswordModal: React.FC<PasswordModalProps> = ({ type, isOpen, onClose, onSubmit }) => {
  const [password, setPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (password.trim()) {
      onSubmit(password);
      setPassword('');
    } else {
      alert('비밀번호를 입력해주세요.');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="modal-overlay active">
      <div className="dimmed"></div>
      <div className="modal-container">
        <div className="modal-title">
          {type === 'edit' ? '게시글 수정' : '게시글 삭제'}
        </div>
        <span className="modal-close" onClick={onClose}></span>
        <div className="modal-content">
          <form onSubmit={handleSubmit}>                
            <div className="user-form__input">
              <label htmlFor="pw">비밀번호</label>                       
              <input 
                type="password" 
                id="pw"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
            </div>
            <div className="modal-btn-area">                    
              <button 
                type="button" 
                className="btn btn--outline"
                onClick={onClose}
              >
                취소
              </button>
              <button 
                type="submit" 
                className="btn btn--primary"
              >
                확인
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default PasswordModal;
