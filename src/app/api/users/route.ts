import { NextResponse } from 'next/server';
const pool = require('@/lib/db');

// 회원정보 조회 (GET)
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userid = searchParams.get('userid');
  try {
    let query = 'SELECT userid, name, email, created_at, nickname FROM users';
    let params: any[] = [];
    if (userid) {
      query += ' WHERE userid = ?';
      params.push(userid);
    }
  const conn = await pool.getConnection();
  const [rows] = await conn.query(query, params);
  conn.release();
    return NextResponse.json({ success: true, users: rows });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}

// 회원정보 수정 (PUT)
export async function PUT(request: Request) {
  try {
    const body = await request.json();
    const { userid, password, name, email, nickname } = body;
    if (!userid) {
      return NextResponse.json({ success: false, error: 'userid is required' }, { status: 400 });
    }
    const query = `UPDATE users SET 
      password = ?,
      name = ?,
      email = ?,
      nickname = ?
      WHERE userid = ?`;
    const params = [password, name, email, nickname, userid];
  const conn = await pool.getConnection();
  const [result] = await conn.query(query, params);
  conn.release();
    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
