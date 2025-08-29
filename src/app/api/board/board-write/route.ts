import { NextResponse } from 'next/server';
import { writeBoard } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

function validateBoardInput(body: any) {
  // board_id, title, content 필수
  if (!body.board_id || typeof body.board_id !== 'string' || body.board_id.trim().length === 0) return false;
  if (!body.title || typeof body.title !== 'string' || body.title.trim().length < 2) return false;
  if (!body.content || typeof body.content !== 'string' || body.content.trim().length < 2) return false;
  
  // 회원/비회원 구분
  const isGuest = !body.author || body.author === 'guest';
  
  // 비회원일 경우 name과 password는 필수
  if (isGuest) {
    if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) return false;
    if (!body.password || typeof body.password !== 'string' || body.password.trim().length < 4) return false;
  }
  
  return true;
}

export async function POST(request: Request) {
  const body = await request.json();
  if (!validateBoardInput(body)) {
    return NextResponse.json({ success: false, error: '입력값 검증 실패: 필수값 누락 또는 형식 오류' }, { status: 400 });
  }
  
  try {
    // 회원/비회원 여부 확인
    const isGuest = !body.author || body.author === 'guest';
    
    // DB 테이블명 동적 처리
    body.tableName = `g5_write_${body.board_id}`;
    
    // 비회원 비밀번호 해시 처리
    if (isGuest && body.password) {
      body.password = await bcrypt.hash(body.password, 10);
    }
    
    // 회원인 경우 사용자 정보 가져오기
    let userNickname = null;
    let userName = null;
    let userId = null;
    
    if (!isGuest) {
      // JWT 토큰이 있으면 사용자 정보 가져오기
      // 1. Authorization 헤더에서 토큰 확인
      let token = request.headers.get('authorization')?.replace('Bearer ', '') || null;
      
      // 2. 토큰이 없으면 쿠키에서 확인 (쿠키에서 직접 추출)
      if (!token) {
        const cookieHeader = request.headers.get('cookie');
        if (cookieHeader) {
          const tokenCookie = cookieHeader.split(';').find(c => c.trim().startsWith('token='));
          if (tokenCookie) {
            token = tokenCookie.split('=')[1];
          }
        }
      }
      
      if (token) {
        try {
          const payload = verifyToken(token) as any;
          userNickname = payload.nickname || null;
          userName = payload.name || null;
          userId = payload.userid || payload.id || null;
          
          // 토큰에서 가져온 사용자 정보로 필드 설정
          body.author = userId || body.author; // 토큰에서 userId가 있으면 사용
          
          // 회원인 경우 name과 nickname은 항상 토큰에서 가져온 값으로 덮어쓰기
          if (userId) {
            body.name = userName || null; // 토큰에서 name이 있으면 사용
            body.nickname = userNickname || null; // 토큰에서 nickname이 있으면 사용
            // 회원인 경우 비밀번호 필드 제거 (비회원 비밀번호와 혼동 방지)
            delete body.password;
          }
        } catch (error) {
          console.warn('Token verification failed:', error);
        }
      }
    }
    
    // nickname 필드 설정
    if (!body.nickname) {
      if (!isGuest && userNickname) {
        // 회원인 경우 토큰에서 가져온 회원 닉네임 사용
        body.nickname = userNickname;
      } else if (isGuest && body.name) {
        // 비회원인 경우 입력한 name 사용
        body.nickname = body.name;
      }
    }
    
    // name 필드 설정 (회원이면서 name이 없는 경우)
    if (!isGuest && !body.name && userName) {
      body.name = userName;
    }
    
    // 테스트용 로깅
    console.log('[게시글 작성] 처리된 데이터:', {
      isGuest,
      author: body.author,
      name: body.name,
      nickname: body.nickname
    });
    
    const result = await writeBoard(body);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'DB 오류' }, { status: 500 });
  }
}
