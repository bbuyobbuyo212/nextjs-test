import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';
import { verifyToken } from '@/lib/jwt';
import bcrypt from 'bcryptjs';

function validateDeleteInput(body: any) {
  // post_id 또는 postId 중 하나라도 있으면 유효
  const hasPostId = Boolean(body.post_id || body.postId);
  if (!body.board_id || !hasPostId) return false;
  
  // 회원 삭제(userid) 또는 비회원 삭제(password) 중 하나는 필요
  const isAuthenticated = Boolean(body.userid || body.password);
  if (!isAuthenticated) return false;
  
  return true;
}

export async function DELETE(request: Request) {
  try {
    const body = await request.json();
    
    // postId로 들어온 경우 post_id로 통일
    if (!body.post_id && body.postId) {
      body.post_id = body.postId;
    }
    
    if (!validateDeleteInput(body)) {
      return NextResponse.json({ 
        success: false, 
        error: '입력값 검증 실패: board_id와 post_id, 인증정보(userid 또는 password)가 필요합니다' 
      }, { status: 400 });
    }
    
    console.log('게시글 삭제 요청:', { board_id: body.board_id, post_id: body.post_id });
    
    const db = await getDb();
    const tableName = `g5_write_${body.board_id}`;
    
    // 게시글 존재 여부 확인
    const [rows] = await db.query(
      `SELECT id, author, name, password FROM ${tableName} WHERE id = ?`, 
      [body.post_id]
    );
    
    const posts = rows as any[];
    if (!posts || posts.length === 0) {
      return NextResponse.json({ 
        success: false, 
        error: '삭제할 게시글을 찾을 수 없습니다' 
      }, { status: 404 });
    }
    
    const post = posts[0];
    
    // 회원 삭제: 작성자 또는 관리자 검증
    if (body.userid) {
      // JWT 검증
      let isAuthorized = false;
      const token = request.headers.get('authorization')?.replace('Bearer ', '') || null;
      
      if (token) {
        try {
          const payload = verifyToken(token) as any;
          const isAdmin = payload.role === 'admin';
          const isAuthor = String(post.author) === String(body.userid);
          
          isAuthorized = isAdmin || isAuthor;
          
          if (!isAuthorized) {
            return NextResponse.json({ 
              success: false, 
              error: '삭제 권한이 없습니다. 작성자 본인 또는 관리자만 삭제할 수 있습니다.' 
            }, { status: 403 });
          }
        } catch (error) {
          return NextResponse.json({ 
            success: false, 
            error: '인증 토큰이 유효하지 않습니다.' 
          }, { status: 401 });
        }
      } else {
        // 토큰 없이는 삭제 불가
        return NextResponse.json({ 
          success: false, 
          error: '인증 토큰이 필요합니다.' 
        }, { status: 401 });
      }
    }
    // 비회원 삭제: 비밀번호 검증
    else if (body.password) {
      // 게시글에 저장된 비밀번호가 없는 경우
      if (!post.password) {
        return NextResponse.json({ 
          success: false, 
          error: '회원이 작성한 글은 비밀번호로 삭제할 수 없습니다.' 
        }, { status: 403 });
      }
      
      // 비밀번호 검증
      const isPasswordValid = await bcrypt.compare(body.password, post.password);
      
      if (!isPasswordValid) {
        return NextResponse.json({ 
          success: false, 
          error: '비밀번호가 일치하지 않습니다.' 
        }, { status: 403 });
      }
    }
    
    // 게시글 삭제
    const [result] = await db.query(
      `DELETE FROM ${tableName} WHERE id = ?`,
      [body.post_id]
    );
    
    // 연관 댓글 삭제 (옵션)
    try {
      const commentsTable = `g5_comments_${body.board_id}`;
      await db.query(
        `DELETE FROM ${commentsTable} WHERE post_id = ?`,
        [body.post_id]
      );
    } catch (err) {
      console.log('댓글 삭제 실패 (무시됨):', err);
    }
    
    console.log('게시글 삭제 완료:', result);
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error('게시글 삭제 오류:', error);
    return NextResponse.json({ 
      success: false, 
      error: error?.message || 'DB 오류' 
    }, { status: 500 });
  }
}
