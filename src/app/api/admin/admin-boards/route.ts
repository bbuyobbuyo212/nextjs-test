import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { verifyAdminJWT } from '../../../../lib/jwt';

// 게시판 테이블: g5_write_테이블아이디, 댓글 테이블: g5_comments_테이블아이디

export async function GET(req: NextRequest) {
  try {
    await verifyAdminJWT(req);
    const db = await getDb();
  const [boards] = await db.query('SELECT id, board_id, name, skin, type, description, upload_limit, link_limit, permissions, listColumns, thumbSize, created_at FROM boards_meta');
  // permissions 컬럼은 JSON으로 변환
  const boardsWithTable = (boards as any[]).map(b => ({
    ...b,
    permissions: b.permissions ? JSON.parse(b.permissions) : {},
    table: `g5_write_${b.board_id}`,
    commentTable: `g5_comments_${b.board_id}`
  }));
  return NextResponse.json({ data: boardsWithTable });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminJWT(req);
    const db = await getDb();
    const body = await req.json();
    // 게시판 추가
  // 필수값 검증
  if (!body.board_id || !body.name || !body.type) {
    return NextResponse.json({ error: '필수값 누락' }, { status: 400 });
  }
  const [result] = await db.query(
    'INSERT INTO boards_meta (board_id, name, skin, type, description, upload_limit, link_limit, permissions, listColumns, thumbSize, created_at) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW())',
    [body.board_id, body.name, body.skin, body.type, body.description, body.upload_limit, body.link_limit, JSON.stringify(body.permissions), body.listColumns, body.thumbSize]
  );

  // 게시글 테이블 생성
  const createWriteTableSql = `
    CREATE TABLE IF NOT EXISTS g5_write_${body.board_id} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      title VARCHAR(255) NOT NULL,
      content TEXT,
      author VARCHAR(50),
      name VARCHAR(50) DEFAULT NULL,
      password VARCHAR(100) DEFAULT NULL,
      nickname VARCHAR(50) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
      view_count INT DEFAULT 0,
      files JSON,
      links JSON
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await db.execute(createWriteTableSql);

  // 댓글 테이블 생성
  const createCommentsTableSql = `
    CREATE TABLE IF NOT EXISTS g5_comments_${body.board_id} (
      id INT AUTO_INCREMENT PRIMARY KEY,
      post_id INT NOT NULL,
      user_id VARCHAR(50) NOT NULL,
      content TEXT NOT NULL,
      parent_id INT NULL,
      target_user VARCHAR(50) NULL,
      nickname VARCHAR(50) DEFAULT NULL,
      name VARCHAR(50) DEFAULT NULL,
      password VARCHAR(100) DEFAULT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4;
  `;
  await db.execute(createCommentsTableSql);

  return NextResponse.json({ success: true, id: (result as any).insertId });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
  
}

export async function PUT(req: NextRequest) {
  try {
    await verifyAdminJWT(req);
    const db = await getDb();
    const body = await req.json();
    if (!body.id || !body.board_id || !body.name || !body.type) {
      return NextResponse.json({ error: '필수값 누락' }, { status: 400 });
    }
    // 존재 여부 체크
    const [rows] = await db.query('SELECT id FROM boards_meta WHERE id=?', [body.id]);
    if (!rows || (Array.isArray(rows) && rows.length === 0)) {
      return NextResponse.json({ error: '존재하지 않는 게시판입니다.' }, { status: 404 });
    }
    await db.query(
      'UPDATE boards_meta SET board_id=?, name=?, skin=?, type=?, description=?, upload_limit=?, link_limit=?, permissions=?, listColumns=?, thumbSize=? WHERE id=?',
      [body.board_id, body.name, body.skin, body.type, body.description, body.upload_limit, body.link_limit, JSON.stringify(body.permissions), body.listColumns, body.thumbSize, body.id]
    );
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdminJWT(req);
    const db = await getDb();
    const { board_id } = await req.json();
    if (!board_id || typeof board_id !== 'string' || board_id.trim() === '') {
      return NextResponse.json({ error: 'board_id 파라미터 누락 또는 비정상' }, { status: 400 });
    }
    // boards_meta에서 board_id로 삭제
    const [rows] = await db.query('SELECT board_id FROM boards_meta WHERE board_id=?', [board_id]);
    if (!rows || (Array.isArray(rows) && (rows as any[]).length === 0)) {
      return NextResponse.json({ error: '존재하지 않는 게시판입니다.', rows }, { status: 404 });
    }
    await db.query('DELETE FROM boards_meta WHERE board_id=?', [board_id]);

    // 게시글/댓글 테이블 DROP
    try {
      await db.execute(`DROP TABLE IF EXISTS \`g5_write_${board_id}\``);
    } catch (err: any) {
      console.log('게시글 테이블 DROP 실패:', err.message);
    }
    try {
      await db.execute(`DROP TABLE IF EXISTS \`g5_comments_${board_id}\``);
    } catch (err: any) {
      console.log('댓글 테이블 DROP 실패:', err.message);
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}