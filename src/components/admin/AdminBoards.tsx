"use client";
import React, { useEffect, useState } from 'react'
import Link from 'next/link';


interface Board {
  id: number
  board_id: string
  name: string
  type: string
  description: string
  upload_limit: number
  link_limit: number
  permissions: Record<string, { member: boolean; guest: boolean }>
  created_at: string
  skin?: string
  listColumns?: number
  thumbSize?: number
}


const API_BASE = '';

function AdminBoards() {
  const [boards, setBoards] = useState<Board[]>([])
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [modal, setModal] = useState<{ open: boolean, mode: 'edit'|'delete', board?: Board|null }>({ open: false, mode: 'edit', board: null })
  const [modalLoading, setModalLoading] = useState(false)
  const [addModal, setAddModal] = useState<{ open: boolean, loading: boolean, error: string, board: Partial<Board> }>({ open: false, loading: false, error: '', board: { permissions: { read: { member: true, guest: false }, write: { member: true, guest: false } } } })
  const [updateTableStatus, setUpdateTableStatus] = useState<{ loading: boolean, success?: boolean, message?: string }>({ loading: false })

  // 게시판 목록 불러오기
  const fetchBoards = async (keyword = '') => {
    setLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/admin-boards?search=${encodeURIComponent(keyword)}`)
      if (!res.ok) {
        const text = await res.text();
        console.error('API Error:', text);
        throw new Error('게시판 목록을 불러올 수 없습니다.');
      }
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('API 응답이 JSON이 아님:', text);
        throw new Error('API 응답이 올바르지 않습니다.');
      }
      const data = await res.json();
      setBoards(Array.isArray(data.data) ? data.data : []);
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    fetchBoards()
  }, [])

  // 게시판 수정
  const handleEdit = async (e?: React.FormEvent) => {
    if (e) e.preventDefault()
    if (!modal.board) return
    setModalLoading(true)
    setError('')
    const { board_id, name, type, description, upload_limit, link_limit, permissions, skin, listColumns, thumbSize } = modal.board
    if (!board_id || !name || !type) {
      setError('필수값 누락: 게시판ID, 이름, 종류')
      setModalLoading(false)
      return
    }
    try {
      const res = await fetch(`/api/admin/admin-boards/${modal.board.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_id,
          name,
          type,
          description: description === undefined || description === '' ? null : description,
          upload_limit: upload_limit === undefined ? null : upload_limit,
          link_limit: link_limit === undefined ? null : link_limit,
          permissions,
          skin: skin ?? null,
          listColumns: listColumns ?? null,
          thumbSize: thumbSize ?? null
        })
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('API 응답이 JSON이 아님:', text);
        throw new Error('API 응답이 올바르지 않습니다.');
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '게시판 수정 실패');
      closeModal();
      fetchBoards();
    } catch (err: any) {
      setError(err.message);
    }
    setModalLoading(false);
  }

  // 게시판 삭제
  const handleDelete = async () => {
    if (!modal.board) return
    setModalLoading(true)
    setError('')
    try {
      const res = await fetch(`/api/admin/admin-boards`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ board_id: modal.board.board_id })
      });
      const contentType = res.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        const text = await res.text();
        console.error('API 응답이 JSON이 아님:', text);
        throw new Error('API 응답이 올바르지 않습니다.');
      }
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '삭제 실패');
      closeModal();
      fetchBoards();
    } catch (err: any) {
      setError(err.message);
    }
    setModalLoading(false);
  }

  // 게시판 추가
  const handleAdd = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    setAddModal(modal => ({ ...modal, loading: true, error: '' }));
    let { board_id, name, type, description, upload_limit, link_limit, permissions, skin, listColumns, thumbSize } = addModal.board;
    if (!board_id || !name || !type) {
      setAddModal(modal => ({ ...modal, loading: false, error: '필수값 누락: 게시판ID, 이름, 종류' }));
      return;
    }
    try {
  const res = await fetch(`/api/admin/admin-boards`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board_id,
          name,
          type,
          description: description === undefined || description === '' ? null : description,
          upload_limit: upload_limit === undefined ? null : upload_limit,
          link_limit: link_limit === undefined ? null : link_limit,
          permissions,
          skin: skin ?? null,
          listColumns: listColumns ?? null,
          thumbSize: thumbSize ?? null
        })
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '게시판 추가 실패');
      setAddModal({ open: false, loading: false, error: '', board: { permissions: { read: { member: true, guest: false }, write: { member: true, guest: false } } } });
      fetchBoards();
    } catch (err: any) {
      setAddModal(modal => ({ ...modal, loading: false, error: err.message }));
    }
  }

  const DEFAULT_PERMISSIONS: Record<string, { member: boolean; guest: boolean }> = { read: { member: true, guest: false }, write: { member: true, guest: false } };

  // 모달 열기 함수
  const openModal = (mode: 'edit'|'delete', board?: Board|null) => {
    let safeBoard = board ? { ...board } : null;
    // 권한 구조가 string(직렬화된 JSON)일 경우 객체로 파싱
    if (safeBoard && typeof safeBoard.permissions === 'string') {
      try {
        safeBoard.permissions = JSON.parse(safeBoard.permissions);
      } catch {
        safeBoard.permissions = { ...DEFAULT_PERMISSIONS };
      }
    }
    // 권한 구조가 없거나 잘못된 경우 기본값으로 초기화
    if (safeBoard && (!safeBoard.permissions || Object.keys(safeBoard.permissions).length === 0)) {
      safeBoard.permissions = { ...DEFAULT_PERMISSIONS };
    } else if (safeBoard) {
      ['read', 'write'].forEach(key => {
        if (!safeBoard.permissions[key]) safeBoard.permissions[key] = { ...DEFAULT_PERMISSIONS[key] };
        if (typeof safeBoard.permissions[key].member !== 'boolean') safeBoard.permissions[key].member = DEFAULT_PERMISSIONS[key].member;
        if (typeof safeBoard.permissions[key].guest !== 'boolean') safeBoard.permissions[key].guest = DEFAULT_PERMISSIONS[key].guest;
      });
    }
    setModal({ open: true, mode, board: safeBoard });
    setError('')
    setModalLoading(false)
  }

  // 모달 닫기 함수
  const closeModal = () => {
    setModal({ open: false, mode: 'edit', board: null })
    setError('')
    setModalLoading(false)
  }

  // 추가 모달 열기
  const openAddModal = () => {
    setAddModal({ open: true, loading: false, error: '', board: { permissions: { read: { member: true, guest: false }, write: { member: true, guest: false } } } });
  }
  // 추가 모달 닫기
  const closeAddModal = () => {
    setAddModal(modal => ({ ...modal, open: false, loading: false, error: '', board: { permissions: { read: { member: true, guest: false }, write: { member: true, guest: false } } } }));
  }

  // 검색
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault()
    fetchBoards(search)
  }

  // 게시판 테이블 필드 업데이트
  const updateBoardTables = async () => {
    if (!confirm("모든 게시판 테이블에 name, password, nickname 필드를 추가하시겠습니까?")) {
      return;
    }
    
    setUpdateTableStatus({ loading: true });
    
    try {
      const res = await fetch('/api/admin/update-board-tables', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' }
      });
      
      const data = await res.json();
      
      if (!res.ok) {
        throw new Error(data.error || '테이블 업데이트 실패');
      }
      
      setUpdateTableStatus({
        loading: false,
        success: data.success,
        message: data.success 
          ? '모든 테이블이 성공적으로 업데이트되었습니다.' 
          : '일부 테이블 업데이트에 실패했습니다.'
      });
      
      setTimeout(() => {
        setUpdateTableStatus({ loading: false });
      }, 5000);
    } catch (err: any) {
      setUpdateTableStatus({ 
        loading: false, 
        success: false, 
        message: err.message 
      });
    }
  }

  // 수정 폼 값 변경
  const handleModalInput = (field: keyof Board, value: any) => {
    if (!modal.board) return
    setModal(modal => ({
      ...modal,
      board: { ...modal.board!, [field]: value }
    }))
  }
  // 권한 체크박스 변경
  const handleModalPermChange = (perm: string, who: 'member'|'guest', checked: boolean) => {
    if (!modal.board) return
    setModal(modal => ({
      ...modal,
      board: {
        ...modal.board!,
        permissions: {
          ...modal.board!.permissions,
          [perm]: { ...modal.board!.permissions[perm], [who]: checked }
        }
      }
    }))
  }
  // 추가 폼 값 변경
  const handleAddInput = (field: keyof Board | 'skin' | 'listColumns' | 'thumbSize', value: any) => {
    setAddModal(modal => ({ ...modal, board: { ...modal.board, [field]: value } }));
  }

  // 스킨 목록 예시
