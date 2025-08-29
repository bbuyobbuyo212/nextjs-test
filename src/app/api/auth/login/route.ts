import { NextResponse } from 'next/server';
// CORS preflight 및 응답 헤더 추가
const CORS_HEADERS = {
    'Access-Control-Allow-Origin': 'http://localhost:3000',
    'Access-Control-Allow-Credentials': 'true',
    'Access-Control-Allow-Methods': 'GET,POST,PUT,DELETE,OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type,Authorization',
};
import pool from '@/lib/db';
const jwt = require('jsonwebtoken');

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

export async function POST(request: Request) {
        // CORS preflight 처리
        if (request.method === 'OPTIONS') {
            return new Response(null, {
                status: 204,
                headers: CORS_HEADERS,
            });
        }
    try {
        const { userid, password } = await request.json();
        if (!userid || !password) {
            const res = NextResponse.json({ success: false, error: '아이디와 비밀번호를 입력하세요.' }, { status: 400 });
            Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
            return res;
        }
        
        // 사용자 조회
        const [rows]: any = await pool.query('SELECT * FROM users WHERE userid = ?', [userid]);
        const user = rows[0];
        
        if (!user) {
            const res = NextResponse.json({ success: false, error: '존재하지 않는 아이디입니다.' }, { status: 401 });
            Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
            return res;
        }
        
        const bcrypt = require('bcryptjs');
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
                        const res = NextResponse.json({ success: false, error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
                        Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
                        return res;
        }
        const token = jwt.sign({ userid: user.userid, name: user.name, email: user.email }, JWT_SECRET, { expiresIn: '3h' });
        const userData = { 
          userid: user.userid, 
          name: user.name, 
          email: user.email, 
          nickname: user.nickname,
          isAdmin: user.is_admin === 1 || user.isAdmin === 1
        };
        
        const response = NextResponse.json({ 
          success: true, 
          token: token,
          user: userData
        });
        
        const isProd = process.env.NODE_ENV === 'production';
        // 토큰을 쿠키에 설정
        const tokenCookieOptions = [
            `token=${token}`,
            'Path=/',
            'Max-Age=3600',
            'SameSite=Strict',
            'HttpOnly',
            isProd ? 'Secure' : ''
        ].filter(Boolean).join('; ');
        
        // 사용자 데이터를 쿠키에 설정 (인코딩 적용)
        const encodedUserData = encodeURIComponent(JSON.stringify(userData));
        const userDataCookieOptions = [
            `user_data=${encodedUserData}`,
            'Path=/',
            'Max-Age=3600',
            'SameSite=Strict',
            isProd ? 'Secure' : ''
        ].filter(Boolean).join('; ');
        
        response.headers.set('Set-Cookie', tokenCookieOptions);
        response.headers.append('Set-Cookie', userDataCookieOptions);
        Object.entries(CORS_HEADERS).forEach(([k, v]) => response.headers.set(k, v));
                return response;
    } catch (error: any) {
                const res = NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
                Object.entries(CORS_HEADERS).forEach(([k, v]) => res.headers.set(k, v));
                return res;
    }
}
