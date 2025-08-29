import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { verifyAdminJWT } from '../../../../lib/jwt';

// 기존 게시판 테이블에 name, password, nickname 필드 추가하는 API
export async function POST(req: NextRequest) {
  try {
    // 관리자 권한 확인
    await verifyAdminJWT(req);
    const db = await getDb();
    
    // 게시판 목록 조회
    const [boards] = await db.query('SELECT id, board_id FROM boards_meta');
    const boardIds = (boards as any[]).map(b => b.board_id);
    
    const results: Record<string, string> = {};
    const errors: Record<string, string> = {};
    
    // 각 게시판 테이블에 필드 추가
    for (const boardId of boardIds) {
      const tableName = `g5_write_${boardId}`;
      
      try {
        // name 필드 추가
        await db.execute(`
          ALTER TABLE ${tableName}
          ADD COLUMN IF NOT EXISTS name VARCHAR(50) DEFAULT NULL
        `);
        
        // password 필드 추가
        await db.execute(`
          ALTER TABLE ${tableName}
          ADD COLUMN IF NOT EXISTS password VARCHAR(100) DEFAULT NULL
        `);
        
        // nickname 필드 추가
        await db.execute(`
          ALTER TABLE ${tableName}
          ADD COLUMN IF NOT EXISTS nickname VARCHAR(50) DEFAULT NULL
        `);
        
        results[tableName] = '성공적으로 필드가 추가되었습니다.';
      } catch (error: any) {
        errors[tableName] = error.message;
      }
    }
    
    return NextResponse.json({
      success: Object.keys(errors).length === 0,
      results,
      errors
    });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}
