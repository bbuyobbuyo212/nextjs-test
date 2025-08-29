import { NextResponse } from 'next/server';

export async function POST() {
  // 로그용 더미 응답
  return NextResponse.json({ ok: true });
}
