"use client";
/* filepath: e:\연습\react\my-comunity\src\components\auth\Register.tsx */
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import './Register.css';

interface RegisterFormData {
  name: string;
  userid: string;
  password: string;
  confirmPassword: string;
  email: string;
  nickname: string;
}

interface ShowPassword {
  password: boolean;
  confirmPassword: boolean;
}

const Register: React.FC = () => {
  const [nicknameCheck, setNicknameCheck] = useState<{ checked: boolean, message: string }>({ checked: false, message: '' });
  const [idCheck, setIdCheck] = useState<{ checked: boolean, message: string }>({ checked: false, message: '' });
  const [emailCheck, setEmailCheck] = useState<{ checked: boolean, message: string }>({ checked: false, message: '' });
  const router = useRouter();
  const [formData, setFormData] = useState<RegisterFormData>({
  name: '',
  userid: '',
  password: '',
  confirmPassword: '',
  email: '',
  nickname: ''
  });

  const [showPassword, setShowPassword] = useState<ShowPassword>({
    password: false,
    confirmPassword: false
  });

  const [errors, setErrors] = useState<Partial<RegisterFormData>>({});

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // 입력값 변경 시 중복 체크 초기화
    if (name === 'nickname') setNicknameCheck({ checked: false, message: '' });
    if (name === 'userid') setIdCheck({ checked: false, message: '' });
    if (name === 'email') setEmailCheck({ checked: false, message: '' });
    // 에러 제거
    if (errors[name as keyof RegisterFormData]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const togglePasswordVisibility = (field: keyof ShowPassword): void => {
    setShowPassword(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<RegisterFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = '이름을 입력해주세요.';
    }

    if (!formData.userid.trim()) {
      newErrors.userid = '아이디를 입력해주세요.';
    } else if (formData.userid.length < 4) {
      newErrors.userid = '아이디는 4글자 이상이어야 합니다.';
    } else if (!idCheck.checked) {
      newErrors.userid = '아이디 중복 확인을 해주세요.';
    }

    if (!formData.password) {
      newErrors.password = '비밀번호를 입력해주세요.';
    } else if (formData.password.length < 6) {
      newErrors.password = '비밀번호는 6글자 이상이어야 합니다.';
    }

    if (!formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호 확인을 입력해주세요.';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    }

    if (!formData.nickname.trim()) {
      newErrors.nickname = '닉네임을 입력해주세요.';
    } else if (!nicknameCheck.checked) {
      newErrors.nickname = '닉네임 중복 확인을 해주세요.';
    }
    if (!formData.email.trim()) {
      newErrors.email = '이메일을 입력해주세요.';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '올바른 이메일 형식이 아닙니다.';
    } else if (!emailCheck.checked) {
      newErrors.email = '이메일 중복 확인을 해주세요.';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (validateForm()) {
      try {
        const response = await fetch('/api/auth/register', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            userid: formData.userid,
            password: formData.password,
            name: formData.name,
            email: formData.email,
            nickname: formData.nickname
          })
        });
        const result = await response.json();
        if (result.success) {
          router.push('/auth/complete');
        } else {
          alert(result.error || '회원가입에 실패했습니다.');
        }
      } catch (err) {
        alert('서버 오류가 발생했습니다.');
      }
    }
  };

  const handlePrevious = (): void => {
  router.push('/auth/terms');
  };

  return (
    <div className="register">
      <div className="container">
        <div className="register__wrapper">
          <h1 className="title title--large register__title">정보입력</h1>
          
          <div className="register__required-notice">
            <span className="register__required-mark">*</span> 필수 입력 항목
          </div>

          <form className="register__form" onSubmit={handleSubmit}>
            <div className="register__field">
              <label className="label" htmlFor="name">
                이름 <span className="register__required-mark">*</span>
              </label>
              <input
                type="text"
                id="name"
                name="name"
                className={`input register__input ${errors.name ? 'input--error' : ''}`}
                placeholder="이름을 입력하세요"
                value={formData.name}
                onChange={handleInputChange}
                required
              />
              {errors.name && <span className="register__error">{errors.name}</span>}
            </div>

            {/* 아이디 인풋 */}
            <div className="register__field">
              <label className="label" htmlFor="userid">
                아이디 <span className="register__required-mark">*</span>
              </label>
              <input
                type="text"
                id="userid"
                name="userid"
                className={`input register__input ${errors.userid ? 'input--error' : ''}`}
                placeholder="아이디를 입력하세요 (4글자 이상)"
                value={formData.userid}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="register__check-button"
                onClick={async () => {
                  const value = formData.userid.trim();
                  if (!value) {
                    setIdCheck({ checked: false, message: '아이디를 입력해주세요.' });
                    return;
                  }
                  if (value.length < 4) {
                    setIdCheck({ checked: false, message: '아이디는 4글자 이상이어야 합니다.' });
                    return;
                  }
                  try {
                    const res = await fetch(`/api/auth/check-userid?userid=${encodeURIComponent(value)}`);
                    const data = await res.json();
                    if (res.ok && data.available) {
                      setIdCheck({ checked: true, message: '사용 가능한 아이디입니다.' });
                    } else {
                      setIdCheck({ checked: false, message: '이미 사용중인 아이디입니다.' });
                    }
                  } catch {
                    setIdCheck({ checked: false, message: '아이디 확인 중 오류가 발생했습니다.' });
                  }
                }}
              >
                중복확인
              </button>
              {errors.userid && <span className="register__message error-message">{errors.userid}</span>}
              {!errors.userid && idCheck.message && (
                <span className={`register__message ${idCheck.checked ? 'success-message' : 'error-message'}`}>{idCheck.message}</span>
              )}
            </div>

            <div className="register__field">
              <label className="label" htmlFor="password">
                비밀번호 <span className="register__required-mark">*</span>
              </label>
              <div className="register__password-wrapper">
                <input
                  type={showPassword.password ? 'text' : 'password'}
                  id="password"
                  name="password"
                  className={`input register__input register__password-input ${errors.password ? 'input--error' : ''}`}
                  placeholder="비밀번호를 입력하세요 (6글자 이상)"
                  value={formData.password}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="register__password-toggle"
                  onClick={() => togglePasswordVisibility('password')}
                  aria-label="비밀번호 보기/숨기기"
                >
                  <svg className="register__password-icon" viewBox="0 0 24 24" fill="currentColor">
                    {showPassword.password ? (
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                    ) : (
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    )}
                  </svg>
                </button>
              </div>
              {errors.password && <span className="register__message error-message">{errors.password}</span>}
            </div>

            <div className="register__field">
              <label className="label" htmlFor="confirmPassword">
                비밀번호 확인 <span className="register__required-mark">*</span>
              </label>
              <div className="register__password-wrapper">
                <input
                  type={showPassword.confirmPassword ? 'text' : 'password'}
                  id="confirmPassword"
                  name="confirmPassword"
                  className={`input register__input register__password-input ${errors.confirmPassword ? 'input--error' : ''}`}
                  placeholder="비밀번호를 다시 입력하세요"
                  value={formData.confirmPassword}
                  onChange={handleInputChange}
                  required
                />
                <button
                  type="button"
                  className="register__password-toggle"
                  onClick={() => togglePasswordVisibility('confirmPassword')}
                  aria-label="비밀번호 확인 보기/숨기기"
                >
                  <svg className="register__password-icon" viewBox="0 0 24 24" fill="currentColor">
                    {showPassword.confirmPassword ? (
                      <path d="M12 7c2.76 0 5 2.24 5 5 0 .65-.13 1.26-.36 1.83l2.92 2.92c1.51-1.26 2.7-2.89 3.43-4.75-1.73-4.39-6-7.5-11-7.5-1.4 0-2.74.25-3.98.7l2.16 2.16C10.74 7.13 11.35 7 12 7zM2 4.27l2.28 2.28.46.46C3.08 8.3 1.78 10.02 1 12c1.73 4.39 6 7.5 11 7.5 1.55 0 3.03-.3 4.38-.84l.42.42L19.73 22 21 20.73 3.27 3 2 4.27zM7.53 9.8l1.55 1.55c-.05.21-.08.43-.08.65 0 1.66 1.34 3 3 3 .22 0 .44-.03.65-.08l1.55 1.55c-.67.33-1.41.53-2.2.53-2.76 0-5-2.24-5-5 0-.79.2-1.53.53-2.2zm4.31-.78l3.15 3.15.02-.16c0-1.66-1.34-3-3-3l-.17.01z"/>
                    ) : (
                      <path d="M12 4.5C7 4.5 2.73 7.61 1 12c1.73 4.39 6 7.5 11 7.5s9.27-3.11 11-7.5c-1.73-4.39-6-7.5-11-7.5zM12 17c-2.76 0-5-2.24-5-5s2.24-5 5-5 5 2.24 5 5-2.24 5-5 5zm0-8c-1.66 0-3 1.34-3 3s1.34 3 3 3 3-1.34 3-3-1.34-3-3-3z"/>
                    )}
                  </svg>
                </button>
              </div>
              {errors.confirmPassword && <span className="register__message error-message">{errors.confirmPassword}</span>}
            </div>

            {/* 닉네임 인풋 */}
            <div className="register__field">
              <label className="label" htmlFor="nickname">
                닉네임 <span className="register__required-mark">*</span>
              </label>
              <input
                type="text"
                id="nickname"
                name="nickname"
                className={`input register__input ${errors.nickname ? 'input--error' : ''}`}
                placeholder="닉네임을 입력하세요"
                value={formData.nickname}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="register__check-button"
                onClick={async () => {
                  const value = formData.nickname.trim();
                  if (!value) {
                    setNicknameCheck({ checked: false, message: '닉네임을 입력해주세요.' });
                    return;
                  }
                  try {
                    const res = await fetch(`/api/auth/check-nickname?nickname=${encodeURIComponent(value)}`);
                    const data = await res.json();
                    if (res.ok && data.available) {
                      setNicknameCheck({ checked: true, message: '사용 가능한 닉네임입니다.' });
                    } else {
                      setNicknameCheck({ checked: false, message: '이미 사용중인 닉네임입니다.' });
                    }
                  } catch {
                    setNicknameCheck({ checked: false, message: '닉네임 확인 중 오류가 발생했습니다.' });
                  }
                }}
              >
                중복확인
              </button>
              {errors.nickname && <span className="register__message error-message">{errors.nickname}</span>}
              {!errors.nickname && nicknameCheck.message && (
                <span className={`register__message ${nicknameCheck.checked ? 'success-message' : 'error-message'}`}>{nicknameCheck.message}</span>
              )}
            </div>

            {/* 이메일 인풋 */}
            <div className="register__field">
              <label className="label" htmlFor="email">
                이메일 <span className="register__required-mark">*</span>
              </label>
              <input
                type="email"
                id="email"
                name="email"
                className={`input register__input ${errors.email ? 'input--error' : ''}`}
                placeholder="이메일을 입력하세요"
                value={formData.email}
                onChange={handleInputChange}
                required
              />
              <button
                type="button"
                className="register__check-button"
                onClick={async () => {
                  const value = formData.email.trim();
                  if (!value) {
                    setEmailCheck({ checked: false, message: '이메일을 입력해주세요.' });
                    return;
                  }
                  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) {
                    setEmailCheck({ checked: false, message: '올바른 이메일 형식이 아닙니다.' });
                    return;
                  }
                  try {
                    const res = await fetch(`/api/auth/check-email?email=${encodeURIComponent(value)}`);
                    const data = await res.json();
                    if (res.ok && data.available) {
                      setEmailCheck({ checked: true, message: '사용 가능한 이메일입니다.' });
                    } else {
                      setEmailCheck({ checked: false, message: '이미 사용중인 이메일입니다.' });
                    }
                  } catch {
                    setEmailCheck({ checked: false, message: '이메일 확인 중 오류가 발생했습니다.' });
                  }
                }}
              >
                중복확인
              </button>
              {errors.email && <span className="register__message error-message">{errors.email}</span>}
              {!errors.email && emailCheck.message && (
                <span className={`register__message ${emailCheck.checked ? 'success-message' : 'error-message'}`}>{emailCheck.message}</span>
              )}
            </div>

            <div className="register__actions">
              <button
                type="button"
                className="btn btn--secondary"
                onClick={handlePrevious}
              >
                이전
              </button>
              <button type="submit" className="btn btn--primary">
                가입완료
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Register;