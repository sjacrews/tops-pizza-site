// Cloudflare Pages middleware — runs on every request.
// Hard-redirect www.topspizza.ca -> apex (topspizza.ca), preserving path + query,
// so there is one canonical host (301). All other requests pass through untouched.
export async function onRequest(context) {
  const url = new URL(context.request.url);
  if (url.hostname.toLowerCase() === "www.topspizza.ca") {
    url.hostname = "topspizza.ca";
    url.protocol = "https:";
    return Response.redirect(url.toString(), 301);
  }
  return context.next();
}
