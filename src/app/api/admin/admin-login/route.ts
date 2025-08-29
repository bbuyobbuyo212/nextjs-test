
import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

export async function POST(req: NextRequest) {
    try {
        const db = await getDb();
        const { adminid, password } = await req.json();

        // 아이디로만 조회
        const [rows] = await db.query('SELECT adminid, password, name, role FROM admin_users WHERE adminid=?', [adminid]);
        if ((rows as any[]).length === 0) {
            return NextResponse.json({ error: '존재하지 않는 아이디입니다.' }, { status: 401 });
        }
        const user = (rows as any[])[0];
        // 비밀번호 해시 비교
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return NextResponse.json({ error: '비밀번호가 올바르지 않습니다.' }, { status: 401 });
        }
        if (user.role !== 'admin' && user.role !== 'SUPER') {
            return NextResponse.json({ error: '관리자 권한이 없습니다.' }, { status: 401 });
        }

        // JWT 발급
    const token = jwt.sign({ adminid: user.adminid, name: user.name, role: user.role }, JWT_SECRET, { expiresIn: '2h' });
    // httpOnly 쿠키에 저장 및 응답 body에 token 포함
    const res = NextResponse.json({ success: true, token });
    res.cookies.set('token', token, { httpOnly: true, path: '/', maxAge: 60 * 60 * 2 });
    return res;
    } catch (err: any) {
        return NextResponse.json({ error: err.message || '로그인 처리 중 오류가 발생했습니다.' }, { status: 401 });
    }
}
