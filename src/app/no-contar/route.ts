import { NextResponse, type NextRequest } from "next/server";
import { TESTER_COOKIE, VISITOR_COOKIE, flashCookie, optOutCookie } from "@/lib/eventCookies";

const PLAN_PARAMS = ["llegar", "sales", "dia", "limite"] as const;

// GET on purpose (a plain link). Linked with <a>, never <Link>, so nothing prefetches it.
export function GET(request: NextRequest) {
  const secure = process.env.NODE_ENV === "production";
  // Back to the same screen: keep the rider's choices (PERSONA_LOG W13 #11). Only the plan
  // params travel, never ?t=, and the redirect can't leave this site. The page re-validates them.
  const back = new URL("/", request.url);
  for (const key of PLAN_PARAMS) {
    const value = request.nextUrl.searchParams.get(key);
    if (value) back.searchParams.set(key, value);
  }
  const response = NextResponse.redirect(back);
  for (const { name, value, options } of [optOutCookie(secure), flashCookie(secure)]) {
    response.cookies.set(name, value, options);
  }
  // Nothing left to count with: drop the random ids too.
  response.cookies.delete(VISITOR_COOKIE);
  response.cookies.delete(TESTER_COOKIE);
  return response;
}
