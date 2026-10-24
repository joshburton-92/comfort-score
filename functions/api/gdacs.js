// Cloudflare Pages Function — /api/gdacs?p=<path>
// Same-origin fallback for the app's tropical cyclone check, used only if the browser
// can't fetch GDACS directly. Passes through the two GDACS requests the app makes and
// nothing else, and lets Cloudflare cache them for 15 minutes.
const ALLOWED = [
  /^events\/geteventlist\/SEARCH\?eventlist=TC$/,
  /^polygons\/getgeometry\?eventtype=TC&eventid=\d+&episodeid=\d+$/,
];

export async function onRequestGet({ request }) {
  const p = new URL(request.url).searchParams.get("p") || "";
  if (!ALLOWED.some((re) => re.test(p))) {
    return new Response("Not allowed", { status: 400 });
  }
  const upstream = await fetch("https://www.gdacs.org/gdacsapi/api/" + p, {
    cf: { cacheTtl: 900, cacheEverything: true },
    headers: { Accept: "application/json" },
  });
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}
