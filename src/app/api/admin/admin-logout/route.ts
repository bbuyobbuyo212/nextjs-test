import { NextRequest, NextResponse } from 'next/server';

/**
 * 관리자 로그아웃 API
 * - 관리자 쿠키를 제거하고 로그아웃 처리
 */
export async function POST(req: NextRequest) {
  try {
    // HTTP 응답 객체 생성
    const response = NextResponse.json({ 
      success: true, 
      message: '관리자 로그아웃 처리가 완료되었습니다.' 
    });
    
    // 관리자 토큰 쿠키 제거
    response.cookies.set('admin_token', '', { 
      httpOnly: true, 
      path: '/', 
      maxAge: 0,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // 관리자 데이터 쿠키 제거
    response.cookies.set('admin_data', '', { 
      httpOnly: false, 
      path: '/', 
      maxAge: 0,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    // 일반 토큰도 함께 제거 (기존 코드와의 호환성 유지)
    response.cookies.set('token', '', { 
      httpOnly: true, 
      path: '/', 
      maxAge: 0 
    });

    // 로그아웃 시간 기록 (디버깅용)
    console.log(`[관리자 로그아웃] 시간: ${new Date().toISOString()}`);
    
    return response;
  } catch (error) {
    console.error('[관리자 로그아웃 오류]', error);
    return NextResponse.json({ 
      success: false, 
      error: '로그아웃 처리 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
