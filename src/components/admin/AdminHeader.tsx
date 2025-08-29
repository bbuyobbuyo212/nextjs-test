"use client";
import React from 'react'
import Link from 'next/link';

function AdminHeader({ onLogout }: { onLogout?: () => void }) {
  return (
    <header className="admin-header">
      <div className="admin-header__logo">관리자</div>
      <nav className="admin-header__nav">
          <Link href="/" className="admin-header__link">사이트 바로가기</Link>
        <button className="btn btn--primary admin-header__logout" onClick={onLogout}>로그아웃</button>
      </nav>
    </header>
  )
}

export default AdminHeader
