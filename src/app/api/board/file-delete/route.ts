import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { verifyToken } from '@/lib/jwt';

export async function DELETE(request: Request) {
  try {
    // JWT 토큰 검증 (선택적)
    const cookie = request.headers.get('cookie');
    let isAuthenticated = false;
    
    if (cookie) {
      const match = cookie.match(/token=([^;]+)/);
      if (match) {
        const token = match[1];
        const payload = verifyToken(token);
        if (payload) {
          isAuthenticated = true;
        }
      }
    }
    
    // URL에서 파라미터 추출
    const { searchParams } = new URL(request.url);
    const fileUrl = searchParams.get('fileUrl');
    const board_id = searchParams.get('board_id');
    const post_id = searchParams.get('post_id');
    
    if (!fileUrl) {
      return NextResponse.json({ success: false, error: '파일 URL이 제공되지 않았습니다.' }, { status: 400 });
    }
    
    // DB에서 해당 게시글의 파일 목록 업데이트 처리
    if (board_id && post_id) {
      try {
        // pool을 가져오기 위해 db 모듈 가져오기
        const { getDb } = await import('@/lib/db');
        const db = await getDb();
        
        // 현재 게시글 정보 가져오기
        const tableName = `g5_write_${board_id}`;
        const [rows] = await db.query(`SELECT files FROM ${tableName} WHERE id = ?`, [post_id]);
        
        if (Array.isArray(rows) && rows.length > 0) {
          const post = rows[0] as any;
          let files = [];
          
          // 현재 저장된 파일 목록 가져오기
          try {
            files = typeof post.files === 'string' 
              ? JSON.parse(post.files) 
              : (Array.isArray(post.files) ? post.files : []);
          } catch (err) {
            files = [];
          }
          
          // 해당 URL을 가진 파일 제외
          const updatedFiles = files.filter((file: any) => {
            const url = file.downloadUrl || file.url || '';
            return url !== fileUrl;
          });
          
          // 업데이트된 파일 목록 저장
          await db.query(
            `UPDATE ${tableName} SET files = ? WHERE id = ?`,
            [JSON.stringify(updatedFiles), post_id]
          );
        }
      } catch (dbError) {
        console.error('DB 업데이트 오류:', dbError);
        // DB 오류가 있어도 파일 삭제는 시도
      }
    }
    
    // 실제 파일 삭제 처리 (옵션)
    // 파일 URL에서 파일 경로 추출 (예: /uploads/filename.jpg)
    try {
      const urlObj = new URL(fileUrl, 'http://example.com');
      const filePath = urlObj.pathname;
      
      // 상대 경로로 변환하여 파일 삭제 시도
      if (filePath.startsWith('/uploads/')) {
        const relativePath = path.join(process.cwd(), 'public', filePath);
        
        if (fs.existsSync(relativePath)) {
          fs.unlinkSync(relativePath);
        }
      }
    } catch (fileError) {
      console.error('파일 삭제 오류:', fileError);
      // 파일 삭제 실패해도 DB 업데이트는 성공한 것으로 간주
    }
    
    return NextResponse.json({ success: true });
  } catch (error: any) {
    console.error('파일 삭제 처리 오류:', error);
    return NextResponse.json({ success: false, error: error.message || '서버 오류' }, { status: 500 });
  }
}
