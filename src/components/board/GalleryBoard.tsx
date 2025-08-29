"use client";
import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';

interface GalleryItem {
  id: number;
  title: string;
  author: string | { id?: number; name?: string };
  createdAt?: string;
  viewCount?: number;
  imageUrl?: string;
  thumbnailUrl?: string;
}

function GalleryBoard({ boardInfo }: { boardInfo?: any }) {
  React.useEffect(() => {
    if (boardInfo) {
      console.log('GalleryBoard boardInfo:', boardInfo);
    }
  }, [boardInfo]);
  const [items, setItems] = useState<GalleryItem[]>([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [searchType, setSearchType] = useState<'title' | 'content'>('title');
  const [searchKeyword, setSearchKeyword] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const galleryListRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // 실제 목록
    const fetchList = async () => {
      try {
        setLoading(true);
        setError(null);
        
        const id = boardInfo?.id || boardInfo?.board_id || '';
        if (!id) { 
          setItems([]); 
          setTotalPages(1);
          setError('유효하지 않은 게시판입니다.');
          return; 
        }
        
        const params = new URLSearchParams({ 
          board_id: id, 
          page: String(currentPage), 
          searchType, 
          searchKeyword 
        });
        
        const res = await fetch(`/api/board/gallery-board?${params.toString()}`);
        const data = await res.json();
        
        if (!res.ok) {
          throw new Error(data.error || '서버 응답 오류');
        }
        
        if (!data?.success) { 
          setItems([]); 
          setTotalPages(1); 
          setError(data.error || '데이터를 불러올 수 없습니다.');
          return; 
        }
        
        const rows = Array.isArray(data.items) ? data.items : [];
        
        if (rows.length === 0 && searchKeyword && isSearching) {
          setError(`'${searchKeyword}' 검색 결과가 없습니다.`);
        } else {
          setError(null);
        }
        
        const mapped = rows.map((r: any): GalleryItem => {
          const title = r.title || r.subject || `#${r.id}`;
          const author = r.author || r.writer || '-';
          const createdAt = r.created_at || r.createdAt;
          const viewCount = r.view_count || r.viewCount || 0;
          
          // 서버에서 제공하는 썸네일 URL 사용
          let imageUrl = r.thumbnail || '';
          let thumbnailUrl = r.thumbnail || '';
          
          // 서버에서 썸네일을 제공하지 않는 경우 파일에서 추출 (백업 로직)
          if (!imageUrl) {
            try {
              let files = r.files;
              if (typeof files === 'string') files = JSON.parse(files);
              if (Array.isArray(files)) {
                const img = files.find((f: any) => {
                  const url = f?.downloadUrl || f?.url || '';
                  const name = f?.originalName || f?.fileName || url;
                  const lowered = String(url || name).toLowerCase();
                  return /(\.png|\.jpg|\.jpeg|\.gif|\.webp)$/.test(lowered);
                });
                if (img) {
                  imageUrl = img.downloadUrl || img.url;
                  thumbnailUrl = img.thumbnailUrl || img.thumbUrl || imageUrl;
                }
              }
            } catch {}
          }
          
          return { id: r.id, title, author, createdAt, viewCount, imageUrl, thumbnailUrl };
        });
        setItems(mapped);
        setTotalPages(data.totalPages || 1);
        setIsSearching(!!searchKeyword);
      } catch (err) {
        console.error('갤러리 목록 로드 오류:', err);
        setError(err instanceof Error ? err.message : '데이터를 불러오는 중 오류가 발생했습니다.');
        setItems([]);
        setTotalPages(1);
      } finally {
        setLoading(false);
      }
    };
    fetchList();
  }, [boardInfo, currentPage, searchType, searchKeyword]);

  useEffect(() => {
    function clipImage() {
      if (!galleryListRef.current) return;
      const divs = galleryListRef.current.querySelectorAll('.clip-image > .clip-image__image');
      divs.forEach(div => {
        const divAspect = div.clientHeight / div.clientWidth;
        div.setAttribute('style', 'overflow: hidden;');
        const img = div.querySelector('img');
        if (img) {
          const imgAspect = img.naturalHeight / img.naturalWidth;
          if (imgAspect <= divAspect) {
            img.setAttribute('style', 'width: auto; height: 100%;');
          } else {
            img.setAttribute('style', 'width: 100%; height: auto;');
          }
        }
      });
    }

    // 이미지 로드 시 clipImage 실행
    if (galleryListRef.current) {
      const imgs = galleryListRef.current.querySelectorAll('img');
      imgs.forEach(img => {
        img.onload = clipImage;
      });
    }

    // 최초 및 items 변경 시 clipImage 실행
    setTimeout(clipImage, 100);

    // window resize 시 clipImage 실행
    window.addEventListener('resize', clipImage);
    return () => {
      window.removeEventListener('resize', clipImage);
      // 이미지 onload 핸들러 해제
      if (galleryListRef.current) {
        const imgs = galleryListRef.current.querySelectorAll('img');
        imgs.forEach(img => {
          img.onload = null;
        });
      }
    };
  }, [items]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ko-KR');
  };

  const handleSearch = () => {
    setCurrentPage(1);
  };

  const handleKeyPress = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleSearch();
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
  
  return (
    <div className="gallery-board">
      <div className="container">
        <BoardTitle board_id={boardInfo?.id} />
        
        <div className="gallery-board__top">
          <div className="gallery-board__search">
            <select
              className="select-box"
              value={searchType}
              onChange={e => setSearchType(e.target.value as 'title' | 'content')}
            >
              <option value="title">제목</option>
              <option value="content">내용</option>
            </select>
            <input
              type="text"
              className="input-box"
              placeholder="검색어를 입력하세요"
              value={searchKeyword}
              onChange={e => setSearchKeyword(e.target.value)}
              onKeyPress={handleKeyPress}
              autoComplete="username"
            />
            <button className="btn btn--primary" onClick={handleSearch}>
              검색
            </button>
          </div>
          <div className="gallery-board__actions">
            <Link href={`/board/${boardInfo?.id}/write`} className="btn btn--primary">
              글등록
            </Link>
          </div>
        </div>

        {loading ? (
          <div className="gallery-board__loading">
            <div className="loading-spinner"></div>
            <p>데이터를 불러오는 중입니다...</p>
          </div>
        ) : error ? (
          <div className="gallery-board__error">
            <p>{error}</p>
            {isSearching && (
              <button className="btn btn--secondary" onClick={() => {
                setSearchKeyword('');
                setIsSearching(false);
                setError(null);
              }}>
                검색 초기화
              </button>
            )}
          </div>
        ) : (
          <div className={`gallery-board__grid ${items.length === 0 ? "gallery-board__grid--empty" : ""}`} ref={galleryListRef}>
            {items.length === 0 ? (
              <div className="gallery-board__empty">
                게시글이 없습니다
              </div>
            ) : (
              items.map(item => (
                <div key={item.id} className="gallery__item">
                  <Link href={`/board/${boardInfo?.id}/${item.id}`} className="gallery__item__link-box">
                    <div className="clip-image">
                      <div className="clip-image__image">
                        <img
                          src={item.thumbnailUrl || item.imageUrl || '/react.svg'}
                          alt={item.title}
                          style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                        />
                      </div>
                    </div>
                    <div className="gallery__item_desc">
                      <div className="gallery__item__subject">
                        <span className="gallery__item__subject-text">{item.title}</span>
                      </div>
                      <div className="gallery__item__info">
                        <div className="gallery__item__date">
                          <svg width="1.6rem" height="1.6rem" viewBox="0 0 24 24" style={{verticalAlign:'middle',marginRight:'0.4rem'}}>
                            <path d="M7 4V2M17 4V2M3 8H21M5 22H19C20.1046 22 21 21.1046 21 20V8C21 6.89543 20.1046 6 19 6H5C3.89543 6 3 6.89543 3 8V20C3 21.1046 3.89543 22 5 22Z" stroke="#666" strokeWidth="2" fill="none"/>
                          </svg>
                          {item.createdAt ? formatDate(item.createdAt) : ''}
                        </div>
                        <div className="gallery__item__hit">
                          <svg width="1.6rem" height="1.6rem" viewBox="0 0 24 24" style={{verticalAlign:'middle',marginRight:'0.4rem'}}>
                            <circle cx="12" cy="12" r="8" stroke="#666" strokeWidth="2" fill="none"/>
                            <circle cx="12" cy="12" r="2" fill="#666"/>
                          </svg>
                          {item.viewCount ?? 0}
                        </div>
                      </div>
                    </div>
                  </Link>
                </div>
              ))
            )}
          </div>
        )}

        {!loading && !error && renderPagination()}

        <div className="gallery-board__actions gallery-board__actions--bottom">
          <Link href={`/board/${boardInfo?.id}/write`} className="btn btn--primary">
            글등록
          </Link>
        </div>
      </div>
    </div>
  );
}

export default GalleryBoard;
