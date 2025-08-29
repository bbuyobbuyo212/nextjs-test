import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { verifyAdminJWT } from '../../../../../lib/jwt';

export async function GET(req: NextRequest) {
    try {
        await verifyAdminJWT(req);
        const db = await getDb();
        const email = req.nextUrl.searchParams.get('email');
        if (!email) {
            return NextResponse.json({ error: 'email 파라미터가 필요합니다.' }, { status: 400 });
        }
        const [rows] = await db.query('SELECT email FROM users WHERE email=?', [email]);
        const available = (rows as any).length === 0;
        return NextResponse.json({ available });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
