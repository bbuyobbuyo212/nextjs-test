"use client";
import React, { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { getCookie, getUserCookie } from '@/lib/cookie';

interface BoardFormData {
  title: string;
  content: string;
  name?: string;     // 비회원 이름
  password?: string; // 비회원 비밀번호
  nickname?: string; // 닉네임 (표시용)
  // files/links는 상태(files/links)로만 관리
}

function BoardWrite({ mode = 'write', initialFiles = [], initialLinks = [], boardInfo, searchParams }: { mode?: 'write' | 'edit', initialFiles?: any[], initialLinks?: string[], boardInfo?: any, searchParams?: any }) {
  const router = useRouter();
  const sp = useSearchParams();

  // 쿼리스트링 기반 편집모드/대상글 식별
  const editQuery = sp?.get('edit');
  const edit_post_id = sp?.get('post_id') || undefined;
  const passwordFromQuery = sp?.get('password') || undefined; // URL 파라미터에서 비밀번호 가져오기
  const editMode = (editQuery === '1' || editQuery === 'true') && !!edit_post_id;

  const [formData, setFormData] = useState<BoardFormData>({
    title: '',
    content: '',
    name: '',
    password: passwordFromQuery || '', // URL에서 가져온 비밀번호로 초기화
    nickname: '',
  });

  // 기존/신규 파일을 함께 관리: { name, size, url?, file? }
  const [files, setFiles] = useState<any[]>(initialFiles);
  const [links, setLinks] = useState<string[]>(initialLinks);
  // 관리자 제한값(0이면 무제한)
  const [uploadLimit, setUploadLimit] = useState<number>(0);
  // linkLimit은 boardInfo에서 직접 가져오도록 초기화
  const [linkLimit, setLinkLimit] = useState<number>(() => {
    const ll = Number(boardInfo?.link_limit ?? boardInfo?.linkLimit ?? 0);
    return Number.isFinite(ll) ? ll : 0;
  });

  // 로그인 여부 확인 (쿠키 기반)
  const token = typeof window !== 'undefined' ? getCookie('token') : '';
  const userData = typeof window !== 'undefined' ? getCookie('user_data') : '';
  const isLogin = !!token || !!userData;
  const canWrite = boardInfo?.permissions?.write?.member ? isLogin : boardInfo?.permissions?.write?.guest;

  React.useEffect(() => {
    // 편집 모드일 때만 기존 게시글 불러오기(+ 파일/링크도 세팅)
    if (!editMode || !boardInfo?.board_id || !edit_post_id) return;
    const fetchPost = async () => {
      try {
        const params = new URLSearchParams({
          board_id: boardInfo.board_id,
          post_id: edit_post_id ?? ''
        });
        const res = await fetch(`/api/board/board-detail?${params.toString()}`);
        console.log('API URL:', `/api/board/board-detail?${params.toString()}`);
        const data = await res.json();
        console.log('게시글 데이터 로드 결과:', data);
        if (res.ok && data.success && data.detail) {
          const p = data.detail;
          console.log('게시글 데이터:', p);
          setFormData({
            title: p.title || '',
            content: p.content || '',
            name: p.name || '',
            nickname: p.nickname || '',
            password: passwordFromQuery || '', // 비밀번호는 URL에서 가져온 값 우선 사용
          });
          
          // 비회원 정보 디버깅
          console.log('[비회원 게시글 수정] 불러온 작성자 정보:', {
            name: p.name,
            nickname: p.nickname,
            author: p.author,
            passwordFromQuery
          });
          // 파일 정규화
          let fs = p.files;
          if (typeof fs === 'string') { try { fs = JSON.parse(fs); } catch {} }
          if (Array.isArray(fs)) {
            setFiles(fs.map((f: any) => {
              const url = f?.downloadUrl || f?.url || '';
              const name = f?.originalName || f?.fileName || (url ? String(url).split('/').pop() : '') || 'file';
              const size = typeof f?.size === 'number' ? (f.size / (1024 * 1024)).toFixed(2) : (f?.size || '');
              return { name, size, url };
            }));
          } else {
            setFiles([]);
          }
          // 링크 정규화: 표준화된 객체 구조로 변환
          if (Array.isArray(p.links)) {
            setLinks(
              p.links
                .map((l: any) => {
                  if (typeof l === 'string') return l;
                  return l?.url || l?.href || l?.link || '';
                })
                .map((s: string) => (s || '').trim())
                .filter((s: string) => !!s)
            );
          } else if (typeof p.links === 'string') {
            try {
              const parsedLinks = JSON.parse(p.links);
              if (Array.isArray(parsedLinks)) {
                setLinks(
                  parsedLinks
                    .map((l: any) => {
                      if (typeof l === 'string') return l;
                      return l?.url || l?.href || l?.link || '';
                    })
                    .map((s: string) => (s || '').trim())
                    .filter((s: string) => !!s)
                );
              }
            } catch (e) {
              console.error('링크 파싱 오류:', e);
              setLinks([]);
            }
          } else {
            setLinks([]);
          }
        } else {
          console.error('게시글 불러오기 실패:', data);
          alert('게시글을 불러올 수 없습니다: ' + (data.error || '알 수 없는 오류'));
        }
      } catch (error) {
        console.error('게시글 불러오기 오류:', error);
        alert('게시글 데이터를 불러오는 중 오류가 발생했습니다.');
      }
    };
    fetchPost();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editMode, boardInfo?.board_id, edit_post_id]);

  // props 변경 시에는 setFiles, setLinks만 (formData는 fetch에서만)
  useEffect(() => {
    if (mode === 'edit') {
      if (initialFiles && initialFiles.length > 0) {
        setFiles(
          initialFiles.map((f: any) => {
            const url = f?.downloadUrl || f?.url || '';
            const name = f?.originalName || f?.fileName || f?.name || (url ? String(url).split('/').pop() : '') || 'file';
            const size = typeof f?.size === 'number' ? (f.size / (1024 * 1024)).toFixed(2) : (f?.size || '');
            return { name, size, url };
          })
        );
      }
      if (initialLinks && initialLinks.length > 0) {
        setLinks(
          (initialLinks as any[])
            .map((l: any) => typeof l === 'string' ? l : (l?.url || l?.href || l?.link || ''))
            .map((s: string) => (s || '').trim())
            .filter((s: string) => !!s)
        );
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [mode, initialFiles, initialLinks]);

  // 작성 화면에서 최소 1행 보장
  useEffect(() => {
    if (!editMode && files.length === 0) {
      setFiles([{ name: '', size: '', file: undefined, url: '' }]);
    }
  }, [editMode]);  

  // 최초 진입(작성 모드) 시 링크 행 1개 보장
  useEffect(() => {
    if (!editMode && links.length === 0) {
      setLinks(['']);
    }
  }, [editMode]);

  // 관리자 제한값 로드(게시판 메타에서 upload_limit, link_limit)
  useEffect(() => {
    let aborted = false;
    const loadLimits = async () => {
      if (!boardInfo?.board_id) return;
      let up = Number(boardInfo?.upload_limit ?? boardInfo?.uploadLimit ?? 0);
      let ll = Number(boardInfo?.link_limit ?? boardInfo?.linkLimit ?? 0);
      // boardInfo에서 값이 있으면 우선 적용
      setUploadLimit(Number.isFinite(up) ? up : 0);
      setLinkLimit(Number.isFinite(ll) ? ll : 0);
      // 만약 값이 없거나 0이면 서버에서 재조회
      if ((!up && !ll) || Number.isNaN(up) || Number.isNaN(ll)) {
        try {
          const res = await fetch(`/api/admin/admin-boards/${boardInfo.board_id}`);
          if (res.ok) {
            const json = await res.json();
            const meta = json?.data ?? {};
            up = Number(meta.upload_limit) || 0;
            ll = Number(meta.link_limit) || 0;
            if (!aborted) {
              setUploadLimit(Number.isFinite(up) ? up : 0);
              setLinkLimit(Number.isFinite(ll) ? ll : 0);
            }
          }
        } catch {}
      }
    };
    loadLimits();
    return () => { aborted = true; };
  }, [boardInfo?.board_id]);

  // 파일 삭제(서버 반영 후 UI 제거)
  const handleFileDelete = async (idx: number) => {
    const f = files[idx];
    if (editMode && f?.url) {
      try {
        // 올바른 API 경로로 수정
        const params = new URLSearchParams({
          fileUrl: f.url,
          board_id: boardInfo.board_id || '',
          post_id: edit_post_id || ''
        });
        const response = await fetch(`/api/board/file-delete?${params.toString()}`, { 
          method: 'DELETE' 
        });
        
        const data = await response.json();
        if (!data.success) {
          throw new Error(data.error || '파일 삭제 실패');
        }
      } catch (error) {
        console.error('파일 삭제 오류:', error);
        alert('파일 삭제 실패: ' + (error instanceof Error ? error.message : '알 수 없는 오류'));
        return;
      }
    }
    setFiles(prev => prev.filter((_, i) => i !== idx));
  };

  // 파일 입력행 추가(링크 추가와 동일 UX)
  const handleFileFieldsAdd = () => {
    if (uploadLimit > 0 && files.length >= uploadLimit) {
      alert(`첨부파일은 최대 ${uploadLimit}개까지 가능합니다.`);
      return;
    }
    setFiles(prev => [...prev, { name: '', size: '', file: undefined, url: '' }]);
  };

  // 특정 행에 파일 선택 반영
  const handleFileChangeAt = (idx: number, file: File | null) => {
    if (!file) return;
    if (uploadLimit > 0 && files.length > uploadLimit) {
      alert(`첨부파일은 최대 ${uploadLimit}개까지 가능합니다.`);
      return;
    }
    if (files.some((f: any, i: number) => i !== idx && f.name === file.name && !f.url)) {
      alert('이미 추가된 파일입니다.');
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('10MB 이하 파일만 업로드 가능합니다.');
      return;
    }
    setFiles(prev => prev.map((f: any, i: number) => i === idx
      ? { name: file.name, size: (file.size / (1024 * 1024)).toFixed(2), file, url: '' }
      : f
    ));
  };

  // 파일 추가(파일 객체도 상태에 저장) + 제한 적용
  const handleFileAdd = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (uploadLimit > 0 && files.length >= uploadLimit) {
      alert(`첨부파일은 최대 ${uploadLimit}개까지 가능합니다.`);
      e.currentTarget.value = '';
      return;
    }
    if (files.some((f: any) => f.name === file.name && !f.url)) {
      alert('이미 추가된 파일입니다.');
      e.currentTarget.value = '';
      return;
    }
    if (file.size > 10 * 1024 * 1024) {
      alert('10MB 이하 파일만 업로드 가능합니다.');
      e.currentTarget.value = '';
      return;
    }
    setFiles(prev => [
      ...prev,
      { name: file.name, size: (file.size / (1024 * 1024)).toFixed(2), file, url: '' }
    ]);
    e.currentTarget.value = '';
  };

  // 링크 변경/추가/삭제(상태 기반)
  const handleLinkChange = (idx: number, value: string) => {
    setLinks(prev => prev.map((l, i) => (i === idx ? value : l)));
  };
  const handleLinkAdd = () => {
    if (linkLimit > 0 && links.length >= linkLimit) {
      alert(`링크는 최대 ${linkLimit}개까지 가능합니다.`);
      return;
    }
    setLinks(prev => [...prev, '']);
  };
  const handleLinkDelete = (idx: number) => {
    setLinks(prev => prev.filter((_, i) => i !== idx));
  };

  // 제출: 제한 최종 검증 추가
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // 제한 검증(프론트)
    const cleanedLinks = links.map(l => (l ?? '').trim()).filter(Boolean);
    if (uploadLimit > 0 && files.length > uploadLimit) {
      alert(`첨부파일은 최대 ${uploadLimit}개까지 가능합니다.`);
      return;
    }
    if (linkLimit > 0 && cleanedLinks.length > linkLimit) {
      alert(`링크는 최대 ${linkLimit}개까지 가능합니다.`);
      return;
    }
    
    // 비회원인 경우 이름과 비밀번호 필수 검증
    // 단, 비회원 글 수정 시 URL에서 받은 비밀번호가 있으면 추가 검증 불필요
    if (!isLogin && (!editMode || !passwordFromQuery)) {
      if (!formData.name || formData.name.trim().length === 0) {
        alert('비회원 글쓰기 시 이름을 입력해야 합니다.');
        return;
      }
      if (!formData.password || formData.password.length < 4) {
        alert('비밀번호는 4자 이상 입력해야 합니다.');
        return;
      }
    }

    // 신규 업로드 파일만 업로드하여 URL 확보 후 기존 파일과 병합
    const pendingFiles = files.filter((f: any) => !f.url && f.file instanceof File);

    let uploadedFiles: { originalName: string; downloadUrl: string }[] = [];
    try {
      if (pendingFiles.length) {
        uploadedFiles = await Promise.all(
          pendingFiles.map(async (f: any) => {
            const fd = new FormData();
            fd.append('file', f.file);
            const res = await fetch('/api/upload', { method: 'POST', body: fd });
            if (!res.ok) throw new Error('파일 업로드 실패');
            const data = await res.json();
            if (!data.success || !data.url) throw new Error('업로드 결과가 올바르지 않습니다');
            return { originalName: data.originalName || f.name, downloadUrl: data.url };
          })
        );
      }
    } catch {
      alert('파일 업로드 중 오류가 발생했습니다.');
      return;
    }

    try {
      const board_id = boardInfo?.board_id;
      if (!board_id) {
        alert('게시판 정보가 없습니다.');
        return;
      }

      // 기존 파일 유지
      const keepFiles = files
        .filter((f: any) => !!f.url)
        .map((f: any) => ({
          originalName: f.originalName || f.name,
          downloadUrl: f.url
        }));
        
      // 링크를 표준화된 형식으로 변환
      const formattedLinks = cleanedLinks.map((link, index) => ({
        id: index + 1,
        url: link,
        title: `링크 ${index + 1}`
      }));
        
      // author 필드 보장
      const author = (() => {
        const user = getUserCookie();
        if (!user) return 'guest';
        return user.id || user.userid || 'guest';
      })();
      
      // 닉네임 처리
      let nickname;
      if (isLogin) {
        // 로그인 사용자는 쿠키의 user 정보에서 닉네임 가져오기
        const user = getUserCookie();
        nickname = user?.nickname || user?.name || undefined;
      } else {
        // 비회원은 입력한 이름을 닉네임으로 사용
        nickname = formData.nickname?.trim() || formData.name?.trim() || undefined;
      }
      
      // 비회원 정보 추가
      const passwordToUse = !isLogin ? (passwordFromQuery || formData.password) : undefined;
      
      // 비밀번호 정보 로깅
      console.log('[테스트] 비밀번호 정보:', {
        passwordFromQuery,
        formDataPassword: formData.password,
        finalPassword: passwordToUse
      });
      
      const payload = {
        board_id,
        title: formData.title,
        content: formData.content,
        author,
        files: [...keepFiles, ...uploadedFiles],
        links: formattedLinks,
        post_id: edit_post_id, // 수정 시 post_id 파라미터 사용
        // 비회원 정보만 추가 (로그인 시에는 서버에서 토큰으로 처리)
        name: !isLogin ? formData.name : undefined,
        password: passwordToUse,
        nickname: !isLogin ? nickname : undefined,
      };
      
      // 수정 모드에서 URL 파라미터로 비밀번호가 있는 경우 로그 출력
      if (editMode && passwordFromQuery) {
        console.log('[테스트] URL에서 전달된 비밀번호를 사용합니다:', passwordFromQuery);
      }

      // 수정 모드일 때는 board-edit에 PUT 요청
      const endpoint = editMode && edit_post_id
        ? `/api/board/board-edit`
        : `/api/board/board-write?board_id=${board_id}`;
      const method = editMode && edit_post_id ? 'PUT' as const : 'POST' as const;

      // 테스트: 제출 데이터 콘솔 출력
      console.log('[테스트] 제출 데이터', {
        endpoint,
        method,
        payload,
        hasPasswordFromQuery: !!passwordFromQuery,
        payloadPassword: payload.password,
        title: formData.title,
        content: formData.content,
        files,
        links,
        editMode,
        edit_post_id,
        nickname
      });

      const res = await fetch(endpoint, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      const data = await res.json();
      // 테스트: 응답 결과 콘솔 출력
      console.log('[테스트] 서버 응답', { res, data });

      if (res.ok && data.success) {
        alert(editMode ? '글이 수정되었습니다.' : '글이 등록되었습니다.');
        // 업로드 성공 후에는 로컬 상태 초기화(옵션)
        // setFiles([]); setLinks([]);
        router.push(`/board/${board_id}`);
      } else {
        alert(data.error || (editMode ? '글 수정에 실패했습니다.' : '글 등록에 실패했습니다.'));
        // 테스트: 오류 발생시 상세 로그
        console.error('[테스트] 오류 발생', data.error);
      }
    } catch (err) {
      alert(editMode ? '글 수정 중 오류가 발생했습니다.' : '글 등록 중 오류가 발생했습니다.');
      // 테스트: 예외 발생시 상세 로그
      console.error('[테스트] 예외 발생', err);
    }
  };

  // 테스트: 글수정시 오류 발생 여부를 콘솔로 확인
  useEffect(() => {
    if (editMode && edit_post_id) {
      console.log('[테스트] 수정모드 진입:', { 
        editMode, 
        edit_post_id,
        passwordFromQuery,
        formDataPassword: formData.password,
        finalPassword: passwordFromQuery || formData.password
      });
    }
  }, [editMode, edit_post_id, passwordFromQuery, formData]);

  function BoardTitle({ board_id, boardInfo }: { board_id: string, boardInfo?: any }) {
    const [boardName, setBoardName] = useState('');
    
    // 이미 boardInfo가 있으면 서버 요청 없이 이름 설정
    useEffect(() => {
      if (boardInfo?.name) {
        setBoardName(boardInfo.name);
        return;
      }
      
      // boardInfo에 이름이 없는 경우에만 API 호출
      fetch(`/api/board/board-meta?board_id=${board_id}`)
        .then(res => res.json())
        .then(data => setBoardName(data.name || board_id))
        .catch(err => {
          console.error("게시판 정보 조회 오류:", err);
          setBoardName(board_id);
        });
    }, [board_id, boardInfo]);
    
    return <h1 className="title">{boardName}</h1>;
  }

  return (
    <div className="board-write">
      <div className="container">
        <BoardTitle board_id={boardInfo?.board_id} boardInfo={boardInfo} />
        <form className="board-write__form" onSubmit={handleSubmit}>
          <div className="form-group">
            <label htmlFor="title" className="label">제목</label>            
            <input
              id="title"
              type="text"
              className="input-box"
              name="title"
              value={formData.title}
              onChange={e => setFormData(fd => ({ ...fd, title: e.target.value }))}
              required
            />
          </div>
          
          {/* 비회원 글쓰기 필드 - 로그인 상태에서는 표시하지 않음 */}
          {!isLogin && (
            <>
              <div className="form-group">
                <label htmlFor="name" className="label">이름</label>
                <input
                  id="name"
                  type="text"
                  className="input-box"
                  name="name"
                  value={formData.name || ''}
                  onChange={e => setFormData(fd => ({ ...fd, name: e.target.value }))}
                  required={!isLogin}
                  placeholder="비회원 이름을 입력하세요"
                />
              </div>
              
              <div className="form-group">
                <label htmlFor="password" className="label">비밀번호</label>
                <input
                  id="password"
                  type="password"
                  className="input-box"
                  name="password"
                  value={formData.password || ''}
                  onChange={e => setFormData(fd => ({ ...fd, password: e.target.value }))}
                  required={!isLogin && (!editMode || !passwordFromQuery)}
                  minLength={4}
                  placeholder="4자 이상 입력하세요"
                  disabled={editMode && !!passwordFromQuery} 
                />
                <div className="help-text">
                  {editMode && passwordFromQuery 
                    ? "비밀번호가 이미 확인되었습니다" 
                    : "글 수정/삭제 시 필요합니다"}
                </div>
              </div>
              
              <div className="form-group">
                <label htmlFor="nickname" className="label">닉네임 (선택)</label>
                <input
                  id="nickname"
                  type="text"
                  className="input-box"
                  name="nickname"
                  value={formData.nickname || ''}
                  onChange={e => setFormData(fd => ({ ...fd, nickname: e.target.value }))}
                  placeholder="사용할 닉네임을 입력하세요 (미입력 시 이름이 표시됩니다)"
                />
              </div>
            </>
          )}
          
          <div className="form-group">
            <label htmlFor="content" className="label">내용</label>
            <textarea
              id="content"
              name="content"
              className="input-box"
              value={formData.content}
              onChange={e => setFormData(fd => ({ ...fd, content: e.target.value }))}
              required
            />
          </div>
          <div className="form-group">
            <label className="label">첨부파일</label>

            {files.map((file, idx) => (
            <div className="board-write__file-row" key={`${file.name || 'file'}-${idx}`}>
              <div className="board-write__file-input-wrapper">
                <input
                  className="input-box"
                  accept="*/*"
                  type="file"
                  onChange={(e) => handleFileChangeAt(idx, e.target.files?.[0] || null)}
                  disabled={uploadLimit > 0 && files.length >= uploadLimit}
                />
                {(file?.url || file?.file) && (
                  <div className="board-write__file-info">
                    <span className="board-write__file-name">{file.name}</span>
                    {file.size ? <span className="board-write__file-size">({String(file.size)} MB)</span> : null}
                    <button className="btn btn--small" type="button" onClick={() => handleFileDelete(idx)}>삭제</button>
                  </div>
                )}
              </div>
              <button className="btn btn--danger" type="button" onClick={() => handleFileDelete(idx)}>삭제</button>
            </div>
          ))}

            <button
              type="button"
              className="btn btn--secondary"
              onClick={handleFileFieldsAdd}
              disabled={uploadLimit > 0 && files.length >= uploadLimit}
            >
              파일 추가
            </button>
            <div className="help-text">{`첨부파일 ${files.length}/${uploadLimit > 0 ? uploadLimit : '∞'}`}</div>
          </div>

          <div className="form-group">
            <label className="label">링크</label>
            {links.map((link, idx) => (
              <div key={idx} className="board-write__link-row">
                <input
                  type="text"
                  className="input-box"
                  value={link}
                  onChange={e => handleLinkChange(idx, e.target.value)}
                  placeholder="링크 입력"
                />
                <button className="btn btn--danger" type="button" onClick={() => handleLinkDelete(idx)}>삭제</button>
              </div>
            ))}
            <button
              type="button"
              className="btn btn--primary"
              onClick={handleLinkAdd}
              disabled={linkLimit > 0 && links.length >= linkLimit}
            >
              링크 추가
            </button>
            <div className="help-text">{`링크 ${links.length}/${linkLimit > 0 ? linkLimit : '∞'}`}</div>
          </div>

          <div className="board-write__actions">
            <button type="button" className="btn btn--secondary" onClick={() => router.back()}>
              취소
            </button>
            <button type="submit" className="btn btn--primary">
              {editMode ? '수정' : '작성'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

export default BoardWrite;
