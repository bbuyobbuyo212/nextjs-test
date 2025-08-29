"use client";
import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import type { Board, SearchParams } from '../../types/board';
import { getCookie, getUserCookie } from '@/lib/cookie';

// User 타입에 nickname 추가
type User = {
  id: string;
  name?: string;
  nickname?: string;
  email?: string;
  // ...기타 필드...
};

// Board 타입의 author를 User로 지정하고 비회원 필드 추가
type BoardWithAuthor = Board & { 
  author: User | string; 
  nickname?: string;  // 비회원 닉네임
  name?: string;      // 비회원 이름
};

function BoardList({ boardInfo }: { boardInfo?: any }) {
  // boardInfo를 실제로 사용하여 경고 제거
  React.useEffect(() => {
    if (boardInfo) {
      console.log('BoardList boardInfo:', boardInfo);
    }
  }, [boardInfo]);
  const [boards, setBoards] = useState<BoardWithAuthor[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchParams, setSearchParams] = useState<SearchParams>({
    searchType: 'title',
    searchKeyword: ''
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // 실제 DB에서 게시판별 목록을 불러옴
    const fetchBoards = async () => {
      const board_id = boardInfo?.id || '';
      if (!board_id) {
        setBoards([]);
        setTotalPages(1);
        setError('유효하지 않은 게시판입니다.');
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          board_id,
          page: String(currentPage),
          searchType: searchParams.searchType,
          searchKeyword: searchParams.searchKeyword
        });
        const res = await fetch(`/api/board/board-list?${params.toString()}`);
        const data = await res.json();
        if (!res.ok || data.error) {
          throw new Error(data.error || '게시글을 불러오는 중 오류가 발생했습니다.');
        }
        setBoards(data.boards || []);
        setTotalPages(data.totalPages || 1);
      } catch (err: any) {
        setError(err.message || '게시글을 불러오는 중 오류가 발생했습니다.');
        setBoards([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchBoards();
  }, [currentPage, boardInfo, searchParams]);

  const handleSearch = () => {
    console.log('검색:', searchParams.searchType, searchParams.searchKeyword);
    // 검색 로직 구현
    setCurrentPage(1); // 검색 시 첫 페이지로 이동
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const formatDate = (dateString?: string) => {
    if (!dateString) return '';
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const renderPagination = () => {
    const startPage = Math.max(1, currentPage - 2);
    const endPage = Math.min(totalPages, startPage + 4);
    const pages = [];

    for (let i = startPage; i <= endPage; i++) {
      pages.push(i);
    }

    return (
      <div className="pagination">
        <button
          className="pagination__btn"
          onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          aria-label="이전 페이지"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M15 18L9 12L15 6" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        </button>
        {pages.map(page => (
          <button
            key={page}
            className={`pagination__btn ${currentPage === page ? 'active' : ''}`}
            onClick={() => setCurrentPage(page)}
          >
            {page}
          </button>
        ))}
        <button
          className="pagination__btn"
          onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          aria-label="다음 페이지"
        >
          <svg width="16" height="16" viewBox="0 0 24 24">
            <path d="M9 18L15 12L9 6" stroke="currentColor" strokeWidth="2" fill="none"/>
          </svg>
        </button>
      </div>
    );
  };

  function BoardTitle({ board_id }: { board_id: string }) {
    const [boardName, setBoardName] = useState('');
    useEffect(() => {
      fetch(`/api/board/board-meta?board_id=${board_id}`)
        .then(res => res.json())
        .then(data => setBoardName(data.name || board_id));
    }, [board_id]);
    return <h1 className="title">{boardName}</h1>;
  }

  // 로그인 상태를 관리하는 상태 추가
  const [loginStatus, setLoginStatus] = useState({
    isLoggedIn: false,
    displayName: ''
  });

  // 클라이언트 사이드에서만 쿠키 접근
  useEffect(() => {
    const userInfo = getUserCookie();
    if (userInfo) {
      setLoginStatus({
        isLoggedIn: true,
        displayName: userInfo.nickname || userInfo.name || userInfo.id || '사용자'
      });
    } else {
      setLoginStatus({
        isLoggedIn: false,
        displayName: ''
      });
    }
  }, []);

  return (
    <div className="board-list">
      <div className="container">
        <div className="board-list__header">
          <BoardTitle board_id={boardInfo?.id || ''} />
          <div className="board-list__top">            
            <div className="board-list__search">
              <select 
                className="select-box"
                value={searchParams.searchType}
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  searchType: e.target.value as 'title' | 'content'
                })}
              >
                <option value="title">제목</option>
                <option value="content">내용</option>
              </select>
              <input
                type="text"
                className="input-box"
                placeholder="검색어를 입력하세요"
                value={searchParams.searchKeyword}
                onChange={(e) => setSearchParams({
                  ...searchParams,
                  searchKeyword: e.target.value
                })}
                onKeyPress={handleKeyPress}
              />
              <button className="btn btn--primary" onClick={handleSearch}>
                검색
              </button>
            </div>
          </div>
          <div className="board-list__actions">
            <Link href={`/board/${boardInfo?.id}/write`} className="btn btn--primary">
              글등록
            </Link>
          </div>
        </div>

        {/* 에러 메시지 표시 */}
        {error && (
          <div className="board-list__error">
            <p style={{ color: 'red', fontWeight: 'bold' }}>{error}</p>
          </div>
        )}
        {/* 로딩 스피너 표시 */}
        {loading && (
          <div className="board-list__loading">
            <p>로딩 중...</p>
          </div>
        )}

        <div className="board-list__table">
          <div className="board-list__header-row">
            <div className="board-list__col board-list__col--number">번호</div>
            <div className="board-list__col board-list__col--title">제목</div>
            <div className="board-list__col board-list__col--author">작성자</div>
            <div className="board-list__col board-list__col--date">작성일</div>
            <div className="board-list__col board-list__col--views">조회</div>
          </div>
          {(!loading && !error && boards.length > 0) ? (
            boards.map((board) => (
              <div key={board.id} className="board-list__row">
                <div className="board-list__col board-list__col--number">
                  {board.id}
                </div>
                <div className="board-list__col board-list__col--title">
                  <Link href={`/board/${boardInfo?.id}/${board.id}`} className="board-list__title-link">
                    {board.title}
                  </Link>
                </div>
                <div className="board-list__col board-list__col--author">
                  {/* 작성자 표시 우선순위: 닉네임 > 이름 > 작성자ID */}
                  {board.nickname 
                    ? board.nickname 
                    : (board.name
                        ? board.name
                        : (typeof board.author === 'object'
                           ? (board.author.nickname 
                               ? board.author.nickname 
                               : (board.author.name 
                                   ? board.author.name 
                                   : board.author.id))
                           : (board.author || '-')))}
                </div>
                <div className="board-list__col board-list__col--date">
                  {formatDate(board.created_at || board.createdAt)}
                </div>
                <div className="board-list__col board-list__col--views">
                  {board.view_count ?? board.viewCount ?? 0}
                </div>
              </div>
            ))
          ) : (!loading && !error && boards.length === 0) ? (
            <div className="board-list__empty">
              <p>게시글이 없습니다.</p>
            </div>
          ) : null}
        </div>

        {!loading && !error && renderPagination()}

        <div className="board-list__actions board-list__actions--bottom">
          <Link href={`/board/${boardInfo?.id}/write`} className="btn btn--primary">
            글등록
          </Link>
        </div>
      </div>
    </div>
  );
}

export default BoardList;

