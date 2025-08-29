import React, { useState } from 'react'
import '../../styles/board-perm-table.css'
// import { useNavigate } from 'react-router-dom'

const API_BASE = 'http://localhost:4000'

const PERMISSIONS = [
  { key: 'read', label: '글읽기' },
  { key: 'write', label: '글쓰기' },
  { key: 'comment', label: '댓글쓰기' },
  { key: 'link', label: '링크' },
  { key: 'upload', label: '업로드' },
  { key: 'download', label: '다운로드' },
  { key: 'html', label: 'HTML쓰기' }
]

type BoardForm = {
  board_id: string
  name: string
  type: string
  description: string
  upload_limit: number
  link_limit: number
  permissions: Record<string, { member: boolean; guest: boolean }>
}

import { useRouter } from 'next/navigation';

function AdminBoardAdd() {
  const router = useRouter();
  const [form, setForm] = useState<BoardForm>({
    board_id: '',
    name: '',
    type: '',
    description: '',
    upload_limit: 0,
    link_limit: 0,
    permissions: PERMISSIONS.reduce((acc, cur) => {
      acc[cur.key] = { member: false, guest: false }
      return acc
    }, {} as Record<string, { member: boolean, guest: boolean }>),
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  // 권한 체크박스 변경
  const handlePermissionChange = (perm: string, who: 'member'|'guest', checked: boolean) => {
    if (!PERMISSIONS.find(p => p.key === perm)) return
    setForm(f => ({
      ...f,
      permissions: {
        ...f.permissions,
        [perm]: { ...f.permissions[perm], [who]: checked }
      }
    }))
  }

  const initialForm = {
    board_id: '',
    name: '',
    type: 'list',
    description: '',
    upload_limit: 0,
    link_limit: 0,
    permissions: PERMISSIONS.reduce((acc, p) => {
      acc[p.key] = { member: false, guest: false }
      return acc
    }, {} as Record<string, { member: boolean; guest: boolean }>)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')
    setLoading(true)
    // 필수값 검증
    if (!form.board_id || !/^[a-zA-Z0-9_]{1,20}$/.test(form.board_id)) {
      setError('게시판 ID는 영문, 숫자, _만 사용, 20자 이내여야 합니다.')
      setLoading(false)
      return
    }
    if (!form.name || form.name.length === 0 || form.name.length > 50) {
      setError('게시판명은 필수이며 50자 이내여야 합니다.')
      setLoading(false)
      return
    }
    if (!form.type || !['list', 'gallery'].includes(form.type)) {
      setError('게시판 종류를 선택하세요.')
      setLoading(false)
      return
    }
    const uploadLimit = Number(form.upload_limit) || 0
    const linkLimit = Number(form.link_limit) || 0
    if (isNaN(uploadLimit) || uploadLimit < 0 || uploadLimit > 10) {
      setError('업로드 개수는 0~10개만 가능합니다.')
      setLoading(false)
      return
    }
    if (isNaN(linkLimit) || linkLimit < 0 || linkLimit > 10) {
      setError('링크 개수는 0~10개만 가능합니다.')
      setLoading(false)
      return
    }
    // 권한 검증
    for (const perm of PERMISSIONS) {
      if (
        typeof form.permissions[perm.key]?.member !== 'boolean' ||
        typeof form.permissions[perm.key]?.guest !== 'boolean'
      ) {
        setError(`권한 ${perm.label}의 회원/비회원 설정이 올바르지 않습니다.`)
        setLoading(false)
        return
      }
    }

    try {
      const res = await fetch(`${API_BASE}/api/admin/boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          ...form,
          upload_limit: uploadLimit,
          link_limit: linkLimit
        })
      })
      const contentType = res.headers.get('content-type')
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text()
        console.error('서버에서 올바른 JSON 응답을 받지 못했습니다.\n', text)
        throw new Error('서버에서 올바른 JSON 응답을 받지 못했습니다.\n' + text)
      }
      const data = await res.json()
      if (!res.ok || !data.success) throw new Error(data.error || '게시판 추가 실패')
      setSuccess('게시판이 성공적으로 생성되었습니다.')
      setForm(initialForm)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="admin-board-add">
      <h2>게시판 추가</h2>
      <form className="board-form" onSubmit={handleSubmit}>
        {error && (
          <div className="mb-2" style={{ color: '#dc3545', fontWeight: 500 }}>
            {error}
          </div>
        )}
        {success && (
          <div className="mb-2" style={{ color: '#28a745', fontWeight: 500 }}>
            {success}
          </div>
        )}
        <div className="board-form__box">
          <label htmlFor="board_id">게시판 ID(영문, 숫자, _, 20자 이내)</label>
          <input
            id="board_id"
            type="text"
            className="input board-form__input"
            placeholder="게시판 ID"
            value={form.board_id}
            onChange={e => setForm({ ...form, board_id: e.target.value })}
            maxLength={20}
            required
          />
        </div>
        <div className="board-form__box">
          <label htmlFor="board_name">게시판명</label>
          <input
            id="board_name"
            type="text"
            className="input board-form__input"
            placeholder="게시판명"
            value={form.name}
            onChange={e => setForm({ ...form, name: e.target.value })}
            maxLength={50}
            required
          />
        </div>
        <div className="board-form__box">
          <label htmlFor="board_type">게시판 종류</label>
          <select
            id="board_type"
            className="input board-form__input"
            value={form.type}
            onChange={e => setForm({ ...form, type: e.target.value })}
            required
          >
            <option value="">게시판 종류 선택</option>
            <option value="list">목록형</option>
            <option value="gallery">갤러리형</option>
          </select>
        </div>
        <div className="board-form__box">
          <label htmlFor="board_desc">설명</label>
          <input
            id="board_desc"
            type="text"
            className="input board-form__input"
            placeholder="설명"
            value={form.description}
            onChange={e => setForm({ ...form, description: e.target.value })}
          />
        </div>
        <div className="board-form__box">
          <label htmlFor="upload_limit">업로드 개수 (최대 10)</label>
          <input
            id="upload_limit"
            type="number"
            className="input board-form__input"
            min={0}
            max={10}
            value={form.upload_limit}
            onChange={e => setForm({ ...form, upload_limit: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="board-form__box">
          <label htmlFor="link_limit">링크 개수 (최대 10)</label>
          <input
            id="link_limit"
            type="number"
            className="input board-form__input"
            min={0}
            max={10}
            value={form.link_limit}
            onChange={e => setForm({ ...form, link_limit: Number(e.target.value) || 0 })}
          />
        </div>
        <div className="board-form__box">
          <label>권한 설정</label>
          <table className="board-perm-table">
            <thead>
              <tr>
                <th>권한</th>
                <th>회원</th>
                <th>비회원</th>
              </tr>
            </thead>
            <tbody>
              {PERMISSIONS.map(perm => (
                <tr key={perm.key}>
                  <td>{perm.label}</td>
                  <td>
                    <div className="checkbox">
                      <input
                        type="checkbox"
                        className="checkbox__input"
                        id={`perm_${perm.key}_member`}
                        checked={form.permissions[perm.key]?.member || false}
                        onChange={e => handlePermissionChange(perm.key, 'member', e.target.checked)}
                      />
                      <label className="checkbox__label" htmlFor={`perm_${perm.key}_member`}></label>
                    </div>
                  </td>
                  <td>
                    <div className="checkbox">
                      <input
                        type="checkbox"
                        className="checkbox__input"
                        id={`perm_${perm.key}_guest`}
                        checked={form.permissions[perm.key]?.guest || false}
                        onChange={e => handlePermissionChange(perm.key, 'guest', e.target.checked)}
                      />
                      <label className="checkbox__label" htmlFor={`perm_${perm.key}_guest`}></label>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="common-btn-box">
          <button type="submit" className="btn btn--primary board-form__btn" disabled={loading}>
            추가
          </button>
          <button type="button" className="btn btn--outline board-form__btn" onClick={() => router.push('/admin/boards')} disabled={loading}>
            취소
          </button>
        </div>
        {error && <div className="login-error" style={{ marginTop: 12 }}>{error}</div>}
      </form>
    </div>
  )
}

export default AdminBoardAdd
