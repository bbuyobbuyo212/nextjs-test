import { NextRequest, NextResponse } from 'next/server';
import { getDb } from '../../../../lib/db';
import { verifyAdminJWT } from '../../../../lib/jwt';

// 메뉴 테이블: id, name, link, visible, created_at

export async function GET(req: NextRequest) {
  try {
    await verifyAdminJWT(req);
    const db = await getDb();
  const [menus] = await db.query('SELECT id, name, url, parent_id, visible FROM menus');
    return NextResponse.json({ menus });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    await verifyAdminJWT(req);
    const db = await getDb();
    const body = await req.json();
    // menus 전체를 받아서 기존 메뉴 삭제 후 재삽입
    if (!Array.isArray(body.menus)) {
      return NextResponse.json({ error: 'menus 배열이 필요합니다.' }, { status: 400 });
    }
    await db.query('DELETE FROM menus');
    for (const menu of body.menus) {
      await db.query(
        'INSERT INTO menus (id, name, url, parent_id, visible) VALUES (?, ?, ?, ?, ?)',
        [menu.id, menu.name ?? '', menu.url ?? '', menu.parent_id ?? null, menu.visible ?? 1]
      );
      if (Array.isArray(menu.children)) {
        for (const child of menu.children) {
          await db.query(
            'INSERT INTO menus (id, name, url, parent_id, visible) VALUES (?, ?, ?, ?, ?)',
            [child.id, child.name ?? '', child.url ?? '', menu.id, child.visible ?? 1]
          );
        }
      }
    }
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function PUT(req: NextRequest) {
  try {
    await verifyAdminJWT(req);
    const db = await getDb();
    const body = await req.json();
  await db.query('UPDATE menus SET name=?, url=?, parent_id=?, visible=? WHERE id=?', [body.name, body.link, body.parent_id ?? null, body.visible, body.id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    await verifyAdminJWT(req);
    const db = await getDb();
    const { id } = await req.json();
    await db.query('DELETE FROM menus WHERE id=?', [id]);
    return NextResponse.json({ success: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message }, { status: 400 });
  }
}
