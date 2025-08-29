import { NextResponse } from 'next/server';
import { getBoardList } from '@/lib/db';

// 게시판 목록 API
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const board_id = searchParams.get('board_id') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const searchType = searchParams.get('searchType') || 'title';
  const searchKeyword = searchParams.get('searchKeyword') || '';

  // 입력값 검증
  if (!board_id) {
    return NextResponse.json({ success: false, error: 'board_id 파라미터 누락', boards: [], totalPages: 1 }, { status: 400 });
  }
  if (isNaN(page) || page < 1) {
    return NextResponse.json({ success: false, error: 'page 파라미터 오류', boards: [], totalPages: 1 }, { status: 400 });
  }
  if (!['title', 'content', 'author'].includes(searchType)) {
    return NextResponse.json({ success: false, error: 'searchType 파라미터 오류', boards: [], totalPages: 1 }, { status: 400 });
  }

  try {
    // DB에서 게시글 목록 조회
    const { boards, totalPages } = await getBoardList({
      board_id,
      page,
      searchType,
      searchKeyword,
    });
    return NextResponse.json({ success: true, boards, totalPages });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || 'DB 오류', boards: [], totalPages: 1 }, { status: 500 });
  }
}
