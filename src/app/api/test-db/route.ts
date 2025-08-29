import { NextResponse } from 'next/server';
const pool = require('@/lib/db');

export async function GET() {
  try {
  const conn = await pool.getConnection();
  const [rows] = await conn.query('SELECT 1 + 1 AS result');
  conn.release();
    return NextResponse.json({ success: true, result: rows[0].result });
  } catch (error: any) {
    return NextResponse.json({ success: false, error: error?.message || String(error) }, { status: 500 });
  }
}
