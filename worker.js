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
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    if (url.pathname === "/api/om") return handleOm(url, ctx);
    if (url.pathname === "/api/met") return handleMet(url, ctx);
    if (url.pathname === "/api/gdacs") return gdacs(url);
    return env.ASSETS.fetch(request); // everything else: the site's own files
  },
};
// ── Weather fallbacks for index.html ─────────────────────────────────────────
// /api/om?…   Open-Meteo forecast, same query string as the app sends, through Cloudflare
//             (helps when the visitor's own connection can't reach Open-Meteo). Cached 10 min.
// /api/met?lat=…&lon=…   MET Norway Locationforecast "complete" (free, CC BY 4.0). MET asks
//             every app to identify itself with a User-Agent and to cache until the Expires
//             time it sends, which browsers can't do properly — so it goes through here.
//             Coordinates are rounded to 2 decimals (about 1 km) so nearby visitors share
//             the cache.
const MET_UA = "ComfortScore/1.0 https://comfortscore.joshburton.au";
const UPSTREAM_TIMEOUT_MS = 12000;

async function handleOm(url, ctx) {
  const target = "https://api.open-meteo.com/v1/forecast" + url.search;
  return cachedJson(target, 600, {}, ctx);
}

async function handleMet(url, ctx) {
  const lat = Number(url.searchParams.get("lat"));
  const lon = Number(url.searchParams.get("lon"));
  if (!url.searchParams.get("lat") || !url.searchParams.get("lon") ||
      !isFinite(lat) || !isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    return jsonError(400, "lat and lon are required");
  }
  const target = "https://api.met.no/weatherapi/locationforecast/2.0/complete?lat=" +
    lat.toFixed(2) + "&lon=" + lon.toFixed(2);
  return cachedJson(target, null, { "User-Agent": MET_UA }, ctx);
}

// Fetch JSON through Cloudflare's cache. ttl in seconds, or null to follow the
// upstream Expires header (MET's rule), with a 1-minute floor.
async function cachedJson(target, ttl, headers, ctx) {
  const cache = caches.default;
  const key = new Request(target);
  const hit = await cache.match(key);
  if (hit) return hit;
  let r;
  try {
    r = await fetch(target, { headers, signal: AbortSignal.timeout(UPSTREAM_TIMEOUT_MS) });
  } catch (e) {
    return jsonError(504, "Upstream not responding");
  }
  if (!r.ok) return jsonError(r.status, "Upstream error " + r.status);
  let secs = ttl;
  if (secs == null) {
    const exp = Date.parse(r.headers.get("Expires") || "");
    secs = isFinite(exp) ? Math.max(60, Math.round((exp - Date.now()) / 1000)) : 1800;
  }
  const out = new Response(await r.text(), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=" + secs },
  });
  ctx.waitUntil(cache.put(key, out.clone()));
  return out;
}

function jsonError(status, reason) {
  return new Response(JSON.stringify({ error: true, reason }), {
    status, headers: { "Content-Type": "application/json", "Cache-Control": "no-store" },
  });
}
