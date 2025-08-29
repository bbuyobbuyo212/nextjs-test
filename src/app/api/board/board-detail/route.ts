import { NextResponse } from 'next/server';
import { getBoardDetail } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const board_id = searchParams.get('board_id') || '';
  const post_id = searchParams.get('post_id') || '';
  if (!board_id || !post_id) {
    return NextResponse.json({ success: false, error: '파라미터 누락', detail: null });
  }
  // 글 등록 화면(post_id가 'write')일 때 견고하게 빈 데이터 반환
  if (post_id === 'write') {
    return NextResponse.json({ success: true, detail: null });
  }
  try {
    const detail = await getBoardDetail({ board_id, post_id });
    if (!detail) {
      return NextResponse.json({ success: false, error: '게시글 없음', detail: null });
    }
    // 견고한 반환 구조: 댓글, 파일 등 포함
    return NextResponse.json({ success: true, detail });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'DB 오류', detail: null });
  }
}
