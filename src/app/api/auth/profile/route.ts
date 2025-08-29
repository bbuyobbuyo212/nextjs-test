import { verifyToken } from '@/lib/jwt';
// CORS preflight 및 응답 헤더 추가
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};
import { NextResponse } from 'next/server';
import pool from '@/lib/db';
const bcrypt = require('bcryptjs');

export async function GET(request: Request) {
        // CORS preflight 처리
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: CORS_HEADERS,
            });
        }
    try {
        // 1. httpOnly 쿠키에서 JWT 추출 (최우선)
        let token = null;
        const cookie = request.headers.get('cookie');
        if (cookie) {
            // 여러 쿠키가 있을 때 정확히 token만 추출
            const cookies = cookie.split(';').map(c => c.trim());
            const tokenCookie = cookies.find(c => c.startsWith('token='));
            if (tokenCookie) token = tokenCookie.replace('token=', '');
        }
        // 2. Authorization 헤더에서 JWT 추출 (fallback)
        if (!token) {
            const authHeader = request.headers.get('authorization');
            if (authHeader && authHeader.startsWith('Bearer ')) {
                token = authHeader.replace('Bearer ', '').trim();
            }
        }
        if (!token) {
                        const res = NextResponse.json({ success: false, error: '인증 정보가 없습니다.' }, { status: 401 });
                        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
                        return res;
        }
        const payload = verifyToken(token);
        if (!payload) {
                        const res = NextResponse.json({ success: false, error: '유효하지 않은 토큰입니다.' }, { status: 401 });
                        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
                        return res;
        }
        console.log('토큰 페이로드:', payload);
        let userid: string | undefined;
        if (typeof payload === 'object' && payload !== null && 'userid' in payload) {
            userid = (payload as any).userid;
        }
        if (!userid) {
                        const res = NextResponse.json({ success: false, error: '유효하지 않은 토큰입니다.' }, { status: 401 });
                        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
                        return res;
        }
        // DB에서 사용자 정보 조회
        const conn = await pool.getConnection();
        const [rows] = await conn.query('SELECT userid, name, email, nickname FROM users WHERE userid = ?', [userid]);
    conn.release();
    const user = (rows as any)[0];
        if (!user) {
                        const res = NextResponse.json({ success: false, error: '사용자를 찾을 수 없습니다.' }, { status: 404 });
                        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
                        return res;
        }
                const res = NextResponse.json({ success: true, user });
                Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
                return res;
    } catch (error: any) {
                const res = NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
                Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
                return res;
    }
}


export async function PUT(request: Request) {
    try {
        const { userid, password, name, email, nickname } = await request.json();
        if (!userid) {
            return NextResponse.json({ success: false, error: 'userid는 필수입니다.' }, { status: 400 });
        }
        let updateFields = [];
        let params = [];
        if (password) {
            const hashedPassword = await bcrypt.hash(password, 10);
            updateFields.push('password = ?');
            params.push(hashedPassword);
        }
        if (name) {
            updateFields.push('name = ?');
            params.push(name);
        }
        if (email) {
            updateFields.push('email = ?');
            params.push(email);
        }
        if (nickname) {
            updateFields.push('nickname = ?');
            params.push(nickname);
        }
        if (updateFields.length === 0) {
            return NextResponse.json({ success: false, error: '수정할 정보가 없습니다.' }, { status: 400 });
        }
        params.push(userid);
    const conn = await pool.getConnection();
    await conn.query(`UPDATE users SET ${updateFields.join(', ')} WHERE userid = ?`, params);
    conn.release();
        return NextResponse.json({ success: true });
    } catch (error: any) {
        return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
    }
}
