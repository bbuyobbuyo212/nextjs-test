import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { verifyAdminJWT } from '../../../../../lib/jwt';

export async function GET(req: NextRequest) {
    try {
        await verifyAdminJWT(req);
        const db = await getDb();
        const nickname = req.nextUrl.searchParams.get('nickname');
        const userid = req.nextUrl.searchParams.get('userid');
        if (!nickname) {
            return NextResponse.json({ error: 'nickname 파라미터가 필요합니다.' }, { status: 400 });
        }
        let query = 'SELECT nickname FROM users WHERE nickname=?';
        let params: any[] = [nickname];
        if (userid) {
            query += ' AND userid<>?';
            params.push(userid);
        }
        const [rows] = await db.query(query, params);
        const available = (rows as any).length === 0;
        return NextResponse.json({ available });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
