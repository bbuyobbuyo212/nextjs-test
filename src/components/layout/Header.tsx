"use client";
import React from 'react';
import GNB from './GNB';
import MobileMenu from './MobileMenu';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useJWTUser } from '@/hooks/useJWTUser';
import { removeCookie } from '@/lib/cookie';

interface HeaderProps {
  isAdmin?: boolean;
}

const Header: React.FC<HeaderProps> = ({ isAdmin }) => {
  const [mobileMenuOpen, setMobileMenuOpen] = React.useState(false);
  const router = useRouter();
  const { user, loading } = useJWTUser();
  const isLogin = !!user;
  const nickname = user?.nickname || user?.name || '';
  const handleLogout = async () => {
    await fetch('/api/auth/logout', { method: 'POST', credentials: 'include' });
    // 쿠키에서 사용자 정보 및 토큰 제거
    removeCookie('token');
    removeCookie('user_data');
    window.location.reload();
  };

  return (
    <>
      <header className="header">
        <div className="container">
          <div className="header__inner">
            <div className="header__logo">
              <Link href="/">로고</Link>
            </div>
            <div className="header__gnb">
              <GNB />
            </div>
            <div className="header__utile">
              {isLogin ? (
                <>
                  <span className="header__utile__link">{nickname}님</span>
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
            <button 
              className="header__hamburger"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="모바일 메뉴 열기"
            >
              <span></span>
              <span></span>
              <span></span>
            </button>
          </div>
        </div>
      </header>
      {mobileMenuOpen && (
        <MobileMenu onClose={() => setMobileMenuOpen(false)} />
      )}
    </>
  );
};

export default Header;
