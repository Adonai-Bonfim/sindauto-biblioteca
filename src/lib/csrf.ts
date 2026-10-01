export function allowFetchSite(site: string, request: Request): boolean {
  if (site === "same-origin") return true;
  if (site !== "none" && site !== "same-site") return false;
  const origin = new URL(request.url).origin;
  const supplied = request.headers.get("origin");
  if (supplied !== null) return supplied === origin;
  const referer = request.headers.get("referer");
  if (!referer) return false;
  try { return new URL(referer).origin === origin; }
  catch { return false; }
}
