import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

// Thay vì 'export default function', dùng cách này sẽ ổn định hơn với mọi phiên bản Next.js
export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;

  const isProtectedPath = request.nextUrl.pathname.startsWith('/dashboard');

  if (isProtectedPath && !token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

// Cấu hình matcher giữ nguyên
export const config = {
  matcher: ['/dashboard/:path*'],
};