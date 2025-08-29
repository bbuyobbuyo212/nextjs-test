import { NextResponse } from 'next/server';
import pool from '@/lib/db';
const bcrypt = require('bcryptjs');

export async function POST(request: Request) {
    try {
        const { userid, password, name, email, nickname } = await request.json();
        if (!userid || !password || !name || !email || !nickname) {
            return NextResponse.json({ success: false, error: '모든 필드를 입력하세요.' }, { status: 400 });
        }
        
        // 아이디 중복 확인
        const [idRows] = await pool.query('SELECT userid FROM users WHERE userid = ?', [userid]);
        if ((idRows as any[]).length > 0) {
            return NextResponse.json({ success: false, error: '이미 사용중인 아이디입니다.' }, { status: 409 });
        }
        
        // 닉네임 중복 확인
        const [nickRows] = await pool.query('SELECT nickname FROM users WHERE nickname = ?', [nickname]);
        if ((nickRows as any[]).length > 0) {
            return NextResponse.json({ success: false, error: '이미 사용중인 닉네임입니다.' }, { status: 409 });
        }
        
        // 이메일 중복 확인
        const [emailRows] = await pool.query('SELECT email FROM users WHERE email = ?', [email]);
        if ((emailRows as any[]).length > 0) {
            return NextResponse.json({ success: false, error: '이미 사용중인 이메일입니다.' }, { status: 409 });
        }
        
        // 비밀번호 해싱
        const hashedPassword = await bcrypt.hash(password, 10);
        
        // 사용자 등록
        await pool.query(
            'INSERT INTO users (userid, password, name, email, nickname, created_at) VALUES (?, ?, ?, ?, ?, NOW())',
            [userid, hashedPassword, name, email, nickname]
        );
        
        return NextResponse.json({ success: true });
    } catch (error: any) {
        console.error('회원가입 오류:', error);
        return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
    }
}
