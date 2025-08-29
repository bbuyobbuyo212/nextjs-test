import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET(request: Request) {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');
    const userid = searchParams.get('userid');
    if (!email) {
        return NextResponse.json({ available: false, error: '이메일을 입력하세요.' }, { status: 400 });
    }
    
    try {
        const [rows] = await pool.query('SELECT userid FROM users WHERE email = ?', [email]);
        // 본인 이메일이면 사용 가능
        if ((rows as any[]).length === 0 || (userid && (rows as any[])[0]?.userid === userid)) {
            return NextResponse.json({ available: true });
        }
        return NextResponse.json({ available: false });
    } catch (error) {
        console.error('이메일 중복 확인 오류:', error);
        return NextResponse.json({ available: false, error: '서버 오류가 발생했습니다.' }, { status: 500 });
    }
}
