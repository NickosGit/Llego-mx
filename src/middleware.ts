import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";
import { isProtectedPath } from "@/lib/authPaths";
import {
  FLASH_COOKIE,
  NOCOUNT_COOKIE,
  VISITOR_COOKIE,
  visitorCookies,
  type CookieToSet,
} from "@/lib/eventCookies";

export async function middleware(request: NextRequest) {
  // Anonymous visitor + tester cookies. Set on the request too, so the page sees them
  // on the very first visit; set on the final response after the Supabase block.
  // /no-contar clears these cookies itself; setting them here would race with it.
  const optingOut = request.nextUrl.pathname === "/no-contar";
  const eventCookies = optingOut ? [] : visitorCookies({
    nocount: request.cookies.get(NOCOUNT_COOKIE)?.value,
    visitorId: request.cookies.get(VISITOR_COOKIE)?.value,
    testerParam: request.nextUrl.searchParams.get("t"),
    secure: process.env.NODE_ENV === "production",
    newId: () => crypto.randomUUID(),
  });
  eventCookies.forEach(({ name, value }) => request.cookies.set(name, value));
  // The one-time note after /no-contar: the page reads it now, the browser drops it.
  const hadFlash = request.cookies.has(FLASH_COOKIE);

  const finish = (res: NextResponse) => {
    eventCookies.forEach(({ name, value, options }: CookieToSet) =>
      res.cookies.set(name, value, options),
    );
    if (hadFlash) res.cookies.delete(FLASH_COOKIE);
    return res;
  };

  let response = NextResponse.next({ request });

  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) => request.cookies.set(name, value));
          response = NextResponse.next({ request });
          cookiesToSet.forEach(({ name, value, options }) =>
            response.cookies.set(name, value, options),
          );
        },
      },
    },
  );

  const {
    data: { user },
  } = await supabase.auth.getUser();

  const { pathname } = request.nextUrl;
  if (!user && isProtectedPath(pathname)) {
    const url = request.nextUrl.clone();
    url.pathname = "/entrar";
    url.search = `?next=${encodeURIComponent(pathname)}`;
    return finish(NextResponse.redirect(url));
  }

  return finish(response);
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
