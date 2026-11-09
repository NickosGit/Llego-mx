import { NextResponse, type NextRequest } from "next/server";
import { TESTER_COOKIE, VISITOR_COOKIE, flashCookie, optOutCookie } from "@/lib/eventCookies";

// GET on purpose (a plain link). Linked with <a>, never <Link>, so nothing prefetches it.
export function GET(request: NextRequest) {
  const secure = process.env.NODE_ENV === "production";
  const response = NextResponse.redirect(new URL("/", request.url));
  for (const { name, value, options } of [optOutCookie(secure), flashCookie(secure)]) {
    response.cookies.set(name, value, options);
  }
  // Nothing left to count with: drop the random ids too.
  response.cookies.delete(VISITOR_COOKIE);
  response.cookies.delete(TESTER_COOKIE);
  return response;
}
