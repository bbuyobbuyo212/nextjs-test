import { NextResponse } from 'next/server';
const pool = require('@/lib/db');
const bcrypt = require('bcryptjs');

export async function POST(request: Request) {
  try {
    const { userid, email } = await request.json();
    if (!userid || !email) {
      return NextResponse.json({ success: false, error: '아이디와 이메일을 입력하세요.' }, { status: 400 });
    }
    const [rows] = await pool.query('SELECT * FROM users WHERE userid = ? AND email = ?', [userid, email]);
    if (rows.length === 0) {
      return NextResponse.json({ success: false, error: '일치하는 회원정보가 없습니다.' }, { status: 404 });
    }
    // 임시 비밀번호 생성 및 암호화
    const tempPassword = Math.random().toString(36).slice(-8);
    const hashedPassword = await bcrypt.hash(tempPassword, 10);
    await pool.query('UPDATE users SET password = ? WHERE userid = ?', [hashedPassword, userid]);
    // 실제 서비스에서는 이메일로 임시 비밀번호를 발송해야 함
    return NextResponse.json({ success: true, tempPassword });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
