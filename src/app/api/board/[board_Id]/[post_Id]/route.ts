import { NextResponse } from 'next/server';
import pool from '@/lib/db';
import { verifyToken } from '@/lib/jwt';

export async function GET(request: Request, { params }: { params: { board_id: string, post_id: string } }) {
  // URL에서 직접 추출 시도
  const paramsData = await params;
  let board_id = paramsData?.board_id;
  let post_id = paramsData?.post_id;
  
  // URL에서 직접 값 추출 시도
  if (!board_id || !post_id) {
    const url = request.url;
    const match = url.match(/\/api\/board\/([^\/]+)\/([^\/\?]+)/);
    if (match) {
      board_id = match[1];
      post_id = match[2];
    }
  }
  if (!board_id || !post_id || board_id === 'undefined' || post_id === 'undefined') {
    console.log('[GET] 잘못된 파라미터:', { board_id, post_id });
    return NextResponse.json({ success: false, error: '잘못된 board_id 또는 post_id', debug: { board_id, post_id } }, { status: 400 });
  }
  try {
    console.log('[GET] board_id:', board_id, 'post_id:', post_id);
    const tableName = `g5_write_${board_id}`;
    const conn = await pool.getConnection();
    
    // 조회수 증가 추가
    await conn.query(`UPDATE ${tableName} SET view_count = view_count + 1 WHERE id = ?`, [post_id]);
    
    const [rows] = await conn.query(
      `SELECT id, title, content, author, nickname, name, created_at, updated_at, view_count, files, links
       FROM ${tableName} WHERE id = ?`, [post_id]
    );
    console.log('[GET] DB rows:', Array.isArray(rows) ? JSON.stringify(rows) : rows);
    conn.release();
    if (!rows || !Array.isArray(rows) || rows.length === 0) {
      console.log('[GET] 글을 찾을 수 없음:', { board_id, post_id, rows });
      return NextResponse.json({ success: false, error: '글을 찾을 수 없음', debug: { board_id, post_id, rows } }, { status: 404 });
    }
    const post = (rows as any)[0];
    post.files = post.files ? JSON.parse(post.files) : [];
    post.links = post.links ? JSON.parse(post.links) : [];
    
    // 댓글 목록 조회 추가
    try {
      const commentsTable = `g5_comments_${board_id}`;
      const [commentsRows] = await conn.query(
        `SELECT id, post_id, user_id, nickname, name, content, parent_id, target_user, created_at
         FROM ${commentsTable} WHERE post_id = ? ORDER BY created_at ASC`, [post_id]
      );
      post.comments = Array.isArray(commentsRows) ? commentsRows : [];
      console.log('[GET] 댓글 조회 결과:', { count: Array.isArray(commentsRows) ? commentsRows.length : 0 });
    } catch (err) {
      console.log('[GET] 댓글 조회 오류:', err);
      post.comments = [];
    }
    
    return NextResponse.json({ success: true, detail: post });
  } catch (err: any) {
    console.log('[GET] 서버 오류:', err);
    return NextResponse.json({ success: false, error: err.message }, { status: 500 });
  }
}


export async function PUT(request: Request, { params }: { params: { board_id: string, post_id: string } }) {
  const paramsData = await params;
  const { board_id, post_id } = paramsData;
  console.log('[DELETE] board_id:', board_id, 'post_id:', post_id);
  let token = null;
  const cookie = request.headers.get('cookie');
  if (cookie) {
    const match = cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token) return NextResponse.json({ success: false, error: '인증 정보 없음' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ success: false, error: '유효하지 않은 토큰' }, { status: 401 });

  const userid = (payload as any).userid;
  const role = (payload as any).role;
  const tableName = `g5_write_${board_id}`;
  const conn = await pool.getConnection();
  // 글의 작성자 확인
  const [rows] = await conn.query(`SELECT author FROM ${tableName} WHERE id = ?`, [post_id]);
  console.log('[DELETE] DB rows:', rows);
  const post = (rows as any)[0];
  if (!post) {
    conn.release();
    console.log('[DELETE] 글을 찾을 수 없음:', { board_id, post_id });
    return NextResponse.json({ success: false, error: '글을 찾을 수 없음', debug: { board_id, post_id, rows } }, { status: 404 });
  }
  // 작성자 또는 관리자만 수정 가능
  if (post.author !== userid && role !== 'admin') {
    conn.release();
    return NextResponse.json({ success: false, error: '수정 권한 없음' }, { status: 403 });
  }
  const body = await request.json();
  // 수정할 필드: title, content, files, links, nickname 등
  await conn.query(
    `UPDATE ${tableName} SET title = ?, content = ?, files = ?, links = ?, nickname = ?, updated_at = NOW() WHERE id = ?`,
    [body.title, body.content, JSON.stringify(body.files || []), JSON.stringify(body.links || []), body.nickname || null, post_id]
  );
  conn.release();
  return NextResponse.json({ success: true });
}


export async function DELETE(request: Request, { params }: { params: { board_id: string, post_id: string } }) {
  const paramsData = await params;
  const { board_id, post_id } = paramsData;
  console.log('[PUT] board_id:', board_id, 'post_id:', post_id);
  // JWT 토큰 추출 및 검증
  let token = null;
  const cookie = request.headers.get('cookie');
  if (cookie) {
    const match = cookie.match(/token=([^;]+)/);
    if (match) token = match[1];
  }
  if (!token) return NextResponse.json({ success: false, error: '인증 정보 없음' }, { status: 401 });
  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ success: false, error: '유효하지 않은 토큰' }, { status: 401 });

  const userid = (payload as any).userid;
  const role = (payload as any).role;

  const tableName = `g5_write_${board_id}`;
  const conn = await pool.getConnection();
  // 글의 작성자 확인
  const [rows] = await conn.query(`SELECT author FROM ${tableName} WHERE id = ?`, [post_id]);
  console.log('[PUT] DB rows:', rows);
  const post = (rows as any)[0];
  if (!post) {
    conn.release();
    console.log('[PUT] 글을 찾을 수 없음:', { board_id, post_id });
    return NextResponse.json({ success: false, error: '글을 찾을 수 없음', debug: { board_id, post_id, rows } }, { status: 404 });
  }
  // 작성자 또는 관리자만 삭제 가능
  if (post.author !== userid && role !== 'admin') {
    conn.release();
    return NextResponse.json({ success: false, error: '삭제 권한 없음' }, { status: 403 });
  }
  await conn.query(`DELETE FROM ${tableName} WHERE id = ?`, [post_id]);
  conn.release();
  return NextResponse.json({ success: true });
}
