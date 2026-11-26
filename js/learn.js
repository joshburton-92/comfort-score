// Comfort Score · learn.js — the Learn tab: short lessons on how climate works
// Loaded by app.js the first time Learn opens (not listed in index.html). All names are global.
// Lessons are plain HTML. {t:25} is a temperature and {d:1.5} a temperature change: both follow the °C/°F switch.
// Images live in img/learn/. A missing image hides itself, so a lesson still reads well without it.
var LEARN_ASOF="24 November 2026";   // date of the "right now" driver status below
// ── Year facts: everything in the lessons that changes from one year to the next ──────
// Titles, the "Where we are" stats and the CO₂ figures all come from here, written into
// lessons as {F:name}. To roll over to a new year, update this block. After `review`, the
// lessons marked yr:1 show a notice that newer full-year figures are out, so nothing
// out of date passes as current. The CO₂ peak updates itself from NOAA via /api/drivers.
var LEARN_FACTS={
  year:"2026",                  // the year "Global warming in …" and "Where we are in …" describe
  asof:"24 November 2026",      // when the figures below were last checked
  review:"2027-01-20",          // from this date the update notice shows (full-year figures are out)
  lastYear:"2025",              // latest complete year with confirmed global figures
  lastAnom:"1.44",              // its global temperature above 1850–1900, °C (WMO)
  run:"2015–2025",run_n:"11",   // the run of years that are the warmest on record
  past12:"Nov 2025–Oct 2026",past12Anom:"1.51",  // latest 12 months (Copernicus)
  co2Peak:"432",co2PeakDate:"May 2026",co2Rise:"1.8"  // Mauna Loa annual peak, ppm
};
var LEARN_SETS=[
  {id:"basics",title:"The basics",blurb:"Weather, climate and how to read a place’s climate.",lessons:["weather-climate","what-shapes-climate","reading-climate"]},
  {id:"drivers",title:"Climate drivers",blurb:"The ocean and air patterns that push a season wetter, drier, hotter or colder.",lessons:["drivers-intro","enso","iod","sam","mjo","ridge","monsoon","itcz","jet","nao","ao","pdo","amv","amoc"]},
  {id:"warming",title:"Global warming in "+LEARN_FACTS.year,blurb:"Climate through deep time, what is changing now, how fast, and where we stand.",lessons:["deep-time","greenhouse","state-now","oceans-ice","tipping"]},
  {id:"extremes",title:"Extremes",blurb:"Heat, rain, drought and fire in a warming world.",lessons:["heatwaves","humid-heat","rain-floods","drought-fire"]},
  {id:"you",title:"What it means for you",blurb:"The hazards where you live, and what you can do about them.",lessons:["for-me","what-you-can-do"]}
];
// Right now, as reported by the agencies on LEARN_ASOF. Update by hand when the outlooks change.
var LEARN_NOW={
  enso:{phase:"El Niño",txt:"A strong to very strong El Niño is underway. Most models expect it to peak in December or January and to stay above El Niño levels into March–May 2027.",src:["Bureau of Meteorology — Climate driver update","https://www.bom.gov.au/climate/enso/"]},
  iod:{phase:"Positive",txt:"A positive Indian Ocean Dipole is underway but weakening. It is expected to return to neutral in December.",src:["Bureau of Meteorology — Climate driver update","https://www.bom.gov.au/climate/enso/"]},
  sam:{phase:"Positive",txt:"The SAM has been positive for most of November and is forecast to return to neutral.",src:["Bureau of Meteorology — Climate driver update","https://www.bom.gov.au/climate/enso/"]}
};
var S={ // sources used in more than one lesson
  bomDrivers:["Bureau of Meteorology — What are climate drivers?","https://beta.bom.gov.au/resources/learn-and-explore/climate-knowledge-centre/climate-drivers"],
  bomNow:["Bureau of Meteorology — Climate driver update (ENSO, IOD, SAM)","https://www.bom.gov.au/climate/enso/"],
  cpc:["NOAA Climate Prediction Center — ENSO diagnostic discussion","https://www.cpc.ncep.noaa.gov/products/analysis_monitoring/enso_advisory/ensodisc.shtml"],
  enosFaq:["NOAA Climate.gov — El Niño and La Niña: frequently asked questions","https://www.climate.gov/news-features/understanding-climate/el-nino-and-la-nina-frequently-asked-questions"],
  wmo25:["WMO — State of the Global Climate 2025","https://www.wmo.int/publication-series/state-of-global-climate/state-of-global-climate-2025"],
  wmoConf:["WMO — WMO confirms 2025 was one of warmest years on record","https://wmo.int/news/media-centre/wmo-confirms-2025-was-one-of-warmest-years-record"],
  c3s:["Copernicus Climate Change Service — Surface air temperature for October 2026","https://climate.copernicus.eu/surface-air-temperature-october-2026"],
  gml:["NOAA Global Monitoring Laboratory — Trends in atmospheric CO₂","https://gml.noaa.gov/ccgg/trends"],
  scripps:["Scripps Institution of Oceanography — Annual CO₂ peak reaches 432 ppm","https://today.ucsd.edu/story/annual-carbon-dioxide-peak-reaches-432-parts-per-million"],
  csiro:["CSIRO and Bureau of Meteorology — State of the Climate 2024","https://www.csiro.au/en/research/environmental-impacts/climate-change/State-of-the-Climate/Report-at-a-Glance"],
  bomAnn:["Bureau of Meteorology — Annual Climate Statement 2025","https://www.bom.gov.au/climate/current/annual/aus/"],
  bomJan26:["Bureau of Meteorology — Australia in January 2026","https://www.bom.gov.au/clim_data/IDCKGC1AR0/202601.summary.shtml"],
  nasaCauses:["NASA — The causes of climate change","https://science.nasa.gov/climate-change/causes/"],
  gtp:["Global Tipping Points Report 2025 (Stockholm Resilience Centre summary)","https://www.stockholmresilience.org/research/research-stories/2025-10-13-world-reaches-first-climate-tipping-point---widespread-mortality-of-coral-reefs.html"],
  hko:["Hong Kong Observatory — The monsoons and climate change","https://www.hko.gov.hk/en/education/weather/monsoons/00072-the-monsoons-and-climate-change.html"],
  metJet:["Met Office — What is the jet stream?","https://weather.metoffice.gov.uk/learn-about/weather/types-of-weather/wind/what-is-the-jet-stream"],
  polar:["NOAA Climate.gov — Understanding the Arctic polar vortex","https://climate.gov/news-features/understanding-climate/understanding-arctic-polar-vortex"],
  circ:["NOAA JetStream — Global atmospheric circulations","https://www.noaa.gov/jetstream/global-circulations"],
  wmoHeat:["WMO — Extreme heat","https://wmo.int/themes/extreme-heat"],
  bomHw:["Bureau of Meteorology — What is a heatwave?","https://www.bom.gov.au/resources/learn-and-explore/heatwave-knowledge-centre/what-is-a-heatwave"]
};
var LEARN={
/* ── The basics ─────────────────────────────────────────────────────────── */
"weather-climate":{title:"Weather vs climate",mins:2,
  lead:"Weather is what is happening now. Climate is the pattern you can expect, worked out from at least 30 years of weather.",
  body:`<p>A common way to put it: <b>climate is what you expect, weather is what you get.</b></p>
<h3>Weather</h3>
<p>Weather is the state of the air over minutes to weeks: temperature, rain, wind, cloud and humidity. It changes fast and can differ between suburbs a few kilometres apart.</p>
<h3>Climate</h3>
<p>Climate describes the typical weather of a place over a long time — usually 30 years or more. It isn’t only averages. It also covers the range: how hot the hottest days usually get, how often frost happens, how much the rainfall varies from year to year.</p>
<h3>Why 30 years?</h3>
<p>Thirty years is long enough to smooth out natural swings such as an El Niño or one unusually wet year. The World Meteorological Organization sets standard 30-year periods called <b>climate normals</b>. The current one is <b>1991–2020</b>, and it is updated every ten years so it stays relevant. The older 1961–1990 period is kept as a fixed yardstick for measuring long-term change.</p>
<h3>One day proves nothing</h3>
<p>A single cold snap doesn’t disprove global warming, and a single hot day doesn’t prove it. What matters is how the whole spread of weather shifts: more hot days, fewer cold nights, heavier downpours. That shift only shows up across many years.</p>
<div class="learn-tip"><b>In this app:</b> the <a href="#" onclick="setView('forecast');return false;">Forecast</a> tab is weather. The <a href="#climate" onclick="setView('climate');return false;">Climate</a> tab is climate — 30-year normals for each place.</div>`,
  sources:[["NOAA NESDIS — What’s the difference between weather and climate?","https://www.nesdis.noaa.gov/about/k-12-education/understanding-our-planet/whats-the-difference-between-weather-and-climate"],["NASA Climate Kids — Weather vs climate","https://climatekids.nasa.gov/weather-climate"],["WMO — It’s warmer than average. But what is average?","https://wmo.int/media/news/its-warmer-average-what-average"],["WMO — Updated 30-year reference period reflects changing climate","https://wmo.int/media/news/updated-30-year-reference-period-reflects-changing-climate"]]},

"what-shapes-climate":{title:"What shapes a place’s climate",mins:3,
  lead:"Five things set the basic climate of anywhere on Earth: latitude, the sea, height, mountains and the global wind belts.",
  body:`<h3>1. Latitude</h3>
<p>Near the equator the sun is high all year, so it is warm all year. Further towards the poles the sun’s angle changes a lot between seasons, so summers and winters differ more.</p>
<h3>2. Distance from the sea</h3>
<p>Water heats and cools slowly, so the sea evens out temperatures. Honolulu and Hong Kong are at similar latitudes, but Honolulu sits in the middle of the Pacific. Its winter days still average about {t:27}; Hong Kong, on the edge of a huge continent, drops to about {t:19}.</p>
<h3>3. Height</h3>
<p>Air cools as it rises, roughly 6–7 degrees Celsius for every 1,000 m. Singapore and Nairobi are both almost on the equator, but Nairobi sits about 1,700 m higher. Singapore’s warmest-month days average about {t:32}; Nairobi’s about {t:27}.</p>
<h3>4. Mountains and prevailing winds</h3>
<p>Moist wind forced up a range drops its rain on the windward side, leaving a dry <b>rain shadow</b> behind. Vancouver gets about 1,255 mm a year; Calgary, on the other side of the Rockies, about 445 mm.</p>
<h3>5. The global wind belts</h3>
<p>Hot air rises near the equator, dropping heavy rain, then sinks around 30° north and south. Sinking air is dry, which is why so many of the world’s great deserts sit near those latitudes. Cold ocean currents add to the effect: Antofagasta, on Chile’s coast, gets about 4 mm of rain a year.</p>
<p>These five set the <i>average</i> climate. <a href="#learn/drivers-intro" onclick="learnGo('drivers-intro');return false;">Climate drivers</a> then push individual seasons and years away from that average.</p>`,
  sources:[S.circ,["Met Office — Global circulation patterns","https://metoffice.gov.uk/learning/atmosphere/global-circulation-patterns"],S.hko,["Comfort Score climate data (1991–2020 normals) for the example places","https://comfortscore.joshburton.au/#climate"]]},
"reading-climate":{title:"Reading the Climate tab",mins:3,
  lead:"How to read the normals, climate types and “warmer than usual” alerts you see in this app.",
  body:`<h3>Normals</h3>
<p>The monthly figures are 30-year averages. “Average max” is the typical daytime high for that month, not the hottest day. Rainfall is the average total for the month in mm. A month can easily come in at half or double its average rainfall and still be normal.</p>
<h3>Hottest days and coldest nights</h3>
<p>These show how far the extremes usually reach in a typical year. They tell you more about comfort and risk than averages do: two places with the same average can have very different heat extremes.</p>
<h3>Köppen climate types</h3>
<p>The Köppen system sorts climates into groups using temperature and rainfall by month. It was designed to match natural vegetation, so places with the same code tend to look and feel alike. The first letter is the main group:</p>
<ul><li><b>A</b> — tropical: warm all year</li><li><b>B</b> — dry: deserts and semi-arid steppe</li><li><b>C</b> — temperate: mild winters (Mediterranean, oceanic, humid subtropical)</li><li><b>D</b> — continental: cold, snowy winters</li><li><b>E</b> — polar and alpine</li></ul>
<p>Climate types are moving as the world warms. Between 1901–1930 and 1991–2020, about 5% of the world’s land (outside Antarctica) shifted to a different main Köppen group.</p>
<h3>“Warmer than usual”</h3>
<p>Alerts in the Forecast tab compare the coming days with the normal for that place and that time of year. That is why {t:30} counts as unusual in one town and routine in another.</p>`,
  sources:[["Beck et al. (2023) — High-resolution Köppen-Geiger maps for 1901–2099, Scientific Data","https://doi.org/10.1038/s41597-023-02549-6"],["NOAA NCEI — WMO climate normals","https://ncei.noaa.gov/products/wmo-climate-normals"],["WMO — It’s warmer than average. But what is average?","https://wmo.int/media/news/its-warmer-average-what-average"]]},

/* ── Climate drivers ────────────────────────────────────────────────────── */
"drivers-intro":{title:"What are climate drivers?",mins:2,
  lead:"Large patterns in the ocean and the air that tilt the odds towards a wetter, drier, hotter or colder season.",
  body:`<p>A climate driver is a pattern that swings between phases — for example warmer or cooler sea in one part of an ocean, or winds that shift north or south. Each phase makes some kinds of weather more likely in certain regions.</p>
<h3>They work on different timescales</h3>
<ul><li><b>Weeks:</b> the Madden–Julian Oscillation, the Southern Annular Mode and the North Atlantic Oscillation.</li><li><b>Seasons to a year:</b> El Niño and La Niña, the Indian Ocean Dipole.</li><li><b>Decades:</b> the Pacific Decadal Oscillation and Atlantic Multidecadal Variability.</li></ul>
<h3>They shift the odds, not the outcome</h3>
<p>Drivers can strengthen or cancel each other, and no two events are the same. An El Niño makes a dry season more likely in some places, but it doesn’t guarantee one. Seasonal outlooks from your national weather service combine all of this, so they are the best guide to the months ahead.</p>
<h3>Climate change sits underneath</h3>
<p>Drivers move the weather around a baseline. Global warming is moving the baseline itself, so a “cool” La Niña year now is warmer than an average year was a few decades ago.</p>`,
  sources:[S.bomDrivers,["Bureau of Meteorology — Factors in Australia’s weather and climate","https://www.bom.gov.au/resources/learn-and-explore/climate-knowledge-centre/climate-factors"],S.enosFaq]},

"enso":{yr:1,title:"El Niño and La Niña",mins:3,now:"enso",
  lead:"A see-saw of warm and cool water across the tropical Pacific that shifts rain and heat around much of the world.",
  body:`<p>The El Niño–Southern Oscillation (ENSO) has three states. It changes the trade winds, the temperature of the tropical Pacific and where the big tropical storm clouds form.</p>
<figure class="learn-fig" data-img="enso-neutral.jpg"><figcaption><b>Neutral.</b> Trade winds blow east to west, piling warm water near Indonesia and Australia, where air rises and rain falls. <span class="learn-credit">NOAA Climate.gov drawing by Fiona Martin</span></figcaption></figure>
<figure class="learn-fig" data-img="el-nino.jpg"><figcaption><b>El Niño.</b> The trade winds weaken and warm water spreads east. Rain follows it into the central and eastern Pacific. <span class="learn-credit">NOAA Climate.gov drawing by Fiona Martin</span></figcaption></figure>
<figure class="learn-fig" data-img="la-nina.jpg"><figcaption><b>La Niña.</b> The trade winds strengthen, the western Pacific gets warmer still, and the east cools. <span class="learn-credit">NOAA Climate.gov drawing by Fiona Martin</span></figcaption></figure>
<h3>Typical effects</h3>
<ul><li><b>El Niño:</b> often drier in eastern Australia, Indonesia, southern Africa and India’s monsoon; often wetter in Peru, Ecuador and the southern United States. Global temperatures tend to spike during and just after it.</li><li><b>La Niña:</b> roughly the reverse. Often wetter in eastern Australia and South-East Asia; often drier in the southern United States and the Horn of Africa.</li></ul>
<p>Events usually build from the middle of the year, peak around December and fade by the following March–May. They come every two to seven years.</p>
<h3>2026–27: an exceptional El Niño</h3>
<p>Copernicus reported the central Pacific in October 2026 at its warmest on record, {d:3.21} above average. NOAA rated a <b>historically strong event</b> (stronger than any since 1950) as likely by late 2026. Because El Niño releases ocean heat into the air, scientists warned that 2027 was at real risk of becoming the hottest year on record.</p>`,
  sources:[S.enosFaq,S.bomNow,S.cpc,S.c3s]},

"iod":{title:"Indian Ocean Dipole",mins:2,now:"iod",
  lead:"The Indian Ocean’s own see-saw, between its warm western side near Africa and its eastern side near Indonesia.",
  body:`<figure class="learn-fig" data-img="iod-positive.jpg"><figcaption><b>Positive IOD.</b> Cooler water off Indonesia, warmer water off Africa. Rain shifts west. <span class="learn-credit">Drawing by NOAA Climate.gov</span></figcaption></figure>
<figure class="learn-fig" data-img="iod-negative.jpg"><figcaption><b>Negative IOD.</b> Warmer water off Indonesia and north-west Australia. Rain shifts east. <span class="learn-credit">Drawing by NOAA Climate.gov</span></figcaption></figure>
<h3>Typical effects</h3>
<ul><li><b>Positive:</b> drier winters and springs across southern and central Australia and Indonesia, with higher fire danger; wetter in East Africa.</li><li><b>Negative:</b> wetter winters and springs across much of Australia; drier in East Africa.</li></ul>
<p>The IOD usually develops in May–June, peaks in spring (September–November) and breaks down by early summer, when the monsoon arrives. A positive IOD alongside El Niño — as in 2026 — doubles the push towards dry conditions in Australia.</p>`,
  sources:[["Bureau of Meteorology — Indian Ocean Dipole","https://www.bom.gov.au/resources/learn-and-explore/climate-knowledge-centre/climate-drivers/indian-ocean-dipole"],S.bomNow,["NOAA Climate.gov — Meet ENSO’s cousin, the Indian Ocean Dipole","https://www.climate.gov/news-features/blogs/enso/meet-enso%E2%80%99s-cousin-indian-ocean-dipole"]]},

"sam":{title:"Southern Annular Mode",mins:2,now:"sam",
  lead:"The north–south shuffle of the westerly winds and cold fronts that circle Antarctica.",
  body:`<p>A belt of strong westerly winds — the Roaring Forties and Furious Fifties — circles the Southern Ocean, carrying cold fronts and storms. The Southern Annular Mode (SAM), also called the Antarctic Oscillation, describes this belt sliding towards or away from Antarctica.</p>
<ul><li><b>Positive SAM:</b> the westerlies contract towards Antarctica. In winter that means fewer cold fronts and drier weather in southern Australia, New Zealand’s north and southern South America. In summer it can bring more rain to eastern Australia.</li><li><b>Negative SAM:</b> the westerlies expand towards the equator. More cold fronts, rain and cold outbreaks reach southern Australia and New Zealand’s south and west in winter.</li></ul>
<p>A SAM event usually lasts one to two weeks, so it matters more for the next fortnight than the next season. Over recent decades the SAM has spent more time positive, partly because of the ozone hole and greenhouse gases — one reason winter rain has declined in southern Australia.</p>`,
  sources:[["Bureau of Meteorology — Southern Annular Mode","https://www.bom.gov.au/resources/learn-and-explore/climate-knowledge-centre/climate-factors/southern-annular-mode"],["Bureau of Meteorology — Southern Annular Mode and the Australian climate","https://www.bom.gov.au/climate/sam/"],S.bomNow]},

"mjo":{title:"Madden–Julian Oscillation",mins:2,
  lead:"A pulse of cloud and rain that travels east around the tropics every 30–60 days.",
  body:`<p>The MJO is a large area of extra cloud and thunderstorms, with a drier, clearer area on either side, that moves eastward along the equator. It is most obvious over the Indian Ocean and the western Pacific, then fades over the cooler eastern Pacific before reappearing in the Indian Ocean.</p>
<h3>Why it matters</h3>
<ul><li>It sets the timing of wet bursts and dry breaks in the Indian, Australian and other monsoons.</li><li>Tropical cyclones are more likely to form near the active, cloudy part of the pulse.</li><li>It can nudge weather outside the tropics too, including heavy rain events and cold outbreaks weeks later.</li></ul>
<p>The MJO works on a timescale of weeks, between day-to-day weather and seasonal drivers such as ENSO. Forecasters use it for outlooks two to four weeks ahead.</p>`,
  sources:[["Bureau of Meteorology — Madden–Julian Oscillation","https://www.bom.gov.au/resources/learn-and-explore/climate-knowledge-centre/climate-factors/madden-julian-oscillation"],["Met Office — What is the Madden-Julian Oscillation?","https://metoffice.gov.uk/learning/atmosphere/madden-julian-oscillation"],["NOAA Physical Sciences Laboratory — MJO","https://www.psl.noaa.gov/mjo/index.html"]]},

"ridge":{title:"The subtropical ridge",mins:2,
  lead:"A belt of high pressure around 30° north and south that brings settled, dry weather.",
  body:`<p>Air that rises near the equator sinks again around 30° north and south. Sinking air warms and dries out, so these latitudes are dominated by high-pressure systems and clear skies. In the Southern Hemisphere the chain of highs is called the <b>subtropical ridge</b>; in the North Atlantic, its best-known member is the <b>Azores High</b>.</p>
<h3>It moves with the seasons</h3>
<p>The ridge follows the sun. In summer it moves towards the pole, blocking cold fronts, so Mediterranean-type climates such as southern Australia, California, Cape Town, central Chile and the Mediterranean itself are hot and dry. In winter it moves towards the equator and lets the rain-bearing fronts through.</p>
<h3>A stronger ridge in a warmer world</h3>
<p>The ridge has strengthened and expanded over recent decades as the tropics widen. That keeps more cold fronts away from places on its poleward edge in the cooler months — one cause of the long-term decline in winter rain in southern Australia and other Mediterranean-type climates.</p>`,
  sources:[["Bureau of Meteorology — Subtropical ridge","https://www.bom.gov.au/resources/learn-and-explore/climate-knowledge-centre/climate-factors/subtropical-ridge"],S.circ,["Met Office — What is the Azores High?","https://www.metoffice.gov.uk/blog/2025/what-is-the-azores-high"],S.csiro]},

"monsoon":{title:"Monsoons",mins:3,
  lead:"A seasonal reversal of the winds that brings a wet summer and a dry winter to much of the tropics.",
  body:`<p>In summer, land heats faster than the sea. Air over the land rises, pulling in moist air from the ocean, and it rains. In winter the land cools faster and the flow reverses, bringing dry air off the continent. That is a monsoon.</p>
<h3>The world’s monsoons</h3>
<ul><li><b>South Asian:</b> normally reaches Kerala, in India’s south-west, around 1 June and covers the country by early July. It brings most of India’s yearly rain.</li><li><b>East Asian:</b> warm, humid south-west winds in summer and the dry north-east monsoon in winter, felt from southern China to Japan. The Himalayas and Tibetan Plateau shape it.</li><li><b>Australian:</b> usually starts around late December near Darwin, with about three active bursts each wet season, separated by drier “breaks”.</li><li><b>West African and North American:</b> summer rains over the Sahel and the south-western United States and Mexico.</li></ul>
<h3>What pushes them around</h3>
<p>La Niña tends to bring an earlier, wetter Australian monsoon; El Niño often weakens the Indian and Australian monsoons. The <a href="#learn/mjo" onclick="learnGo('mjo');return false;">MJO</a> sets the timing of the bursts and breaks.</p>`,
  sources:[["Bureau of Meteorology — Monsoon","https://www.bom.gov.au/resources/learn-and-explore/climate-knowledge-centre/climate-factors/monsoon"],S.hko,["Hong Kong Observatory — Why the winter monsoon in Hong Kong is called the northeast monsoon","https://www.hko.gov.hk/en/education/weather/meteorology-basics/00068-why-the-winter-monsoon-in-hong-kong-is-generally-called-the-northeast-monsoon.html"],["NOAA Climate.gov — Annual migration of the tropical rain belt","https://www.climate.gov/news-features/understanding-climate/annual-migration-tropical-rain-belt"]]},

"itcz":{title:"The tropical rain belt (ITCZ)",mins:2,
  lead:"A band of thunderstorms circling the Earth near the equator, where the trade winds meet.",
  body:`<p>The north-east and south-east trade winds converge near the equator and force the air upwards. The result is the Intertropical Convergence Zone (ITCZ): a band of towering thunderstorms, some topping 16 km, visible from space as a line of cloud around the planet.</p>
<h3>It follows the sun</h3>
<p>The ITCZ drifts north in the northern summer and south in the southern summer, further over land than over the ocean. That migration creates the wet and dry seasons of much of the tropics: places near the equator can get two rainy seasons a year as it passes over twice, places at its edges get one.</p>
<h3>Its relatives</h3>
<p>In the south-west Pacific a branch called the <b>South Pacific Convergence Zone</b> stretches from Papua New Guinea towards Fiji and Samoa. ENSO shifts it: El Niño pulls it north-east, La Niña south-west, changing which islands get the rain.</p>`,
  sources:[["Met Office — Intertropical Convergence Zone","https://weather.metoffice.gov.uk/learn-about/weather/atmosphere/intertropical-convergence-zone"],["NOAA JetStream — Inter-Tropical Convergence Zone","https://www.noaa.gov/jetstream/tropical/convergence-zone"],["NOAA Climate.gov — Annual migration of the tropical rain belt","https://www.climate.gov/news-features/understanding-climate/annual-migration-tropical-rain-belt"]]},

"jet":{title:"The jet stream",mins:2,
  lead:"A fast river of air, 8–11 km up, that steers storms across the middle latitudes.",
  body:`<p>The jet stream forms where cold polar air meets warmer air from the tropics. The bigger the temperature difference, the faster it blows — sometimes over 320 km/h. Storms and cold fronts tend to form along it and follow it, from west to east.</p>
<h3>Straight or wavy</h3>
<ul><li>A <b>strong, straight jet</b> sends a conveyor belt of storms: windy, wet and mild in winter.</li><li>A <b>slow, wavy jet</b> lets high pressure stall in one place. That can mean days of settled weather — or a stuck heatwave, a long cold spell, or rain falling on the same area day after day.</li></ul>
<p>The jet is strongest in winter, when the gap between pole and tropics is biggest, and moves towards the pole in summer. Each hemisphere has its own.</p>`,
  sources:[S.metJet,["Met Office — What is the jet stream and how does it affect our weather?","https://www.metoffice.gov.uk/blog/2025/what-is-the-jet-stream-and-how-does-it-affect-our-weather"],S.circ]},

"nao":{title:"North Atlantic Oscillation",mins:2,now:"nao",
  lead:"A pressure see-saw between Iceland and the Azores that sets the tone of Europe’s winters.",
  body:`<figure class="learn-fig" data-img="nao.jpg"><figcaption>How pressure near Iceland (low) and the Azores (high) changes between the two phases. <span class="learn-credit">Schematic adapted from AIRMAP by Ned Gardiner and David Herring, NOAA</span></figcaption></figure>
<p>The NAO measures the difference in air pressure between the Icelandic Low and the Azores High. That difference controls how strongly the westerly winds blow across the Atlantic into Europe.</p>
<ul><li><b>Positive NAO:</b> a big pressure difference and strong westerlies. Northern Europe gets mild, wet and stormy winters; southern Europe and the Mediterranean stay drier. Eastern North America is often milder.</li><li><b>Negative NAO:</b> a weak pressure difference. The westerlies stall, letting cold air spill into northern Europe and eastern North America, while storms track further south into Spain and the Mediterranean.</li></ul>
<p>The NAO is strongest in winter and can flip within weeks. Unlike ENSO, it can’t usually be predicted more than a week or two ahead, although seasonal forecasts have some skill.</p>`,
  sources:[["NOAA Climate.gov — Climate variability: North Atlantic Oscillation","https://climate.gov/news-features/understanding-climate/climate-variability-north-atlantic-oscillation"],["Met Office — The North Atlantic Oscillation","https://www.metoffice.gov.uk/research/climate/seasonal-to-decadal/gpc-outlooks/ens-mean/nao-description"],["Deutscher Wetterdienst (via wetterdienst.de) — Die Nordatlantische Oszillation und ihr Einfluss auf den Winter","https://www.wetterdienst.de/Deutschlandwetter/Thema_des_Tages/477/die-nordatlantische-oszillation-und-ihr-einfluss-auf-den-winter"],["NOAA NCEI — North Atlantic Oscillation","https://www.ncei.noaa.gov/access/monitoring/nao/"]]},

"ao":{title:"Arctic Oscillation and the polar vortex",mins:2,now:"ao",
  lead:"How tightly the coldest air is locked up over the Arctic — and what happens when it escapes.",
  body:`<figure class="learn-fig" data-img="polar-vortex.jpg"><figcaption>A strong vortex keeps the coldest air in the Arctic. When it weakens or splits, the jet stream turns wavy and polar air can sink south. <span class="learn-credit">NOAA Climate.gov graphic, adapted from original by NOAA</span></figcaption></figure>
<p>Every winter a ring of strong westerly winds forms about 16–48 km above the North Pole: the <b>polar vortex</b>. It sits far above the weather, but it influences the jet stream below.</p>
<p>The <b>Arctic Oscillation (AO)</b> is its fingerprint at ground level — air pressure sloshing between the Arctic and the middle latitudes.</p>
<ul><li><b>Positive AO:</b> a strong vortex and a tight jet. The cold stays north; Europe, North America and East Asia tend to get milder winters.</li><li><b>Negative AO:</b> a weak or disrupted vortex and a wavy jet. Arctic air breaks out into the mid-latitudes, bringing cold snaps and snow, while the Arctic itself can be unusually warm.</li></ul>
<p>A sudden disruption of the vortex happens about every other year and can lead to severe cold outbreaks weeks later, although many cold spells happen without one.</p>`,
  sources:[S.polar,["NOAA Climate.gov — How is the polar vortex related to the Arctic Oscillation?","https://www.climate.gov/news-features/event-tracker/how-polar-vortex-related-arctic-oscillation"]]},

"pdo":{title:"Pacific Decadal Oscillation",mins:2,
  lead:"A slow, El Niño-like pattern in the North Pacific that can tilt the odds for a decade or more.",
  body:`<p>The PDO describes a long-lived pattern of sea temperatures across the North Pacific. In its <b>positive (warm)</b> phase, a band of warm water runs along the west coast of North America with cooler water in the central North Pacific. The <b>negative (cool)</b> phase is the reverse.</p>
<p>Phases can last for years to decades. A positive PDO tends to boost El Niño’s effects and a negative PDO La Niña’s, which matters for rainfall and fisheries from Alaska to California, and for droughts and floods across the Pacific, including Australia and New Zealand (where scientists often use the related Interdecadal Pacific Oscillation, or IPO).</p>
<p>The PDO isn’t one single process. It is the combined result of ENSO, the strength of the Aleutian Low and heat stored in the ocean. Recent research finds that steady warming of the whole North Pacific now outweighs the PDO’s own swings in many places.</p>`,
  sources:[["NOAA NCEI — Pacific Decadal Oscillation","https://www.ncei.noaa.gov/access/monitoring/pdo/"],["NOAA Climate.gov — Going out for ice cream: a first date with the PDO","https://www.climate.gov/news-features/blogs/enso/going-out-ice-cream-first-date-pacific-decadal-oscillation"],["NOAA Institutional Repository — Pan-basin warming now overshadows robust PDO (Nature Climate Change, 2025)","https://repository.library.noaa.gov/view/noaa/72194"]]},

"amv":{title:"Atlantic Multidecadal Variability",mins:2,
  lead:"A slow warming and cooling of the North Atlantic over 60–80 years.",
  body:`<p>Atlantic Multidecadal Variability (AMV), also called the Atlantic Multidecadal Oscillation (AMO), describes long swings in North Atlantic sea temperatures that last decades.</p>
<ul><li><b>Warm phases</b> are linked to more active Atlantic hurricane seasons, more summer rain in the Sahel and India, and hotter, drier summers in parts of North America.</li><li><b>Cool phases</b> tend to bring the opposite.</li></ul>
<p>How much of the AMV is natural is debated: changes in air pollution and greenhouse gases have shaped the North Atlantic’s temperature too. Either way, it now rides on top of a warming ocean, and North Atlantic temperatures have been at or near record levels in recent years.</p>`,
  sources:[["Met Office Hadley Centre — Climate modes (ENSO, NAO, AMV)","https://hadleyserver.metoffice.gov.uk/monitoring/climate_modes.html"],S.wmo25]},

"amoc":{title:"The Atlantic overturning and the Gulf Stream",mins:3,
  lead:"A slow ocean conveyor carries tropical heat north through the Atlantic, sinks near Greenland and returns south in the deep. It is weakening.",
  body:`<h3>How it works</h3>
<p>The <b>Atlantic Meridional Overturning Circulation (AMOC)</b> is a loop. Warm, salty surface water flows north from the tropics — the <b>Gulf Stream</b> is its fastest stretch, running from the Gulf of Mexico across the Atlantic towards Europe. On the way it gives up its heat to the air.</p>
<p>By the time it reaches the seas around Greenland and Norway the water is cold, salty and heavy, so it <b>sinks</b> to the ocean floor. This becomes North Atlantic Deep Water, which creeps south along the bottom of the Atlantic. Much of it is eventually brought back to the surface — <b>upwelling</b> — in the Southern Ocean, pulled up by the strong westerly winds around Antarctica, and the loop starts again. One trip takes centuries.</p>
<h3>Why it matters</h3>
<p>The heat it carries north is why north-west Europe is far milder than places at the same latitude in Canada. It also helps decide where the tropical rain belt sits and draws carbon dioxide down into the deep ocean.</p>
<h3>The Gulf Stream won’t simply stop</h3>
<p>The Gulf Stream is driven mainly by the winds, so it will keep flowing. What can weaken is the overturning — the sinking in the far north that pulls warm water up the Atlantic.</p>
<h3>What is happening now</h3>
<p>Warming and meltwater from Greenland make North Atlantic surface water warmer and fresher, so it is lighter and sinks less readily. A patch of ocean south of Greenland has stayed cool while the rest of the world’s oceans warm — one sign the AMOC is weakening.</p>
<ul><li>The IPCC judged that weakening by 2100 is very likely, with medium confidence that it won’t collapse this century.</li><li>A 2025 Met Office and University of Exeter study found collapse this century unlikely because Southern Ocean winds keep the loop going — but a big weakening very likely.</li><li>Other researchers think it is closer to a tipping point than models suggest. In November 2025 Iceland’s government declared the risk of an AMOC shutdown a national security threat.</li></ul>
<h3>If it did collapse</h3>
<p>North-west Europe would face much colder winters even in a warmer world, sea level would rise faster along North America’s east coast, and tropical rain belts would shift south — disrupting the monsoons of West Africa and South Asia.</p>`,
  sources:[["Met Office — The Atlantic Meridional Overturning Circulation in a changing climate","https://www.metoffice.gov.uk/blog/2024/the-atlantic-meridional-overturning-circulation-in-a-changing-climate"],["Met Office — Climate change: AMOC likely to withstand future warming (2025)","https://www.metoffice.gov.uk/about-us/news-and-media/media-centre/weather-and-climate-news/2025/climate-change-amoc-likely-to-withstand-future-warming"],["Carbon Brief — AMOC explainer","https://interactive.carbonbrief.org/amoc-explainer/"],["Yale Environment 360 — The AMOC and climate change","https://e360.yale.edu/features/amoc-climate-change"]]},
/* ── Global warming (year-specific figures come from LEARN_FACTS) ──────────── */
"deep-time":{title:"Climate through deep time",mins:3,
  lead:"Earth’s climate has swung between ice ages and hothouses. What is different now is the speed.",
  body:`<h3>How we know</h3>
<p>Before thermometers, scientists read the climate from natural records: air bubbles trapped in ice cores, tree rings, corals, cave formations, lake and ocean sediments, and fossil pollen. Ice cores alone reach back about 800,000 years.</p>
<h3>Ice ages</h3>
<p>For the past two million years or so, Earth has cycled in and out of ice ages, driven by slow wobbles in its orbit and amplified by CO₂ and ice. At the height of the last one, about 20,000 years ago, ice sheets covered much of North America and Europe, sea level was up to 125 m lower, and the world averaged about {d:-6} colder than in the 20th century. CO₂ was about 180 ppm, against 280 ppm before industry.</p>
<h3>Hothouses</h3>
<ul><li><b>The Cretaceous</b> (145–66 million years ago, the age of the late dinosaurs) was far warmer than today, with little polar ice and much higher seas.</li><li><b>The Paleocene–Eocene Thermal Maximum</b>, 56 million years ago, saw a huge release of carbon warm the planet by at least {d:5}. The oceans turned more acidic and many deep-sea creatures died out.</li><li><b>The Pliocene</b>, about 3 million years ago, was the last time CO₂ was above 400 ppm, as it is now. The world was about {d:3} warmer and the sea 10–20 m higher.</li></ul>
<h3>What the past tells us</h3>
<p>Across all these records, temperature and CO₂ rise and fall together. Today’s CO₂ is far outside anything in the last 800,000 years.</p>
<p>The real difference is speed. Coming out of the last ice age, the world warmed about 6 degrees over roughly 10,000 years. We have added about 1.5 degrees in around 150 years. Humans are releasing carbon about ten times faster than during the Paleocene–Eocene event, the fastest natural release in 66 million years. It took more than two million years for CO₂ to fall naturally from Pliocene levels to pre-industrial ones — we brought it back in about a century and a half.</p>
<p>Ecosystems and ice sheets respond slowly, so much of the change from today’s CO₂ is still to come.</p>`,
  sources:[["NOAA NCEI — What is paleoclimatology?","https://www.ncei.noaa.gov/node/54"],["NOAA NCEI — Climate change in the context of paleoclimate","https://www.ncei.noaa.gov/news/climate-change-context-paleoclimate"],["University of Arizona — How cold was the ice age? (Tierney et al., Nature, 2020)","https://news.arizona.edu/news/how-cold-was-ice-age-researchers-now-know"],["UC Santa Cruz — Current rate of carbon emissions unprecedented in 66 million years","https://news.ucsc.edu/2016/03/carbon-emissions/"],["UCL — The Pliocene: the last time Earth had more than 400 ppm CO₂","https://discovery-pp.ucl.ac.uk/10079994/1/little%20AAM%20weather%20Pliocene%20meeting%20report-submitted.pdf"],["University of Arizona — Ancient plankton help researchers predict near-future climate","https://news.arizona.edu/news/ancient-plankton-help-researchers-predict-near-future-climate"]]},
"greenhouse":{title:"Why the world is warming",mins:3,yr:1,
  lead:"Burning fossil fuels adds heat-trapping gases to the air faster than nature can remove them.",
  body:`<h3>The natural greenhouse effect</h3>
<p>Sunlight warms the ground, which gives off heat. Gases such as water vapour, carbon dioxide (CO₂) and methane absorb some of that heat and send it back down. Without them, Earth would average about {t:-18} instead of about {t:15}.</p>
<h3>The extra greenhouse effect</h3>
<p>Burning coal, oil and gas, and clearing forests, has raised CO₂ by about 50% since 1750. In {F:co2PeakDate} it peaked at <b>{F:co2Peak} parts per million</b> at Mauna Loa, Hawaii — {F:co2Rise} ppm higher than a year earlier, and the highest in at least 800,000 years. Methane and nitrous oxide are rising too.</p>
<figure class="learn-fig" data-img="co2-mauna-loa.png"><figcaption>Monthly CO₂ at Mauna Loa since 1958. The red line rises and falls with the seasons as Northern Hemisphere plants grow and die back. <span class="learn-credit">NOAA Global Monitoring Laboratory and Scripps Institution of Oceanography</span></figcaption></figure>
<h3>How we know it’s us</h3>
<ul><li>The Sun’s output has been flat or slightly lower since the 1950s while temperatures climbed.</li><li>The lower atmosphere is warming while the upper atmosphere cools — the signature of trapped heat, not a brighter Sun.</li><li>The carbon added to the air carries the chemical fingerprint of fossil fuels.</li></ul>
<p>The Earth is now taking in more energy than it gives out by the largest margin in 65 years of records. About 90% of that extra heat goes into the ocean.</p>`,
  sources:[S.nasaCauses,["NASA Earth Observatory — Global warming","https://earthobservatory.nasa.gov/features/GlobalWarming"],S.scripps,S.gml,S.wmo25]},

"state-now":{title:"Where we are in "+LEARN_FACTS.year,mins:3,yr:1,
  lead:"The world has warmed about 1.5 degrees, and every year from "+LEARN_FACTS.run+" is among the warmest on record.",
  body:`<div class="learn-stats">
<div class="learn-stat"><b>{d:{F:lastAnom}}</b><span>{F:lastYear} above the 1850–1900 average (WMO)</span></div>
<div class="learn-stat"><b>{F:run_n} of {F:run_n}</b><span>{F:run}: the {F:run_n} warmest years on record</span></div>
<div class="learn-stat"><b>{d:{F:past12Anom}}</b><span>{F:past12}, 12 months (Copernicus)</span></div>
<div class="learn-stat"><b>{F:co2Peak} ppm</b><span>CO₂ peak, {F:co2PeakDate}</span></div></div>
<h3>Global temperature</h3>
<p>2024 was the hottest year on record, about {d:1.55} above pre-industrial levels, and 2025 was second or third. As of late 2026, 2026 was on track to finish second, at about {d:1.6}. October 2026 was the warmest October ever measured, {d:1.75} above pre-industrial, and ocean surface temperatures set records for five months running.</p>
<h3>Crossing 1.5</h3>
<p>The Paris Agreement aims to limit warming to 1.5 degrees, measured as a 20-year average. Single years have now gone over it, and the average of 2023–2025 reached about {d:1.48}. Scientists now expect the long-term average to pass 1.5 degrees; the question is how far it overshoots and for how long.</p>
<h3>Not the same everywhere</h3>
<p>Land warms faster than the ocean, and the Arctic is warming several times faster than the world as a whole. Europe is the fastest-warming continent. So 1.5 degrees of global warming means more than 2 degrees over land, where people live — and much bigger jumps on the hottest days.</p>
<h3>What comes next</h3>
<p>The strong El Niño that built through 2026 releases extra ocean heat into the air, so scientists gave 2027 a real chance of breaking 2024’s record. Strong El Niño years, and the year after them, have tended to set new records.</p>
<div class="learn-tip"><a href="#learn/for-me" onclick="learnGo('for-me');return false;">What does it mean for me?</a> — the main hazards where you live.</div>`,
  sources:[S.wmoConf,S.wmo25,S.c3s,S.scripps,["Eos — Climate change may have killed 16,469 people in Europe this summer (2025)","https://eos.org/articles/climate-change-may-have-killed-16469-people-in-europe-this-summer"]]},
"oceans-ice":{title:"Oceans, ice and sea level",mins:3,yr:1,
  lead:"The ocean has absorbed most of the extra heat. It is now hotter, higher and more acidic than ever measured.",
  body:`<h3>Ocean heat</h3>
<p>Ocean heat content hit a new record in 2025, and the ocean has warmed more than twice as fast over 2005–2025 as over 1960–2005. Warmer seas fuel heavier rain and stronger tropical cyclones, and cause marine heatwaves that kill kelp forests, fish and coral.</p>
<h3>Sea level</h3>
<p>Global sea level has risen about 10 cm since satellite records began in 1993, and the rate has more than doubled: about 2.7 mm a year in 1993–2011 against about 4.8 mm a year in 2012–2025. Warmer water expands, and melting glaciers and ice sheets add water. Even if warming stopped today, the sea would keep rising for centuries.</p>
<figure class="learn-fig" data-img="sea-level.png"><figcaption>Global mean sea level measured by satellite since 1993. <span class="learn-credit">NASA/JPL-Caltech</span></figcaption></figure>
<h3>Ice</h3>
<p>The Arctic’s yearly sea-ice peak in 2025 was the lowest or second lowest on record. The 2026 summer minimum, about 4.6 million km² on 12 September, tied for tenth lowest — all of the lowest have come since 2007. Glaciers worldwide are losing ice faster than at any time in the record.</p>
<h3>Acidity</h3>
<p>The ocean absorbed about 29% of the CO₂ people emitted between 2015 and 2024, making it more acidic. That makes it harder for corals and shellfish to build skeletons and shells.</p>`,
  sources:[S.wmo25,["WMO — Earth’s climate swings increasingly out of balance","https://wmo.int/node/38416"],["NASA — Analysis shows La Niña limited sea level rise in 2025","https://www.nasa.gov/earth/nasa-analysis-shows-la-nina-limited-sea-level-rise-in-2025/"],["NASA Earth Observatory — Arctic sea ice shrinks to its 2026 minimum","https://science.nasa.gov/earth/earth-observatory/arctic-sea-ice-shrinks-to-its-2026-minimum/"]]},

"tipping":{title:"Tipping points",mins:2,
  lead:"Some parts of the Earth system don’t change gradually. Push them too far and they shift to a new state that can’t easily be undone.",
  body:`<h3>The first one has been crossed</h3>
<p>In October 2025, 160 scientists from 23 countries concluded that <b>warm-water coral reefs are passing their tipping point</b>. Marine heatwaves hit more than 80% of the world’s reefs between 2023 and 2025, causing the worst bleaching and die-off on record. Nearly a billion people, and about a quarter of all marine life, depend on these reefs. Even at 1.5 degrees of warming, most are expected to be lost.</p>
<h3>Others close by</h3>
<ul><li><b>Greenland and West Antarctic ice sheets:</b> nearing tipping points. Their full loss would raise the sea by several metres over centuries.</li><li><b>The Amazon:</b> drought, fire and clearing risk turning large parts of rainforest into drier savanna.</li><li><b>Atlantic Ocean circulation (AMOC):</b> weakening. A collapse would bring harsh winters to north-west Europe and shift tropical rain belts.</li><li><b>Permafrost:</b> thawing soils release CO₂ and methane, adding to warming.</li></ul>
<h3>Positive tipping points</h3>
<p>The same report found that solar power, wind and electric vehicles have passed their own tipping points in many markets: once cheaper than the alternative, they spread fast. Every tenth of a degree avoided lowers the risk of crossing more thresholds.</p>`,
  sources:[S.gtp,["National Oceanography Centre — Global Tipping Points Report 2025","https://www.noc.ac.uk/news/global-tipping-points-report-2025-reveals-first-earth-system-tipping-point-reached"],["NOAA — World’s fourth mass coral bleaching event","https://www.nesdis.noaa.gov/news/worlds-fourth-mass-coral-bleaching-event-likely-ended-2025"]]},

/* ── Extremes and you ───────────────────────────────────────────────────── */
"heatwaves":{title:"Heatwaves",mins:3,
  lead:"Heat kills more people than any other kind of weather, and heatwaves are getting hotter, longer and more frequent.",
  body:`<h3>What counts as a heatwave</h3>
<p>A heatwave is not just a hot day. Definitions vary between countries, but the best ones compare with what is normal for that place. Australia’s Bureau of Meteorology, for example, counts at least three days where both the days and the <b>nights</b> are unusually hot for the location. Hot nights matter because the body can’t recover. The heatwave alerts in this app use the same idea: the local climate sets the bar.</p>
<h3>The toll</h3>
<p>The WMO estimates heat kills around half a million people a year worldwide, and many deaths go unrecorded. Older people, babies, outdoor workers, people with heart, lung or kidney conditions and people living alone are most at risk.</p>
<h3>Recent extremes</h3>
<ul><li><b>Europe, summer 2026:</b> record heat helped kill more than 50,000 people in 854 cities, and researchers attributed nearly two-thirds of those deaths to climate change. In some cities temperatures ran {d:12} above normal.</li><li><b>Europe, summer 2025:</b> Türkiye set a national record of {t:50.5}, and Finland had an unprecedented three weeks of {t:30} heat.</li><li><b>Australia, January 2026:</b> Andamooka and Port Augusta in South Australia both reached {t:50.0}, and more than 50 weather stations set all-time records.</li></ul>
<h3>The trend</h3>
<p>Heat extremes that came once in 50 years in a pre-industrial climate now happen about five times as often, and they are hotter. Each extra degree of global warming makes them more frequent and more intense still.</p>`,
  sources:[S.wmoHeat,["WMO — COP31: Protecting health in an era of extreme heat","https://wmo.int/ar/node/39254"],["IPCC AR6 — Climate Change 2021: Summary for Policymakers","https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/"],["AP via OPB — Europe’s heat claims 50,000 lives; climate change blamed for two-thirds of deaths (Oct 2026)","https://www.opb.org/article/2026/10/23/europe-s-killer-heat-this-summer-claims-50000-lives/"],["Eos — Climate change may have killed 16,469 people in Europe this summer (2025)","https://eos.org/articles/climate-change-may-have-killed-16469-people-in-europe-this-summer"],S.bomHw,S.bomJan26]},
"humid-heat":{title:"Humid heat and your body",mins:2,
  lead:"Your body cools by sweating. Humidity stops sweat evaporating, so humid heat is more dangerous than dry heat at the same temperature.",
  body:`<p>When sweat evaporates it carries heat away. In dry air that works well. In humid air the sweat just drips off, and body temperature climbs. That is why the Comfort Score uses the <b>dew point</b> — a direct measure of the moisture in the air — and not just the temperature.</p>
<h3>Wet-bulb temperature</h3>
<p>Wrap a thermometer in a wet cloth and it measures the coolest temperature that evaporation can reach. When that “wet-bulb” reading gets into the low 30s Celsius, even healthy people resting in the shade struggle to stay cool; for many people the danger starts well below that.</p>
<h3>It’s getting worse</h3>
<p>The WMO reports that extreme humid heat has more than doubled since 1979. Warm air holds more moisture, so a warmer world is a more humid one. Tropical and coastal cities are most exposed.</p>
<h3>Wind and sun</h3>
<p>A breeze helps sweat evaporate; direct sun can add the equivalent of several degrees. Very hot dry wind, though, heats the body faster than sweat can cool it.</p>`,
  sources:[S.wmoHeat,["WMO — COP31: Protecting health in an era of extreme heat","https://wmo.int/ar/node/39254"],["MIT Climate Portal — Extreme heat","https://climate.mit.edu/explainers/extreme-heat"],["World Health Organization — Heat and health","https://who.int/mega-menu/health-topics/popular/excessive-heat"]]},

"rain-floods":{title:"Heavy rain and floods",mins:2,
  lead:"Warmer air holds more water, so when it rains, it can rain harder.",
  body:`<figure class="learn-fig" data-img="warm-air-moisture.png"><figcaption>For every degree Celsius of warming, the air can hold about 7% more water vapour, so storms have more to drop. <span class="learn-credit">NOAA Climate.gov illustration</span></figcaption></figure>
<p>The air can hold about 7% more moisture for each degree Celsius of warming. When a storm forms, that extra moisture can fall as heavier rain — and in short, intense bursts the increase can be larger still.</p>
<h3>What that looks like</h3>
<ul><li>Short, intense downpours that overwhelm drains and cause flash flooding.</li><li>Slow-moving storms that dump rain on the same place for hours or days. Models project these to become much more common over land.</li><li>Warmer seas feeding more moisture into tropical cyclones, hurricanes and typhoons, so they bring more rain when they come ashore.</li></ul>
<h3>Wetter and drier at once</h3>
<p>A warmer world isn’t simply wetter. Rain tends to come in heavier bursts with longer dry gaps between, so the same region can face both more flooding and more drought.</p>`,
  sources:[["NOAA Climate.gov — A thirsty atmosphere (illustration)","https://climate.gov/media/16553"],["Met Office — The influence of climate change on severe weather","https://www.metoffice.gov.uk/blog/2024/the-influence-of-climate-change-on-severe-weather"],["Met Office — Future extreme rainfall more extreme than first thought","https://www.metoffice.gov.uk/about-us/news-and-media/media-centre/weather-and-climate-news/2021/future-extreme-rainfall-more-extreme-than-first-thought"]]},
"drought-fire":{title:"Drought and fire weather",mins:2,
  lead:"Heat dries out soil and plants faster, so dry spells bite harder and fire seasons start earlier.",
  body:`<h3>Drought</h3>
<p>Higher temperatures increase evaporation, so the same amount of rain leaves drier soil and lower rivers. Where rainfall is also falling — as in many Mediterranean-type climates, from southern Europe and California to central Chile, south-western Africa and southern Australia — drought becomes more frequent and harder to recover from.</p>
<h3>Fire weather</h3>
<p>Fire weather is the mix of heat, low humidity, strong wind and dry fuel that lets fires start and spread. It is increasing across much of the world, including western North America, the Mediterranean, the boreal forests of Canada and Siberia, and Australia, where extreme fire weather has increased and fire seasons have lengthened since the 1950s. Smoke from big fires can harm health thousands of kilometres away.</p>
<h3>Compound events</h3>
<p>The biggest disasters often come from several hazards at once: drought, then a heatwave, then dry lightning and wind. These combinations are becoming more likely as the climate warms.</p>`,
  sources:[["IPCC AR6 — Climate Change 2021: Summary for Policymakers","https://www.ipcc.ch/report/ar6/wg1/chapter/summary-for-policymakers/"],S.csiro,["Bureau of Meteorology — Fire weather knowledge centre","https://www.bom.gov.au/resources/learn-and-explore/fire-weather-knowledge-centre"]]},
"for-me":{title:"What does it mean for me?",mins:3,
  lead:"The main climate change hazards where you live, and how to read them.",
  bodyFn:function(){return learnForMeBody();},
  sourcesFn:function(){return learnForMeSources();},
  body:"",sources:[]},
"what-you-can-do":{title:"What can I do?",mins:5,
  lead:"Climate change is driven mostly by the richest people and the biggest companies, not by ordinary households. Here is where the real weight sits, and the things that are worth your energy.",
  body:`<h3>Where the weight really sits</h3>
<p>Responsibility for climate change is not shared equally. It follows wealth and power.</p>
<ul><li><b>The richest 1% of people</b> — about 77 million — caused 16% of the world’s consumption emissions in 2019. That is as much as the poorest two-thirds of humanity, about 5 billion people. The richest 10% caused about half.</li><li><b>Billionaires</b> are in a league of their own. Oxfam estimated that someone in the bottom 99% would need about 1,500 years to produce what one of the richest billionaires emits in a single year — through private jets, superyachts and several homes, and through the polluting companies they own and invest in.</li><li><b>A small number of producers</b> sit at the top of the chain. Just 57 oil, gas, coal and cement producers — companies and state-owned firms — were linked to 80% of the world’s fossil fuel and cement CO₂ from 2016 to 2022. In 2024, 32 of them accounted for more than half.</li></ul>
<p>The wealthiest also have the most say over what gets built, what gets sold and what governments decide. One private jet trip or one investment decision can outweigh a lifetime of an ordinary family’s careful choices.</p>
<p><b>So the weight of fixing this does not rest on you.</b> If you can’t afford solar panels or an electric car, rent your home, or need to drive to work, that is not a personal failing. The things below are still worth doing — they keep you and the people around you safer, often save money, and add up across millions of households — but the biggest thing ordinary people have is numbers. Acting together, and pushing governments and companies to change, moves far more than any one household can.</p>
<h3>1. Get ready for heat and extremes</h3>
<ul><li>Watch the heatwave and “warmer than usual” alerts in the Forecast tab, and your national weather service’s warnings.</li><li>Plan the hottest days: shift activity to early morning, know a cool place you can get to, keep water handy.</li><li>Check on older neighbours, relatives and anyone living alone.</li><li>Know the signs of heat illness — dizziness, headache, nausea, confusion — and get help early.</li><li>Never drive or walk through floodwater. If you live near bush, forest or grassland, have a fire plan and know your local warning system.</li></ul>
<h3>2. Make your voice heard — together</h3>
<ul><li><b>Contact your representatives</b> — local, state or provincial, and national. Surveys of political staff find that personal letters, emails and face-to-face visits from constituents sway undecided lawmakers far more than form letters or petitions. Say who you are, where you live and what you want them to do.</li><li><b>Join others:</b> community groups, unions, residents’ associations and climate groups carry far more weight than one voice. Many win changes locally — more trees, better buses, cleaner power for public housing.</li><li><b>Have your say locally:</b> councils decide on tree cover, building rules, bike lanes and local planning. Make submissions and turn up to consultations.</li><li><b>Vote with climate in mind:</b> find out where candidates and parties stand on climate policy before every election.</li><li><b>Talk about it.</b> Most people who care about climate change rarely discuss it. Research shows conversations with friends and family help people understand the science and make action feel normal.</li><li><b>Follow your money:</b> ask your bank and your superannuation or pension fund how they invest, and move if you don’t like the answer.</li></ul>
<h3>3. Grow native plants</h3>
<ul><li>Plants that grow naturally in your area need less water once established, cope with the local climate and feed local insects, birds and other wildlife.</li><li>Trees and dense planting cool their surroundings through shade and evaporation. Urban forests average about {d:1.6} cooler than nearby bare areas, and restoring native plant communities has been measured cooling summer days by over 4 degrees in a decade.</li><li>Swap some lawn or paving for garden beds and trees, plant shade on the sunny side of your home, and let rain soak in rather than run off. Pots work too if you rent.</li><li>Join a local planting or bush-regeneration group, or your council’s tree-planting days. Your local council or nursery can tell you which species are native to your area.</li></ul>
<h3>4. At home, if you can</h3>
<ul><li><b>Keep the heat out:</b> shade windows from the outside, seal draughts, and open up at night when it’s cooler outside than in. Renters can use removable blinds, curtains and draught stoppers, and ask the landlord about insulation and shading.</li><li><b>Go electric when things wear out:</b> heat pumps (reverse-cycle air conditioning) for heating and cooling, a heat-pump hot water system and induction cooking all use far less energy than gas or old electric heaters. Many governments offer rebates.</li><li><b>Clean power:</b> rooftop solar if you own your roof, or a renewable-energy plan from your electricity retailer.</li><li><b>Waste less:</b> plan meals to cut food waste, eat more plant-based meals, and repair, borrow or buy second-hand before buying new — it saves money too.</li></ul>
<h3>5. Getting around</h3>
<ul><li>Walk, cycle or take public transport where it works for you — and push for better services where it doesn’t.</li><li>When you replace a car, consider an electric one or whether you need a second car at all.</li><li>If you fly often, flying less — especially long-haul — is the biggest single cut most frequent flyers can make.</li></ul>
<p>Every tenth of a degree avoided means fewer extreme days, and heat–health warning systems already save lives where they are used. The biggest tenths will come from the people and companies with the most power — and from ordinary people, together, making them act.</p>`,
  sources:[["Oxfam — Richest 1% emit as much planet-heating pollution as two-thirds of humanity (Climate Equality, 2023)","https://www.oxfam.org/en/node/23495"],["Oxfam and Stockholm Environment Institute — Climate Equality: A planet for the 99% (full report)","https://www.oxfamnovib.nl/Files/rapporten/2023/Climate%20Equality_Oxfam_NOVEMBER%202023.pdf"],["CBS News — World’s richest 1% emitting enough carbon to cause 1.3 million heat deaths","https://www.cbsnews.com/news/worlds-richest-carbon-emissions-climate-change-report"],["Institute for New Economic Thinking, Oxford — Only 57 producers are responsible for 80% of fossil fuel and cement CO₂ since 2016 (Carbon Majors)","https://www.inet.ox.ac.uk/news/only-57-producers-are-responsible-for-80-of-all-fossil-fuel-and-cement-co2-emissions-since-2016-new-report"],["Inside Climate News — Half of fossil fuel carbon emissions in 2024 came from 32 companies (2026)","https://insideclimatenews.org/news/21012026/half-of-fossil-fuel-carbon-emissions-in-2024-came-from-32-companies/"],["IPCC AR6 WGIII — Chapter 5: Demand, services and social aspects of mitigation","https://www.ipcc.ch/report/ar6/wg3/chapter/chapter-5/"],["US EPA — Benefits of trees and vegetation (heat islands)","https://epa.gov/heatislands/benefits-trees-and-vegetation"],["University of Waterloo — Planting native trees and greenery can cool off your backyard","https://uwaterloo.ca/stories/news/planting-native-trees-greenery-can-cool-your-backyard"],["Congressional Management Foundation (via PPG Buffalo) — Most effective ways of contacting lawmakers","https://ppgbuffalo.org/news-and-events/news/article:03-15-2017-12-00am-congressional-management-foundation-releases-report-outlining-the-most-effective-ways-of-contacting-congress/"],["Yale Program on Climate Change Communication — Discussing global warming leads to greater acceptance of climate science","https://climatecommunication.yale.edu/publications/discussing-global-warming-leads-to-greater-acceptance-of-climate-science/"],S.wmoHeat,["WMO — COP31: Protecting health in an era of extreme heat","https://wmo.int/ar/node/39254"]]}
};

