"use client";
import React, { useState } from 'react';
import { useRouter } from 'next/navigation';

function LogoutButton() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleLogout = async () => {
    setLoading(true);
    setError('');
    try {
      const res = await fetch('/api/auth/logout', {
        method: 'POST',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || '로그아웃 실패');
      router.replace('/'); // 로그아웃 후 메인 페이지로 이동
    } catch (err: any) {
      setError(err.message);
    }
    setLoading(false);
  };

  return (
    <button className="btn btn--outline" onClick={handleLogout} disabled={loading}>
      로그아웃
    </button>
  );
}
export default LogoutButton;