const SKINS = [
  { value: 'default-list', label: '기본 목록형', preview: <div style={{border:'1px solid #ddd',padding:16}}>목록형 게시판 미리보기<br/><span style={{fontSize:12,color:'#888'}}>BoardList, BoardDetail, BoardWrite 컴포넌트 기반</span></div> },
  { value: 'gallery', label: '갤러리형', preview: <div style={{border:'1px solid #ddd',padding:16}}>갤러리형 게시판 미리보기<br/><span style={{fontSize:12,color:'#888'}}>GalleryBoard, GalleryDetail, GalleryWrite 컴포넌트 기반</span></div> }
];

  // 추가/수정 모달에서 스킨 선택, 미리보기, 커스텀 옵션, 주소 생성
  function getBoardUrl(board_id: string): string {
    return board_id ? `/board/${board_id}` : '';
  }

  return (
    <div className="admin-boards">
      <h2>게시판관리</h2>
      <div style={{ display: 'flex', gap: '10px', marginBottom: 16 }}>
        <button type="button" className="btn btn--primary" onClick={openAddModal}>게시판 추가</button>
        <button 
          type="button" 
          className="btn btn--secondary" 
          onClick={updateBoardTables}
          disabled={updateTableStatus.loading}
        >
          {updateTableStatus.loading ? '테이블 업데이트 중...' : '모든 게시판 테이블 필드 업데이트'}
        </button>
      </div>
      
      {updateTableStatus.message && (
        <div className={`alert ${updateTableStatus.success ? 'alert--success' : 'alert--error'}`} style={{ marginBottom: 16 }}>
          {updateTableStatus.message}
        </div>
      )}

      <form className="board-search-row board-search-row--single" onSubmit={handleSearch}>
        <input
          type="text"
          className="input"
          placeholder="게시판명/설명/종류 검색"
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
        <button type="submit" className="btn btn--primary">검색</button>
      </form>
      {loading && <div>로딩중...</div>}
      {error && <div className="login-error">{error}</div>}

      <div className="common-list">
        <div className="common-list__header">
          <div className="common-list__cell common-list__id">ID</div>
          <div className="common-list__cell common-list__name">게시판명</div>
          <div className="common-list__cell common-list__type">종류</div>
          <div className="common-list__cell common-list__desc">설명</div>
          <div className="common-list__cell common-list__date">생성일</div>
          <div className="common-list__cell common-list__url">주소</div>
          <div className="common-list__cell common-list__actions">관리</div>
        </div>
        {boards.length === 0 ? (
          <div className="common-list__empty">게시판이 없습니다.</div>
        ) : (
          boards.map(board => (
            <div className="common-list__row" key={board.id}>
              <div className="common-list__cell common-list__id">{board.id}</div>
              <div className="common-list__cell common-list__name">{board.name}</div>
              <div className="common-list__cell common-list__type">{board.type || ''}</div>
              <div className="common-list__cell common-list__desc">{board.description}</div>
              <div className="common-list__cell common-list__date">{board.created_at}</div>
              <div className="common-list__cell common-list__url">
                <Link href={`/board/${board.board_id}`} target="_blank" rel="noopener noreferrer" style={{color:'#0070f3',textDecoration:'underline'}}>
                  /board/{board.board_id}
                </Link>
              </div>
              <div className="common-list__cell common-list__actions">
                <button className="btn btn--small btn--danger" onClick={() => openModal('delete', board)}>삭제</button>
                <button className="btn btn--small btn--primary" style={{ marginLeft: 8 }} onClick={() => openModal('edit', board)}>수정</button>
              </div>
            </div>
          ))
        )}
        {modal.open && (
          <div className={"modal-overlay active"}>
            <div className="dimmed" onClick={closeModal}></div>
            <div className="modal-container">
              <div className="modal-title">{modal.mode === 'delete' ? '게시판 삭제' : '게시판 수정'}</div>
              <div className="modal-content">
                {modal.mode === 'delete' ? (
                  <div className="common-btn-box">
                    <button className="btn btn--danger" onClick={handleDelete} disabled={modalLoading}>삭제</button>
                    <button className="btn btn--outline" onClick={closeModal} disabled={modalLoading}>취소</button>
                    {error && <div className="login-error" style={{ marginTop: 12 }}>{error}</div>}
                  </div>
                ) : (
                  <form onSubmit={handleEdit} className="board-form">
                    <div className="board-form__box">
                      <label htmlFor="edit_board_id" className="board-form__label">게시판ID <span style={{color:'#e00'}}>*</span></label>
                      <input
                        id="edit_board_id"
                        type="text"
                        className="input board-form__input"
                        placeholder="영문, 숫자 조합"
                        value={modal.board?.board_id || ''}
                        onChange={e => handleModalInput('board_id', e.target.value)}
                        maxLength={50}
                        required
                      />
                    </div>
                    <div className="board-form__box">
                      <label htmlFor="edit_board_name" className="board-form__label">게시판명 <span style={{color:'#e00'}}>*</span></label>
                      <input
                        id="edit_board_name"
                        type="text"
                        className="input board-form__input"
                        placeholder="게시판 이름"
                        value={modal.board?.name || ''}
                        onChange={e => handleModalInput('name', e.target.value)}
                        maxLength={50}
                        required
                      />
                    </div>
                    <div className="board-form__box">
                      <label htmlFor="edit_board_type" className="board-form__label">게시판 종류 <span style={{color:'#e00'}}>*</span></label>
                      <select
                        id="edit_board_type"
                        className="input board-form__input"
                        value={modal.board?.type || ''}
                        onChange={e => handleModalInput('type', e.target.value)}
                        required
                      >
                        <option value="">게시판 종류 선택</option>
                        <option value="list">목록형</option>
                        <option value="gallery">갤러리형</option>
                      </select>
                    </div>
                    <div className="board-form__box">
                      <label htmlFor="edit_board_desc" className="board-form__label">설명</label>
                      <input
                        id="edit_board_desc"
                        type="text"
                        className="input board-form__input"
                        placeholder="게시판 설명"
                        value={modal.board?.description || ''}
                        onChange={e => handleModalInput('description', e.target.value)}
                      />
                    </div>
                    <div className="board-form__box">
                      <label htmlFor="edit_upload_limit" className="board-form__label">업로드 개수</label>
                      <input
                        id="edit_upload_limit"
                        type="number"
                        className="input board-form__input"
                        min={0}
                        max={10}
                        placeholder="최대 10개"
                        value={modal.board?.upload_limit ?? 0}
                        onChange={e => handleModalInput('upload_limit', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="board-form__box">
                      <label htmlFor="edit_link_limit" className="board-form__label">링크 개수</label>
                      <input
                        id="edit_link_limit"
                        type="number"
                        className="input board-form__input"
                        min={0}
                        max={10}
                        placeholder="최대 10개"
                        value={modal.board?.link_limit ?? 0}
                        onChange={e => handleModalInput('link_limit', Number(e.target.value) || 0)}
                      />
                    </div>
                    <div className="board-form__box">
                      <label className="board-form__label">권한 설정</label>
                      <table className="board-perm-table">
                        <thead>
                          <tr>
                            <th>권한</th>
                            <th>회원</th>
                            <th>비회원</th>
                          </tr>
                        </thead>
                        <tbody>
                          {modal.board && Object.keys(modal.board.permissions).map(permKey => (
                            <tr key={permKey}>
                              <td>{permKey}</td>
                              <td>
                                <div className="checkbox">
                                  <input
                                    type="checkbox"
                                    className="checkbox__input"
                                    id={`edit_perm_${permKey}_member`}
                                    checked={!!modal.board?.permissions[permKey]?.member}
                                    onChange={e => handleModalPermChange(permKey, 'member', e.target.checked)}
                                  />
                                  <label className="checkbox__label" htmlFor={`edit_perm_${permKey}_member`}></label>
                                </div>
                              </td>
                              <td>
                                <div className="checkbox">
                                  <input
                                    type="checkbox"
                                    className="checkbox__input"
                                    id={`edit_perm_${permKey}_guest`}
                                    checked={!!modal.board?.permissions[permKey]?.guest}
                                    onChange={e => handleModalPermChange(permKey, 'guest', e.target.checked)}
                                  />
                                  <label className="checkbox__label" htmlFor={`edit_perm_${permKey}_guest`}></label>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                    <div className="common-btn-box" style={{marginTop:24}}>
                      <button type="submit" className="btn btn--primary board-form__btn" disabled={modalLoading}>
                        수정
                      </button>
                      <button type="button" className="btn btn--outline board-form__btn" onClick={closeModal} disabled={modalLoading}>
                        취소
                      </button>
                    </div>
                    {error && <div className="login-error" style={{ marginTop: 12 }}>{error}</div>}
                  </form>
                )}
              </div>
              <div className="modal-footer">
                {modal.mode === 'delete' ? '삭제 후 복구 불가합니다.' : '수정 후 저장됩니다.'}
              </div>
              <button className="modal-close" onClick={closeModal}>
                <span className="blind">모달창 닫기</span>
              </button>
            </div>
          </div>
        )}
        {addModal.open && (
          <div className="modal-overlay active">
            <div className="dimmed" onClick={closeAddModal}></div>
            <div className="modal-container">
              <div className="modal-title">게시판 추가</div>
              <div className="modal-content">
                <form onSubmit={handleAdd} className="board-form">
                  <div className="board-form__box">
                    <label htmlFor="add_board_id" className="board-form__label">게시판ID <span style={{color:'#e00'}}>*</span></label>
                    <input
                      id="add_board_id"
                      type="text"
                      className="input board-form__input"
                      placeholder="영문, 숫자 조합"
                      value={addModal.board.board_id || ''}
                      onChange={e => handleAddInput('board_id', e.target.value)}
                      maxLength={50}
                      required
                    />
                  </div>
                  <div className="board-form__box">
                    <label htmlFor="add_board_name" className="board-form__label">게시판명 <span style={{color:'#e00'}}>*</span></label>
                    <input
                      id="add_board_name"
                      type="text"
                      className="input board-form__input"
                      placeholder="게시판 이름"
                      value={addModal.board.name || ''}
                      onChange={e => handleAddInput('name', e.target.value)}
                      maxLength={50}
                      required
                    />
                  </div>
                  <div className="board-form__box">
                    <label htmlFor="add_board_type" className="board-form__label">게시판 종류 <span style={{color:'#e00'}}>*</span></label>
                    <select
                      id="add_board_type"
                      className="input board-form__input"
                      value={addModal.board.type || ''}
                      onChange={e => handleAddInput('type', e.target.value)}
                      required
                    >
                      <option value="">게시판 종류 선택</option>
                      <option value="list">목록형</option>
                      <option value="gallery">갤러리형</option>
                    </select>
                  </div>
                  <div className="board-form__box">
                    <label htmlFor="add_board_desc" className="board-form__label">설명</label>
                    <input
                      id="add_board_desc"
                      type="text"
                      className="input board-form__input"
                      placeholder="게시판 설명"
                      value={addModal.board.description || ''}
                      onChange={e => handleAddInput('description', e.target.value)}
                    />
                  </div>
                  <div className="board-form__box">
                    <label htmlFor="add_upload_limit" className="board-form__label">업로드 개수</label>
                    <input
                      id="add_upload_limit"
                      type="number"
                      className="input board-form__input"
                      min={0}
                      max={10}
                      placeholder="최대 10개"
                      value={addModal.board.upload_limit ?? 0}
                      onChange={e => handleAddInput('upload_limit', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="board-form__box">
                    <label htmlFor="add_link_limit" className="board-form__label">링크 개수</label>
                    <input
                      id="add_link_limit"
                      type="number"
                      className="input board-form__input"
                      min={0}
                      max={10}
                      placeholder="최대 10개"
                      value={addModal.board.link_limit ?? 0}
                      onChange={e => handleAddInput('link_limit', Number(e.target.value) || 0)}
                    />
                  </div>
                  <div className="board-form__box">
                    <label htmlFor="add_board_skin" className="board-form__label">스킨 선택 <span style={{color:'#e00'}}>*</span></label>
                    <select
                      id="add_board_skin"
                      className="input board-form__input"
                      value={addModal.board.skin || SKINS[0].value}
                      onChange={e => handleAddInput('skin', e.target.value)}
                      required
                    >
                      {SKINS.map(skin => (
                        <option key={skin.value} value={skin.value}>{skin.label}</option>
                      ))}
                    </select>
                    <div style={{marginTop:8}}>
                      {SKINS.find(skin => skin.value === (addModal.board.skin || SKINS[0].value))?.preview}
                    </div>
                    {/* 커스텀 옵션 예시 */}
                    {addModal.board.skin === 'default-list' && (
                      <div style={{marginTop:8}}>
                        <label className="board-form__label">목록 컬럼 수</label>
                        <input type="number" min={1} max={5} className="input board-form__input" value={addModal.board.listColumns ?? 3} onChange={e => handleAddInput('listColumns', Number(e.target.value))} />
                      </div>
                    )}
                    {addModal.board.skin === 'gallery' && (
                      <div style={{marginTop:8}}>
                        <label className="board-form__label">썸네일 크기(px)</label>
                        <input type="number" min={50} max={500} className="input board-form__input" value={addModal.board.thumbSize ?? 120} onChange={e => handleAddInput('thumbSize', Number(e.target.value))} />
                      </div>
                    )}
                    <div style={{marginTop:8,fontSize:13,color:'#888'}}>게시판 주소: <span style={{color:'#0070f3'}}>{getBoardUrl(addModal.board.board_id ?? '')}</span></div>
                  </div>
                  <div className="common-btn-box" style={{marginTop:24}}>
                    <button type="submit" className="btn btn--primary board-form__btn" disabled={addModal.loading}>
                      추가
                    </button>
                    <button type="button" className="btn btn--outline board-form__btn" onClick={closeAddModal} disabled={addModal.loading}>
                      취소
                    </button>
                  </div>
                  {addModal.error && <div className="login-error" style={{ marginTop: 12 }}>{addModal.error}</div>}
                </form>
              </div>
              <div className="modal-footer">추가 후 저장됩니다.</div>
              <button className="modal-close" onClick={closeAddModal}>
                <span className="blind">모달창 닫기</span>
              </button>
            </div>
          </div>
        )}
    </div>
    </div>
  );
}

export default AdminBoards
