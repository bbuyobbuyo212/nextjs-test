import { NextRequest, NextResponse } from 'next/server';
import { verifyToken } from '@/lib/jwt';

/**
 * 관리자 인증 상태 확인 API
 * - 관리자 토큰의 유효성을 확인하고 관리자 정보 반환
 */
export async function GET(request: NextRequest) {
  try {
    console.log('[API] 관리자 인증 확인 API 호출됨');
    
    // 헤더에서 토큰 추출
    let token = request.headers.get('authorization')?.replace('Bearer ', '') || null;
    
    // 헤더에 토큰이 없으면 쿠키에서 확인
    if (!token) {
      token = request.cookies.get('admin_token')?.value || null;
      console.log('[API] 쿠키에서 토큰 확인:', token ? '토큰 있음' : '토큰 없음');
    } else {
      console.log('[API] 헤더에서 토큰 확인:', '토큰 있음');
    }
    
    // 토큰이 없으면 인증 실패
    if (!token) {
      console.log('[API] 토큰 없음 - 인증 실패');
      return NextResponse.json({ 
        success: false, 
        error: '관리자 토큰이 없습니다.' 
      }, { status: 401 });
    }
    
    // 토큰 검증
    try {
      console.log('[API] 토큰 검증 시도');
      const decoded = verifyToken(token);
      console.log('[API] 토큰 검증 결과:', decoded);
      
      // 추가 검증: admin 플래그가 있는지 확인
      if (!decoded || typeof decoded !== 'object') {
        console.log('[API] 토큰 디코딩 실패');
        return NextResponse.json({ 
          success: false, 
          error: '유효한 관리자 토큰이 아닙니다.' 
        }, { status: 403 });
      }
      
      // isAdmin 플래그 또는 role 필드로 관리자 확인
      const isValidAdmin = decoded.isAdmin === true || 
                          decoded.role === 'admin' || 
                          decoded.role === 'SUPER';
      
      if (!isValidAdmin) {
        console.log('[API] 관리자 권한 없음:', decoded);
        return NextResponse.json({ 
          success: false, 
          error: '관리자 권한이 없습니다.' 
        }, { status: 403 });
      }
      
      // 검증 성공
      console.log('[API] 관리자 인증 성공');
      return NextResponse.json({ 
        success: true, 
        admin: {
          id: decoded.id || decoded.userid || decoded.adminid,
          name: decoded.name,
          email: decoded.email || '',
          role: decoded.role || 'admin',
          isAdmin: true
        }
      });
    } catch (err) {
      console.error('토큰 검증 오류:', err);
      return NextResponse.json({ 
        success: false, 
        error: '토큰이 유효하지 않거나 만료되었습니다.' 
      }, { status: 401 });
    }
  } catch (error) {
    console.error('관리자 인증 확인 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: '인증 확인 중 오류가 발생했습니다.' 
    }, { status: 500 });
  }
}
