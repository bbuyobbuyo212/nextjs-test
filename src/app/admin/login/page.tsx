"use client";

import React, { useEffect } from 'react';

export default function AdminLoginRedirectPage() {
  useEffect(() => {
    console.log('[AdminLoginRedirect] /admin/login에서 /admin/admin-login으로 리다이렉트');
    // 서버 미들웨어를 우회하기 위해 직접 클라이언트 측 리다이렉트 사용
    window.location.href = '/admin/admin-login';
  }, []);
  
  return (
    <div style={{ padding: '20px', textAlign: 'center' }}>
      <p>관리자 로그인 페이지로 이동 중입니다...</p>
    </div>
  );
}
