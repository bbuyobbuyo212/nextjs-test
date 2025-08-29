import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';

// 게시판 메타정보 API: board_id로 게시판명, 설명 등 반환
export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const board_id = searchParams.get('board_id');
  if (!board_id) {
    return NextResponse.json({ success: false, error: 'board_id 파라미터 누락' });
  }
  try {
    const db = await getDb();
    // type, skin, 기타 스킨 관련 정보 포함하여 조회
    const [rows] = await db.query('SELECT board_id, name, description, type, skin FROM boards_meta WHERE board_id = ?', [board_id]);
    const metaRows = rows as any[];
    if (!metaRows || metaRows.length === 0) {
      return NextResponse.json({ success: false, error: '해당 게시판 없음' });
    }
    return NextResponse.json({ success: true, ...metaRows[0] });
  } catch (err: any) {
    return NextResponse.json({ success: false, error: err.message });
  }
}
