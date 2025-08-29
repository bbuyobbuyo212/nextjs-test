import React, { useState, useEffect } from 'react';

interface CommentFormProps {
  onSubmit: (content: string, extra?: { name?: string; nickname?: string; password?: string }) => void;
  onCancel?: () => void;
  placeholder?: string;
  isReply?: boolean;
  targetUser?: string;
  initialContent?: string;
  isEdit?: boolean;
  user?: { nickname?: string } | null; // 회원 정보 prop 추가
  errorMessage?: string;
}

const CommentForm: React.FC<CommentFormProps> = ({
  onSubmit,
  onCancel,
  placeholder = "댓글을 입력하세요",
  isReply = false,
  targetUser,
  initialContent = '',
  isEdit = false,
  user = null, // 회원 정보 prop 추가
  errorMessage = ''
}) => {
  const [content, setContent] = useState(initialContent);
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const maxLength = 100;

  useEffect(() => {
    setContent(initialContent);
    setError('');
    if (!user) {
      setName('');
      setPassword('');
    }
  }, [initialContent, user]);

  // 외부에서 에러 메시지 들어오면 표시
  useEffect(() => {
    if (errorMessage) {
      setError(errorMessage);
    }
  }, [errorMessage]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (content.trim().length === 0) {
      setError('댓글 내용을 입력하세요.');
      return;
    }
    
    if (content.length > maxLength) {
      setError(`댓글은 ${maxLength}자를 초과할 수 없습니다.`);
      return;
    }
    
    if (!user) {
      // 비회원 댓글 처리
      if (!isEdit) {
        if (!name.trim()) {
          setError('이름을 입력하세요.');
          return;
        }
        if (!password.trim()) {
          setError('비밀번호를 입력하세요.');
          return;
        }
        if (password.trim().length < 4) {
          setError('비밀번호는 4자 이상 입력하세요.');
          return;
        }
        // 비회원: nickname에 name값을 항상 전달
        onSubmit(content.trim(), { 
          name: name.trim(), 
          nickname: name.trim(), 
          password: password 
        });
      } else {
        if (!password.trim()) {
          setError('비밀번호를 입력하세요.');
          return;
        }
        if (password.trim().length < 4) {
          setError('비밀번호는 4자 이상 입력하세요.');
          return;
        }
        // 비회원 댓글 수정 시에도 nickname에 name값을 항상 전달
        onSubmit(content.trim(), { 
          nickname: name.trim(), 
          password: password 
        });
      }
    } else {
      // 회원: nickname에 user.nickname을 명확히 전달
      onSubmit(content.trim(), { 
        nickname: user.nickname 
      });
    }
    
    if (!isEdit) {
      setContent('');
      setName('');
      setPassword('');
    }
  };

  const handleChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    const value = e.target.value;
    if (value.length <= maxLength) {
      setContent(value);
      setError('');
    }
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
    setError('');
  };
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setPassword(e.target.value);
    setError('');
  };

  const isOverLimit = content.length > maxLength;
  const remainingChars = maxLength - content.length;

  return (
    <form className="comment-form" onSubmit={handleSubmit}>
      {isReply && targetUser && !isEdit && (
        <div className="comment-form__target">
          <span className="comment-form__mention">@{targetUser}님에게 답글 작성 중...</span>
        </div>
      )}
      <div className="comment-form__input-group">
        {/* 회원: user 객체가 있고 nickname이 있으면 닉네임만 표시 */}
        {(user && user.nickname && user.nickname.trim()) ? (
          <div className="comment-form__input-nickname">
            <span className="comment-form__nickname">{user.nickname}</span>
          </div>
        ) : (
          <div className="comment-form__input-users">
            {/* 비회원: 이름/비밀번호 입력란 노출 */}
            {!isEdit ? (
              <>
                <input 
                  type="text" 
                  className="comment-form__input" 
                  required 
                  placeholder="이름" 
                  value={name} 
                  onChange={handleNameChange} 
                  autoComplete="username" 
                />
                <input
                  type="password"
                  className={`comment-form__input${error && error.toLowerCase().includes('비밀번호') ? ' comment-form__input--shake' : ''}`}
                  required
                  placeholder="비밀번호"
                  value={password}
                  onChange={handlePasswordChange}
                  autoComplete="current-password"
                  minLength={4}
                />
              </>
            ) : (
              <input
                type="password"
                className={`comment-form__input${error && error.toLowerCase().includes('비밀번호') ? ' comment-form__input--shake' : ''}`}
                required
                placeholder="비밀번호"
                value={password}
                onChange={handlePasswordChange}
                autoComplete="current-password"
                minLength={4}
              />
            )}
          </div>
        )}
      </div>
      
      <div className="comment-form__textarea-container">
        <textarea
          className={`comment-form__textarea ${isOverLimit ? 'comment-form__textarea--error' : ''}`}
          placeholder={placeholder}
          value={content}
          onChange={handleChange}
          rows={3}
          autoFocus={isEdit}
        />
        <div className="comment-form__counter">
          <span className={remainingChars < 0 ? 'comment-form__counter--error' : ''}>
            {content.length}/{maxLength}
          </span>
        </div>
      </div>

      {error && (
        <div className={`comment-form__error${error ? ' comment-form__error--shake' : ''}`}>{error}</div>
      )}

      <div className="comment-form__actions">
        {onCancel && (
          <button 
            type="button" 
            className="btn btn--secondary btn--small"
            onClick={onCancel}
          >
            취소
          </button>
        )}
        <button 
          type="submit" 
          className="btn btn--primary btn--small"
          disabled={
            isOverLimit ||
            (!user && (
              (!isEdit && (!name.trim() || !password.trim() || password.trim().length < 4)) ||
              (isEdit && (!password.trim() || password.trim().length < 4))
            )) ||
            !content.trim()
          }
        >
          {isEdit ? '수정' : (isReply ? '답글 작성' : '댓글 작성')}
        </button>
      </div>
    </form>
  );
};

export default CommentForm;
