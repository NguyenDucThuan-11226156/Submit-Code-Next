import { NextResponse } from "next/server";

export function middleware(request) {
  const url = request.nextUrl.clone();
  const rewrites = [
    { path: "/submit-code", destination: "https://submit-code-next.vercel.app/" },
    // Các điều hướng khác...
  ];

  for (const { path, destination } of rewrites) {
    if (url.pathname.startsWith(path)) {
      return NextResponse.rewrite(
        `${destination}${url.pathname.replace(path, "")}${url.search}`
      );
    }
  }

  return NextResponse.next();
}
