"use client";

import React, { useState, useEffect } from 'react';
import AdminHeader from '@/components/admin/AdminHeader';
import AdminSidebar from '@/components/admin/AdminSidebar';
import { useAdminGuard } from '@/hooks/useAdminAuth';
import { useRouter, usePathname } from 'next/navigation';
import { removeCookie } from '@/lib/cookie';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  const { isAdmin, isLoading } = useAdminGuard();
  const router = useRouter();
  const pathname = usePathname();
  const [showLayout, setShowLayout] = useState(false);
  
  // 현재 경로가 로그인 페이지인지 확인 (usePathname 훅 사용)
  const isLoginPage = pathname?.includes('/admin/admin-login') || false;
  
  useEffect(() => {
    console.log('[AdminLayout] 현재 경로:', pathname, '로그인 페이지:', isLoginPage);
  }, [pathname, isLoginPage]);
  
  // 로그인 페이지인 경우 레이아웃 없이 컨텐츠만 표시
  if (isLoginPage) {
    console.log('[AdminLayout] 로그인 페이지 감지, 레이아웃 없이 표시');
    return <>{children}</>;
  }

  // 관리자 로그아웃 처리
  const handleLogout = async () => {
    try {
      // 서버 API를 통한 로그아웃
      await fetch('/api/admin/admin-logout', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      // 쿠키 삭제
      removeCookie('admin_token');
      removeCookie('admin_data');
      
      // 로그인 페이지로 리다이렉트
      router.push('/admin/login');
    } catch (error) {
      console.error('로그아웃 오류:', error);
      alert('로그아웃 처리 중 오류가 발생했습니다.');
    }
  };

  // 로딩이 완료되고 관리자인 경우에만 레이아웃 표시
  useEffect(() => {
    console.log('[AdminLayout] isLoading:', isLoading, 'isAdmin:', isAdmin);
    
    if (!isLoading) {
      // 이미 위에서 로그인 페이지 확인을 했으므로 여기서는 생략
      
      if (!isAdmin) {
        console.log('[AdminLayout] 관리자가 아님, 로그인 페이지로 리다이렉트 시도');
        
        // 직접 window.location 사용
        window.location.href = '/admin/admin-login';
        return;
      }
      
      setShowLayout(isAdmin);
    }
  }, [isAdmin, isLoading]);

  // 로딩 중 표시
  if (isLoading) {
    return (
      <div className="admin-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f6f7fb' }}>
        <div className="admin-loading__spinner" style={{ width: '40px', height: '40px', border: '4px solid #4e54c8', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '1rem', color: '#333', fontSize: '1rem' }}>관리자 인증 확인 중...</p>
      </div>
    );
  }

  // 관리자가 아닌 경우 빈 화면 (리다이렉트 처리 중)
  if (!isAdmin) {
    return (
      <div className="admin-loading" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100vh', background: '#f6f7fb' }}>
        <div className="admin-loading__spinner" style={{ width: '40px', height: '40px', border: '4px solid #4e54c8', borderTop: '4px solid transparent', borderRadius: '50%', animation: 'spin 1s linear infinite' }}></div>
        <p style={{ marginTop: '1rem', color: '#333', fontSize: '1rem' }}>관리자 페이지로 이동 중...</p>
        <style jsx global>{`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
        `}</style>
      </div>
    );
  }

  // 관리자 레이아웃 렌더링
  console.log('[AdminLayout] 관리자 레이아웃 렌더링');
  return (
    <div className="admin-layout">
      <AdminHeader onLogout={handleLogout} />
      <div className='admin-layout__body'>
        <AdminSidebar />
        <main className="admin-layout__content">
          {children}
        </main>
      </div>
    </div>
  );
}
