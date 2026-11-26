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
    if (url.pathname === "/api/drivers") return handleDrivers(request, ctx);
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
// ── /api/drivers: latest climate-driver readings for the Learn tab ───────────────────
// Reads the agencies' own public data files, works out each driver's current phase and
// returns one small JSON object. Cached at Cloudflare for 6 hours, so the agencies see at
// most a few requests a day however many people open Learn. A source that fails is left
// out (null) and the app falls back to its built-in text for that driver.
//   ENSO: Bureau of Meteorology relative Niño3.4 (weekly) + NOAA CPC alert status and synopsis
//   IOD:  Bureau of Meteorology IOD index (weekly)
//   SAM, NAO, AO: NOAA CPC daily indices (7-day average)
//   CO2:  NOAA Global Monitoring Laboratory monthly Mauna Loa record (latest month + annual peak)
const DRV_UA = "ComfortScore/1.0 https://comfortscore.joshburton.au";
const DRV_TTL = 6 * 3600;
const DRV_SRC = {
  nino: "https://www.bom.gov.au/clim_data/IDCK000072/rnino_3.4.txt",
  iod: "https://www.bom.gov.au/clim_data/IDCK000072/iod_1.txt",
  cpc: "https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml",
  sam: "https://ftp.cpc.ncep.noaa.gov/cwlinks/norm.daily.aao.cdas.z700.19790101_current.csv",
  nao: "https://ftp.cpc.ncep.noaa.gov/cwlinks/norm.daily.nao.cdas.z500.19500101_current.csv",
  ao: "https://ftp.cpc.ncep.noaa.gov/cwlinks/norm.daily.ao.cdas.z1000.19500101_current.csv",
  co2: "https://gml.noaa.gov/webdata/ccgg/trends/co2/co2_mm_mlo.txt",
};

async function handleDrivers(request, ctx) {
  const cache = caches.default;
  const key = new Request("https://comfortscore.joshburton.au/api/drivers?v=2");
  const hit = await cache.match(key);
  if (hit) return hit;
  const get = (u) => fetch(u, { headers: { "User-Agent": DRV_UA }, signal: AbortSignal.timeout(12000) })
    .then((r) => (r.ok ? r.text() : null)).catch(() => null);
  const t = {};
  await Promise.all(Object.keys(DRV_SRC).map(async (k) => { t[k] = await get(DRV_SRC[k]); }));
  const out = {
    fetched: new Date().toISOString(),
    enso: drvEnso(t.nino, t.cpc),
    iod: drvWeekly(t.iod),
    sam: drvDaily(t.sam),
    nao: drvDaily(t.nao),
    ao: drvDaily(t.ao),
    co2: drvCo2(t.co2),
  };
  const any = out.enso || out.iod || out.sam || out.nao || out.ao || out.co2;
  const res = new Response(JSON.stringify(out), {
    headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=" + (any ? 3600 : 300) },
  });
  if (any) {
    const keep = new Response(JSON.stringify(out), {
      headers: { "Content-Type": "application/json", "Cache-Control": "public, max-age=" + DRV_TTL },
    });
    ctx.waitUntil(cache.put(key, keep));
  }
  return res;
}

// BOM weekly files: "20261116,20261122,0.53" per line (week start, week end, value)
function drvWeekly(txt) {
  try {
    if (!txt) return null;
    const rows = txt.trim().split(/\r?\n/).map((l) => l.trim().split(","))
      .filter((p) => p.length >= 3 && /^\d{8}$/.test(p[1]) && isFinite(parseFloat(p[2])));
    if (!rows.length) return null;
    const last = rows[rows.length - 1], prev = rows[Math.max(0, rows.length - 5)];
    const d = (s) => s.slice(0, 4) + "-" + s.slice(4, 6) + "-" + s.slice(6, 8);
    return { value: parseFloat(last[2]), date: d(last[1]), prev4: parseFloat(prev[2]) };
  } catch (e) { return null; }
}

// CPC daily CSVs: one day per line with the date and the index value last. Returns the
// average of the last 7 days, the latest daily value and its date.
function drvDaily(txt) {
  try {
    if (!txt) return null;
    const rows = [];
    for (const line of txt.trim().split(/\r?\n/)) {
      const m = line.match(/(\d{4})[-,\s\/]+(\d{1,2})[-,\s\/]+(\d{1,2})\b/);
      const nums = line.split(/[,\s]+/).filter((x) => x !== "");
      const v = parseFloat(nums[nums.length - 1]);
      if (!m || !isFinite(v) || Math.abs(v) > 10) continue;
      rows.push({ date: m[1] + "-" + m[2].padStart(2, "0") + "-" + m[3].padStart(2, "0"), v });
    }
    if (rows.length < 7) return null;
    const w = rows.slice(-7), avg = w.reduce((s, r) => s + r.v, 0) / 7;
    return { value: Math.round(avg * 100) / 100, daily: w[6].v, date: w[6].date };
  } catch (e) { return null; }
}

function drvEnso(ninoTxt, cpcHtml) {
  const n = drvWeekly(ninoTxt);
  let status = null, issued = null, synopsis = null;
  try {
    if (cpcHtml) {
      const txt = cpcHtml.replace(/<[^>]+>/g, " ").replace(/&nbsp;/g, " ").replace(/&ntilde;/g, "ñ").replace(/&amp;/g, "&").replace(/\s+/g, " ");
      const s = txt.match(/ENSO Alert System Status:\s*(.+?)\s+Synopsis:/i);
      if (s) status = s[1].trim().slice(0, 80);
      const d = txt.match(/issued by.*?(\d{1,2} (?:January|February|March|April|May|June|July|August|September|October|November|December) \d{4})/i);
      if (d) issued = d[1];
      const y = txt.match(/Synopsis:\s*(.+?\.)(?:\s|$)/);
      if (y) synopsis = y[1].trim().slice(0, 300);
    }
  } catch (e) {}
  if (!n && !status) return null;
  return Object.assign({}, n || {}, { status, issued, synopsis });
}

// NOAA GML monthly Mauna Loa CO2: "# ..." comment lines, then one month per line:
// year, month, decimal date, monthly average (ppm), deseasonalised, ... (-99.99 = missing).
// Returns the latest month, the same month a year earlier, and the annual peak (the highest
// month) of the latest year whose May–June peak has passed, plus the year before's peak.
function drvCo2(txt) {
  try {
    if (!txt) return null;
    const rows = [];
    for (const line of txt.split(/\r?\n/)) {
      if (!line.trim() || line.trim()[0] === "#") continue;
      const p = line.trim().split(/[\s,]+/);
      const y = +p[0], m = +p[1], v = +p[3];
      if (!(y > 1950 && m >= 1 && m <= 12 && v > 250 && v < 1000)) continue;
      rows.push({ y, m, v });
    }
    if (rows.length < 24) return null;
    const last = rows[rows.length - 1];
    const ym = (r) => r.y + "-" + String(r.m).padStart(2, "0");
    const ago = rows.find((r) => r.y === last.y - 1 && r.m === last.m);
    const py = last.m >= 7 ? last.y : last.y - 1;
    const top = (yr) => rows.filter((r) => r.y === yr).reduce((a, r) => (!a || r.v > a.v ? r : a), null);
    const pk = top(py), pp = top(py - 1);
    return {
      value: last.v, date: ym(last), yearAgo: ago ? ago.v : null,
      peak: pk ? pk.v : null, peakDate: pk ? ym(pk) : null, prevPeak: pp ? pp.v : null,
    };
  } catch (e) { return null; }
}