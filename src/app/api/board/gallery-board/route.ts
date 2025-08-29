import { NextResponse } from 'next/server';
import { getGalleryBoardList } from '@/lib/db';

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const board_id = searchParams.get('board_id') || '';
  const page = parseInt(searchParams.get('page') || '1', 10);
  const searchType = searchParams.get('searchType') || '';
  const searchKeyword = searchParams.get('searchKeyword') || '';
  
  if (!board_id) {
    return NextResponse.json({ success: false, items: [], totalPages: 1, error: '파라미터 누락' });
  }
  
  try {
    const { items, totalPages } = await getGalleryBoardList({ 
      board_id, 
      page, 
      searchType, 
      searchKeyword 
    });
    
    return NextResponse.json({ 
      success: true, 
      items, 
      totalPages, 
      searchInfo: { searchType, searchKeyword } 
    });
    
  } catch (error: any) {
    console.error('갤러리 목록 조회 오류:', error);
    return NextResponse.json({ 
      success: false, 
      items: [], 
      totalPages: 1, 
      error: error?.message || 'DB 오류' 
    });
  }
}
