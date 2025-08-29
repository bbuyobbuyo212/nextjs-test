import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const userid = searchParams.get('userid');
    if (!userid) {
        return NextResponse.json({ available: false, error: '아이디를 입력하세요.' }, { status: 400 });
    }
    
    try {
        const [rows] = await pool.query('SELECT userid FROM users WHERE userid = ?', [userid]);
        return NextResponse.json({ available: (rows as any[]).length === 0 });
    } catch (error) {
        console.error('아이디 중복 확인 오류:', error);
        return NextResponse.json({ available: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
