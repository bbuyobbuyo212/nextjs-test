"use client";

import React from 'react';

export default function AdminLoginLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  console.log('[AdminLoginLayout] 로그인 페이지 레이아웃 렌더링');
  
  return (
    <>
      {children}
    </>
  );
}
