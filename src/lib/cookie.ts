// 쿠키 관리 유틸리티 함수

/**
 * 쿠키 설정 함수
 * @param name 쿠키 이름
 * @param value 쿠키 값
 * @param days 유효 기간 (일)
 */
export function setCookie(name: string, value: string, days?: number): void {
  let expires = '';
  if (days) {
    const date = new Date();
    date.setTime(date.getTime() + (days * 24 * 60 * 60 * 1000));
    expires = `; expires=${date.toUTCString()}`;
  }
  document.cookie = `${name}=${value || ''}${expires}; path=/; SameSite=Strict; Secure`;
}

/**
 * 쿠키 값 가져오기 함수
 * @param name 쿠키 이름
 * @returns 쿠키 값 또는 빈 문자열
 */
export function getCookie(name: string): string {
  if (typeof window === 'undefined') return '';
  
  const value = `; ${document.cookie}`;
  const parts = value.split(`; ${name}=`);
  if (parts.length === 2) return parts.pop()?.split(';').shift() || '';
  return '';
}

/**
 * 쿠키 삭제 함수
 * @param name 삭제할 쿠키 이름
 */
export function removeCookie(name: string): void {
  document.cookie = `${name}=; Path=/; Expires=Thu, 01 Jan 1970 00:00:01 GMT; SameSite=Strict; Secure`;
}

/**
 * 사용자 정보를 쿠키에 저장 (인코딩 처리)
 * @param userData 저장할 사용자 정보 객체
 */
export function setUserCookie(userData: any): void {
  if (!userData) return;
  const encodedData = encodeURIComponent(JSON.stringify(userData));
  setCookie('user_data', encodedData, 1); // 1일 유효
}

/**
 * 쿠키에서 사용자 정보 가져오기 (디코딩 처리)
 * @returns 사용자 정보 객체 또는 null
 */
export function getUserCookie(): any {
  const encodedData = getCookie('user_data');
  if (!encodedData) return null;
  
  try {
    return JSON.parse(decodeURIComponent(encodedData));
  } catch (e) {
    console.error('사용자 정보 쿠키 파싱 오류:', e);
    return null;
  }
}
