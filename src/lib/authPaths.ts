const PROTECTED_PATHS = ["/registrar", "/mis-viajes"];

export function isProtectedPath(pathname: string): boolean {
  return PROTECTED_PATHS.includes(pathname);
}

// Only our own pages: "next" arrives in the URL, so it must never send anyone off-site.
export function safeNext(next: string | string[] | null | undefined): string {
  return typeof next === "string" && isProtectedPath(next) ? next : "/registrar";
}
