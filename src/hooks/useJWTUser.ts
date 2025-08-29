import { useEffect, useState } from 'react';
import { getCookie, getUserCookie } from '@/lib/cookie';

export interface UserInfo {
  userid: string;
  name: string;
  email: string;
  nickname?: string;
}

export function useJWTUser() {
  const [user, setUser] = useState<UserInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchProfile() {
      // 쿠키에서 토큰 확인
      const token = getCookie('token');
      // user_data 쿠키에서 직접 정보 가져오기
      const userData = getUserCookie();
      
      // 토큰이 없고 user_data도 없으면 로그인되지 않은 상태
      if (!token && !userData) {
        setUser(null);
        setLoading(false);
        return;
      }
      
      // user_data가 있으면 바로 사용
      if (userData) {
        setUser(userData);
        setLoading(false);
        return;
      }
      try {
        const res = await fetch('/api/auth/profile', {
          method: 'GET',
          credentials: 'include',
          headers: { 'Authorization': `Bearer ${token}` },
        });
        if (!res.ok) {
          setUser(null);
        } else {
          const data = await res.json();
          if (data.success && data.user) {
            setUser(data.user);
          } else {
            setUser(null);
          }
        }
      } catch {
        setUser(null);
      } finally {
        setLoading(false);
      }
    }
    fetchProfile();
  }, []);

  return { user, loading };
}
