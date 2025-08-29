import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const nickname = searchParams.get('nickname');
    const userid = searchParams.get('userid');
    if (!nickname) {
        return NextResponse.json({ available: false, error: '닉네임을 입력하세요.' }, { status: 400 });
    }
    
    try {
        const [rows] = await pool.query('SELECT userid FROM users WHERE nickname = ?', [nickname]);
        // 본인 닉네임이면 사용 가능
        if ((rows as any[]).length === 0 || (userid && (rows as any[])[0]?.userid === userid)) {
            return NextResponse.json({ available: true });
        }
        return NextResponse.json({ available: false });
    } catch (error) {
        console.error('닉네임 중복 확인 오류:', error);
        return NextResponse.json({ available: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
