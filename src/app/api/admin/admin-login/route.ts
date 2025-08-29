
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

export async function POST(req: NextRequest) {
    try {
        const db = await getDb();
        const { adminid, password } = await req.json();

        // 아이디로만 조회
        const [rows] = await db.query('SELECT adminid, password, name, role FROM admin_users WHERE adminid=?', [adminid]);
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ error: '존재하지 않는 아이디입니다.' }, { status: 401 });
        }
        const user = (rows as any[])[0];
        // 비밀번호 해시 비교
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }
        if (user.role !== 'admin' && user.role !== 'SUPER') {
            return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 401 });
        }

        // JWT 발급 (isAdmin 플래그 추가)
    const token = jwt.sign(
      { 
        adminid: user.adminid, 
        name: user.name, 
        role: user.role,
        isAdmin: true,  // 관리자 확인 플래그
        id: user.adminid  // id 필드 추가 (verify-admin API와 호환)
      }, 
      JWT_SECRET, 
      { expiresIn: '3h' }
    );
    
    // 관리자 데이터 (클라이언트에서 사용할 정보)
    const adminData = {
      adminid: user.adminid,
      name: user.name,
      role: user.role
    };
    
    console.log('[API] 관리자 로그인 성공, 토큰 생성:', token ? '토큰 생성됨' : '토큰 생성 실패');
    
    // 응답 생성
    const response = NextResponse.json({ 
      success: true, 
      message: '관리자 로그인 성공',
      admin: adminData,
      token
    });

    // 서버 측 HTTP 전용 쿠키 설정
    response.cookies.set('admin_token', token, { 
      httpOnly: true, 
      path: '/', 
      maxAge: 60 * 60 * 3,  // 3시간
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'  // 'strict'에서 'lax'로 변경
    });
    
    // 클라이언트 접근용 관리자 토큰 쿠키
    response.cookies.set('admin_token_access', token, { 
      httpOnly: false, 
      path: '/', 
      maxAge: 60 * 60 * 3,  // 3시간
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'  // 'strict'에서 'lax'로 변경
    });
    
    // 일반 토큰 (httpOnly)
    response.cookies.set('token', token, { 
      httpOnly: true, 
      path: '/', 
      maxAge: 60 * 60 * 3,  // 3시간
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'  // 제한 완화
    });
    
    // 클라이언트 접근용 일반 토큰
    response.cookies.set('token_access', token, { 
      httpOnly: false, 
      path: '/', 
      maxAge: 60 * 60 * 3,  // 3시간
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'  // 제한 완화
    });
    
    // 클라이언트에서 접근 가능한 관리자 데이터 쿠키 설정
    response.cookies.set('admin_data', JSON.stringify(adminData), { 
      httpOnly: false, 
      path: '/', 
      maxAge: 60 * 60 * 3,  // 3시간
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax'  // 제한 완화
    });
    
    console.log('[API] 관리자 로그인 성공, 모든 쿠키 설정 완료');
    
    return response;
    
    // 클라이언트에서 접근 가능한 관리자 데이터 쿠키 설정
    response.cookies.set('admin_data', JSON.stringify(adminData), { 
      httpOnly: false, 
      path: '/', 
      maxAge: 60 * 60 * 3,  // 3시간
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });
    
    return response;
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '로그인 처리 중 오류가 발생했습니다.' }, { status: 401 });
    }
}
