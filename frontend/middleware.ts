import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export function middleware(request: NextRequest) {
  const token = request.cookies.get('access_token')?.value;

  // Vì matcher chỉ khớp với các private routes, bất kỳ request nào vào đây đều cần có token.
  if (!token) {
    return NextResponse.redirect(new URL('/login', request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    '/admin/:path*',
    '/dashboard/:path*',
    '/explore/:path*',
    '/practice/:path*',
    '/upload/:path*',
    '/welcome/:path*',
  ],
};
