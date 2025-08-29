import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { verifyAdminJWT } from '../../../../../lib/jwt';

export async function GET(req: NextRequest) {
    try {
        await verifyAdminJWT(req);
        const db = await getDb();
        const userid = req.nextUrl.searchParams.get('userid');
        if (!userid) {
            return NextResponse.json({ error: 'userid 파라미터가 필요합니다.' }, { status: 400 });
        }
        const [rows] = await db.query('SELECT userid FROM users WHERE userid=?', [userid]);
        const available = (rows as any).length === 0;
        return NextResponse.json({ available });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
