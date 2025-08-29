"use client";
import React, { useState, useEffect } from 'react';

const ProfileEdit: React.FC = () => {
  const router = typeof window !== 'undefined' ? require('next/navigation').useRouter() : null;
  const [status, setStatus] = useState<'loading'|'authenticated'|'unauthenticated'>('loading');
  const [formData, setFormData] = useState({
    userid: '',
    name: '',
    email: '',
    nickname: '',
    password: '',
    confirmPassword: ''
  });
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const [success, setSuccess] = useState('');
  const [emailCheck, setEmailCheck] = useState<{ checked: boolean, message: string }>({ checked: true, message: '' });
  const [nicknameCheck, setNicknameCheck] = useState<{ checked: boolean, message: string }>({ checked: true, message: '' });

  useEffect(() => {
    fetch('/api/auth/profile', {
      method: 'GET',
      credentials: 'include'
    })
      .then(res => res.json())
      .then(data => {
        if (data.success && data.user) {
          setFormData(prev => ({
            ...prev,
            userid: data.user.userid,
            name: data.user.name,
            email: data.user.email,
            nickname: data.user.nickname
          }));
          setStatus('authenticated');
        } else {
          setStatus('unauthenticated');
          setErrors(prev => ({ ...prev, general: data.error || '회원정보를 불러올 수 없습니다.' }));
          if (router) router.push('/auth/login');
        }
      })
      .catch(err => {
        setStatus('unauthenticated');
        setErrors(prev => ({ ...prev, general: '회원정보 API 오류: ' + err.message }));
        if (router) router.push('/auth/login');
      });
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setErrors(prev => ({ ...prev, [name]: '' }));
    setSuccess('');
    if (name === 'email') setEmailCheck({ checked: false, message: '' });
    if (name === 'nickname') setNicknameCheck({ checked: false, message: '' });
  };

  const handleEmailCheck = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    const value = e.target.value.trim();
    if (!value) {
      setEmailCheck({ checked: false, message: '' });
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
      setEmailCheck({ checked: false, message: '이메일 확인 중 오류.' });
    }
  };

  const handleNicknameCheck = async (e: React.ChangeEvent<HTMLInputElement>) => {
    handleChange(e);
    const value = e.target.value.trim();
    if (!value) {
      setNicknameCheck({ checked: false, message: '' });
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
      setNicknameCheck({ checked: false, message: '닉네임 확인 중 오류.' });
    }
  };

  const validate = () => {
    const newErrors: { [key: string]: string } = {};
    if (!formData.name.trim()) newErrors.name = '이름을 입력하세요.';
    if (!formData.nickname.trim()) newErrors.nickname = '닉네임을 입력하세요.';
    else if (!nicknameCheck.checked) newErrors.nickname = '닉네임 중복 확인을 해주세요.';
    if (!formData.email.trim()) newErrors.email = '이메일을 입력하세요.';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) newErrors.email = '올바른 이메일 형식이 아닙니다.';
    else if (!emailCheck.checked) newErrors.email = '이메일 중복 확인을 해주세요.';
    if (formData.password && formData.password.length < 6) newErrors.password = '비밀번호는 6글자 이상이어야 합니다.';
    if (formData.password && formData.password !== formData.confirmPassword) newErrors.confirmPassword = '비밀번호가 일치하지 않습니다.';
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;
    try {
      const body: any = {
        name: formData.name,
        email: formData.email,
        nickname: formData.nickname
      };
      if (formData.password) body.password = formData.password;
      const response = await fetch(`/api/auth/profile`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        credentials: 'include',
        body: JSON.stringify({
          userid: formData.userid,
          name: formData.name,
          email: formData.email,
          nickname: formData.nickname,
          password: formData.password
        })
      });
      const result = await response.json();
      if (result.success) {
        setSuccess('정보가 성공적으로 수정되었습니다.');
      } else {
        setErrors({ general: result.error || '수정 실패' });
      }
    } catch {
      setErrors({ general: '서버 오류가 발생했습니다.' });
    }
    // 최신 정보 다시 불러오기
    fetch('/api/auth/profile', {
      method: 'GET',
      credentials: 'include'
    })
      .then(async res => {
        if (!res.ok) throw new Error('정보 갱신 실패');
        return await res.json();
      })
      .then(data => {
        if (data.success && data.user) {
          setFormData(prev => ({
            ...prev,
            name: data.user.name,
            email: data.user.email,
            nickname: data.user.nickname
          }));
        }
      })
      .catch(err => {
        console.error('정보 갱신 오류:', err);
      });
    
  };

  if (status === 'loading') {
    return <div className="container" style={{ maxWidth: '40rem', margin: '4rem auto' }}><h1 className="title">정보수정</h1><div>로딩 중...</div></div>;
  }
  if (status === 'unauthenticated') {
  return null;
  }
  return (
    <div className="container" style={{ maxWidth: '40rem', margin: '4rem auto' }}>
      <h1 className="title">정보수정</h1>
      <form onSubmit={handleSubmit} className="board-write__form">
        <div className="form-group">
          <label className="label">아이디</label>
          <div className="profile-id">{formData.userid}</div>
        </div>
        <div className="form-group">
          <label className="label" htmlFor="name">이름</label>
          <input
            type="text"
            id="name"
            name="name"
            className="input-box"
            value={formData.name ?? ''}
            onChange={handleChange}
            required
          />
          {errors.name && <div className="comment-form__error">{errors.name}</div>}
        </div>
        <div className="form-group">
          <label className="label" htmlFor="nickname">닉네임</label>
          <input
            type="text"
            id="nickname"
            name="nickname"
            className="input-box"
            value={formData.nickname ?? ''}
            onChange={handleNicknameCheck}
            required
          />
          {errors.nickname && <div className="comment-form__error error-message">{errors.nickname}</div>}
          {!errors.nickname && nicknameCheck.message && (
            <div className={`comment-form__error ${nicknameCheck.checked ? 'success-message' : 'error-message'}`}>{nicknameCheck.message}</div>
          )}
        </div>
        <div className="form-group">
          <label className="label" htmlFor="email">이메일</label>
          <input
            type="email"
            id="email"
            name="email"
            className="input-box"
            value={formData.email}
            onChange={handleEmailCheck}
            required
          />
          {errors.email && <div className="comment-form__error error-message">{errors.email}</div>}
          {!errors.email && emailCheck.message && (
            <div className={`comment-form__error ${emailCheck.checked ? 'success-message' : 'error-message'}`}>{emailCheck.message}</div>
          )}
        </div>
        <div className="form-group">
          <label className="label" htmlFor="password">새 비밀번호</label>
          <input
            type="password"
            id="password"
            name="password"
            className="input-box"
            value={formData.password}
            onChange={handleChange}
            placeholder="변경 시 입력 (6글자 이상)"
          />
          {errors.password && <div className="comment-form__error">{errors.password}</div>}
        </div>
        <div className="form-group">
          <label className="label" htmlFor="confirmPassword">비밀번호 확인</label>
          <input
            type="password"
            id="confirmPassword"
            name="confirmPassword"
            className="input-box"
            value={formData.confirmPassword}
            onChange={handleChange}
            placeholder="비밀번호 확인"
          />
          {errors.confirmPassword && <div className="comment-form__error">{errors.confirmPassword}</div>}
        </div>
        <div className="board-write__actions">
          <button type="submit" className="btn btn--primary">정보수정</button>
        </div>
        {errors.general && <div className="comment-form__error error-message" style={{ marginTop: '2rem', textAlign: 'center' }}>{errors.general}</div>}
        {success && <div className="success-message" style={{ marginTop: '2rem', textAlign: 'center' }}>{success}</div>}
      </form>
    </div>
  );
};

export default ProfileEdit;
