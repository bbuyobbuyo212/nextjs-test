import React, { useState, useEffect } from 'react';
import { useJWTUser } from '@/hooks/useJWTUser';
import Link from 'next/link';

interface MenuItem {
  id: number;
  name: string;
  url: string;
  children?: MenuItem[];
}

function useMenus() {
  const [menus, setMenus] = useState<MenuItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  useEffect(() => {
    fetch('/api/admin/menus/')
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.menus)) {
          // 데이터 검증: url 필드가 없으면 제외
          setMenus(data.menus.filter((m: MenuItem) => typeof m.url === 'string'));
        } else {
          setError('메뉴 데이터를 불러올 수 없습니다.');
        }
      })
      .catch(() => setError('메뉴 API 요청 실패'))
      .finally(() => setLoading(false));
  }, []);
  return { menus, loading, error };
}

interface MobileMenuProps {
  onClose: () => void;

}

const MobileMenu: React.FC<MobileMenuProps> = ({ onClose }) => {
  const { menus, loading, error } = useMenus();
  const [activeIndex, setActiveIndex] = useState<number | null>(null);
  const { user, loading: userLoading } = useJWTUser();
  const isLogin = !!user;

  const handleMenuClick = (idx: number) => {
    setActiveIndex(activeIndex === idx ? null : idx);
  };

  // JWT 로그아웃 처리
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    onClose();
    window.location.reload();
  };

  return (
    <div className="mobile-gnb">
      <div className="mobile-gnb__head">
        <button 
          className="mobile-gnb__close"
          onClick={onClose}
          aria-label="모바일 메뉴 닫기"
        >
          <svg width="24" height="24" viewBox="0 0 24 24">
            <path d="M18 6L6 18M6 6l12 12" strokeWidth="2" strokeLinecap="round" stroke="#000000"/>
          </svg>
        </button>
      </div>
      <div className="mobile-gnb__utile">
        {isLogin ? (
          <>
            <button type="button" className="header__utile__link" onClick={handleLogout}>로그아웃</button>
            <Link href="/auth/profile" className="header__utile__link">정보수정</Link>
          </>
        ) : (
          <>
            <Link href="/auth/login" className="header__utile__link">로그인</Link>
            <Link href="/auth/terms" className="header__utile__link">회원가입</Link>
          </>
        )}
      </div>
      <div className="mobile-gnb__body">
        <nav className="mobile-gnb__list" aria-label="모바일 내비게이션">
          {loading && <div className="mobile-gnb__loading">메뉴 불러오는 중...</div>}
          {error && <div className="mobile-gnb__error">{error}</div>}
          <ul className="mobile-gnb__1depth">            
            {(!loading && !error && menus.length > 0) && menus.map((menu, idx) => (
              <li
                key={menu.id}
                className={`mobile-gnb__1depth__item${activeIndex === idx ? ' active' : ''}`}
                aria-expanded={activeIndex === idx}
              >
                <div
                  className="mobile-gnb__1dpeth__link"
                  tabIndex={0}
                  onClick={() => handleMenuClick(idx)}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') handleMenuClick(idx);
                  }}
                  aria-label={menu.name}
                  aria-controls={`mobile-gnb-2depth-${menu.id}`}
                >
                  <Link href={menu.url}>{menu.name}</Link>
                  {menu.children && menu.children.length > 0 && (
                    <span className="mobile-gnb__arrow" aria-hidden>{activeIndex === idx ? '▲' : '▼'}</span>
                  )}
                </div>
                {menu.children && menu.children.length > 0 && activeIndex === idx && (
                  <ul className="mobile-gnb__2depth" id={`mobile-gnb-2depth-${menu.id}`}>
                    {menu.children.map(child => (
                      <li key={child.id} className="mobile-gnb__2depth__item">
                        <Link href={child.url} className="mobile-gnb__1dpeth__link">{child.name}</Link>
                      </li>
                    ))}
                  </ul>
                )}
              </li>
            ))}
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default MobileMenu;
