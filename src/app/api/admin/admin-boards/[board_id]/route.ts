import { NextResponse } from 'next/server';
import { getDb } from '@/lib/db';

export async function GET(req: Request, context: { params: { board_id: string } }) {
  const { board_id } = await context.params;
  if (!board_id || board_id === 'undefined' || board_id === 'null' || board_id.trim() === '') {
    return NextResponse.json({ success: false, error: 'board_id 파라미터 누락 또는 잘못됨', data: null }, { status: 400 });
  }
  try {
    const db = await getDb();
    const [rows] = await db.query('SELECT * FROM boards_meta WHERE board_id = ?', [board_id]);
    const metaRows = rows as any[];
    if (!metaRows || metaRows.length === 0) {
      return NextResponse.json({ success: false, error: '게시판 없음', data: null });
    }
    return NextResponse.json({ success: true, data: metaRows[0] });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'DB 오류', data: null });
  }
}
