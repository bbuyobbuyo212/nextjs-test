import { NextResponse } from "next/server";
import { getDb } from "@/lib/db";
import bcrypt from "bcryptjs";
import { verifyToken } from "@/lib/jwt";

// 댓글/대댓글 수정
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    if (!body.board_id || !body.id || !body.content) {
      return NextResponse.json({ success: false, error: "필수값 누락" }, { status: 400 });
    }
    
    const db = await getDb();
    const tableName = `g5_comments_${body.board_id}`;
    
    // 댓글 정보 조회
    const [rows] = await db.query(`SELECT * FROM ${tableName} WHERE id=?`, [body.id]);
    
    if (!rows || (rows as any).length === 0) {
      return NextResponse.json({ success: false, error: "존재하지 않는 댓글입니다" }, { status: 404 });
    }
    
    const comment = (rows as any)[0];
    
    // 권한 검증: 관리자, 작성자 본인만 수정 가능
    let isAuthorized = false;
    let isAdmin = false;
    
    // 토큰 확인 - 관리자 또는 해당 회원인지 확인
    const token = request.headers.get('authorization')?.replace('Bearer ', '') || null;
    
    if (token) {
      try {
        const payload = verifyToken(token) as any;
        isAdmin = payload.isAdmin === true;
        
        // 회원이 작성한 댓글이고, 토큰의 회원 ID가 일치하는 경우
        if (comment.user_id !== 'guest' && payload.userid === comment.user_id) {
          isAuthorized = true;
        }
      } catch (error) {
        console.warn('Token verification failed:', error);
      }
    }
    
    // 비회원 댓글인 경우 비밀번호 확인
    if (comment.user_id === 'guest' && body.password) {
      // 저장된 비밀번호와 입력한 비밀번호 비교
      const passwordMatch = await bcrypt.compare(body.password, comment.password);
      if (passwordMatch) {
        isAuthorized = true;
      } else {
        return NextResponse.json({ success: false, error: "비밀번호가 일치하지 않습니다" }, { status: 403 });
      }
    } else if (comment.user_id !== 'guest' && body.userid === comment.user_id) {
      // 회원 댓글이고 요청 user_id가 일치하는 경우 (토큰 검증 없이도 허용)
      isAuthorized = true;
    }
    
    // 관리자 또는 작성자 본인이 아니면 수정 불가
    if (!isAdmin && !isAuthorized) {
      return NextResponse.json({ success: false, error: "댓글을 수정할 권한이 없습니다" }, { status: 403 });
    }
    
    // 댓글 수정 (비회원이면서 nickname 필드가 전달된 경우에만 닉네임도 함께 업데이트)
    let sql = `UPDATE ${tableName} SET content=?, updated_at=NOW()`;
    const params = [body.content];
    
    // 비회원이고 닉네임 변경을 요청한 경우
    if (comment.user_id === 'guest' && body.nickname) {
      sql += `, nickname=?`;
      params.push(body.nickname);
    }
    
    sql += ` WHERE id=?`;
    params.push(body.id);
    
    const [result] = await db.query(sql, params);
    
    return NextResponse.json({ success: true, result });
  } catch (err: any) {
    console.error("댓글 수정 오류:", err);
    return NextResponse.json({ success: false, error: err.message || "서버 오류" }, { status: 500 });
  }
}