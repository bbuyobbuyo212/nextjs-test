import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/jwt";

// 댓글/대댓글 작성
export async function POST(request: Request) {
  try {
    const body = await request.json();
    if (!body.board_id || !body.post_id || !body.content) {
      return NextResponse.json({ success: false, error: "필수값 누락" }, { status: 400 });
    }
    
    // 회원/비회원 여부 확인
    const isGuest = !body.userid || body.userid === 'guest';
    
    // 비회원일 경우 name과 password는 필수
    if (isGuest) {
      if (!body.name || typeof body.name !== 'string' || body.name.trim().length === 0) {
        return NextResponse.json({ success: false, error: "비회원 댓글에는 이름이 필요합니다" }, { status: 400 });
      }
      if (!body.password || typeof body.password !== 'string' || body.password.trim().length < 4) {
        return NextResponse.json({ success: false, error: "비회원 댓글에는 비밀번호(4자 이상)가 필요합니다" }, { status: 400 });
      }
    }
    
    // 비회원 비밀번호 해시 처리
    let passwordHash = null;
    if (isGuest && body.password) {
      passwordHash = await bcrypt.hash(body.password, 10);
    }
    
    // 회원인 경우 토큰에서 사용자 정보 가져오기
    let userNickname = null;
    let userName = null;
    
    if (!isGuest) {
      // JWT 토큰이 있으면 사용자 정보 가져오기
      const token = request.headers.get('authorization')?.replace('Bearer ', '') || null;
      if (token) {
        try {
          const payload = verifyToken(token) as any;
          userNickname = payload.nickname || null;
          userName = payload.name || null;
        } catch (error) {
          console.warn('Token verification failed:', error);
        }
      }
    }
    
    // nickname 필드 설정
    if (!body.nickname) {
      if (!isGuest && userNickname) {
        // 회원인 경우 회원 닉네임 사용
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
    
    const db = await getDb();
    const tableName = `g5_comments_${body.board_id}`;
    const sql = `
      INSERT INTO ${tableName} (post_id, user_id, nickname, name, password, content, parent_id, target_user)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `;
    const params = [
      body.post_id,
      body.userid ? body.userid : 'guest',
      body.nickname || null,
      body.name || null,
      passwordHash,
      body.content,
      body.parent_id || null,
      body.target_user || null
    ];
    const [result] = await db.query(sql, params);
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("댓글 작성 오류:", err);
    return NextResponse.json({ success: false, error: err.message || "서버 오류" }, { status: 500 });
  }
}



