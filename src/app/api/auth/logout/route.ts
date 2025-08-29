import { NextRequest, NextResponse } from 'next/server';

export async function POST(req: NextRequest) {
  // httpOnly 쿠키에서 토큰 및 사용자 데이터 삭제
  const res = NextResponse.json({ success: true });
  res.cookies.set('token', '', { httpOnly: true, path: '/', maxAge: 0 });
  res.cookies.set('user_data', '', { path: '/', maxAge: 0 });
  return res;
}
