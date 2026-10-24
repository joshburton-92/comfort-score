// Cloudflare Worker for comfortscore.joshburton.au
// Serves the site's files as before, and adds one small endpoint:
//   /api/gdacs?p=<path>  — a same-origin pass-through to GDACS (tropical cyclones),
//   used by the app only if the browser can't fetch GDACS directly. It allows just the
//   two GDACS requests the app makes, and Cloudflare caches them for 15 minutes.
const ALLOWED = [
  /^events\/geteventlist\/SEARCH\?eventlist=TC$/,
  /^polygons\/getgeometry\?eventtype=TC&eventid=\d+&episodeid=\d+$/,
];

async function gdacs(url) {
  const p = url.searchParams.get("p") || "";
  if (!ALLOWED.some((re) => re.test(p))) {
    return new Response("Not allowed", { status: 400 });
  }
  let upstream;
  try {
    upstream = await fetch("https://www.gdacs.org/gdacsapi/api/" + p, {
      cf: { cacheTtl: 900, cacheEverything: true },
      headers: { Accept: "application/json" },
    });
  } catch (e) {
    return new Response("GDACS unavailable", { status: 502 });
  }
  return new Response(upstream.body, {
    status: upstream.status,
    headers: {
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "public, max-age=900",
    },
  });
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);
    if (url.pathname === "/api/gdacs") return gdacs(url);
    return env.ASSETS.fetch(request); // everything else: the site's own files
  },
};
