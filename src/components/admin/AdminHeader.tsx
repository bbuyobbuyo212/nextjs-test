"use client";
import React, { useState } from 'react'
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { removeCookie } from '@/lib/cookie';

function AdminHeader({ onLogout }: { onLogout?: () => void }) {
  const router = useRouter();
  const [isLoggingOut, setIsLoggingOut] = useState(false);

  const handleLogout = async () => {
    if (isLoggingOut) return; // 중복 클릭 방지
    
    try {
      setIsLoggingOut(true);
      
      // 서버 API를 통한 로그아웃
      const response = await fetch('/api/admin/admin-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (response.ok) {
        // 쿠키 삭제
        removeCookie('admin_token');
        removeCookie('admin_data');
        
        // 전달된 콜백 함수가 있으면 실행
        if (onLogout) onLogout();
        
        // 로그인 페이지로 리다이렉트
        router.push('/admin/login');
      } else {
        const data = await response.json();
        console.error('로그아웃 실패:', data.error || '알 수 없는 오류');
        alert('로그아웃 처리 중 오류가 발생했습니다.');
      }
    } catch (error) {
      console.error('로그아웃 오류:', error);
      alert('로그아웃 처리 중 오류가 발생했습니다.');
    } finally {
      setIsLoggingOut(false);
    }
  };

  return (
    <header className="admin-header">
      <div className="admin-header__logo">관리자</div>
      <nav className="admin-header__nav">
          <Link href="/" className="btn btn--light">사이트 바로가기</Link>
          <button 
            className="btn btn--primary admin-header__logout" 
            onClick={handleLogout}
            disabled={isLoggingOut}
          >
            {isLoggingOut ? '로그아웃 중...' : '로그아웃'}
          </button>
      </nav>
    </header>
  )
}

export default AdminHeader
