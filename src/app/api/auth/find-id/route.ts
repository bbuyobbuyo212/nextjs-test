import { NextResponse } from 'next/server';
const pool = require('@/lib/db');

export async function POST(request: Request) {
  try {
    const { name, email } = await request.json();
    if (!name || !email) {
      return NextResponse.json({ success: false, error: '이름과 이메일을 입력하세요.' }, { status: 400 });
    }
  const conn = await pool.getConnection();
  const [rows] = await conn.query('SELECT userid FROM users WHERE name = ? AND email = ?', [name, email]);
  conn.release();
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: '일치하는 회원정보가 없습니다.' }, { status: 404 });
    }
    return NextResponse.json({ success: true, userid: rows[0].userid });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