// ── Your drivers: chosen from where home is ─────────────────────────────────
function learnHome(){
  var d=null;
  try{d=JSON.parse(localStorage.getItem("default_loc")||"null");}catch(e){}
  if(d&&d.lat!=null&&d.lon!=null)return{lat:+d.lat,lon:+d.lon,label:(d.label||"").split(",")[0],home:true};
  if(window._currentLat!=null&&window._currentLon!=null)return{lat:+window._currentLat,lon:+window._currentLon,label:(window._currentLabel||"").split(",")[0],home:false};
  return null;
}
function learnRegion(lat,lon){
  function inB(a,b,c,e){return lat>=a&&lat<=b&&lon>=c&&lon<=e;}
  if(inB(-45,-9,112,155))return lat>-20?{key:"au-n",name:"northern Australia",ids:["monsoon","enso","mjo","iod"]}:{key:"au-s",name:"southern Australia",ids:["enso","iod","sam","ridge"]};
  if(inB(-48,-33,165,179.9))return{key:"nz",name:"New Zealand",ids:["enso","sam","pdo"]};
  if(inB(20,55,100,150))return{key:"ea",name:"East Asia",ids:["monsoon","enso","ao","jet"]};
  if(inB(-11,35,60,130))return{key:"sa",name:"South and South-East Asia",ids:["monsoon","enso","iod","mjo"]};
  if(inB(34,72,-25,45))return{key:"eu",name:"Europe",ids:["nao","jet","ao","amoc"]};
  if(lat>-30&&lat<30&&(lon>130||lon<-140))return{key:"pac",name:"the tropical Pacific",ids:["enso","mjo","itcz"]};
  if(inB(15,75,-170,-50))return inB(25,38,-118,-103)?{key:"na-sw",name:"south-western North America",ids:["enso","monsoon","pdo","jet"]}:{key:"na",name:"North America",ids:["enso","pdo","ao","jet"]};
  if(inB(12,45,34,63))return{key:"me",name:"the Middle East",ids:["ridge","jet","nao","enso"]};
  if(inB(-35,37,-20,52))return{key:"af",name:"Africa",ids:lon>28?["itcz","iod","enso","monsoon"]:["itcz","monsoon","enso","amv"]};
  if(inB(-56,13,-82,-34))return lat<-33?{key:"sam-s",name:"southern South America",ids:["enso","sam","ridge"]}:{key:"sam",name:"South America",ids:["enso","itcz","monsoon","amv"]};
  if(inB(30,55,45,100))return{key:"ca",name:"Central Asia",ids:["jet","nao","ao","enso"]};
  return{key:"glob",name:"",ids:["enso","jet","ridge"]};
}
// ── What does it mean for me? ──────────────────────────────────────────────
// Main climate change hazards by region, from the IPCC's regional fact sheets and national
// science agencies. [title, text] pairs; the region comes from learnRegion().
var LEARN_HZ={
  "au-s":{t:[["Hotter, longer heatwaves","More days over {t:40}, and heatwaves that start earlier, last longer and bring hotter nights."],["Less cool-season rain","Rain in the cooler months has fallen since the 1970s in the south-west and since the 1990s in the south-east, as the subtropical ridge strengthens. Droughts hit harder because heat dries soil faster."],["Longer, more dangerous fire seasons","Extreme fire weather days have increased and the season now starts earlier and ends later. El Niño and a positive Indian Ocean Dipole, both present in 2026, add to the risk."],["Heavier downpours","Short bursts of rain are getting more intense, raising flash-flood risk even as total rain declines."],["Coasts and seas","Rising sea level brings more frequent coastal flooding and erosion; marine heatwaves are damaging kelp forests and fisheries."]],
       s:["csiro","ipcc2","ipcc1","bomNow"]},
  "au-n":{t:[["Dangerous humid heat","The build-up and wet season are getting hotter and more humid, pushing heat stress towards the limit for outdoor work and sleep."],["Fewer but stronger cyclones","Tropical cyclones are expected to be less frequent overall but a larger share intense, with heavier rain and higher storm surge."],["Heavier wet-season rain","Monsoon bursts and cyclones can drop more rain, worsening floods."],["Reefs and coasts","Marine heatwaves are bleaching coral, and rising seas push storm surge further inland."]],
       s:["csiro","ipcc2","ipcc1"]},
  "nz":{t:[["Hotter summers, fewer frosts","More hot days and fewer cold nights, with alpine snow and glaciers shrinking fast."],["A wetter west, a drier east","Western and southern areas are getting more rain; northern and eastern areas more drought and fire weather."],["Heavier rain and floods","Intense rainstorms and ex-tropical cyclones are bringing more damaging floods and landslides."],["Coasts","Rising seas and storm surge threaten low-lying coastal towns, roads and infrastructure."]],
       s:["ipcc2","ipcc1"]},
  "eu":{t:[["Deadly heat","Europe is warming faster than the global average. Heatwaves are its deadliest climate hazard: more than 50,000 heat deaths in summer 2026."],["Drought and fire in the south","Southern Europe and the Mediterranean face hotter, drier summers, water shortages and bigger wildfires."],["Heavier rain and floods in the north and centre","More intense downpours and slow-moving storms bring flash floods and river floods."],["Coasts and the Atlantic","Rising seas threaten low-lying coasts, and a weakening Atlantic overturning circulation adds uncertainty for north-west Europe."]],
       s:["ipcc2","ipcc1","ap26","amoc"]},
  "na":{t:[["Heat","More frequent and intense heatwaves, with the greatest danger in cities and humid regions."],["Wildfire and smoke","Longer fire seasons in the west and the boreal forests; smoke can spread across the continent."],["Hurricanes and storm surge","Atlantic and Gulf coast hurricanes are bringing heavier rain and higher surge as seas rise and warm."],["Heavy rain and floods","Downpours are getting heavier across much of the continent."],["Northern thaw","Permafrost thaw, sea-ice loss and shorter winters are changing the Arctic and the north."]],
       s:["ipcc2","ipcc1"]},
  "na-sw":{t:[["Extreme heat","More days of extreme heat, with very warm nights that offer little relief."],["Megadrought and water supply","Hotter temperatures dry soils and shrink snowpack and rivers, straining water supply."],["Wildfire","Longer, more intense fire seasons."],["Monsoon storms","Summer monsoon storms can bring flash floods and damaging winds."]],
       s:["ipcc2","ipcc1"]},
  "ea":{t:[["Heat and humid heat","Hotter summers with dangerous humid heat in big cities."],["Heavier rain and floods","More intense rain during the summer rainy season and from typhoons, bringing floods and landslides."],["Typhoons","A larger share of typhoons are expected to be intense, with more rain and higher storm surge."],["Coasts","Rising seas threaten densely populated coasts and river deltas."]],
       s:["ipcc2","ipcc1"]},
  "sa":{t:[["Dangerous humid heat","Heat and humidity are approaching the limits of what the body can cope with in parts of South Asia and the Gulf coast."],["Monsoon extremes","Heavier monsoon downpours and floods, alternating with dry spells and failed seasons."],["Cyclones and sea level","Stronger cyclones and rising seas threaten low-lying deltas and coastal cities."],["Glaciers and rivers","Himalayan glaciers that feed major rivers are shrinking, threatening long-term water supply."]],
       s:["ipcc2","ipcc1"]},
  "af":{t:[["Heat","Africa is warming faster than the global average, with more frequent dangerous heat."],["Drought and food security","Northern and southern Africa face more drought, threatening crops, livestock and water supply."],["Heavier rain in places","East Africa and parts of the tropics face more intense rain and flooding."],["Coasts","Rising seas threaten coastal cities and farmland."]],
       s:["ipcc2","ipcc1"]},
  "me":{t:[["Extreme heat","Summer heat is approaching the limits of human tolerance in some areas, especially where humidity is high near the coast."],["Water scarcity","Less rain and more evaporation strain already scarce water."],["Dust and drought","More frequent dust storms and drought."]],
       s:["ipcc2","ipcc1"]},
  "ca":{t:[["Shrinking glaciers","Mountain glaciers that feed rivers are melting, threatening long-term water supply."],["Heat and drought","Hotter summers and more frequent drought."],["Floods and landslides","Glacier melt and heavier rain raise the risk of floods and mudslides in the mountains."]],
       s:["ipcc2","ipcc1"]},
  "sam":{t:[["Amazon drought and fire","The Amazon faces more severe drought and fire, with a risk of large areas turning to drier savanna."],["Heat","More frequent dangerous heat."],["Floods","Heavier rain and floods in the south-east of the continent."],["Glaciers","Andean glaciers are shrinking, affecting water for cities and farms."]],
       s:["ipcc2","ipcc1"]},
  "sam-s":{t:[["Drought","Central Chile and parts of Argentina have faced long droughts as winter storms shift south."],["Glaciers","Patagonian and Andean glaciers are shrinking fast."],["Fire","Hotter, drier summers raise wildfire risk."]],
       s:["ipcc2","ipcc1"]},
  "pac":{t:[["Rising seas","Low-lying islands face more frequent flooding at high tide, coastal erosion and salt water in fresh groundwater."],["Coral reefs","Marine heatwaves are killing reefs that protect coasts and feed communities."],["Cyclones","A larger share of cyclones are expected to be intense, with more rain and higher surge."]],
       s:["ipcc2","ipcc1"]},
  "glob":{t:[["Heat","More frequent and intense heatwaves almost everywhere."],["Heavier rain","More intense downpours in most regions."],["Drought and fire","More drought and fire weather in many dry and Mediterranean-type climates."],["Rising seas","Higher sea level and storm surge on every coast."]],
       s:["ipcc2","ipcc1"]}
};
var LEARN_HZ_SRC={
  ipcc1:["IPCC AR6 Working Group I — Regional fact sheets","https://www.ipcc.ch/report/ar6/wg1/resources/factsheets"],
  ipcc2:["IPCC AR6 Working Group II — Regional fact sheets (impacts and adaptation)","https://www.ipcc.ch/report/ar6/wg2/about/factsheets"],
  ap26:["AP via OPB — Europe’s heat claims 50,000 lives (Oct 2026)","https://www.opb.org/article/2026/10/23/europe-s-killer-heat-this-summer-claims-50000-lives/"],
  amoc:["Met Office — The AMOC in a changing climate","https://www.metoffice.gov.uk/blog/2024/the-atlantic-meridional-overturning-circulation-in-a-changing-climate"]
};
function learnForMe(){var h=learnHome(),r=h?learnRegion(h.lat,h.lon):{key:"glob",name:""};return{h:h,r:r,z:LEARN_HZ[r.key]||LEARN_HZ.glob};}
function learnForMeBody(){
  var o=learnForMe(),h=o.h,r=o.r,s="";
  s+="<p>"+(h?"For <b>"+learnEsc(h.label||"your location")+"</b>"+(r.name?", in "+learnEsc(r.name):"")+", these are the main ways climate change is showing up"+(h.home?"":" (based on the place you’re viewing — set a home with ⌂ to keep it)")+".":"Set a home location (the ⌂ button next to a place’s name) and this page shows the hazards for where you live. Until then, here are the main ones worldwide.")+"</p>";
  var kp=learnKoppen(h);
  if(kp)s+="<p>Your climate type is <b>"+learnEsc(kp.code)+" — "+learnEsc(kp.name)+"</b>. <a href='#climate' onclick=\"setView('climate');return false;\">See its normals in the Climate tab</a>.</p>";
  s+="<div class='learn-hz'>"+o.z.t.map(function(x){return"<div class='learn-hz-i'><b>"+x[0]+"</b><span>"+x[1]+"</span></div>";}).join("")+"</div>";
  s+="<h3>What drives your seasons</h3><p>"+r.ids.map(function(id){return"<a href='#learn/"+id+"' onclick=\"learnGo('"+id+"');return false;\">"+learnEsc(LEARN[id].title)+"</a>";}).join(" · ")+"</p>";
  s+="<h3>Everywhere</h3><p>Whatever your climate: if you live near the coast, sea level will keep rising for centuries; if you live in a city, heat builds up in pavement and buildings, so nights stay hotter than in the countryside around it. The hazards above add to these.</p>";
  s+="<div class='learn-tip'><a href='#learn/what-you-can-do' onclick=\"learnGo('what-you-can-do');return false;\">What can I do?</a> — the most useful steps, from getting ready for heat to growing native plants and contacting your representatives.</div>";
  return s;
}
function learnForMeSources(){var z=learnForMe().z;return z.s.map(function(k){return LEARN_HZ_SRC[k]||S[k];}).filter(Boolean);}
function learnKoppen(h){
  try{if(!h||typeof findClimEntry!=="function"||typeof KOPPEN_DATA==="undefined")return null;
    var e=findClimEntry(h.lat,h.lon);if(!e||!e.koppen)return null;
    var code=String(e.koppen).split(/[\s(]/)[0],k=KOPPEN_DATA[code];return k?{code:code,name:k.name}:null;}catch(x){return null;}
}

// ── Rendering ───────────────────────────────────────────────────────────────
var _learnShown=null;
function learnEsc(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;").replace(/"/g,"&quot;");}
function learnUnits(h){
  return h.replace(/\{t:(-?[\d.]+)\}/g,function(_,c){return toDisp(+c)+unitSym();})
          .replace(/\{d:(-?[\d.]+)\}/g,function(_,c){c=+c;var v=useFahrenheit?c*1.8:c,dp=c%1===0?0:(String(c).split(".")[1]||"").length;
            if(useFahrenheit)dp=Math.max(1,Math.min(dp,1));return(v>0?"+":"")+v.toFixed(dp)+(useFahrenheit?"°F":"°C");});
}
function learnLink(id,cls){var L=LEARN[id];return"<a class='"+(cls||"learn-item")+"' href='#learn/"+id+"' onclick=\"learnGo('"+id+"');return false;\"><span class='learn-item-t'>"+learnEsc(L.title)+"</span><span class='learn-item-m'>"+L.mins+" min</span></a>";}
function learnNav(cur){
  return LEARN_SETS.map(function(s){
    return"<div class='learn-nav-set'><div class='learn-nav-h'>"+learnEsc(s.title)+"</div>"+s.lessons.map(function(id){
      return"<a class='learn-nav-a"+(id===cur?" cur":"")+"' href='#learn/"+id+"' onclick=\"learnGo('"+id+"');return false;\""+(id===cur?" aria-current='page'":"")+">"+learnEsc(LEARN[id].title)+"</a>";}).join("")+"</div>";
  }).join("");
}
// ── Right now: live readings from /api/drivers (Worker), else the built-in text ─────
// The Worker reads the agencies' data files and caches them for a few hours. The built-in
// LEARN_NOW text is only shown while it's recent (LEARN_NOW_DAYS), so a dead feed can't
// leave months-old "right now" text on screen.
var LEARN_LIVE=null,LEARN_NOW_DAYS=45;
var LEARN_LIVE_SRC={
  enso:["Bureau of Meteorology — Climate driver update","https://www.bom.gov.au/climate/enso/"],
  iod:["Bureau of Meteorology — Climate driver update","https://www.bom.gov.au/climate/enso/"],
  sam:["NOAA Climate Prediction Center — Antarctic Oscillation (SAM)","https://www.cpc.ncep.noaa.gov/products/precip/CWlink/daily_ao_index/aao/aao.shtml"],
  nao:["NOAA Climate Prediction Center — North Atlantic Oscillation","https://www.cpc.ncep.noaa.gov/products/precip/CWlink/pna/nao.shtml"],
  ao:["NOAA Climate Prediction Center — Arctic Oscillation","https://www.cpc.ncep.noaa.gov/products/precip/CWlink/daily_ao_index/ao.shtml"]
};
function learnFetchLive(){
  if(LEARN_LIVE!==null||!window.fetch)return;
  LEARN_LIVE=false;
  fetch("/api/drivers").then(function(r){return r.ok?r.json():null;}).then(function(j){
    if(!j)return;LEARN_LIVE=j;
    if(_learnShown!==null&&document.body.classList.contains("view-learn"))learnRender(_learnShown);
  }).catch(function(){});
}
function learnDate(iso){
  var d=new Date(iso+"T12:00:00Z");if(isNaN(d))return iso;
  return d.getUTCDate()+" "+["January","February","March","April","May","June","July","August","September","October","November","December"][d.getUTCMonth()]+" "+d.getUTCFullYear();
}
function learnSigned(v){return(v>0?"+":v<0?"−":"")+Math.abs(v).toFixed(1);}
// {phase, html, date} for a driver from the live feed, or null
function learnLive(key){
  var L=LEARN_LIVE&&LEARN_LIVE[key];if(!L||L.value==null||!isFinite(L.value))return null;
  var v=+L.value,ch=L.prev4!=null?v-L.prev4:0,date=learnDate(L.date),ph,h;
  if(key==="enso"){
    ph=v>=0.8?"El Niño":v<=-0.8?"La Niña":"Neutral";
    var a=Math.abs(v),str=a>=2?"very strong":a>=1.5?"strong":a>=1?"moderate":"weak";
    h="<p><b>"+(ph==="Neutral"?"Neutral":ph+" levels ("+str+")")+".</b> The central Pacific was {d:"+v.toFixed(2)+"} "+(v>=0?"warmer":"cooler")+" than normal in the week to "+date
      +". El Niño levels start at {d:0.8} and La Niña at {d:-0.8}"+(Math.abs(ch)>=0.2?"; it has "+(ch>0?"warmed":"cooled")+" by {d:"+Math.abs(ch).toFixed(2)+"} over the past month":"")+".</p>";
    if(L.status)h+="<p>NOAA status: <b>"+learnEsc(L.status)+"</b>"+(L.issued?" ("+learnEsc(L.issued)+")":"")+"."+(L.synopsis?" "+learnEsc(L.synopsis):"")+"</p>";
  }else if(key==="iod"){
    ph=v>=0.4?"Positive":v<=-0.4?"Negative":"Neutral";
    var tr=ph!=="Neutral"&&Math.abs(ch)>=0.2?((ch<0)===(v>0)?" and weakening":" and strengthening"):"";
    h="<p><b>"+ph+tr+".</b> The IOD index was {d:"+v.toFixed(2)+"} in the week to "+date+". Positive IOD levels start at {d:0.4} and negative at {d:-0.4}.</p>";
  }else{
    var th=key==="sam"?1:0.5;
    ph=v>=th?"Positive":v<=-th?"Negative":"Neutral";
    var nm={sam:"SAM",nao:"NAO",ao:"AO"}[key];
    h="<p><b>"+ph+".</b> The "+nm+" index averaged "+learnSigned(v)+" over the 7 days to "+date+" (latest day "+learnSigned(+L.daily)+"). It counts as positive above +"+th+" and negative below −"+th+".</p>";
  }
  return{phase:ph,html:h,date:date};
}
function learnNowPhase(key){
  var l=learnLive(key);if(l)return l.phase;
  var n=LEARN_NOW[key];return n&&learnNowFresh()?n.phase:null;
}
function learnNowFresh(){return(Date.now()-Date.parse("2026-11-24T00:00:00Z"))/864e5<LEARN_NOW_DAYS;}
function learnNowBox(key){
  var l=learnLive(key),src=LEARN_LIVE_SRC[key];
  if(l)return"<div class='learn-now'><div class='learn-now-h'>Right now <span>as of "+l.date+"</span></div>"+l.html
    +"<div class='learn-now-f'>Updates automatically from the Bureau of Meteorology and NOAA. <a href='"+src[1]+"' target='_blank' rel='noopener'>Latest update ↗</a></div></div>";
  var n=LEARN_NOW[key];
  if(n&&learnNowFresh())return"<div class='learn-now'><div class='learn-now-h'>Right now <span>as of "+LEARN_ASOF+"</span></div><p><b>"+learnEsc(n.phase)+".</b> "+learnEsc(n.txt)+"</p><a href='"+n.src[1]+"' target='_blank' rel='noopener'>Latest update ↗</a></div>";
  if(!src)return"";
  return"<div class='learn-now'><div class='learn-now-h'>Right now</div><p>The latest reading couldn’t be loaded. <a href='"+src[1]+"' target='_blank' rel='noopener'>See the latest update ↗</a></p></div>";
}
function learnDrivers(){
  var h=learnHome(),r=h?learnRegion(h.lat,h.lon):null;
  var head=h?("Your climate drivers"+(h.label?" — "+learnEsc(h.label):"")):"Your climate drivers";
  var sub=!h?"Set a home location (the ⌂ button next to a place’s name) and this shows the drivers that matter most where you live."
    :(r.name?"The patterns that most affect "+learnEsc(r.name)+(h.home?"":" (based on the place you’re viewing — set a home with ⌂ to keep it)")+".":"The main global drivers. Every driver is in the list below.");
  var ids=r?r.ids:["enso","jet","ridge"];
  var chips=ids.map(function(id){var now=LEARN[id].now&&learnNowPhase(LEARN[id].now);
    return"<a class='learn-chip' href='#learn/"+id+"' onclick=\"learnGo('"+id+"');return false;\"><span>"+learnEsc(LEARN[id].title)+"</span>"+(now?"<em>Now: "+learnEsc(now)+"</em>":"")+"</a>";}).join("");
  return"<div class='card learn-drivers'><div class='learn-drivers-h'>"+head+"</div><p class='learn-sub'>"+sub+"</p><div class='learn-chips'>"+chips+"</div>"
    +"<a class='learn-forme' href='#learn/for-me' onclick=\"learnGo('for-me');return false;\">What does climate change mean for me? \u203A</a></div>";
}
function learnHomeHTML(){
  var s="<div class='learn-intro'><h1>Learn</h1><p>Short lessons on how weather and climate work, what drives your seasons, and where global warming stands in "+LEARN_FACTS.year+". Each takes two or three minutes, with sources at the end.</p></div>"+learnDrivers();
  s+=LEARN_SETS.map(function(set){
    return"<section class='card learn-set'><h2>"+learnEsc(set.title)+"</h2><p class='learn-sub'>"+learnEsc(set.blurb)+"</p><div class='learn-list'>"+set.lessons.map(function(id){return learnLink(id);}).join("")+"</div></section>";
  }).join("");
  return s;
}
function learnOrder(){var a=[];LEARN_SETS.forEach(function(s){a=a.concat(s.lessons);});return a;}
function learnLessonHTML(id){
  var L=LEARN[id],order=learnOrder(),i=order.indexOf(id),set=LEARN_SETS.filter(function(s){return s.lessons.indexOf(id)!==-1;})[0];
  var prev=order[i-1],next=order[i+1];
  var s="<a class='learn-back' href='#learn' onclick=\"learnGo('');return false;\">‹ All lessons</a>";
  s+="<article class='card learn-lesson'><div class='learn-kicker'>"+learnEsc(set.title)+" · "+L.mins+" min read</div><h1>"+learnEsc(L.title)+"</h1><p class='learn-lead'>"+learnEsc(L.lead)+"</p>";
  s+=learnUpdBox(L);
  if(L.now)s+=learnNowBox(L.now);
  s+="<div class='learn-body'>"+(L.bodyFn?L.bodyFn():L.body)+"</div>";
  s+="<div class='learn-src'><div class='learn-src-h'>Sources</div><p class='learn-ai'>Written with the help of Claude, Anthropic’s AI, and checked against these sources.</p><ol>"+(L.sourcesFn?L.sourcesFn():L.sources).map(function(x){return"<li><a href='"+learnEsc(x[1])+"' target='_blank' rel='noopener'>"+learnEsc(x[0])+"</a></li>";}).join("")+"</ol></div></article>";
  s+="<nav class='learn-pn'>"+(prev?"<a href='#learn/"+prev+"' onclick=\"learnGo('"+prev+"');return false;\"><small>Previous</small>"+learnEsc(LEARN[prev].title)+"</a>":"<span></span>")
    +(next?"<a class='nx' href='#learn/"+next+"' onclick=\"learnGo('"+next+"');return false;\"><small>Next</small>"+learnEsc(LEARN[next].title)+"</a>":"<span></span>")+"</nav>";
  return s;
}
// Figures: <figure data-img="x.jpg"> gets its picture here; if it fails to load it tries .png/.jpg, then hides.
function learnFigs(root){
  root.querySelectorAll("figure[data-img]").forEach(function(f){
    var name=f.getAttribute("data-img"),alt=f.querySelector("figcaption")?f.querySelector("figcaption").textContent:"";
    var img=new Image(),tried=false;img.alt=alt.split(".")[0];img.loading="lazy";
    img.onerror=function(){if(!tried){tried=true;img.src="img/learn/"+name.replace(/\.(jpg|png)$/,function(m){return m===".jpg"?".png":".jpg";});}else f.style.display="none";};
    img.src="img/learn/"+name;f.insertBefore(img,f.firstChild);
  });
}
// {F:name} → the LEARN_FACTS value, with the live NOAA CO₂ peak when /api/drivers has it
function learnFactVals(){
  var f={},k;for(k in LEARN_FACTS)f[k]=LEARN_FACTS[k];
  var c=LEARN_LIVE&&LEARN_LIVE.co2;
  if(c&&c.peak>300&&c.peakDate&&c.peakDate.slice(0,4)>=LEARN_FACTS.co2PeakDate.slice(-4)){
    f.co2Peak=String(Math.round(c.peak));f.co2PeakDate=learnMonth(c.peakDate);
    if(c.prevPeak>300)f.co2Rise=(c.peak-c.prevPeak).toFixed(1);
  }
  return f;
}
function learnMonth(ym){var p=String(ym).split("-");return["January","February","March","April","May","June","July","August","September","October","November","December"][(+p[1]||1)-1]+" "+p[0];}
function learnFacts(h){var f=learnFactVals();return h.replace(/\{F:(\w+)\}/g,function(m,k){return f[k]!==undefined?f[k]:m;});}
// After LEARN_FACTS.review, lessons with yr:1 say newer full-year figures are out
function learnUpdBox(L){
  if(!L.yr||Date.now()<Date.parse(LEARN_FACTS.review+"T00:00:00Z"))return"";
  return"<div class='learn-upd'><b>Newer figures are out.</b> The figures in this lesson were checked on "+LEARN_FACTS.asof+". Full-year figures for "+LEARN_FACTS.year
    +" have since been published, so some numbers here may have changed. <a href='https://wmo.int/topics/climate' target='_blank' rel='noopener'>Latest from the WMO ↗</a></div>";
}
function learnRender(id){
  if(id==="state-2026")id="state-now";   // old address
  if(id&&!LEARN[id])id="";
  var el=document.getElementById("learn-page");if(!el)return;
  var main=id?learnLessonHTML(id):learnHomeHTML();
  el.innerHTML="<aside class='learn-side' aria-label='Lessons'><a class='learn-side-home"+(id?"":" cur")+"' href='#learn' onclick=\"learnGo('');return false;\">All lessons</a>"+learnNav(id)+"</aside><div class='learn-main'>"+learnUnits(learnFacts(main))+"</div>";
  learnFigs(el);
  _learnShown=id;
  document.title=(id?LEARN[id].title+" · ":"")+"Learn · Comfort Score";
}
// Redraw when °C/°F changes so the numbers follow
["btn-c","btn-f"].forEach(function(b){var e=document.getElementById(b);if(e)e.addEventListener("click",function(){if(_learnShown!==null&&document.body.classList.contains("view-learn"))learnRender(_learnShown);});});
learnFetchLive();
window.LEARN_READY=true;
