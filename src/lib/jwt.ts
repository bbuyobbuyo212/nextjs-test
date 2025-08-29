import jwt from 'jsonwebtoken';
const JWT_SECRET = process.env.JWT_SECRET || 'mysecretkey';

export function verifyToken(token: string) {
  try {
    return jwt.verify(token, JWT_SECRET);
  } catch (err) {
    console.error('JWT 검증 에러:', err);
    return null;
  }
}

// NextRequest에서 httpOnly 쿠키에서 토큰 추출 후 검증
export async function verifyAdminJWT(req: any) {
  let token = '';
  // next/server의 NextRequest 쿠키 접근 방식
  if (req.cookies && typeof req.cookies.get === 'function') {
    // admin_token을 우선적으로 확인하고, 없으면 token 확인
    token = req.cookies.get('admin_token')?.value || req.cookies.get('token')?.value || '';
  } else if (req.cookies?.admin_token) {
    token = req.cookies.admin_token;
  } else if (req.cookies?.token) {
    token = req.cookies.token;
  } else if (req.headers?.get) {
    // fallback: 헤더에서 직접 추출
    const cookie = req.headers.get('cookie') || '';
    const adminMatch = cookie.match(/admin_token=([^;]+)/);
    if (adminMatch) token = adminMatch[1];
    else {
      const match = cookie.match(/token=([^;]+)/);
      if (match) token = match[1];
    }
  }
  console.log('[verifyAdminJWT] token:', token);
  if (!token) throw new Error('No token');
  const payload = verifyToken(token);
  console.log('[verifyAdminJWT] payload:', payload);
  if (!payload || ((payload as any).role !== 'admin' && (payload as any).role !== 'SUPER')) throw new Error('Unauthorized');
  return payload;
}
