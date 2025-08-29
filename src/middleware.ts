import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

/**
 * 미들웨어 함수 - 관리자 권한 검증
 * @param request 요청 객체
 * @returns 응답 객체
 */
export function middleware(request: NextRequest) {
  // 디버깅을 위한 요청 경로 및 쿠키 정보 출력
  console.log('[Middleware] 요청 경로:', request.nextUrl.pathname);
  console.log('[Middleware] 쿠키:', request.cookies.getAll().map(c => c.name));
  
  // admin 경로에 대한 요청 처리 (admin-login 페이지는 제외)
  if (
    request.nextUrl.pathname.startsWith('/admin') && 
    !request.nextUrl.pathname.includes('/admin/admin-login') && 
    !request.nextUrl.pathname.includes('/admin/login')
  ) {
    console.log('[Middleware] 관리자 페이지 접근 확인:', request.nextUrl.pathname);
    
    // 쿠키에서 관리자 토큰 확인
    const adminToken = request.cookies.get('admin_token')?.value;
    const adminTokenAccess = request.cookies.get('admin_token_access')?.value;
    
    console.log('[Middleware] 관리자 토큰 확인 결과:',
      'admin_token:', !!adminToken,
      'admin_token_access:', !!adminTokenAccess
    );
    
    // 관리자 토큰이 없으면 로그인 페이지로 리다이렉트
    if (!adminToken && !adminTokenAccess) {
      console.log('[Middleware] 관리자 토큰 없음, 로그인 페이지로 리다이렉트');
      const loginUrl = new URL('/admin/admin-login', request.url);
      console.log('[Middleware] 리다이렉트 URL:', loginUrl.toString());
      return NextResponse.redirect(loginUrl);
    }
    
    console.log('[Middleware] 관리자 토큰 확인됨, 접근 허용');
  }
  
  // login 페이지 접근 시 admin-login으로 리다이렉트 (구 경로 지원)
  if (request.nextUrl.pathname === '/admin/login') {
    console.log('[Middleware] 구 로그인 경로 접근, 새 경로로 리다이렉트');
    return NextResponse.redirect(new URL('/admin/admin-login', request.url));
  }
  
  return NextResponse.next();
}

/**
 * 미들웨어 설정 - 적용할 경로 패턴 지정
 */
export const config = {
  matcher: ['/admin/:path*'],
};
