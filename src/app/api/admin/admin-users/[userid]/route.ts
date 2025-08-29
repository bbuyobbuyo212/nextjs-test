import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../../lib/db';
import { verifyAdminJWT } from '../../../../../lib/jwt';

export async function DELETE(req: NextRequest, { params }: { params: { userid: string } }) {
    try {
        await verifyAdminJWT(req);
        const db = await getDb();
        const { userid } = await params;
        if (!userid) {
            return NextResponse.json({ error: 'userid 파라미터가 필요합니다.' }, { status: 400 });
        }
        // 회원 존재 여부 확인
        const [rows] = await db.query('SELECT userid FROM users WHERE userid=?', [userid]);
        if ((rows as any).length === 0) {
            return NextResponse.json({ error: '존재하지 않는 회원입니다.' }, { status: 404 });
        }
        await db.query('DELETE FROM users WHERE userid=?', [userid]);
        return NextResponse.json({ success: true });
    } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 400 });
    }
}
