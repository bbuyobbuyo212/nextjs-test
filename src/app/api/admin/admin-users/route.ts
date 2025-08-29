import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { verifyAdminJWT } from '../../../../lib/jwt';

// DB users 테이블 예시 필드: userid, name, nickname, email, password, created_at, role

export async function GET(req: NextRequest) {
    try {
        await verifyAdminJWT(req); // 인증 미들웨어
        const db = await getDb();
        const search = req.nextUrl.searchParams.get('search');
        let query = 'SELECT userid, name, nickname, email, created_at FROM users';
        let params: any[] = [];
        if (search) {
        query += ' WHERE name LIKE ? OR email LIKE ? OR userid LIKE ?';
        params = [`%${search}%`, `%${search}%`, `%${search}%`];
        }
        const [users] = await db.query(query, params);
        return NextResponse.json({ users });
    } catch (err: any) {
        const status = err.message === 'Unauthorized' ? 403 : 401;
        return NextResponse.json({ error: `인증 실패: ${err.message}` }, { status });
    }
}

export async function POST(req: NextRequest) {
    try {
        await verifyAdminJWT(req);
        const db = await getDb();
        const body = await req.json();
        // 중복 체크
    const [rows] = await db.query('SELECT COUNT(*) as cnt FROM users WHERE userid=? OR email=? OR nickname=?', [body.userid, body.email, body.nickname]);
    if ((rows as any)[0].cnt > 0) throw new Error('중복된 회원 정보');
    await db.query('INSERT INTO users (userid, password, name, email, nickname, created_at) VALUES (?, ?, ?, ?, ?, NOW())', [body.userid, body.password, body.name, body.email, body.nickname]);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function PUT(req: NextRequest) {
    try {
        await verifyAdminJWT(req);
        const db = await getDb();
        const body = await req.json();
        await db.query('UPDATE users SET name=?, nickname=?, email=?, password=? WHERE userid=?', [body.name, body.nickname, body.email, body.password, body.userid]);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

export async function DELETE(req: NextRequest) {
    try {
        await verifyAdminJWT(req);
        const db = await getDb();
        const { userid } = await req.json();
        await db.query('DELETE FROM users WHERE userid=?', [userid]);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}

// 권한 변경 API (PATCH)
export async function PATCH(req: NextRequest) {
    try {
        await verifyAdminJWT(req);
        const db = await getDb();
    // role 필드가 없으므로 PATCH 핸들러는 비활성화 또는 에러 반환
    return NextResponse.json({ error: 'role 필드가 존재하지 않습니다.' }, { status: 400 });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
