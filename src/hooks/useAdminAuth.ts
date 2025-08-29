"use client";

import { useState, useEffect } from 'react';
import { getCookie } from '@/lib/cookie';
import { useRouter } from 'next/navigation';

/**
 * 관리자 인증 상태를 확인하는 훅
 * @returns {Object} { isAdmin, isLoading, adminData } - 관리자 상태 정보
 */
export function useAdminAuth() {
  const [isAdmin, setIsAdmin] = useState(false);
  const [adminData, setAdminData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 클라이언트 사이드에서만 실행
    if (typeof window === 'undefined') return;

    async function checkAdmin() {
      try {
        // 토큰 초기화 및 확인
        console.log('[DEBUG] 쿠키에서 토큰 확인 시작');
        
        // 모든 쿠키 로깅
        console.log('[DEBUG] 전체 쿠키:', document.cookie);
        
        // 쿠키에서 관리자 토큰 확인 (httpOnly가 아닌 버전 우선 확인)
        const adminTokenAccess = getCookie('admin_token_access');
        const adminToken = getCookie('admin_token'); // httpOnly라 JS에서 확인 불가
        const normalToken = getCookie('token'); // httpOnly라 JS에서 확인 불가
        const tokenAccess = getCookie('token_access');
        
        console.log('[DEBUG] adminTokenAccess:', adminTokenAccess ? '있음' : '없음');
        console.log('[DEBUG] tokenAccess:', tokenAccess ? '있음' : '없음');
        
        // 사용할 토큰 결정 (httpOnly가 아닌 것만 확인 가능)
        const tokenToUse = adminTokenAccess || tokenAccess;
        
        if (!tokenToUse) {
          console.log('[DEBUG] 사용 가능한 토큰 없음, 인증 실패');
          setIsAdmin(false);
          setIsLoading(false);
          return;
        }
        
        console.log('[DEBUG] 토큰 확인됨, API 호출 준비');

        // 서버에 관리자 인증 상태 확인 요청
        console.log('[DEBUG] 관리자 인증 상태 확인 요청');
        const response = await fetch('/api/admin/verify-admin', {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${tokenToUse}`
          }
        });

        console.log('[DEBUG] 관리자 인증 응답 상태:', response.status);
        if (response.ok) {
          const data = await response.json();
          console.log('[DEBUG] 관리자 인증 성공:', data);
          setIsAdmin(true);
          setAdminData(data.admin || null);
        } else {
          console.log('[DEBUG] 관리자 인증 실패');
          setIsAdmin(false);
          // 응답이 실패했을 때 쿠키 삭제
          document.cookie = "admin_token=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
          document.cookie = "admin_data=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;";
        }
      } catch (error) {
        console.error('관리자 인증 확인 오류:', error);
        setIsAdmin(false);
      } finally {
        setIsLoading(false);
      }
    }

    checkAdmin();
  }, [router]);

  return { isAdmin, isLoading, adminData };
}

/**
 * 관리자 페이지 라우트 가드 훅
 * - 관리자가 아닌 경우 로그인 페이지로 리다이렉트
 */
export function useAdminGuard() {
  const { isAdmin, isLoading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    // 로딩이 끝나고 관리자가 아닌 경우
    if (!isLoading && !isAdmin) {
      router.push('/admin/login');
    }
  }, [isAdmin, isLoading, router]);

  return { isAdmin, isLoading };
}
