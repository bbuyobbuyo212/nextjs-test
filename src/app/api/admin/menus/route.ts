// 1분 캐시
let cachedMenus: any[] = [];
let cachedAt = 0;
const CACHE_TTL = 60 * 1000; // 1분
import { NextResponse } from 'next/server';
import pool from '@/lib/db';

export async function GET() {
  const now = Date.now();
  if (cachedMenus.length > 0 && now - cachedAt < CACHE_TTL) {
    return NextResponse.json({ success: true, menus: cachedMenus });
  }
  try {
    const conn = await pool.getConnection();
    try {
      const [rowsRaw] = await conn.query('SELECT id, name, url, parent_id FROM menus ORDER BY id ASC');
      const rows = rowsRaw as any[];
      // 1차/2차 메뉴 트리 구조로 변환
      const menuMap: Record<number, any> = {};
      const rootMenus: any[] = [];
      rows.forEach((row: any) => {
        menuMap[row.id] = { ...row, children: [] };
      });
      rows.forEach((row: any) => {
        if (row.parent_id) {
          if (menuMap[row.parent_id]) {
            menuMap[row.parent_id].children.push(menuMap[row.id]);
          }
        } else {
          rootMenus.push(menuMap[row.id]);
        }
      });
      cachedMenus = rootMenus;
      cachedAt = now;
      return NextResponse.json({
        success: true,
        menus: rootMenus
      });
    } finally {
      conn.release();
    }
  } catch (e) {
    return NextResponse.json({
      success: false,
      menus: [],
      error: '메뉴 데이터를 불러올 수 없습니다.'
    }, { status: 500 });
  }
}
