"use client";
import React, { useEffect, useState } from 'react';
// 회원 관리 폼 컴포넌트 타입
type UserFormProps = {
  user: User;
  onClose: () => void;
  onUserChange: (userid: string, data: Partial<User>) => void;
  loading: boolean;
};
// 회원 관리 폼 컴포넌트
const UserForm = ({ user, onClose, onUserChange, loading }: UserFormProps) => {
  const [form, setForm] = useState({ ...user });
  const [nicknameCheck, setNicknameCheck] = useState<{ checked: boolean, message: string }>({ checked: false, message: '' });
  const [idCheck, setIdCheck] = useState<{ checked: boolean, message: string }>({ checked: false, message: '' });
  const [emailCheck, setEmailCheck] = useState<{ checked: boolean, message: string }>({ checked: false, message: '' });
  const [error, setError] = useState('');

  // 아이디 중복 체크
  const checkUserId = async (userid: string) => {
    if (!userid) {
      setIdCheck({ checked: false, message: '아이디를 입력하세요.' });
      return false;
    }
    try {
      const res = await fetch(`/api/admin/admin-users/check-userid?userid=${encodeURIComponent(userid)}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.available) {
        setIdCheck({ checked: true, message: '사용 가능한 아이디입니다.' });
        return true;
      } else {
        setIdCheck({ checked: false, message: '이미 사용중인 아이디입니다.' });
        return false;
      }
    } catch {
      setIdCheck({ checked: false, message: '아이디 확인 중 오류.' });
      return false;
    }
  };

  // 이메일 중복 체크
  const checkEmail = async (email: string) => {
    if (!email) {
      setEmailCheck({ checked: false, message: '이메일을 입력하세요.' });
      return false;
    }
    try {
      const res = await fetch(`/api/admin/admin-users/check-email?email=${encodeURIComponent(email)}`, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.available) {
        setEmailCheck({ checked: true, message: '사용 가능한 이메일입니다.' });
        return true;
      } else {
        setEmailCheck({ checked: false, message: '이미 사용중인 이메일입니다.' });
        return false;
      }
    } catch {
      setEmailCheck({ checked: false, message: '이메일 확인 중 오류.' });
      return false;
    }
  };
  // 닉네임 중복 체크
  const checkNickname = async (nickname: string) => {
    if (!nickname) {
      setNicknameCheck({ checked: false, message: '닉네임을 입력하세요.' });
      return false;
    }
    try {
      let url = `/api/admin/admin-users/check-nickname?nickname=${encodeURIComponent(nickname)}`;
      if (user.userid) {
        url += `&userid=${encodeURIComponent(user.userid)}`;
      }
      const res = await fetch(url, { credentials: 'include' });
      const data = await res.json();
      if (res.ok && data.available) {
        setNicknameCheck({ checked: true, message: '사용 가능한 닉네임입니다.' });
        return true;
      } else {
        setNicknameCheck({ checked: false, message: '이미 사용중인 닉네임입니다.' });
        return false;
      }
    } catch {
      setNicknameCheck({ checked: false, message: '닉네임 확인 중 오류.' });
      return false;
    }
  };

  // 회원 수정 및 추가
  const handleSubmit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setError('');
    // 이메일 형식 체크
    if (!/^\S+@\S+\.\S+$/.test(form.email)) {
      setError('이메일 형식이 올바르지 않습니다.');
      return;
    }
    // 닉네임 길이 체크
    if (form.nickname.length < 2) {
      setError('닉네임은 2자 이상이어야 합니다.');
      return;
    }
    // 모달 모드 판별
    const isEdit = !!user.userid;
    // 회원추가: 아이디 중복검사
    if (!isEdit) {
      if (!idCheck.checked) {
        setError('아이디 중복 확인을 해주세요.');
        return;
      }
    }
    // 이메일 중복검사: 회원수정시 기존 이메일이면 검사 없이 통과
    if (isEdit) {
      if (!emailCheck.checked && form.email !== user.email) {
        setError('이메일 중복 확인을 해주세요.');
        return;
      }
    } else {
      if (!emailCheck.checked) {
        setError('이메일 중복 확인을 해주세요.');
        return;
      }
    }
    if (!nicknameCheck.checked) {
      setError('닉네임 중복 확인을 해주세요.');
      return;
    }
    onUserChange(form.userid, form);
    onClose();
  }

  return (
    <form onSubmit={handleSubmit}>
      <div className="user-form__input">
        <label>
          <b>아이디:</b>
          {user.userid ? (
            <input type="text" value={form.userid} readOnly style={{ background: '#f5f5f5', color: '#888' }} />
          ) : (
            <input type="text" value={form.userid} onChange={e => { setForm({ ...form, userid: e.target.value }); setIdCheck({ checked: false, message: '' }); }} onBlur={() => checkUserId(form.userid)} />
          )}
        </label>
        {!user.userid && !idCheck.checked && idCheck.message && <div className="login-error">{idCheck.message}</div>}
      </div>
      <div className="user-form__input">
        <label>
          <b>이름:</b>
          <input type="text" value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} />
        </label>
      </div>
      <div className="user-form__input">
        <label>
          <b>닉네임:</b>
          <input type="text" value={form.nickname} onChange={e => { setForm({ ...form, nickname: e.target.value }); setNicknameCheck({ checked: false, message: '' }); }} onBlur={() => checkNickname(form.nickname)} />
        </label>
        {!nicknameCheck.checked && nicknameCheck.message && <div className="login-error">{nicknameCheck.message}</div>}
      </div>
      <div className="user-form__input">
        <label>
          <b>이메일:</b>
          <input type="email" value={form.email} onChange={e => { setForm({ ...form, email: e.target.value }); setEmailCheck({ checked: false, message: '' }); }} onBlur={() => checkEmail(form.email)} />
        </label>
        {!emailCheck.checked && emailCheck.message && <div className="login-error">{emailCheck.message}</div>}
      </div>
      <div className="user-form__input">
      <label>
        <b>비밀번호:</b>
        <input type="password" value={form.password} onChange={e => setForm({ ...form, password: e.target.value })} />
      </label>
      {error && <div className="login-error" style={{ marginTop: 8 }}>{error}</div>}
      </div>      
      <div className="modal-btn-area">
        <button type="submit" className="btn btn--primary" disabled={loading}>저장</button>
        <button type="button" className="btn btn--outline" onClick={onClose} disabled={loading}>취소</button>
      </div>
    </form>
  );
};

interface User {
  userid: string;
  name: string;
  nickname: string;
  email: string;
  created_at: string;
  password?: string;
}

// Next.js 내부 API 경로 사용

function AdminUsers() {
  const [users, setUsers] = useState<User[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState<{ userid: string; name: string; nickname: string; email: string; password?: string; created_at: string }>({
    userid: '',
    name: '',
    nickname: '',
    email: '',
    password: '',
    created_at: ''
  });
  const [nicknameCheck, setNicknameCheck] = useState<{ checked: boolean, message: string }>({ checked: false, message: '' });
  const [emailCheck, setEmailCheck] = useState<{ checked: boolean, message: string }>({ checked: false, message: '' });
  type ModalMode = 'add' | 'edit' | 'delete' | 'detail';
  const [modal, setModal] = useState<{ open: boolean, mode: ModalMode, user?: User|null }>({ open: false, mode: 'add', user: null });
  const [modalLoading, setModalLoading] = useState(false)

  // 회원 목록 불러오기
  const fetchUsers = async (keyword = '') => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/admin-users?search=${encodeURIComponent(keyword)}`, {
        credentials: 'include'
      })
      if (!res.ok) throw new Error('회원 목록을 불러올 수 없습니다.')
      const data = await res.json()
      setUsers(Array.isArray(data.users) ? data.users : [])
    } catch (err: any) {
      setError(err.message)
    }
    setLoading(false)
  }

  useEffect(() => {
    fetchUsers()
  }, [])

  // 아이디 중복 체크
  const checkUserId = async (userid: string) => {
    if (!userid) return false;
    try {
      const res = await fetch(`/api/admin/admin-users/check-userid?userid=${encodeURIComponent(userid)}`, {
        credentials: 'include'
      });
      const data = await res.json();
      return res.ok && data.available;
    } catch {
      return false;
    }
  };

  // 이메일 중복 체크
  const checkEmail = async (email: string) => {
    if (!email) return false;
    try {
      const res = await fetch(`/api/admin/admin-users/check-email?email=${encodeURIComponent(email)}`, {
        credentials: 'include'
      });
      const data = await res.json();
      return res.ok && data.available;
    } catch {
      return false;
    }
  };

  // 닉네임 중복 체크
  const checkNickname = async (nickname: string) => {
    if (!nickname) {
      setNicknameCheck({ checked: false, message: '닉네임을 입력하세요.' });
      return false;
    }
    try {
      let url = `/api/admin/admin-users/check-nickname?nickname=${encodeURIComponent(nickname)}`;
      if (modal.mode === 'edit' && modal.user?.userid) {
        url += `&userid=${encodeURIComponent(modal.user.userid)}`;
      }
      const res = await fetch(url, {
        credentials: 'include'
      });
      const data = await res.json();
      if (res.ok && data.available) {
        setNicknameCheck({ checked: true, message: '사용 가능한 닉네임입니다.' });
        return true;
      } else {
        setNicknameCheck({ checked: false, message: '이미 사용중인 닉네임입니다.' });
        return false;
      }
    } catch {
      setNicknameCheck({ checked: false, message: '닉네임 확인 중 오류.' });
      return false;
    }
  };

  // 회원 추가
  const handleAdd = async (userid: string, data: Partial<User>) => {
    setModalLoading(true);
    setError('');
    if (!data.userid || !data.name || !data.nickname || !data.email || !data.password) {
      setError('모든 필드를 입력하세요.');
      setModalLoading(false);
      return;
    }
    const [idOk, emailOk, nicknameOk] = await Promise.all([
      checkUserId(data.userid),
      checkEmail(data.email),
      checkNickname(data.nickname)
    ]);
    if (!idOk) {
      setError('이미 사용중인 아이디입니다.');
      setModalLoading(false);
      return;
    }
    if (!emailOk) {
      setError('이미 사용중인 이메일입니다.');
      setModalLoading(false);
      return;
    }
    if (!nicknameOk) {
      setError('이미 사용중인 닉네임입니다.');
      setModalLoading(false);
      return;
    }
    try {
      const res = await fetch(`/api/admin/admin-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          userid: data.userid,
          password: data.password,
          name: data.name,
          email: data.email,
          nickname: data.nickname
        }),
        credentials: 'include'
      })
      const resData = await res.json()
      if (!res.ok) throw new Error(resData.error || '회원 추가 실패')
      setForm({ userid: '', name: '', nickname: '', email: '', password: '', created_at: '' });
      closeModal()
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
    setModalLoading(false)
  }

  // 회원 수정
  const handleEdit = async (userid: string, data: Partial<User>) => {
    setModalLoading(true);
    setError('');
  // 아무것도 수정하지 않아도 저장 가능하게 (입력값 체크 제거)
    // 아무것도 수정하지 않아도 저장 가능하게
    const oldUser = users.find(u => u.userid === userid);
    const nicknameToSave = data.nickname ?? oldUser?.nickname ?? '';
    const emailToSave = data.email ?? oldUser?.email ?? '';
    const passwordToSave = data.password ? data.password : oldUser?.password ?? '';
    // 닉네임/이메일 중복 확인 (기존 값이면 자동 통과)
    if (!nicknameCheck.checked && nicknameToSave !== oldUser?.nickname) {
      setError('닉네임 중복 확인을 해주세요.');
      setModalLoading(false);
      return;
    }
    // 기존 이메일이면 중복 검사 없이 통과
    if (emailToSave !== oldUser?.email && !emailCheck.checked) {
      setError('이메일 중복 확인을 해주세요.');
      setModalLoading(false);
      return;
    }
    try {
      // 기존 회원정보 가져오기
      const oldUser = users.find(u => u.userid === userid);
      const passwordToSave = data.password ? data.password : oldUser?.password || '';
      const res = await fetch(`/api/admin/admin-users/${userid}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          name: oldUser?.name,
          nickname: data.nickname,
          email: data.email,
          password: passwordToSave
        }),
        credentials: 'include'
      });
      const resData = await res.json();
      if (!res.ok) throw new Error(resData.error || '회원 수정 실패');
      setForm({ userid: '', name: '', nickname: '', email: '', password: '', created_at: '' });
      closeModal();
      fetchUsers();
    } catch (err: any) {
      setError(err.message);
    }
    setModalLoading(false);
  }

  // 회원 삭제
  const handleDelete = async () => {
    if (!modal.user) return
    setModalLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/admin-users/${modal.user.userid}`, { method: 'DELETE', credentials: 'include' })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error || '삭제 실패')
      closeModal()
      fetchUsers()
    } catch (err: any) {
      setError(err.message)
    }
    setModalLoading(false)
  }

  // 모달 열기 함수
  const openModal = (mode: ModalMode, user?: User|null) => {
    setModal({ open: true, mode, user })
    setError('')
    setModalLoading(false)
    if (mode === 'edit' && user) {
      setForm({
        userid: user.userid,
        name: user.name,
        nickname: user.nickname || '',
        email: user.email,
        password: '',
        created_at: user.created_at
      });
      setNicknameCheck({ checked: true, message: '' });
    } else if (mode === 'add') {
      setForm({ userid: '', name: '', nickname: '', email: '', password: '', created_at: '' });
      setNicknameCheck({ checked: false, message: '' });
    }
  }

  // 모달 닫기 함수
  const closeModal = () => {
    setModal({ open: false, mode: 'add', user: null })
    setError('')
    setForm({ userid: '', name: '', nickname: '', email: '', password: '', created_at: '' });
    setModalLoading(false)
  }

  // 검색
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchUsers(search)
  }

  // 닉네임 입력 핸들러
  const handleNicknameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setForm({ ...form, nickname: e.target.value });
    setNicknameCheck({ checked: false, message: '' });
  };

  return (
    <div className="admin-users">
      <h2>회원관리</h2>
      <form className="user-search-row" onSubmit={handleSearch}>        
        <input
          type="text"
          className="input"
          placeholder="아이디/이름/이메일 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn--primary">검색</button>
      </form>
      {loading && <div>로딩중...</div>}
      {error && <div className="login-error">{error}</div>}
      <div className="common-list">
        <div className="common-list__header">
          <div className="common-list__cell common-list__id">아이디</div>
          <div className="common-list__cell common-list__name">이름</div>
          <div className="common-list__cell common-list__nickname">닉네임</div>
          <div className="common-list__cell common-list__email">이메일</div>
          <div className="common-list__cell common-list__date">가입일</div>
          <div className="common-list__cell common-list__actions">관리</div>
        </div>
        {users.length === 0 ? (
          <div className="common-list__empty">회원이 없습니다.</div>
        ) : (
          users.map(user => (
            <div className="common-list__row" key={user.userid}>
              <div className="common-list__cell common-list__id">{user.userid}</div>
              <div className="common-list__cell common-list__name">{user.name}</div>
              <div className="common-list__cell common-list__nickname">{user.nickname}</div>
              <div className="common-list__cell common-list__email">{user.email}</div>
              <div className="common-list__cell common-list__date">{user.created_at}</div>
              <div className="common-list__cell common-list__actions">
                <button className="btn btn--small btn--info" onClick={() => openModal('detail', user)}>상세</button>
                <button className="btn btn--small btn--primary" style={{ marginLeft: 8 }} onClick={() => openModal('edit', user)}>수정</button>
                <button className="btn btn--small btn--danger" style={{ marginLeft: 8 }} onClick={() => openModal('delete', user)}>삭제</button>
              </div>
            </div>
          ))
        )}
      </div>
      <button className="btn btn--primary user-add-btn" style={{ marginTop: 24 }} onClick={() => openModal('add')}>회원 추가</button>
      {/* 모달 컴포넌트 */}
      {modal.open && (
        <div className="modal-overlay active">
          <div className="dimmed" onClick={closeModal}></div>
          <div className="modal-container">
            <div className="modal-title">
              {modal.mode === 'delete' ? '회원 삭제' : modal.mode === 'edit' ? '회원 수정' : modal.mode === 'add' ? '회원 추가' : '회원 상세정보'}
            </div>
            <span className="modal-close" onClick={closeModal}></span>
            <div className="modal-content">
              {modal.mode === 'detail' && modal.user && (
                <div>
                  <p><b>아이디:</b> {modal.user.userid}</p>
                  <p><b>이름:</b> {modal.user.name}</p>
                  <p><b>닉네임:</b> {modal.user.nickname}</p>
                  <p><b>이메일:</b> {modal.user.email}</p>
                  <p><b>가입일:</b> {modal.user.created_at}</p>
                  <div className="modal-btn-area">
                    <button className="btn btn--outline" onClick={closeModal}>닫기</button>
                  </div>
                </div>
              )}
              {modal.mode === 'delete' ? (
                <div>
                  <p>정말로 <b>{modal.user?.userid}</b> 회원을 삭제하시겠습니까?</p>
                  <div className="modal-btn-area">
                    <button className="btn btn--danger" onClick={handleDelete} disabled={modalLoading}>삭제</button>
                    <button className="btn btn--outline" onClick={closeModal} disabled={modalLoading}>취소</button>
                  </div>
                  {error && <div className="login-error" style={{ marginTop: 12 }}>{error}</div>}
                </div>
              ) : (modal.mode === 'edit' || modal.mode === 'add') && (
                <UserForm
                  user={modal.mode === 'edit' ? modal.user! : form}
                  onClose={closeModal}
                  onUserChange={modal.mode === 'edit' ? handleEdit : handleAdd}
                  loading={modalLoading}
                />
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
export default AdminUsers;