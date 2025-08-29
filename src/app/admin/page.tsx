"use client";

import React, { useEffect } from 'react';
import { useAdminAuth } from '@/hooks/useAdminAuth';
import { getCookie } from '@/lib/cookie';

export default function AdminPage() {
  const { adminData, isLoading } = useAdminAuth();

  useEffect(() => {
    // 디버깅을 위한 쿠키 확인
    console.log('[AdminPage] 쿠키 확인:');
    console.log('admin_token:', getCookie('admin_token') ? '있음' : '없음');
    console.log('token:', getCookie('token') ? '있음' : '없음');
    console.log('admin_data:', getCookie('admin_data'));
  }, []);

  console.log('[AdminPage] adminData:', adminData, 'isLoading:', isLoading);

  if (isLoading) {
    return <div>로딩 중...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h1 className="admin-dashboard__title">관리자 대시보드</h1>
      
      <div className="admin-dashboard__info">
        <h2>관리자 정보</h2>
        {adminData && (
          <div className="admin-dashboard__card">
            <p><strong>아이디:</strong> {adminData.adminid || adminData.id || '-'}</p>
            <p><strong>이름:</strong> {adminData.name || '-'}</p>
            <p><strong>역할:</strong> {adminData.role || '-'}</p>
          </div>
        )}
      </div>
      
      <div className="admin-dashboard__quick-links">
        <h2>바로가기</h2>
        <div className="admin-dashboard__grid">
          <a href="/admin/admin-boards" className="admin-dashboard__card admin-dashboard__link">
            <h3>게시판 관리</h3>
            <p>게시판 생성, 설정 변경, 권한 관리</p>
          </a>
          
          <a href="/admin/admin-users" className="admin-dashboard__card admin-dashboard__link">
            <h3>회원 관리</h3>
            <p>회원 목록, 정보 수정, 권한 설정</p>
          </a>
          
          <a href="/admin/admin-menu" className="admin-dashboard__card admin-dashboard__link">
            <h3>메뉴 관리</h3>
            <p>사이트 메뉴 구조 설정</p>
          </a>
        </div>
      </div>
    </div>
  );
}
