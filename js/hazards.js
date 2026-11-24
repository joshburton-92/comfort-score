// Comfort Score · hazards.js — UV, air quality, fire danger, heatwave, coldwave, warmer/cooler than usual, wind chill, hypothermia, storms, winds, cyclones, hazard and UV popups
// Loaded by index.html (classic script, deferred, in a fixed order). All names are global.
// ── UV Index ───────────────────────────────────────────────────────────────
function uvAnnotation(uv){
  if(uv===null||uv===undefined||uv<3)return null;
  if(uv<6) return{c:"ann-uv",t:"UV moderate 🕶️"};
  if(uv<8) return{c:"ann-uv",t:"UV high 🧴"};
  if(uv<11)return{c:"ann-uv",t:"UV very high 🧴"};
  return{c:"ann-uv",t:"UV extreme ☠️"};
}
function uvAnnotationDaytime(uv){
  // Like uvAnnotation but shows a "low UV" pill during daylight even when UV<3
  if(uv===null||uv===undefined)return null;
  if(uv<3) return{c:"ann-uv",t:"UV low ✅"};
  if(uv<6) return{c:"ann-uv",t:"UV moderate 🕶️"};
  if(uv<8) return{c:"ann-uv",t:"UV high 🧴"};
  if(uv<11)return{c:"ann-uv",t:"UV very high 🧴"};
  return{c:"ann-uv",t:"UV extreme ☠️"};
}
function isCurrentlyDaytime(fc){
  // Returns true if current time is between today's sunrise and sunset
  if(!fc||!fc.daily||!fc.daily.sunrise||!fc.daily.sunset)return false;
  var tz=fc.timezone,tzOff=getTZOffsetMin(tz),now=Date.now();
  var todayStr=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  var todayDayIdx=fc.daily.time?fc.daily.time.indexOf(todayStr):0;
  if(todayDayIdx<0)todayDayIdx=0;
  var sr=toEpoch(fc.daily.sunrise[todayDayIdx],tzOff);
  var ss=toEpoch(fc.daily.sunset[todayDayIdx],tzOff);
  return now>=sr&&now<=ss;
}

// ── Air Quality ────────────────────────────────────────────────────────────
function aqiAnnotation(aqi){
  if(aqi===null||aqi===undefined||aqi<=50)return null;
  if(aqi<=100)return{c:"ann-aqi ann-info",t:"AQI moderate 😷"};
  if(aqi<=150)return{c:"ann-aqi ann-info",t:"AQI unhealthy* 😷"};
  if(aqi<=200)return{c:"ann-aqi ann-info",t:"AQI unhealthy 😷"};
  if(aqi<=300)return{c:"ann-aqi ann-info",t:"AQI very unhealthy 😷"};
  return{c:"ann-aqi ann-info",t:"AQI hazardous ☣️"};
}
function showAQIPop(slotIdx){
  var aq=window._AQ;
  if(!aq||!aq.hourly)return;
  var fromTitle=document.getElementById("pop-ttl").textContent;
  var fromBody=document.getElementById("pop-body").innerHTML;
  var backLink=fromTitle?"<div style='margin-top:12px;padding-top:10px;border-top:1px solid var(--divider);text-align:center;font-size:12px;font-weight:700;color:var(--text-muted);cursor:pointer' onclick='document.getElementById(\"pop-ttl\").textContent=decodeURIComponent(\""+encodeURIComponent(fromTitle)+"\");document.getElementById(\"pop-body\").innerHTML=decodeURIComponent(\""+encodeURIComponent(fromBody)+"\")'>\u2190 Back</div>":"";
  var idx=slotIdx;
  if(idx===null||idx===undefined){
    var fc=window._FC;
    var tz=fc?fc.timezone:"UTC";
    var nowHour=localHourInTZ(tz);
    var todayStr=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    idx=0;
    for(var i=0;i<(aq.hourly.time||[]).length;i++){
      if(aq.hourly.time[i].slice(0,10)===todayStr&&parseInt(aq.hourly.time[i].slice(11,13))===nowHour){idx=i;break;}
    }
  }
  var h=aq.hourly;
  function val(arr){var v=(arr||[])[idx];return(v===null||v===undefined)?null:Math.round(v);}
  var aqi=val(h.us_aqi);
  var pm25=val(h.pm2_5);
  var pm10=val(h.pm10);
  var o3=val(h.ozone);
  var no2=val(h.nitrogen_dioxide);
  var so2=val(h.sulphur_dioxide);
  var grassPollen=val(h.grass_pollen);
  var dust=val(h.dust);

  function aqiLabel(v){if(v===null)return"—";if(v<=50)return"Good";if(v<=100)return"Moderate";if(v<=150)return"Unhealthy for sensitive groups";if(v<=200)return"Unhealthy";if(v<=300)return"Very unhealthy";return"Hazardous";}
  function aqiCol(v){if(v===null)return"var(--text-muted)";if(v<=50)return"#1a7a3a";if(v<=100)return"#8a7000";if(v<=150)return"#b05010";if(v<=200)return"#a02020";if(v<=300)return"#7a0080";return"#4a0000";}
  // Tint: returns rgba bg and border for a tile given value and thresholds [good, moderate, high, vhigh]
  function tint(v,t1,t2,t3,t4){
    if(v===null)return{bg:"var(--card-inner)",border:"var(--card-inner-border)",col:"var(--text-muted)"};
    if(v<=t1)return{bg:"rgba(26,122,58,0.12)",border:"rgba(26,122,58,0.3)",col:"#1a7a3a"};
    if(v<=t2)return{bg:"rgba(138,112,0,0.12)",border:"rgba(138,112,0,0.3)",col:"#8a7000"};
    if(v<=t3)return{bg:"rgba(176,80,16,0.12)",border:"rgba(176,80,16,0.3)",col:"#b05010"};
    if(v<=t4)return{bg:"rgba(160,32,32,0.12)",border:"rgba(160,32,32,0.3)",col:"#a02020"};
    return{bg:"rgba(122,0,128,0.12)",border:"rgba(122,0,128,0.3)",col:"#7a0080"};
  }
  // Per-pollutant thresholds (US EPA, μg/m³): good / moderate / USG / unhealthy / very unhealthy
  var tPM25 =tint(pm25, 12,  35,  55, 150);
  var tPM10 =tint(pm10, 55, 155, 255, 355);
  var tO3   =tint(o3,   60, 100, 140, 180);
  var tNO2  =tint(no2,  40,  80, 180, 280);
  var tSO2  =tint(so2,  35,  75, 185, 305);
  var tDust =tint(dust, 25,  50, 100, 200);
  var tPoll =tint(grassPollen, 10, 30, 80, 200);

  // Info tooltip: inline expand on tap using a hidden div pattern
  // Each pollutant tile has a small ⓘ that toggles a detail div
  function tile(id,label,value,t,infoText){
    var disp=value===null?"—":value;
    var col=t.col;
    return "<div style='background:"+t.bg+";border:1px solid "+t.border+";border-radius:8px;padding:6px 8px;position:relative'>"
      +"<div style='display:flex;align-items:center;justify-content:space-between;margin-bottom:2px'>"
      +"<div style='font-size:10px;font-weight:700;color:var(--text-muted)'>"+label+"</div>"
      +"<div class='ibtn' style='flex-shrink:0' onclick='(function(el){el.style.display=el.style.display===\"none\"?\"block\":\"none\";})(document.getElementById(\"aqti-"+id+"\"))'>i</div>"
      +"</div>"
      +"<div style='font-size:18px;font-weight:800;color:"+col+"'>"+disp+"</div>"
      +"<div id='aqti-"+id+"' style='display:none;margin-top:6px;padding-top:6px;border-top:1px solid var(--divider);font-size:10px;font-weight:600;color:var(--text-muted);line-height:1.5'>"+infoText+"</div>"
      +"</div>";
  }

  var body="<div class='washing-reason'>"
    +"<div style='font-size:24px;font-weight:800;color:"+aqiCol(aqi)+";margin-bottom:2px'>"+(aqi===null?"—":aqi)+"</div>"
    +"<div style='font-size:15px;font-weight:800;color:"+aqiCol(aqi)+";margin-bottom:10px'>"+aqiLabel(aqi)+"</div>"
    +"<div style='font-size:11px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px'>Pollutants</div>"
    +"<div style='display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:10px'>"
    +tile("pm25","PM2.5 (μg/m³)",pm25,tPM25,"Fine particles &lt;2.5μm. Penetrate deep into lungs and bloodstream. Main risk in bushfire smoke &amp; traffic. Good ≤12 · Moderate ≤35 · High ≤55 · Unhealthy ≤150")
    +tile("pm10","PM10 (μg/m³)",pm10,tPM10,"Coarser particles &lt;10μm. Dust, pollen, smoke. Irritate eyes, nose &amp; throat. Good ≤55 · Moderate ≤155 · High ≤255 · Unhealthy ≤355")
    +tile("o3","Ozone O₃ (μg/m³)",o3,tO3,"Ground-level ozone formed by sunlight &amp; traffic fumes. Triggers asthma, reduces lung function. Worst on hot sunny afternoons. Good ≤60 · Moderate ≤100 · High ≤140")
    +tile("no2","NO₂ (μg/m³)",no2,tNO2,"Nitrogen dioxide from vehicles &amp; industry. Inflames airways, worsens asthma. Good ≤40 · Moderate ≤80 · High ≤180")
    +tile("so2","SO₂ (μg/m³)",so2,tSO2,"Sulphur dioxide from power plants &amp; volcanoes. Causes breathing difficulty. Good ≤35 · Moderate ≤75 · High ≤185")
    +tile("dust","Dust (μg/m³)",dust,tDust,"Windblown mineral dust. Can travel thousands of km. Reduces visibility and worsens respiratory conditions. Good ≤25 · Moderate ≤50 · High ≤100")
    +"</div>"
    +"<div style='font-size:11px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.05em;margin-bottom:6px'>Pollen</div>"
    +"<div style='display:grid;grid-template-columns:1fr 1fr;gap:5px;margin-bottom:10px'>"
    +tile("gpoll","Grass pollen",grassPollen,tPoll,"Grass pollen count (grains/m³). Main trigger for hay fever in Australia. Low ≤10 · Moderate ≤30 · High ≤80 · Very high &gt;80. Only available in Europe — shown as — elsewhere.")
    +"</div>"
    +"<div style='font-size:11px;color:var(--text-muted);font-weight:600;line-height:1.5'>US AQI scale. Tap ⓘ on any tile for details.</div>"
    +backLink
    +"</div>";
  document.getElementById("pop-ttl").innerHTML="Air Quality 😷";
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}

// ── Fire Danger (FFDI) ─────────────────────────────────────────────────────
function calcDroughtFactor(dailyRain,dailyTmax,dailyRhMin){
  // Evaporation-weighted rainfall sum over past 20 days
  // Rain suppresses fire risk less in hot/dry conditions (faster decay)
  // and more in cool/humid conditions (slower decay)
  // Returns drought factor 1-10 (10 = most severe drought)
  if(!dailyRain||!dailyRain.length)return 5;
  var weightedRain=0;
  var days=Math.min(dailyRain.length,20);
  for(var i=0;i<days;i++){
    var rain=Math.max(0,(dailyRain[i]||0)-3); // ignore first 3mm (interception/surface evap); only net rainfall suppresses drought
    var age=days-i; // 1=most recent, 20=oldest
    // Evaporative demand for this day: 0=cool/humid, 1=hot/dry
    var tMax=dailyTmax?dailyTmax[i]:null;
    var rhMin=dailyRhMin?dailyRhMin[i]:null;
    var evapDemand=0.5; // neutral fallback if no data
    if(tMax!==null&&tMax!==undefined&&rhMin!==null&&rhMin!==undefined){
      var tFactor=Math.max(0,Math.min(1,(tMax-10)/30)); // 0 at 10C, 1 at 40C+
      var rhFactor=Math.max(0,Math.min(1,(100-rhMin)/70)); // 0 at 100% RH, 1 at 30% RH
      evapDemand=tFactor*rhFactor;
    }
    // Decay rate: 0.05 (cool/humid, slow) to 0.20 (hot/dry, fast)
    var decayRate=0.05+0.15*evapDemand;
    var weight=Math.exp(-decayRate*age);
    weightedRain+=rain*weight;
  }
  // Map weighted rain to drought factor: 0mm->10, 50mm+->1
  var df=10-Math.min(9,weightedRain/5);
  return Math.max(1,Math.min(10,df));
}
function getDailyTmaxRhMin(fc,dateKeys){
  // Extracts daily max temp and min RH from hourly data for given date strings
  // Returns {tmax:[...], rhmin:[...]} parallel to dateKeys
  var tmax=[],rhmin=[];
  if(!fc||!fc.hourly)return{tmax:tmax,rhmin:rhmin};
  var times=fc.hourly.time,temps=fc.hourly.temperature_2m,rhs=fc.hourly.relative_humidity_2m;
  for(var d=0;d<dateKeys.length;d++){
    var key=dateKeys[d],dayTmax=null,dayRhMin=null;
    for(var i=0;i<times.length;i++){
      if(times[i].slice(0,10)!==key)continue;
      if(temps[i]!==null&&(dayTmax===null||temps[i]>dayTmax))dayTmax=temps[i];
      if(rhs[i]!==null&&(dayRhMin===null||rhs[i]<dayRhMin))dayRhMin=rhs[i];
    }
    tmax.push(dayTmax);
    rhmin.push(dayRhMin);
  }
  return{tmax:tmax,rhmin:rhmin};
}
function calcFFDI(temp,rh,wind,df){
  // McArthur Forest Fire Danger Index
  rh=Math.max(1,Math.min(100,rh));
  df=Math.max(1,Math.min(10,df));
  wind=Math.max(0,wind);
  return Math.round(2*Math.exp(-0.45+0.987*Math.log(df)-0.0345*rh+0.0338*temp+0.0234*wind));
}
function ffdiInfo(ffdi){
  if(ffdi<12)return null; // None, not shown
  if(ffdi<24)return{label:"Moderate",col:"#64BF30",emoji:"🔥"};
  if(ffdi<50)return{label:"High",col:"#FFDD39",emoji:"🔥"};
  if(ffdi<100)return{label:"Extreme",col:"#F78100",emoji:"🔥"};
  return{label:"Catastrophic",col:"#AD0A08",emoji:"🔥"};
}
function getFireDangerForFC(fc){
  // Returns {currentFFDI, todayMaxFFDI, df} or null if data unavailable
  if(!fc||!fc.hourly||!fc.hourly.relative_humidity_2m)return null;
  var dailyRain=fc.daily&&fc.daily.precipitation_sum?fc.daily.precipitation_sum:[];
  var dailyDates=fc.daily&&fc.daily.time?fc.daily.time:[];
    // Drought factor needs the 20 days immediately BEFORE today. Locate today by
  // date rather than assuming a fixed past_days offset, so changing past_days
  // (the heatwave index needs 32) can't silently shift this window.
  var fdToday=new Intl.DateTimeFormat("en-CA",{timeZone:fc.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  var fdIdx=dailyDates.indexOf(fdToday);
  if(fdIdx<0)fdIdx=Math.min(20,dailyDates.length);
  var fdFrom=Math.max(0,fdIdx-20);
  var pastRain=dailyRain.slice(fdFrom,fdIdx);
  var pastDates=dailyDates.slice(fdFrom,fdIdx);
  var evap=getDailyTmaxRhMin(fc,pastDates);
  var df=calcDroughtFactor(pastRain,evap.tmax,evap.rhmin);
  var times=fc.hourly.time,rhs=fc.hourly.relative_humidity_2m,temps=fc.hourly.temperature_2m,winds=fc.hourly.wind_speed_10m;
  var tz=fc.timezone,tzOff=getTZOffsetMin(tz),nowEpoch=Date.now();
  // Today's date string in location timezone
  var todayStr=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  var todayMaxFFDI=0;
  for(var i=0;i<times.length;i++){
    if(times[i].slice(0,10)!==todayStr)continue;
    var ffdi=calcFFDI(temps[i],rhs[i],winds[i],df);
    if(ffdi>todayMaxFFDI)todayMaxFFDI=ffdi;
  }
  // Current FFDI from _LW
  var currentFFDI=null;
  if(window._LW){
    var rh=window._LW.rh!=null?window._LW.rh:50;
    currentFFDI=calcFFDI(window._LW.temp,rh,window._LW.wind,df);
  }
  return{currentFFDI:currentFFDI,todayMaxFFDI:todayMaxFFDI,df:Math.round(df*10)/10};
}
function getMaxFFDIForDay(fc,dateStr){
  if(!fc||!fc.hourly||!fc.hourly.relative_humidity_2m)return null;
  var dailyRain=fc.daily&&fc.daily.precipitation_sum?fc.daily.precipitation_sum:[];
  var dailyDates=fc.daily&&fc.daily.time?fc.daily.time:[];
  // Drought factor uses the 20 days immediately BEFORE dateStr, located by date
  // (calcDroughtFactor only reads 20 entries, so a fixed slice(0,20) went stale
  // once past_days=32 was added)
  var tIdx=dailyDates.indexOf(dateStr);
  if(tIdx<0)tIdx=dailyDates.length;
  var dFrom=Math.max(0,tIdx-20);
  var datesUpToDate=dailyDates.slice(dFrom,tIdx);
  var rainUpToDate=dailyRain.slice(dFrom,tIdx);
  var evap=getDailyTmaxRhMin(fc,datesUpToDate);
  var df=calcDroughtFactor(rainUpToDate,evap.tmax,evap.rhmin);
  var times=fc.hourly.time,rhs=fc.hourly.relative_humidity_2m,temps=fc.hourly.temperature_2m,winds=fc.hourly.wind_speed_10m;
  var maxFFDI=0;
  for(var i=0;i<times.length;i++){
    if(times[i].slice(0,10)!==dateStr)continue;
    var ffdi=calcFFDI(temps[i],rhs[i],winds[i],df);
    if(ffdi>maxFFDI)maxFFDI=ffdi;
  }
  return maxFFDI;
}
// ── Heatwave index ─────────────────────────────────────────────────────────
// Structure follows the Bureau's Excess Heat Factor (Nairn & Fawcett), but the
// significance threshold and severity scale are normalised against this app's
// own climatology rather than a fitted EHF85, so no historical data is needed
// beyond the cache. Constants calibrated against BoM station records for
// Adelaide, Melbourne, Cairns and Darwin (23,080 three-day windows): 98% band
// agreement with true EHF severity, every disagreement adjacent-band.
var HW_K=0.578;       // heatwave threshold sits this far into the local range
var HW_C=0.47;        // EHF85 ~ HW_C * Range^2
var HW_LIFT=0.45;     // overnight-minimum lift on an extreme day
var HW_SEASON=2;      // months either side of the climatological peak
var HW_MIN_SCALE=2;   // lowest x/10 shown; 1/10 was over a third of all firings

function hwClimatology(entry){
  if(!entry||!entry.monthly||entry.monthly.length<12)return null;
  var m=entry.monthly,i,x;
  for(i=0;i<12;i++){
    x=m[i];
    if(!x||x.T===null||x.T===undefined||x.tmin===null||x.tmin===undefined
      ||x.tmaxMax===null||x.tmaxMax===undefined)return null;
  }
  var dmtOf=function(a){return (a.T+a.tmin)/2;};
  var srt=m.slice(0,12).sort(function(a,b){return dmtOf(b)-dmtOf(a);});
  var Thot=(dmtOf(srt[0])+dmtOf(srt[1]))/2;
  var hm=srt[0],sp=hm.tmaxMax-hm.T;
  var Range=(hm.tmaxMax+hm.tmin+HW_LIFT*sp)/2-Thot;
  if(!(Range>0.5))return null;
  var pk=1;for(i=0;i<12;i++)if(m[i]===hm){pk=i+1;break;}
  return{Thot:Thot,Range:Range,thresh:Thot+HW_K*Range,peak:pk};
}
function hwScale(s){
  if(s<=0)return 0;
  var h=s<1?1+2.5*s:(s<3?3.5+4*Math.log(s)/Math.log(3):7.5+3*Math.log(s/3)/Math.log(3));
  return Math.max(1,Math.min(10,Math.round(Math.min(h,10.49))));
}
function hwInfo(s){
  if(s>=3)return{label:"Extreme heatwave",col:"rgba(150,25,60,1)",band:3};
  if(s>=1)return{label:"Severe heatwave",col:"rgba(205,60,15,1)",band:2};
  return{label:"Low-intensity heatwave",col:"rgba(205,140,15,1)",band:1};
}
// Severity per CALENDAR DAY: the worst three-day window that covers that day,
// so a day sitting mid-event still reads high even as the event winds down.
function heatwaveDays(fc,clim){
  if(!fc||!fc.daily||!fc.daily.time||!clim)return null;
  var dates=fc.daily.time,tx=fc.daily.temperature_2m_max,tn=fc.daily.temperature_2m_min;
  if(!tx||!tn)return null;
  var n=dates.length,dmt=[],i,j,map={};
  for(i=0;i<n;i++){
    dmt.push((i+1<n&&tx[i]!==null&&tx[i]!==undefined&&tn[i+1]!==null&&tn[i+1]!==undefined)
      ?(tx[i]+tn[i+1])/2:null);
  }
  for(i=30;i<n-2;i++){
    var mo=parseInt(dates[i].slice(5,7),10),dm=Math.abs(mo-clim.peak);
    if(dm>6)dm=12-dm;
    if(dm>HW_SEASON)continue;
    var ok=true;
    for(j=i-30;j<i+3;j++){if(dmt[j]===null||dmt[j]===undefined){ok=false;break;}}
    if(!ok)continue;
    var d3=(dmt[i]+dmt[i+1]+dmt[i+2])/3,s30=0;
    for(j=i-30;j<i;j++)s30+=dmt[j];
    var d30=s30/30;
    var sig=(d3-clim.thresh)/clim.Range;
    if(sig<=0)continue;
    var sev=sig*Math.max(1,d3-d30)/(HW_C*clim.Range);
    for(j=i;j<i+3;j++){
      if(!map[dates[j]]||sev>map[dates[j]].sev)
        map[dates[j]]={sev:sev,d3:d3,d30:d30,winStart:dates[i]};
    }
  }
  // Below HW_MIN_SCALE isn't shown anywhere (strip, tiles, day card)
  for(var dk in map)if(hwScale(map[dk].sev)<HW_MIN_SCALE)delete map[dk];
  return{dates:dates,map:map,clim:clim,lastDay:n-3};
}
// One day's reading, plus the span of the event it belongs to.
function hwForDate(hwd,dateStr){
  if(!hwd||!hwd.map[dateStr])return null;
  var e=hwd.map[dateStr],d=hwd.dates,i=d.indexOf(dateStr);
  var lo=i,hi=i;
  while(lo>0&&hwd.map[d[lo-1]])lo--;
  while(hi<d.length-1&&hwd.map[d[hi+1]])hi++;
  var info=(hwd.info||hwInfo)(e.sev,e),j;
  // The peak is a BAND of days, not one. Several days routinely round to the
  // same x/10, and singling out the first of them reads as a separate event
  // that has already passed.
  var top=0;
  for(j=lo;j<=hi;j++)top=Math.max(top,hwScale(hwd.map[d[j]].sev));
  var pFrom=-1,pTo=-1;
  for(j=lo;j<=hi;j++){
    if(hwScale(hwd.map[d[j]].sev)===top){if(pFrom<0)pFrom=j;pTo=j;}
  }
  var scale=hwScale(e.sev);
  // The scan can't see past the forecast, so an event still running at the end
  // of it must not be reported as ending there.
  var openEnded=(hi>=hwd.lastDay);
  return{sev:e.sev,scale:scale,label:info.label,col:info.col,band:info.band,
    date:dateStr,start:d[lo],end:d[hi],
    peakScale:top,peakFrom:d[pFrom],peakTo:d[pTo],atPeak:(scale===top),
    days:hi-lo+1,remaining:hi-i+1,openEnded:openEnded,d3:e.d3,d30:e.d30,cooler:!!info.cooler,
    thresh:hwd.clim.thresh,range:hwd.clim.Range};
}
function hwToday(fc,clim){
  var hwd=heatwaveDays(fc,clim);
  if(!hwd)return null;
  var today=new Intl.DateTimeFormat("en-CA",{timeZone:fc.timezone||"UTC",
    year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  return hwForDate(hwd,today);
}
// ── Coldwave index (Excess Cold Factor, from cache + forecast) ─────────────
// Mirror of the heatwave index. Constants fitted against 31 years of daily data for
// 21 cities from Darwin to Harbin (99,090 cold-season three-day windows): 97% exact
// band agreement with true ECF severity, almost never more than one band out.
var CW_K=0.49;        // coldwave threshold sits this far below the coldest-month baseline, in Ranges
var CW_C=0.50;        // ECF85 ~ CW_C * Range^2
var CW_DROP=0.5;      // daytime-maximum drop on an extreme cold day
var CW_SEASON=2;      // months either side of the climatological coldest month
// Mild-temperature cut-off. A spell whose three-day mean (day and night) is CW_WARM °C or
// more is still unusually cool for the place, but not cold: 4/10 and above shows as a
// "Cooler spell" with no cold-health advice, and 1–3/10 isn't shown at all. Without it,
// low-Range tropical climates (Singapore, Jakarta) flagged "cold snaps" on 29°C days.
var CW_WARM=18;
function cwClimatology(entry){
  if(!entry||!entry.monthly||entry.monthly.length<12)return null;
  var m=entry.monthly,i,x;
  for(i=0;i<12;i++){
    x=m[i];
    if(!x||x.T==null||x.tmin==null||x.tminMin==null)return null;
  }
  var dmtOf=function(a){return (a.T+a.tmin)/2;};
  var srt=m.slice(0,12).sort(function(a,b){return dmtOf(a)-dmtOf(b);});
  var Tcold=(dmtOf(srt[0])+dmtOf(srt[1]))/2;
  var cm=srt[0],sp=cm.tmin-cm.tminMin;
  var Range=Tcold-(cm.T+cm.tminMin-CW_DROP*sp)/2;
  if(!(Range>0.5))return null;
  var pk=1;for(i=0;i<12;i++)if(m[i]===cm){pk=i+1;break;}
  return{Tcold:Tcold,Range:Range,thresh:Tcold-CW_K*Range,peak:pk};
}
function cwInfo(s,e){
  if(e&&e.warm)return{label:"Cooler spell",col:"rgba(40,130,140,1)",band:0,cooler:true};
  if(s>=3)return{label:"Extreme coldwave",col:"rgba(90,40,180,1)",band:3};
  if(s>=1)return{label:"Severe coldwave",col:"rgba(30,90,210,1)",band:2};
  return{label:"Cold snap",col:"rgba(60,125,175,1)",band:1};
}
// Same per-calendar-day scan as heatwaveDays, mirrored for cold
function coldwaveDays(fc,clim){
  if(!fc||!fc.daily||!fc.daily.time||!clim)return null;
  var dates=fc.daily.time,tx=fc.daily.temperature_2m_max,tn=fc.daily.temperature_2m_min;
  if(!tx||!tn)return null;
  var n=dates.length,dmt=[],i,j,map={};
  for(i=0;i<n;i++){
    dmt.push((i+1<n&&tx[i]!=null&&tn[i+1]!=null)?(tx[i]+tn[i+1])/2:null);
  }
  for(i=30;i<n-2;i++){
    var mo=parseInt(dates[i].slice(5,7),10),dm=Math.abs(mo-clim.peak);
    if(dm>6)dm=12-dm;
    if(dm>CW_SEASON)continue;
    var ok=true;
    for(j=i-30;j<i+3;j++){if(dmt[j]==null){ok=false;break;}}
    if(!ok)continue;
    var d3=(dmt[i]+dmt[i+1]+dmt[i+2])/3,s30=0;
    for(j=i-30;j<i;j++)s30+=dmt[j];
    var d30=s30/30;
    var sig=(clim.thresh-d3)/clim.Range;
    if(sig<=0)continue;
    var sev=sig*Math.max(1,d30-d3)/(CW_C*clim.Range);
    for(j=i;j<i+3;j++){
      if(!map[dates[j]]||sev>map[dates[j]].sev)
        map[dates[j]]={sev:sev,d3:d3,d30:d30,winStart:dates[i]};
    }
  }
  // Mild spells: hide 1–3/10, mark the rest as a "Cooler spell"
  for(var dk in map){
    if(map[dk].d3<CW_WARM)continue;
    if(map[dk].sev<1)delete map[dk];else map[dk].warm=true;
  }
  return{dates:dates,map:map,clim:clim,lastDay:n-3,info:cwInfo};
}
function cwAdvice(band){
  var a="<div style='font-size:12.5px;font-weight:600;color:var(--text);line-height:1.65'>"
    +"Keep your home warm \u2014 around 18\u00B0C or more in the rooms you use \u2014 especially for older people, babies and anyone unwell. Wear layers indoors as well as out, and check on neighbours who are elderly or living alone.";
  if(band>=2)a+=" At this level cold raises the risk of heart attacks, strokes and chest infections for people who are otherwise well, not only the frail. Avoid long spells in cold rooms, eat warm meals, and keep hard outdoor exertion short. Never run an outdoor gas heater, barbecue or generator indoors \u2014 carbon monoxide kills.";
  if(band>=3)a+=" Extreme cold is dangerous to everyone. Limit time outdoors, protect water pipes where freezing is a risk, and make sure anyone without reliable heating has somewhere warm to go.";
  a+=" Follow your local weather service and health authority for official cold warnings.</div>";
  return a;
}
// Body for a "Cooler spell": what to expect, who might notice, and why it isn't a cold snap
function coolerText(h,deg){
  var p="<div style='font-size:12.5px;font-weight:600;color:var(--text);line-height:1.65'>";
  return p+"<b>What to expect:</b> days and nights running cooler than usual for this time of year here, averaging "+deg(h.d3)+" across day and night against a typical cool-season "+deg(h.thresh+CW_K*h.range)+". For most people that\u2019s pleasant rather than a problem.</div>"
    +p.replace("line-height:1.65'","line-height:1.65;margin-top:8px'")+"<b>Who might notice:</b> if you\u2019re used to the warmth it can feel chilly, especially overnight and early in the morning. Babies, older people and anyone unwell lose heat more easily, so keep an extra layer or blanket handy at night.</div>"
    +p.replace("line-height:1.65'","line-height:1.65;margin-top:8px'")+"<b>Why it\u2019s showing:</b> cold is measured against what\u2019s normal for each place, and this spell is unusual enough here to rate "+h.scale+"/10. Because the temperatures themselves are mild \u2014 an average of "+String(Math.round(toDisp(CW_WARM)))+unitSym()+" or more across day and night \u2014 it\u2019s shown as a cooler spell rather than a cold snap or coldwave, and milder readings aren\u2019t shown at all.</div>";
}
function showColdwavePop(dateStr,backDi){
  var h=window._CWDAYS?hwForDate(window._CWDAYS,dateStr||window._CWPILLDATE):null;
  var back=backDi!==undefined&&backDi!==null?"<div style='margin-top:12px;padding-top:10px;border-top:1px solid var(--divider);text-align:center;font-size:12px;font-weight:700;color:var(--text-muted);cursor:pointer' onclick='show7DaySlot("+backDi+")'>\u2190 Back</div>":"";
  var body,title="Coldwave \u2744\uFE0F";
  if(!h){
    body="<div class='washing-reason'><div style='font-size:12px;color:var(--text-muted)'>No coldwave conditions for this day.</div>"+back+"</div>";
  }else{
    if(h.band===1)title="Cold snap \u2744\uFE0F";
    if(h.cooler)title="Cooler spell \uD83C\uDF43";
    var nowStr=new Intl.DateTimeFormat("en-CA",{timeZone:(window._FC&&window._FC.timezone)||"UTC",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    var startTxt=h.start===nowStr?"Started today":(h.start<nowStr?"Began "+hwDayFmt(h.start):"Starts "+hwDayFmt(h.start));
    var endTxt=h.openEnded?"still going at the end of the forecast"
      :(h.end===nowStr?"easing after today"
      :(h.end>nowStr?"easing after "+hwDayFmt(h.end):"eased after "+hwDayFmt(h.end)));
    var tail=h.openEnded?" \u2014 at least "+h.days+" days so far"
      :" \u2014 "+(h.days===1?"a single day":h.days+" days")+" in all";
    var dur=startTxt+", "+endTxt+tail+".";
    var peakTxt="";
    if(!h.atPeak){
      var pr=h.peakFrom===h.peakTo?hwDayFmt(h.peakFrom):hwDayFmt(h.peakFrom)+" \u2013 "+hwDayFmt(h.peakTo);
      var pv=h.peakTo<nowStr?"Peaked ":(h.peakFrom>nowStr?"Peaks ":"Peaking ");
      peakTxt=pv+pr+" at "+h.peakScale+"/10.";
    }
    var rule="<div style='height:1px;background:var(--divider);margin:11px 0 10px'></div>";
    var deg=function(v){return String(toDisp(v).toFixed(1)).replace("-","\u2212")+unitSym();};
    body="<div class='washing-reason'>"
      +"<div style='font-size:15px;font-weight:800;color:"+h.col+";margin-bottom:1px'>"+h.label+" \u2014 "+h.scale+"/10</div>"
      +"<div style='font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:9px'>"+hwDayFmt(h.date)+"</div>"
      +"<div style='font-size:14px;font-weight:800;color:var(--text);line-height:1.5'>"+dur+"</div>"
      +(peakTxt?"<div style='font-size:13px;font-weight:700;color:var(--text-muted);margin-top:3px'>"+peakTxt+"</div>":"")
      +rule
      +(h.cooler?coolerText(h,deg):cwAdvice(h.band))
      +rule
      +"<div style='font-size:11px;color:var(--text-muted);line-height:1.6'>"
      +"Three-day mean temperature "+deg(h.d3)+" against a local coldwave threshold of "+deg(h.thresh)+", with the preceding 30 days averaging "+deg(h.d30)+". "
      +"Intensity follows the Excess Cold Factor method, the cold counterpart of the Excess Heat Factor: it measures cold against both the local climate and the month before it, so a spell that passes unremarked in one city can be severe in another. "
      +"Cold snaps are the low-intensity end (1\u20133/10); severe and extreme coldwaves start at 4/10. "
      +"This is an independent calculation from this app\u2019s own climate data on a present-day baseline, not an official warning product, and it may differ from your local service\u2019s assessment.</div>"
      +back+"</div>";
  }
  document.getElementById("pop-ttl").innerHTML=title;
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}
// Heat- and cold-wave readings for the 7-day tiles, worked out once per forecast
function waveDaysFor(fc){
  if(window._WAVEFC===fc&&window._WAVEDAYS)return window._WAVEDAYS;
  var ent=(fc&&typeof findClimEntry==="function")?findClimEntry(fc.latitude,fc.longitude,fc.elevation,CLIM_HAZARD_KM,true):null;
  var hc=ent?hwClimatology(ent):null,cc=ent?cwClimatology(ent):null;
  window._WAVEFC=fc;
  window._WAVEDAYS={hw:hc?heatwaveDays(fc,hc):null,cw:cc?coldwaveDays(fc,cc):null,an:ent?anomDays(fc,ent):null};
  return window._WAVEDAYS;
}
function waveTileTags(fc,dateStr){
  var w=waveDaysFor(fc),out="";
  if(w.hw&&w.hw.map[dateStr])out+="<div class='fc-hw'>\uD83C\uDF21\uFE0F Heatwave</div>";
  if(w.cw&&w.cw.map[dateStr]){
    var ci=cwInfo(w.cw.map[dateStr].sev,w.cw.map[dateStr]),b=ci.band;
    out+="<div class='"+(b>=2?"fc-cw":"fc-cs")+"'>"+(ci.cooler?"\uD83C\uDF43 Cooler":"\u2744\uFE0F "+(b>=2?"Coldwave":"Cold snap"))+"</div>";
  }
  // Warmer/cooler than usual: both levels (plain and "Much") show on the tiles
  var an=out?null:anomFor(fc,dateStr);
  if(an&&an.lvl>=1)out+="<div class='"+(an.warm?"fc-an-w":"fc-an-c")+"'>"+(an.warm?"\u2191 Warmer":"\u2193 Cooler")+"</div>";
  return out;
}
// ── Warmer / cooler than usual ─────────────────────────────────────────────
// Each forecast day's high and low against the normal for that date here, from the same
// climate profile the heatwave check uses (within 50 km, adjusted for height). The normal
// is a smooth line through the monthly averages, each sitting at mid-month.
// How far counts as unusual depends on the place: a month's average hottest day sits about
// ANOM_SPREAD standard deviations above its average high (its coldest night as far below its
// average low), which sets the size of a normal day-to-day swing there. A day's reading is
// the average of its high's and low's departures in those units. Heatwave and coldwave take
// precedence: this shows only on days neither covers.
var ANOM_SPREAD=1.8,ANOM_SD_MIN=0.8;
var ANOM_LVLS=[{z:2.25,w:"Much ",lvl:2},{z:1.5,w:"",lvl:1}];   // a third level, "A bit" at 0.9, fired too often and too close to normal
function anomNormal(m,dateStr){
  var y=+dateStr.slice(0,4),mo=+dateStr.slice(5,7)-1,d=+dateStr.slice(8,10);
  var dim=new Date(Date.UTC(y,mo+1,0)).getUTCDate();
  var t=mo+(d-0.5)/dim-0.5,i0=Math.floor(t),f=t-i0,a=m[(i0+12)%12],b=m[(i0+13)%12];
  function L(k){return a[k]+(b[k]-a[k])*f;}
  return{hi:L("T"),lo:L("tmin"),
    sdHi:Math.max(ANOM_SD_MIN,(L("tmaxMax")-L("T"))/ANOM_SPREAD),
    sdLo:Math.max(ANOM_SD_MIN,(L("tmin")-L("tminMin"))/ANOM_SPREAD)};
}
function anomDays(fc,ent){
  if(!fc||!fc.daily||!fc.daily.time||!ent||!ent.monthly||ent.monthly.length<12)return null;
  for(var i=0;i<12;i++){var x=ent.monthly[i];if(!x||x.T==null||x.tmin==null||x.tmaxMax==null||x.tminMin==null)return null;}
  var D=fc.daily,tx=D.temperature_2m_max,tn=D.temperature_2m_min,map={};
  if(!tx||!tn)return null;
  for(i=0;i<D.time.length;i++){
    if(tx[i]==null||tn[i]==null)continue;
    var n=anomNormal(ent.monthly,D.time[i]);
    var zH=(tx[i]-n.hi)/n.sdHi,zL=(tn[i]-n.lo)/n.sdLo,z=(zH+zL)/2,lv=null;
    for(var k=0;k<ANOM_LVLS.length;k++)if(Math.abs(z)>=ANOM_LVLS[k].z){lv=ANOM_LVLS[k];break;}
    if(!lv)continue;
    var warm=z>0,lab=lv.w+(warm?"warmer":"cooler")+" than usual";
    map[D.time[i]]={z:z,zH:zH,zL:zL,hi:tx[i],lo:tn[i],n:n,warm:warm,lvl:lv.lvl,label:lab.charAt(0).toUpperCase()+lab.slice(1)};
  }
  return{map:map,ent:ent};
}
// The day's reading, unless a heatwave or coldwave already covers it
function anomFor(fc,dateStr){
  if(!fc)return null;
  var w=waveDaysFor(fc);
  if(!w.an||(w.hw&&w.hw.map[dateStr])||(w.cw&&w.cw.map[dateStr]))return null;
  return w.an.map[dateStr]||null;
}
function normCdf(z){
  var t=1/(1+0.2316419*Math.abs(z)),d=0.3989423*Math.exp(-z*z/2);
  var p=d*t*(0.3193815+t*(-0.3565638+t*(1.781478+t*(-1.821256+t*1.330274))));
  return z>0?1-p:p;
}
function showAnomPop(dateStr,backDi){
  var fc=window._FC,a=anomFor(fc,dateStr);
  var back=backDi!==undefined&&backDi!==null?"<div style='margin-top:12px;padding-top:10px;border-top:1px solid var(--divider);text-align:center;font-size:12px;font-weight:700;color:var(--text-muted);cursor:pointer' onclick='show7DaySlot("+backDi+")'>\u2190 Back</div>":"";
  var body,title="Compared with usual";
  if(!a){
    body="<div class='washing-reason'><div style='font-size:12px;color:var(--text-muted)'>Nothing out of the ordinary for this day.</div>"+back+"</div>";
  }else{
    var col=a.warm?"rgba(215,110,30,1)":"rgba(30,135,165,1)";
    title=(a.warm?"\u2197\uFE0F ":"\u2198\uFE0F ")+a.label;
    var deg=function(v){return String(Math.round(toDisp(v))).replace("-","\u2212")+unitSym();};
    var dd=function(v){var x=Math.round(v*(useFahrenheit?1.8:1));return(x>0?"+":x<0?"\u2212":"\u00B1")+Math.abs(x)+"\u00B0";};
    var n=a.n,k80=1.28,p="<div style='font-size:12.5px;font-weight:600;color:var(--text);line-height:1.65;margin-top:8px'>";
    // The more unusual of the high and the low, if it leans the same way as the day
    var useHi=Math.abs(a.zH)>=Math.abs(a.zL),zc=useHi?a.zH:a.zL,often="";
    if((zc>0)===a.warm&&Math.abs(zc)>=0.8){
      var pr=1-normCdf(Math.abs(zc)),N=Math.round(1/pr);
      often=p+"<b>How unusual:</b> "+(useHi?"a high":"a low")+" this "+(a.warm?"warm":"cool")+" comes on "
        +(N>=100?"fewer than 1 day in 100":"about 1 day in "+N)+" at this time of year here.</div>";
    }
    var src=climFromNote(window._WAVEDAYS&&window._WAVEDAYS.an?window._WAVEDAYS.an.ent:null);
    var rule="<div style='height:1px;background:var(--divider);margin:11px 0 10px'></div>";
    body="<div class='washing-reason'>"
      +"<div style='font-size:15px;font-weight:800;color:"+col+";margin-bottom:1px'>"+a.label+"</div>"
      +"<div style='font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:9px'>"+hwDayFmt(dateStr)+"</div>"
      +"<div style='font-size:14px;font-weight:800;color:var(--text);line-height:1.5'>Forecast: high "+deg(a.hi)+", low "+deg(a.lo)+"</div>"
      +"<div style='font-size:13px;font-weight:700;color:var(--text-muted);margin-top:3px'>Normal for this date: high "+deg(n.hi)+", low "+deg(n.lo)
      +" \u2014 so "+dd(a.hi-n.hi)+" on the high, "+dd(a.lo-n.lo)+" on the low</div>"
      +rule
      +p.replace(";margin-top:8px","")+"<b>What\u2019s normal here:</b> 8 days in 10 at this time of year have a high between "+deg(n.hi-k80*n.sdHi)+" and "+deg(n.hi+k80*n.sdHi)
      +", and a low between "+deg(n.lo-k80*n.sdLo)+" and "+deg(n.lo+k80*n.sdLo)+".</div>"
      +often
      +p+"<b>Why it\u2019s showing:</b> every place has its own normal, and its own size of normal swings \u2014 a few degrees above average is ordinary in some climates and rare in others. "
      +(a.warm?"Heatwave":"Coldwave")+" alerts take over when a spell is long and strong enough to matter for health; this is for days that are out of the ordinary without being that.</div>"
      +rule
      +"<div style='font-size:11px;color:var(--text-muted);line-height:1.6'>Estimated from this app\u2019s climate data: the long-term average for the date, with the usual spread worked out from each month\u2019s average hottest day and coldest night. "
      +"It\u2019s a guide to what\u2019s normal, not an official anomaly."+(src?" "+src+".":"")+"</div>"
      +back+"</div>";
  }
  document.getElementById("pop-ttl").innerHTML=title;
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}
function hwAdvice(band){
  var a="<div style='font-size:12.5px;font-weight:600;color:var(--text);line-height:1.65'>"
    +"Drink water regularly without waiting to feel thirsty, keep out of the sun through the hottest part of the day, and check on anyone nearby who is elderly, unwell, pregnant or living alone. Never leave people or animals in a parked car.";
  if(band>=2)a+=" At this level heat starts to affect people who are otherwise healthy, not only those already vulnerable \u2014 move strenuous work and exercise to early morning, and find somewhere cool to spend the afternoon if your home doesn\u2019t cool down overnight.";
  if(band>=3)a+=" Extreme heat is dangerous to everyone regardless of fitness. Consider cancelling strenuous outdoor activity altogether, and seek out air conditioning \u2014 a library, shopping centre or public cooling centre if you don\u2019t have it at home.";
  a+=" Follow your local weather service and health authority for official heat warnings.</div>";
  return a;
}
function hwDayFmt(d){var p=d.split("-");return new Date(p[0],p[1]-1,p[2]).toLocaleDateString(undefined,{weekday:"short",day:"numeric",month:"short"});}
function showHeatwavePop(dateStr,backDi){
  var h=window._HWDAYS?hwForDate(window._HWDAYS,dateStr||window._HWPILLDATE):null;
  var back=backDi!==undefined&&backDi!==null?"<div style='margin-top:12px;padding-top:10px;border-top:1px solid var(--divider);text-align:center;font-size:12px;font-weight:700;color:var(--text-muted);cursor:pointer' onclick='show7DaySlot("+backDi+")'>\u2190 Back</div>":"";
  var body;
  if(!h){
    body="<div class='washing-reason'><div style='font-size:12px;color:var(--text-muted)'>No heatwave conditions for this day.</div>"+back+"</div>";
  }else{
    var nowStr=new Intl.DateTimeFormat("en-CA",{timeZone:(window._FC&&window._FC.timezone)||"UTC",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    var startTxt=h.start===nowStr?"Started today":(h.start<nowStr?"Began "+hwDayFmt(h.start):"Starts "+hwDayFmt(h.start));
    var endTxt=h.openEnded?"still going at the end of the forecast"
      :(h.end===nowStr?"easing after today"
      :(h.end>nowStr?"easing after "+hwDayFmt(h.end):"eased after "+hwDayFmt(h.end)));
    var tail=h.openEnded?" \u2014 at least "+h.days+" days so far"
      :" \u2014 "+(h.days===1?"a single day":h.days+" days")+" in all";
    var dur=startTxt+", "+endTxt+tail+".";
    // Only call out the peak when this day isn't already part of it
    var peakTxt="";
    if(!h.atPeak){
      var pr=h.peakFrom===h.peakTo?hwDayFmt(h.peakFrom):hwDayFmt(h.peakFrom)+" \u2013 "+hwDayFmt(h.peakTo);
      var pv=h.peakTo<nowStr?"Peaked ":(h.peakFrom>nowStr?"Peaks ":"Peaking ");
      peakTxt=pv+pr+" at "+h.peakScale+"/10.";
    }
    var rule="<div style='height:1px;background:var(--divider);margin:11px 0 10px'></div>";
    body="<div class='washing-reason'>"
      +"<div style='font-size:15px;font-weight:800;color:"+h.col+";margin-bottom:1px'>"+h.label+" \u2014 "+h.scale+"/10</div>"
      +"<div style='font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:9px'>"+hwDayFmt(h.date)+"</div>"
      +"<div style='font-size:14px;font-weight:800;color:var(--text);line-height:1.5'>"+dur+"</div>"
      +(peakTxt?"<div style='font-size:13px;font-weight:700;color:var(--text-muted);margin-top:3px'>"+peakTxt+"</div>":"")
      +rule
      +hwAdvice(h.band)
      +rule
      +"<div style='font-size:11px;color:var(--text-muted);line-height:1.6'>"
      +"Three-day mean temperature "+toDisp(h.d3).toFixed(1)+unitSym()+" against a local heatwave threshold of "+toDisp(h.thresh).toFixed(1)+unitSym()+", with the preceding 30 days averaging "+toDisp(h.d30).toFixed(1)+unitSym()+". "
      +"Intensity follows the Excess Heat Factor method, which measures heat against both the local climate and the month preceding it \u2014 so what counts as a heatwave depends on where you are, and a temperature that passes unremarked in one city can be severe in another. "
      +"This is an independent calculation from this app\u2019s own climate data on a present-day baseline, not an official warning product, and it may differ from your local service\u2019s assessment.</div>"
      +back+"</div>";
  }
  document.getElementById("pop-ttl").innerHTML="Heatwave \uD83C\uDF21\uFE0F";
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}
function showFireDangerPop(ffdi,todayMax,df,backDi){
  var cur=ffdi!==null&&ffdi!==undefined?ffdiInfo(ffdi):null,pk=todayMax?ffdiInfo(todayMax):null;
  var main=pk||cur;
  var key={Moderate:"Plan and prepare.",High:"Be ready to act.",Extreme:"Take action now to protect your life and property.",Catastrophic:"For your survival, leave bush fire risk areas."};
  var sub=[];
  if(cur)sub.push("Now: "+cur.label+" ("+ffdi+")");
  if(pk&&(!cur||todayMax>ffdi))sub.push((backDi!==undefined&&backDi!==null?"Peak":"Today’s peak")+": "+pk.label+" ("+todayMax+")");
  sub.push("drought factor "+df+"/10");
  hazardPop({
    title:"Fire danger",
    col:main?main.col:"#64BF30",
    headline:"🔥 "+(main?main.label:"Low")+" fire danger",
    sub:sub.join(" · "),
    lead:main?key[main.label]:"No significant fire danger.",
    advice:main&&main.label!=="Moderate"
      ?"Know your bushfire plan and your triggers to leave. Keep up with warnings and check whether a total fire ban is in place — that usually means no fires in the open, and limits on welding, grinding and similar work outdoors."
      :"Most fires can be controlled at this level, but stay aware of conditions and check for local restrictions before lighting fires or using machinery outdoors.",
    foot:"Estimated with the McArthur Forest Fire Danger Index from temperature, humidity, wind and a drought factor approximated from recent rainfall, then mapped to the Australian Fire Danger Rating System bands. The official rating also accounts for vegetation and fuel type, which this app can’t see, so it may differ. Always check your local fire authority for official ratings and total fire bans.",
    backDi:backDi});
}

// ── Dangerous cold (wind chill) ────────────────────────────────────────────
// North American wind chill index (Environment Canada / US NWS). Applies at or below 0°C;
// below 5 km/h uses Environment Canada's light-wind version. Tiers follow Environment
// Canada's frostbite risk table: −28 (skin freezes in 10–30 min) and −40 (5–10 min).
var WC_DANGER=-28,WC_EXTREME=-40;
function windChill(t,wind){
  if(t==null||isNaN(t))return null;
  var v=wind==null||isNaN(wind)?0:wind;
  if(t>0)return t;
  if(v<5)return t+((-1.59+0.1345*t)/5)*v;
  var p=Math.pow(v,0.16);
  return 13.12+0.6215*t-11.37*p+0.3965*t*p;
}
function coldTier(t,wind){
  var wc=windChill(t,wind);
  return wc==null?0:wc<=WC_EXTREME?2:wc<=WC_DANGER?1:0;
}
function coldPill(t,wind,back){
  var tier=coldTier(t,wind);
  if(!tier)return"";
  return"<span class='ann "+(tier===2?"ann-wcx":"ann-wc")+"' onclick='showColdPop("+t+","+(wind||0)+hzBackArg(back)+")'>"
    +(tier===2?"\uD83D\uDEA8 Extremely dangerous cold":"\uD83E\uDD76 Dangerously cold")+"</span>";
}
function showColdPop(t,wind,backDi){
  var wc=windChill(t,wind),tier=coldTier(t,wind),v=wind||0;
  var freeze=wc<=-55?"in under 2 minutes":wc<=-48?"in 2 to 5 minutes":wc<=-40?"in 5 to 10 minutes":"in 10 to 30 minutes";
  hazardPop({
    title:tier===2?"Extremely dangerous cold":"Dangerously cold",
    col:tier===2?"rgba(110,80,230,1)":"rgba(20,130,210,1)",
    headline:(tier===2?"🚨 ":"🥶 ")+"Wind chill "+hzDeg(wc,0),
    sub:hzDeg(t)+" air · "+windPhrase(v)+" ("+Math.round(v)+" km/h)",
    lead:"Exposed skin can freeze "+freeze+"."+(v>50?" In winds over 50 km/h it can happen faster still.":""),
    advice:tier===2
      ?"Limit time outdoors as much as possible. Cover every patch of skin, including face and hands, and wear insulated layers under a windproof outer shell. Don’t travel without warm clothing and supplies in case you’re stranded."
      :"Cover exposed skin — face, ears, hands — and wear insulated layers under a windproof outer shell. Keep time outdoors short and stay dry; wet clothing loses its warmth fast.",
    signs:"<b>Watch for frostbite</b> — numbness, then white, grey or waxy skin, often on fingers, toes, ears and nose. Warm it gently; don’t rub. <b>Hypothermia</b> — uncontrolled shivering, clumsiness, confusion — needs urgent medical help.",
    foot:"Wind chill is how cold it feels on bare skin once wind is taken into account (North American wind chill index, used in Canada and the US). Warnings follow Environment Canada’s frostbite risk table: "+hzDeg(WC_DANGER,0)+" and below, and "+hzDeg(WC_EXTREME,0)+" and below for extreme cold. Follow advice from your local weather service and health authority.",
    backDi:backDi});
}
// Lowest wind chill across a day's forecast slots ({temp,wind,utcMs}); futureOnly skips hours already past
function dayMinWindChill(slots,futureOnly){
  var now=Date.now(),best=null;
  for(var i=0;i<slots.length;i++){
    var sl=slots[i];
    if(sl.temp==null)continue;
    if(futureOnly&&sl.utcMs<now-3600000)continue;
    var wc=windChill(sl.temp,sl.wind);
    if(!best||wc<best.wc)best={wc:wc,slot:sl};
  }
  return best;
}
function wcTileTag(slots,futureOnly){
  var pk=dayMinWindChill(slots,futureOnly);
  if(!pk||pk.wc>WC_DANGER)return"";
  var ext=pk.wc<=WC_EXTREME;
  return"<div class='fc-wc"+(ext?" fc-wc-x":"")+"'>"+(ext?"\uD83D\uDEA8 Extreme":"\uD83E\uDD76 Dangerous")+"</div>";
}
// ── Hypothermia risk (cold + wet + wind) ───────────────────────────────────
// The cold hazard of mild climates: rain soaks clothing and wind strips its warmth.
// An hour qualifies at ≤ HYPO_T °C with mean wind ≥ HYPO_WIND km/h and rain
// (≥ HYPO_MM mm in the hour, or a rain/drizzle/sleet code when no amount is known;
// wet snow counts near 0°C). Forecast days need ≥ HYPO_HOURS such hours.
var HYPO_T=8,HYPO_WIND=30,HYPO_MM=0.3,HYPO_HOURS=2;
function hypoWet(code,mm,t){
  if(mm!=null&&!isNaN(mm))return mm>=HYPO_MM;
  if(code==null)return false;
  if((code>=51&&code<=67)||(code>=80&&code<=82))return true;
  return ((code>=71&&code<=77)||code===85||code===86)&&t>=-1;
}
function hypoHour(t,wind,code,mm){
  if(t==null||wind==null||isNaN(t)||isNaN(wind))return false;
  if(coldTier(t,wind))return false;              // frostbite warning already covers it
  return t<=HYPO_T&&wind>=HYPO_WIND&&hypoWet(code,mm,t);
}
function hypoPill(t,wind,code,mm,back){
  if(!hypoHour(t,wind,code,mm))return"";
  return"<span class='ann ann-hypo' onclick='showHypoPop("+t+","+wind+hzBackArg(back)+")'>\uD83C\uDF27\uFE0F Hypothermia risk</span>";
}
function showHypoPop(t,wind,backDi,hours){
  hazardPop({
    title:"Hypothermia risk",
    col:"rgba(40,120,150,1)",
    headline:"🌧️ Cold, wet and windy",
    sub:(hours?"About "+hours+" hour"+(hours>1?"s":"")+" · at worst ":"Now · ")+hzDeg(t)+", rain, "+windPhrase(wind)+" ("+Math.round(wind)+" km/h)",
    lead:"Rain soaks clothing and wind strips its warmth — a few degrees above zero in these conditions can chill you faster than a dry, still frost.",
    advice:"If you’re outdoors — walking, cycling, working — wear a waterproof, windproof outer shell over wool or synthetic layers (not cotton), carry a spare dry layer, and keep moving or get under cover. Newly shorn sheep and young livestock are especially vulnerable in these conditions.",
    signs:"<b>Watch for hypothermia</b> in yourself and others — uncontrolled shivering, clumsiness, slurred speech, confusion or unusual tiredness. Get the person somewhere dry and sheltered, replace wet clothing, warm them gradually, and call your local emergency number if they don’t improve.",
    foot:"Shown when it is "+hzDeg(HYPO_T,0)+" or colder, the wind averages "+HYPO_WIND+" km/h or more, and it is raining. In the forecast, a day is flagged when at least "+HYPO_HOURS+" such hours are expected. It stays quiet when a frostbite warning is already showing. Follow advice from your local weather service and health authority.",
    backDi:backDi});
}
// Qualifying hours in a day's slots ({temp,wind,rain,idx,utcMs}); codes = fc.hourly.weather_code
function dayHypo(slots,codes,futureOnly){
  var now=Date.now(),n=0,first=null,worst=null;
  for(var i=0;i<slots.length;i++){
    var sl=slots[i];
    if(futureOnly&&sl.utcMs<now-3600000)continue;
    if(!hypoHour(sl.temp,sl.wind,codes?codes[sl.idx]:null,sl.rain))continue;
    n++;
    if(!first)first=sl;
    if(!worst||(sl.temp-sl.wind/10)<(worst.temp-worst.wind/10))worst=sl;
  }
  return n>=HYPO_HOURS?{n:n,first:first,worst:worst}:null;
}
function hypoTileTag(slots,codes,futureOnly){
  return dayHypo(slots,codes,futureOnly)?"<div class='fc-hypo'>\uD83C\uDF27\uFE0F Hypothermia</div>":"";
}
// ── Storms ─────────────────────────────────────────────────────────────────
// A modelled storm indicator, not an official warning. Each forecast hour is rated from
// the model's thunderstorm codes (95/96/99), storm energy (CAPE, J/kg) and stability
// (lifted index), with the hour's rain rate, gusts and hail used to pick out severe storms.
//   1 Storms possible        — showers with storm energy, but no thunder in the forecast,
//                              or thunder forecast with little energy behind it
//   2 Thunderstorms likely   — thunder forecast with moderate energy or more
//   3 Severe storms possible — as 2, with ≥ STORM_HEAVY_MM in the hour, gusts ≥ STORM_GUST or hail
var STORM_CAPE=[500,1000,2000],STORM_LI=[-2,-4,-6],STORM_HEAVY_MM=10,STORM_GUST=90,STORM_AHEAD=6;
var STORM_LBL=["","Storms possible","Thunderstorms likely","Severe storms possible"];
var STORM_COL=["","rgba(110,80,170,1)","rgba(120,60,190,1)","rgba(150,30,130,1)"];
function stormEnergy(cape,li){
  if(cape==null&&li==null)return null;
  for(var k=2;k>=0;k--)if((cape!=null&&cape>=STORM_CAPE[k])||(li!=null&&li<=STORM_LI[k]))return k+1;
  return 0;
}
function capeWord(c){return c<300?"low":c<1000?"marginal":c<2500?"moderate":c<3500?"strong":"extreme";}
function stormHour(fc,i){
  var H=fc&&fc.hourly;if(!H||i<0||i>=H.time.length)return{lvl:0};
  var code=(H.weather_code||[])[i],cape=(H.cape||[])[i],li=(H.lifted_index||[])[i];
  var mm=(H.precipitation||[])[i]||0,gust=(H.wind_gusts_10m||[])[i]||0;
  var thunder=code===95||code===96||code===99,hail=code===96||code===99;
  var showers=(code>=80&&code<=82)||mm>=0.5,e=stormEnergy(cape,li),lvl=0;
  if(thunder){
    lvl=(e==null||e>=2)?2:1;
    if(lvl===2&&(mm>=STORM_HEAVY_MM||gust>=STORM_GUST||hail))lvl=3;
  }else if(showers&&e!=null&&e>=2)lvl=1;
  return{lvl:lvl,cape:cape,gust:gust,hail:hail,thunder:thunder};
}
// Worst rating over a list of hourly indices, with when it starts and what drives it
function stormOver(fc,idxs){
  var S={lvl:0,first:null,n:0,cape:null,gust:0,hail:false,thunder:false};
  for(var k=0;k<idxs.length;k++){
    var h=stormHour(fc,idxs[k]);if(!h.lvl)continue;
    S.n++;
    if(h.lvl>S.lvl){S.lvl=h.lvl;S.first=idxs[k];}
    if(h.cape!=null&&(S.cape==null||h.cape>S.cape))S.cape=h.cape;
    if(h.gust>S.gust)S.gust=h.gust;
    if(h.hail)S.hail=true;
    if(h.thunder)S.thunder=true;
  }
  return S;
}
// "3pm" from a forecast hour (Open-Meteo times are already local to the place)
function fcHourLabel(fc,i){
  var h=parseInt(fc.hourly.time[i].slice(11,13),10);
  return h===0?"midnight":h===12?"midday":(h%12)+(h<12?"am":"pm");
}
// The forecast hour that contains "now", located by date and hour in the place's time zone
function fcNowIdx(fc){
  if(!fc||!fc.hourly||!fc.hourly.time)return -1;
  var tz=fc.timezone,h=localHourInTZ(tz);
  var day=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  for(var i=0;i<fc.hourly.time.length;i++)if(fc.hourly.time[i].slice(0,10)===day&&parseInt(fc.hourly.time[i].slice(11,13))===h)return i;
  return -1;
}
function stormCls(lvl){return lvl>=3?"ann-stormx":lvl===2?"ann-storm":"ann-storm quiet";}
// Live strip: the next STORM_AHEAD hours
function stormStripPill(fc){
  var i0=fcNowIdx(fc);if(i0<0)return"";
  var idxs=[];for(var i=i0;i<=i0+STORM_AHEAD&&i<fc.hourly.time.length;i++)idxs.push(i);
  var S=stormOver(fc,idxs);if(!S.lvl)return"";
  var when=S.first===i0?"":" from "+fcHourLabel(fc,S.first);
  return"<span class='ann "+stormCls(S.lvl)+"' onclick='showStormPop("+i0+","+idxs[idxs.length-1]+",null)'>\u26C8\uFE0F "+STORM_LBL[S.lvl]+when+"</span>";
}
// Hour popup pill — covers the popup's 2-hour slot, like its rain figure
function stormHourPill(fc,idx){
  var i1=Math.min(idx+1,fc.hourly.time.length-1),S=stormOver(fc,[idx,i1]);if(!S.lvl)return"";
  return"<span class='ann "+stormCls(S.lvl)+"' onclick='showStormPop("+idx+","+i1+",\"h\")'>\u26C8\uFE0F "+STORM_LBL[S.lvl]+"</span>";
}
// 7-day tile tag: storms likely or severe only (possible stays in the day and hour views)
function stormTileTag(fc,slots,futureOnly){
  var now=Date.now(),idxs=[];
  for(var i=0;i<slots.length;i++){if(futureOnly&&slots[i].utcMs<now-3600000)continue;idxs.push(slots[i].idx);}
  var S=stormOver(fc,idxs);
  if(S.lvl<2)return"";
  return S.lvl>=3?"<div class='fc-storm-x'>\u26C8\uFE0F Severe storms</div>":"<div class='fc-storm'>\u26C8\uFE0F Storms</div>";
}
function showStormPop(i0,i1,backDi){
  var fc=window._FC;if(!fc)return;
  var idxs=[];for(var i=i0;i<=i1;i++)idxs.push(i);
  var S=stormOver(fc,idxs);if(!S.lvl)return;
  var col=STORM_COL[S.lvl];
  var bits=[S.first===fcNowIdx(fc)?"From now":"From "+fcHourLabel(fc,S.first)];
  if(S.n>1)bits.push("about "+S.n+" hours");
  if(S.gust>=GUST_SHOW)bits.push("gusts to "+Math.round(S.gust)+" km/h");
  if(S.hail)bits.push("hail possible");
  var lead=S.lvl===1?(S.thunder?"Thunder is in the forecast, but with little storm energy behind it, so any storms should be brief and isolated."
      :"Showers could turn thundery. The atmosphere has enough energy for storms, though the forecast doesn\u2019t show them outright.")
    :S.lvl===2?"Thunderstorms are forecast. Lightning is the main danger, and storms can bring sudden downpours and strong gusts."
    :"Storms could be severe: the forecast pairs plenty of storm energy with very heavy rain, damaging gusts or hail.";
  hazardPop({
    title:"Storms",
    col:col,
    headline:"\u26C8\uFE0F "+STORM_LBL[S.lvl],
    sub:bits.join(" \u00B7 "),
    lead:lead,
    advice:"Plan outdoor activities around the storms and keep an eye on the sky. <b>When thunder roars, go indoors</b> \u2014 if you can hear thunder, you\u2019re close enough to be struck. Shelter in a solid building or a hard-topped car, not under a tree, and keep away from open ground, water and metal fences. Bring in or tie down loose outdoor items"+(S.lvl>=3||S.hail?", and park undercover if you can \u2014 hail can damage cars":"")+".",
    signs:"<b>Watch for</b> towering dark clouds, a sudden cool gust or drop in temperature, and the first rumbles of thunder. Heavy rain can cause flash flooding in minutes \u2014 never drive, ride or walk through floodwater.",
    foot:"A modelled indicator, not an official warning. It combines the forecast\u2019s thunderstorm signal with storm energy (CAPE"+(S.cape!=null?", peaking around "+Math.round(S.cape).toLocaleString("en-AU")+" J/kg \u2014 "+capeWord(S.cape):"")+") and atmospheric stability, and flags storms as severe when they come with very heavy rain, gusts of "+STORM_GUST+" km/h or more, or hail. Storms are small and hard to place, so timing and location can be off. For official warnings, follow your local weather service.",
    backDi:backDi});
}
// ── Damaging winds ─────────────────────────────────────────────────────────
// Forecast gusts of WIND_DAMAGING km/h or more (WIND_DESTRUCTIVE for destructive winds).
// Hours rated as thunderstorms are left to the storm alert, and when a tropical cyclone's
// wind zone covers the place, the same gusts are shown as cyclone winds instead.
var WIND_DAMAGING=80,WIND_DESTRUCTIVE=125;
var WIND_COL=["","rgba(0,125,130,1)","rgba(160,40,40,1)"];
function windHour(fc,i){
  var g=((fc&&fc.hourly&&fc.hourly.wind_gusts_10m)||[])[i];
  if(g==null||g<WIND_DAMAGING)return{lvl:0,gust:g||0};
  if(stormHour(fc,i).lvl>=2)return{lvl:0,gust:g};
  return{lvl:g>=WIND_DESTRUCTIVE?2:1,gust:g};
}
function windOver(fc,idxs){
  var W={lvl:0,first:null,n:0,gust:0};
  for(var k=0;k<idxs.length;k++){
    var h=windHour(fc,idxs[k]);if(!h.lvl)continue;
    W.n++;if(W.first==null)W.first=idxs[k];
    if(h.lvl>W.lvl)W.lvl=h.lvl;
    if(h.gust>W.gust)W.gust=h.gust;
  }
  return W;
}
function windName(lvl){return lvl>=2?"Destructive winds":"Damaging winds";}
function windCls(lvl){return lvl>=2?"ann-wdes":"ann-wdmg";}
function tcActive(){return!!(window._TC&&window._TC.band>0);}
function windStripPill(fc){
  if(tcActive())return"";
  var i0=fcNowIdx(fc);if(i0<0)return"";
  var idxs=[];for(var i=i0;i<=i0+STORM_AHEAD&&i<fc.hourly.time.length;i++)idxs.push(i);
  var W=windOver(fc,idxs);if(!W.lvl)return"";
  return"<span class='ann "+windCls(W.lvl)+"' onclick='showWindPop("+i0+","+idxs[idxs.length-1]+",null)'>\uD83D\uDCA8 "+windName(W.lvl)+(W.first===i0?"":" from "+fcHourLabel(fc,W.first))+" \u00B7 gusts to "+Math.round(W.gust)+" km/h</span>";
}
function windHourPill(fc,idx){
  var i1=Math.min(idx+1,fc.hourly.time.length-1),W=windOver(fc,[idx,i1]);if(!W.lvl)return"";
  if(tcActive())return"<span class='ann ann-tc' onclick='showTCPop(\"h\")'>\uD83C\uDF00 Cyclone winds</span>";
  return"<span class='ann "+windCls(W.lvl)+"' onclick='showWindPop("+idx+","+i1+",\"h\")'>\uD83D\uDCA8 "+windName(W.lvl)+"</span>";
}
function windTileTag(fc,slots,futureOnly){
  var now=Date.now(),idxs=[];
  for(var i=0;i<slots.length;i++){if(futureOnly&&slots[i].utcMs<now-3600000)continue;idxs.push(slots[i].idx);}
  var W=windOver(fc,idxs);if(!W.lvl)return"";
  if(tcActive())return"<div class='fc-tc'>\uD83C\uDF00 Cyclone winds</div>";
  return W.lvl>=2?"<div class='fc-wdes'>\uD83D\uDCA8 Destructive winds</div>":"<div class='fc-wdmg'>\uD83D\uDCA8 Damaging winds</div>";
}
function showWindPop(i0,i1,backDi){
  var fc=window._FC;if(!fc)return;
  var idxs=[];for(var i=i0;i<=i1;i++)idxs.push(i);
  var W=windOver(fc,idxs);if(!W.lvl)return;
  var bits=[W.first===fcNowIdx(fc)?"From now":"From "+fcHourLabel(fc,W.first)];
  if(W.n>1)bits.push("about "+W.n+" hours");
  bits.push("gusts to "+Math.round(W.gust)+" km/h ("+beaufort(W.gust).n+")");
  hazardPop({
    title:windName(W.lvl),
    col:WIND_COL[W.lvl],
    headline:"\uD83D\uDCA8 "+windName(W.lvl),
    sub:bits.join(" \u00B7 "),
    lead:W.lvl>=2?"Gusts this strong can tear off roofing, bring down large trees and power lines, and make travel dangerous."
      :"Gusts this strong can bring down trees, branches and power lines, lift loose roofing and outdoor items, and make driving hazardous \u2014 especially in high-sided vehicles or when towing.",
    advice:"Secure or bring in anything that could blow around \u2014 outdoor furniture, bins, trampolines, washing. Park away from trees and power lines, avoid forests and walking under trees, and take extra care on the roads"+(W.lvl>=2?". Stay indoors, away from windows, while the strongest winds pass":"")+".",
    signs:"<b>Stay well clear of fallen power lines</b> \u2014 always assume they\u2019re live \u2014 and of damaged trees, which can drop limbs after the wind eases.",
    foot:"Shown when forecast gusts reach "+WIND_DAMAGING+" km/h, or "+WIND_DESTRUCTIVE+" km/h for destructive winds. Hours with forecast thunderstorms are covered by the storm alert, and a tropical cyclone takes over when one is nearby. Gusts are modelled for open ground at 10 m: exposed ridges and coasts can be stronger, sheltered valleys lighter. Not an official warning \u2014 follow your local weather service.",
    backDi:backDi});
}
// ── Tropical cyclones (GDACS) ──────────────────────────────────────────────
// Current tropical cyclones from GDACS (Global Disaster Alert and Coordination System).
// A place counts as in a cyclone's wind zone when it lies inside one of GDACS's wind
// buffers (60 / 90 / 120 km/h) and within TC_NEAR_KM of the storm's current centre — the
// buffers also cover where the storm has already been. Within TC_NEAR_KM but outside the
// buffers it's shown as a quiet "nearby" note. Tries GDACS directly, then the site's own
// /api/gdacs proxy; on any failure the feature stays silent. The "Checking for cyclones"
// line only shows once a cyclone is known to be within TC_NEAR_KM and its zones are loading.
var TC_NEAR_KM=1000,TC_BANDS=["","Poly_Green","Poly_Orange","Poly_Red"],TC_BAND_KMH=[0,60,90,120];
var _gdacsCache={};
function gdacsGet(path){
  var c=_gdacsCache[path];
  if(c&&Date.now()-c.t<1800000)return Promise.resolve(c.d);
  try{var ls=JSON.parse(localStorage.getItem("gdacs:"+path)||"null");if(ls&&Date.now()-ls.t<1800000){_gdacsCache[path]=ls;return Promise.resolve(ls.d);}}catch(e){}
  var get=function(u,route){return fetch(u).then(function(r){if(!r.ok)throw new Error(r.status);return r.json();}).then(function(d){try{localStorage.setItem("gdacs_route",route);}catch(e){}return d;});};
  var direct=function(){return get("https://www.gdacs.org/gdacsapi/api/"+path,"direct");};
  var proxy=function(){return get("/api/gdacs?p="+encodeURIComponent(path),"proxy");};
  var first="direct";try{first=localStorage.getItem("gdacs_route")||"direct";}catch(e){}
  var p=first==="proxy"?proxy().catch(direct):direct().catch(proxy);
  return p.then(function(d){var c2={t:Date.now(),d:d};_gdacsCache[path]=c2;try{localStorage.setItem("gdacs:"+path,JSON.stringify(c2));}catch(e){}return d;});
}
function tcPointIn(lat,lon,geom){
  var polys=geom.type==="Polygon"?[geom.coordinates]:geom.type==="MultiPolygon"?geom.coordinates:[];
  for(var p=0;p<polys.length;p++){
    var inside=false;
    for(var r=0;r<polys[p].length;r++){
      var ring=polys[p][r],wrap=ring.some(function(c){return c[0]>90;})&&ring.some(function(c){return c[0]<-90;});
      var x=wrap&&lon<0?lon+360:lon;
      for(var i=0,j=ring.length-1;i<ring.length;j=i++){
        var xi=wrap&&ring[i][0]<0?ring[i][0]+360:ring[i][0],yi=ring[i][1];
        var xj=wrap&&ring[j][0]<0?ring[j][0]+360:ring[j][0],yj=ring[j][1];
        if(((yi>lat)!==(yj>lat))&&(x<(xj-xi)*(lat-yi)/(yj-yi)+xi))inside=!inside;
      }
    }
    if(inside)return true;
  }
  return false;
}
function tcName(p){var n=String(p.eventname||p.name||"").split("-")[0].toLowerCase();return n.charAt(0).toUpperCase()+n.slice(1);}
function gdacsCheck(lat,lon){
  window._TC=null;
  var key=lat+","+lon;window._TCpending=key;window._TCnear=null;
  var done=function(){
    if(window._TCpending!==key)return;
    window._TCpending=null;
    if(window._renderedFor===key){reRenderLive();if(window._FC)renderForecast(window._FC);}
  };
  gdacsGet("events/geteventlist/SEARCH?eventlist=TC").then(function(list){
    var now=Date.now(),cand=[];
    (list&&list.features||[]).forEach(function(f){
      var p=f.properties||{},g=f.geometry;
      if(String(p.iscurrent)!=="true"||!g||g.type!=="Point")return;
      if(p.datemodified&&now-Date.parse(p.datemodified+"Z")>3*86400000)return;
      var km=haversineKm(lat,lon,g.coordinates[1],g.coordinates[0]);
      if(km<=TC_NEAR_KM)cand.push({p:p,km:km});
    });
    cand.sort(function(a,b){return a.km-b.km;});
    if(cand.length&&window._TCpending===key){window._TCnear=key;if(window._renderedFor===key)reRenderLive();}
    return Promise.all(cand.slice(0,3).map(function(c){
      return gdacsGet("polygons/getgeometry?eventtype=TC&eventid="+c.p.eventid+"&episodeid="+c.p.episodeid).then(function(geo){
        var band=0;
        (geo&&geo.features||[]).forEach(function(f){
          var b=TC_BANDS.indexOf((f.properties||{}).Class);
          if(b>band&&f.geometry&&tcPointIn(lat,lon,f.geometry))band=b;
        });
        c.band=band;return c;
      }).catch(function(){c.band=0;return c;});
    }));
  }).then(function(cs){
    if(!cs||!cs.length||window._currentLat!==lat||window._currentLon!==lon)return done();
    cs.sort(function(a,b){return(b.band-a.band)||(a.km-b.km);});
    var c=cs[0],p=c.p,sv=p.severitydata||{};
    window._TC={name:tcName(p),alert:p.alertlevel||"",band:c.band,km:c.km,
      maxwind:sv.severityunit==="km/h"?sv.severity:null,country:p.country||"",report:p.url&&p.url.report||""};
    done();
  }).catch(function(){done();});
}
function tcStripPill(){
  if(window._TCpending&&window._TCpending===window._renderedFor&&window._TCnear===window._TCpending)return"<span class='ann ann-hzload quiet'>\u23F3 Checking for cyclones\u2026</span>";
  var T=window._TC;if(!T)return"";
  if(!T.band)return"<span class='ann ann-tcnear quiet' onclick='showTCPop(null)'>\uD83C\uDF00 Cyclone "+T.name+" \u00B7 "+Math.round(T.km/10)*10+" km away</span>";
  return"<span class='ann ann-tc' onclick='showTCPop(null)'>\uD83C\uDF00 Cyclone "+T.name+" \u00B7 "+(T.band>=3?"destructive":T.band===2?"damaging":"gale-force")+" winds possible</span>";
}
function showTCPop(backDi){
  var T=window._TC;if(!T)return;
  var bits=[];
  if(T.alert)bits.push("GDACS "+T.alert+" alert");
  if(T.maxwind)bits.push("peak winds "+Math.round(T.maxwind)+" km/h");
  bits.push("centre "+Math.round(T.km/10)*10+" km away");
  var lead=!T.band?"A tropical cyclone is active within "+TC_NEAR_KM.toLocaleString("en-AU")+" km. This place isn\u2019t in its expected wind zone, but tracks can change \u2014 keep an eye on official forecasts."
    :"This place lies in the cyclone\u2019s wind zone, where winds of "+TC_BAND_KMH[T.band]+" km/h or more are expected along its track.";
  hazardPop({
    title:"Tropical cyclone",
    col:T.band?"rgba(200,30,50,1)":"rgba(150,60,70,1)",
    headline:"\uD83C\uDF00 Tropical cyclone "+T.name,
    sub:bits.join(" \u00B7 "),
    lead:lead,
    advice:"<b>Follow instructions from your local emergency services \u2014 evacuation orders come first.</b> Before it arrives: secure or bring in loose outdoor items, charge phones and power banks, and have water, food, medicines and a battery radio for several days. During the cyclone, stay indoors in the strongest part of the building, away from windows. If the wind suddenly drops, it may be the eye passing over \u2014 stay inside, as the winds return from the other direction.",
    signs:"<b>Storm surge and flooding</b> are often the biggest dangers near coasts and rivers. Never drive, ride or walk through floodwater, and stay clear of fallen power lines.",
    foot:"From GDACS (Global Disaster Alert and Coordination System, a United Nations and European Commission service). Its Green, Orange and Red alerts rate the cyclone\u2019s overall expected humanitarian impact, not the conditions at this place. The wind zone is GDACS\u2019s modelled area for winds of 60, 90 or 120 km/h along the cyclone\u2019s track, which can include where the storm has already been. Not an official warning \u2014 follow your local weather service."
      +(T.report?" <a href='"+T.report+"' target='_blank' rel='noopener' style='color:inherit'>GDACS report \u2197</a>":""),
    backDi:backDi});
}
// Peak wet bulb across a day's forecast slots ({temp,dp,utcMs}); futureOnly skips hours already past
function dayPeakWetBulb(slots,futureOnly){
  var now=Date.now(),best=null;
  for(var i=0;i<slots.length;i++){
    var sl=slots[i];
    if(sl.temp==null||sl.dp==null)continue;
    if(futureOnly&&sl.utcMs<now-3600000)continue;
    var w=wetBulb(sl.temp,sl.dp);
    if(!best||w>best.w)best={w:w,slot:sl};
  }
  return best;
}
// Small tag for a 7-day tile when the day's peak wet bulb is dangerous
function wbTileTag(slots,futureOnly){
  var pk=dayPeakWetBulb(slots,futureOnly);
  if(!pk||pk.w<WB_DANGER)return"";
  var ext=pk.w>=WB_EXTREME;
  return"<div class='fc-wb"+(ext?" fc-wb-x":"")+"'>"+(ext?"\uD83D\uDEA8 Extreme":"\uD83E\uDD75 Dangerous")+"</div>";
}
// ── Hazard popups ──────────────────────────────────────────────────────────
// Shared layout for the hazard explanations, matching the heatwave/coldwave popups:
// tinted headline band → key message → advice → method footnote → back link.
function hzRgba(col,a){
  if(/^#/.test(col)){var h=col.slice(1);if(h.length===3)h=h.replace(/./g,"$&$&");
    return"rgba("+parseInt(h.slice(0,2),16)+","+parseInt(h.slice(2,4),16)+","+parseInt(h.slice(4,6),16)+","+a+")";}
  return col.replace(/rgba?\(([^,]+),([^,]+),([^,)]+)(,[^)]*)?\)/,"rgba($1,$2,$3,"+a+")");
}
function hazardPop(o){
  var rule="<div style='height:1px;background:var(--divider);margin:11px 0 10px'></div>";
  var back=(o.backDi!==undefined&&o.backDi!==null)?"<div style='margin-top:12px;padding-top:10px;border-top:1px solid var(--divider);text-align:center;font-size:12px;font-weight:700;color:var(--text-muted);cursor:pointer' onclick='"+(o.backDi==="h"?"hourBack()":"show7DaySlot("+o.backDi+")")+"'>← Back</div>":"";
  var body="<div class='washing-reason'>"
    +"<div style='padding:8px 10px;border-radius:8px;background:"+hzRgba(o.col,0.14)+";border:1px solid "+hzRgba(o.col,0.45)+"'>"
    +"<div style='font-size:15px;font-weight:800;color:"+o.col+";line-height:1.3'>"+o.headline+"</div>"
    +(o.sub?"<div style='font-size:12px;font-weight:700;color:var(--text-muted);margin-top:2px'>"+o.sub+"</div>":"")
    +"</div>"
    +"<div style='font-size:14px;font-weight:800;color:var(--text);line-height:1.5;margin-top:10px'>"+o.lead+"</div>"
    +rule
    +"<div style='font-size:12.5px;font-weight:600;color:var(--text);line-height:1.65'>"+o.advice+"</div>"
    +(o.signs?"<div style='font-size:12.5px;font-weight:600;color:var(--text);line-height:1.65;margin-top:8px'>"+o.signs+"</div>":"")
    +rule
    +"<div style='font-size:11px;color:var(--text-muted);line-height:1.6'>"+o.foot+"</div>"
    +back+"</div>";
  document.getElementById("pop-ttl").textContent=o.title;
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}
function hzDeg(c,dp){return String(toDisp(c).toFixed(dp==null?1:dp)).replace("-","−")+unitSym();}
function showWetBulbPop(t,dp,backDi){
  var w=wetBulb(t,dp),ext=w>=WB_EXTREME;
  hazardPop({
    title:ext?"Extremely dangerous heat":"Dangerously hot",
    col:ext?"rgba(220,30,80,1)":"rgba(230,105,0,1)",
    headline:(ext?"🚨 ":"🥵 ")+"Wet bulb "+hzDeg(w),
    sub:hzDeg(t)+" air · "+hzDeg(dp)+" dew point",
    lead:ext
      ?"Even fit, healthy people resting in the shade struggle to shed heat at this level."
      :"Sweating can no longer cool you properly — heat illness can set in quickly with any exertion.",
    advice:ext
      ?"Avoid exertion entirely. Stay somewhere cooled — air-conditioning if you have it, or a library, shopping centre or public cooling centre if you don’t. Drink water steadily, and check on anyone elderly, very young, pregnant or unwell."
      :"Avoid strenuous activity and move any you can’t avoid to the coolest part of the day. Rest in shade or air-conditioning, drink water regularly without waiting to feel thirsty, and check on anyone vulnerable.",
    signs:"<b>Watch for heat exhaustion</b> — heavy sweating, dizziness, headache, nausea, cramps. <b>Heat stroke</b> — confusion, slurred speech, hot skin, collapse — is a medical emergency: call your local emergency number.",
    foot:"Wet-bulb temperature combines heat and humidity into one number: the lowest temperature sweat can cool you to. This app warns at "+hzDeg(WB_DANGER,0)+" and above, and "+hzDeg(WB_EXTREME,0)+" and above for extreme heat, calculated from air temperature and dew point (Stull, 2011). Follow advice from your local weather service and health authority.",
    backDi:backDi});
}
function scoreInfo(s){
  if(s>90)return{label:"Excellent",emoji:"\uD83D\uDE0A",col:"#1a7a3a"};
  if(s>75)return{label:"Good",emoji:"\uD83D\uDE42",col:"#3a9a2a"};
  if(s>55)return{label:"Moderate",emoji:"\uD83D\uDE10",col:"#7a7000"};
  if(s>35)return{label:"Poor",emoji:"\uD83D\uDE13",col:"#b05010"};
  return{label:"Very poor",emoji:"\uD83D\uDE30",col:"#a02020"};
}
function getAnnotations(temp,dp,wind,score,s,iP,wP,wxCode){
  var a=[];
  if(temp<-15)a.push({c:"ann-bitter",t:"bitterly cold \u2744\uFE0F"});
  else if(temp<0)a.push({c:"ann-freeze",t:"freezing cold \uD83E\uDD76"});
  else if(temp<5)a.push({c:"ann-vcold",t:"very cold \uD83E\uDDCA"});
  else if(temp<10)a.push({c:"ann-cold",t:"cold \uD83E\uDDE5"});
  else if(temp<15)a.push({c:"ann-chilly",t:"a bit chilly \uD83E\uDDE5"});
  else if(temp<s.tlo)a.push({c:"ann-cool",t:"cool \uD83C\uDF2C\uFE0F"});
  else if(temp<=s.thi){}
  else if(temp<25)a.push({c:"ann-warm",t:"mildly warm \u2600\uFE0F"});
  else if(temp<30)a.push({c:"ann-warm",t:"warm \u2600\uFE0F"});
  else if(temp<35)a.push({c:"ann-hot",t:"hot \uD83D\uDD25"});
  else if(temp<40)a.push({c:"ann-vhot",t:"very hot \uD83E\uDD75"});
  else a.push({c:"ann-xhot",t:"extremely hot \uD83C\uDF0B"});
  if(dp>s.dp+10)a.push({c:"ann-steamy",t:"oppressively humid \uD83C\uDF0A"});
  else if(dp>s.dp+5)a.push({c:"ann-humid",t:"humid & sticky \uD83D\uDCA7"});
  else if(dp>14)a.push({c:"ann-muggy",t:"a little muggy \uD83D\uDCA6"});
if(temp>=0){
    var depression=temp-dp;
    var firesDry,firesVdry;
    if(temp<10){
      firesDry=depression>10;
      firesVdry=depression>20;
    } else if(temp<15){
      firesDry=depression>8;
      firesVdry=depression>15;
    } else {
      firesDry=dp<4;
      firesVdry=dp<0;
    }
    if(firesVdry)a.push({c:"ann-vdry",t:"very dry air \uD83C\uDFDC\uFE0F"});
    else if(firesDry)a.push({c:"ann-dry",t:"dry air \uD83C\uDF35"});
  }
  var wb=windBeaufort(wind,temp,s);if(wb)a.push(wb);
  if(wxCode!==undefined&&wxCode!==null){var wx=wxFromCode(wxCode);if(wx)a.push(wx);}
  var inIdeal=(temp>=s.tlo&&temp<=s.thi&&dp<=s.dp&&wP<=2);
  var wetNow=s.rainOn&&wxCode!=null&&wxCode>=51;
  if((inIdeal||score>90)&&!wetNow)a.push({c:"ann-great",t:"feels great \u2728"});
  if(score===69)a.push({c:"ann-great",t:"nice \uD83D\uDE0F"});
  if(score>=80){var _loc=document.getElementById("live-locname");if(_loc&&_loc.textContent.indexOf("Los Angeles")!==-1)a.push({c:"ann-great ann-info",t:"Magdalena Bay weather \uD83C\uDF05",url:"https://www.youtube.com/magdalenabay"});}
  var seen={},out=[];
  for(var i=0;i<a.length;i++){if(!seen[a[i].t]){seen[a[i].t]=1;out.push(a[i]);}}
  return out;
}
function drawGauge(id,score){
  var el=document.getElementById(id);if(!el)return;
  var SEGS=20;
  var lit=Math.round((Math.min(100,Math.max(0,score))/100)*SEGS);
  var col=SBANDS[bandForScore(score)].col.replace("0.92","1");
  var rgb=col.match(/[\d.]+/g);
  var rv=rgb[0],gv=rgb[1],bv=rgb[2];
  var html="";
  for(var i=0;i<SEGS;i++){
    if(i<lit){
      var segScore=Math.round(((i+1)/SEGS)*100);
      var segCol=SBANDS[bandForScore(segScore)].col.replace("0.92","1");
      var segRgb=segCol.match(/[\d.]+/g);
      var shadow="0 0 5px rgba("+segRgb[0]+","+segRgb[1]+","+segRgb[2]+",0.45)";
      html+="<div class='vol-seg lit' style='background:"+segCol+";box-shadow:"+shadow+"'></div>";
    } else {
      html+="<div class='vol-seg dim'></div>";
    }
  }
  el.innerHTML=html;
}
function renderScore(areaId,gaugeId,r,temp,effDP,wind,wxCode,rain){
  var score=r.score,iP=r.iP,wP=r.wP,si=scoreInfo(score),s=r.sleep?gsSleep():gs();
  var anns=getAnnotations(temp,effDP,wind,score,s,iP,wP,wxCode);
  // Build pill HTML — unified order: comfort conditions, then hazards, then verdict
  // getAnnotations already returns: temp > humidity > dry > hot&steamy > wind > wx > verdict
  // We split out the verdict pills (ann-great) and insert hazard pills before them
  var condAnns=[],verdictAnns=[];
  for(var i=0;i<anns.length;i++){
    if(anns[i].c.indexOf("ann-great")!==-1)verdictAnns.push(anns[i]);
    else condAnns.push(anns[i]);
  }
  function annSpan(ann){
    return ann.url?"<a class='ann "+ann.c+"' href='"+ann.url+"' target='_blank' rel='noopener' style='text-decoration:none'>"+ann.t+"</a>"
      :"<span class='ann "+ann.c+"'>"+ann.t+"</span>";
  }
  var annHtml="",alertHtml="",gustExtra="";
  if(areaId==="live-score-area"&&window._LW)gustExtra=withGust(condAnns,window._LW.gust,tcActive()||!!(window._FC&&windStripPill(window._FC)));
  for(var i=0;i<condAnns.length;i++)annHtml+=annSpan(condAnns[i]);
  annHtml+=gustExtra;
  // Hazards go in the alert strip above the ring; everything else stays a pill
  alertHtml+=wetBulbPill(temp,effDP);
  alertHtml+=coldPill(temp,wind);
  alertHtml+=hypoPill(temp,wind,wxCode,rain==null?null:rain);
  if(areaId==="live-score-area"){
    alertHtml+=tcStripPill();
    if(window._FC)alertHtml+=stormStripPill(window._FC)+windStripPill(window._FC);
  }
  // Hazard pills: UV, AQI, Fire — inserted between conditions and verdict
  if(areaId==="live-score-area"&&window._FC){
    // UV — always shown during daylight, even when low
    var curUV=null;
    if(window._FC.hourly&&window._FC.hourly.uv_index){
      var tz2=window._FC.timezone,nowH=localHourInTZ(tz2);
      var todayStr2=new Intl.DateTimeFormat("en-CA",{timeZone:tz2,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
      for(var j=0;j<window._FC.hourly.time.length;j++){
        if(window._FC.hourly.time[j].slice(0,10)===todayStr2&&parseInt(window._FC.hourly.time[j].slice(11,13))===nowH){curUV=window._FC.hourly.uv_index[j];break;}
      }
    }
    var isDaytime=isCurrentlyDaytime(window._FC);
    var uvAnn=isDaytime?uvAnnotationDaytime(curUV):uvAnnotation(curUV);
    if(uvAnn)annHtml+="<span class='ann "+uvAnn.c+"' style='cursor:pointer' onclick='showUVPop()'>"+uvAnn.t+"</span>";
    // AQI pill
    if(window._AQ&&window._AQ.hourly){
      var aqiNowIdx=null;
      var aqTz=window._FC.timezone,aqNowH=localHourInTZ(aqTz);
      var aqTodayStr=new Intl.DateTimeFormat("en-CA",{timeZone:aqTz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
      for(var k=0;k<(window._AQ.hourly.time||[]).length;k++){
        if(window._AQ.hourly.time[k].slice(0,10)===aqTodayStr&&parseInt(window._AQ.hourly.time[k].slice(11,13))===aqNowH){aqiNowIdx=k;break;}
      }
      var aqiVal=aqiNowIdx!==null?(window._AQ.hourly.us_aqi||[])[aqiNowIdx]:null;
      var aqAnn=aqiAnnotation(aqiVal);
      var aqLabel=aqAnn?aqAnn.t:(aqiVal!==null&&aqiVal!==undefined?"AQI good 😊":"AQI —");
      var aqClass=aqAnn?aqAnn.c:"ann-aqi ann-info";
      var aqiIdxArg=(aqiNowIdx!==null?aqiNowIdx:"null");
      annHtml+="<span class='ann "+aqClass+"' onclick='document.getElementById(\"pop-ttl\").textContent=\"\";document.getElementById(\"pop-body\").innerHTML=\"\";showAQIPop("+aqiIdxArg+")'>"+aqLabel+"</span>";
    }
    // Fire danger pill
    var fd=getFireDangerForFC(window._FC);
    if(fd){
      var curFI=fd.currentFFDI!==null?ffdiInfo(fd.currentFFDI):null;
      var maxFI=ffdiInfo(fd.todayMaxFFDI);
      if(curFI||maxFI){
        var showFI=curFI||maxFI;
        var fireAlert=Math.max(fd.todayMaxFFDI||0,fd.currentFFDI||0)>=24;
        var fireLabel="🔥 "+(fireAlert?"Fire danger: ":"")+showFI.label+(maxFI&&curFI&&fd.todayMaxFFDI>fd.currentFFDI?" · peak: "+maxFI.label:"");
        if(fireAlert)alertHtml+="<span class='ann ann-fire' style='color:"+showFI.col+";border-color:"+showFI.col.replace("1)","0.4)")+"' onclick='document.getElementById(\"pop-ttl\").textContent=\"\";document.getElementById(\"pop-body\").innerHTML=\"\";showFireDangerPop("+(fd.currentFFDI!==null?fd.currentFFDI:"null")+","+fd.todayMaxFFDI+","+fd.df+")'>"+fireLabel+"</span>";
        else annHtml+="<span class='ann ann-fire' style='color:"+showFI.col+";border-color:"+showFI.col.replace("1)","0.4)")+"' onclick='document.getElementById(\"pop-ttl\").textContent=\"\";document.getElementById(\"pop-body\").innerHTML=\"\";showFireDangerPop("+(fd.currentFFDI!==null?fd.currentFFDI:"null")+","+fd.todayMaxFFDI+","+fd.df+")'>"+fireLabel+"</span>";
      }
    }
    // Heatwave pill — fires for today OR tomorrow so there is a day of lead time.
    // Cache-derived climatology only; silent where we have none.
    window._HWDAYS=null;window._HWPILLDATE=null;
    if(window._FC&&typeof findClimEntry==="function"){
      var hwEnt=findClimEntry(window._FC.latitude,window._FC.longitude,window._FC.elevation,CLIM_HAZARD_KM,true);
      var hwClim=hwEnt?hwClimatology(hwEnt):null;
      if(hwClim){
        window._HWDAYS=heatwaveDays(window._FC,hwClim);
        if(window._HWDAYS){
          var hwD0=new Date(),hwFmt=new Intl.DateTimeFormat("en-CA",{timeZone:window._FC.timezone||"UTC",year:"numeric",month:"2-digit",day:"2-digit"});
          var hwToday=hwFmt.format(hwD0),hwTmrw=hwFmt.format(new Date(hwD0.getTime()+86400000));
          var hA=hwForDate(window._HWDAYS,hwToday),hB=hwForDate(window._HWDAYS,hwTmrw);
          var hw=(hA&&hB)?(hB.sev>hA.sev?hB:hA):(hA||hB);
          if(hw){
            window._HWPILLDATE=hw.date;
            alertHtml+="<span class='ann ann-heat"+(hw.band===1?" quiet":"")+"' onclick='document.getElementById(\"pop-ttl\").textContent=\"\";document.getElementById(\"pop-body\").innerHTML=\"\";showHeatwavePop(\""+hw.date+"\",null)'>"
              +"<span>\uD83C\uDF21\uFE0F "+hw.label+(hw.date!==hwToday?" from tomorrow":"")+" \u00B7 "+hw.scale+"/10</span></span>";
          }
        }
      }
    }
    // Coldwave pill — today or tomorrow, same rules as the heatwave pill.
    // Low intensity reads as a quieter "Cold snap"; severe and extreme as "Coldwave".
    window._CWDAYS=null;window._CWPILLDATE=null;
    if(window._FC&&typeof findClimEntry==="function"){
      var cwEnt=findClimEntry(window._FC.latitude,window._FC.longitude,window._FC.elevation,CLIM_HAZARD_KM,true);
      var cwClim=cwEnt?cwClimatology(cwEnt):null;
      if(cwClim){
        window._CWDAYS=coldwaveDays(window._FC,cwClim);
        if(window._CWDAYS){
          var cwD0=new Date(),cwFmt=new Intl.DateTimeFormat("en-CA",{timeZone:window._FC.timezone||"UTC",year:"numeric",month:"2-digit",day:"2-digit"});
          var cA=hwForDate(window._CWDAYS,cwFmt.format(cwD0)),cB=hwForDate(window._CWDAYS,cwFmt.format(new Date(cwD0.getTime()+86400000)));
          var cw=(cA&&cB)?(cB.sev>cA.sev?cB:cA):(cA||cB);
          if(cw){
            window._CWPILLDATE=cw.date;
            var cwIsTomorrow=cw.date!==cwFmt.format(cwD0);
            alertHtml+="<span class='ann "+(cw.band>=2?"ann-cwave":"ann-csnap quiet")+"' onclick='showColdwavePop(\""+cw.date+"\",null)'>"
              +"<span>"+(cw.cooler?"\uD83C\uDF43 ":"\u2744\uFE0F ")+cw.label+(cwIsTomorrow?" from tomorrow":"")+" \u00B7 "+cw.scale+"/10</span></span>";
          }
        }
      }
    }
    // Warmer/cooler than usual — today, when no heatwave or coldwave covers today
    if(window._FC&&typeof findClimEntry==="function"){
      var anToday=new Intl.DateTimeFormat("en-CA",{timeZone:window._FC.timezone||"UTC",year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
      var anT=anomFor(window._FC,anToday);
      if(anT)alertHtml+="<span class='ann quiet "+(anT.warm?"ann-an-w":"ann-an-c")+"' onclick='showAnomPop(\""+anToday+"\",null)'>"
        +"<span>"+(anT.warm?"\u2197\uFE0F ":"\u2198\uFE0F ")+anT.label+" today</span></span>";
    }
  }
  for(var i=0;i<verdictAnns.length;i++)annHtml+=annSpan(verdictAnns[i]);
  document.getElementById(areaId).innerHTML=
    (alertHtml?"<div class='alert-strip'>"+alertHtml+"</div>":"")
    +"<div class='score-hero'>"
    +"<div class='ring-wrap' onclick='showBreakdown("+r.tP+","+r.hP+","+r.iP+","+r.wP+","+score+","+temp+","+effDP+","+wind+","+(r.rP||0)+","+(rain==null?"null":rain)+","+(r.sleep?1:0)+")' title='Score breakdown'>"+scoreRing(score)
    +"<div class='ring-centre'>"
    +"<span class='ring-num' style='color:"+si.col+"'>"+score+"</span>"
    +"<span class='ring-lbl' style='color:"+si.col+"'>"+si.label+" "+si.emoji+"</span>"
    +"<span class='ring-info'>"+(r.sleep?"\uD83C\uDF19 sleep comfort &#9432;":"breakdown &#9432;")+"</span>"
    +"</div></div>"
    +"<div class='annotations'>"+annHtml+"</div>"
    +"</div>";
}
// 270° ring, open at the bottom, filled to the score in its band colour
function scoreRing(score){
  var v=Math.min(100,Math.max(0,score)),R=52,C=2*Math.PI*R,arc=C*0.75;
  var col=SBANDS[bandForScore(v)].col.replace("0.92","1");
  return "<svg viewBox='0 0 120 120' aria-hidden='true'>"
    +"<circle class='ring-track' cx='60' cy='60' r='"+R+"' fill='none' stroke-width='10' stroke-linecap='round' stroke-dasharray='"+arc.toFixed(1)+" "+C.toFixed(1)+"' transform='rotate(135 60 60)'/>"
    +(v>0?"<circle cx='60' cy='60' r='"+R+"' fill='none' stroke='"+col+"' stroke-width='10' stroke-linecap='round' stroke-dasharray='"+(arc*v/100).toFixed(1)+" "+C.toFixed(1)+"' transform='rotate(135 60 60)' style='filter:drop-shadow(0 0 4px "+col.replace(",1)",",0.45)")+")'/>":"")
    +"</svg>";
}

// ── UV popup ───────────────────────────────────────────────────────────────
// WHO UV index categories; protection advised from 3. Text colours are darkened
// versions of the standard UV colours so they stay readable.
function uvBand(u){
  if(u<3)return{label:"Low",col:"#2e8b2e"};
  if(u<6)return{label:"Moderate",col:"#b08f00"};
  if(u<8)return{label:"High",col:"#e06000"};
  if(u<11)return{label:"Very high",col:"#c8001a"};
  return{label:"Extreme",col:"#6b49c8"};
}
// Peak UV and the sun-protection window (UV 3 or more) for one day of the forecast
function uvDayStats(fc,dateStr){
  if(!fc||!fc.hourly||!fc.hourly.uv_index)return null;
  var t=fc.hourly.time,u=fc.hourly.uv_index,pk=-1,pkI=-1,from=-1,to=-1;
  for(var i=0;i<t.length;i++){
    if(t[i].slice(0,10)!==dateStr||u[i]==null)continue;
    if(u[i]>pk){pk=u[i];pkI=i;}
    if(u[i]>=3){if(from<0)from=i;to=i;}
  }
  if(pkI<0)return null;
  var off=getTZOffsetMin(fc.timezone);
  var hr=function(i,add){return new Intl.DateTimeFormat("en-AU",{timeZone:fc.timezone,hour:"numeric",hour12:true}).format(new Date(toEpoch(t[i],off)+(add||0))).toLowerCase().replace(" ","");};
  return{peak:pk,peakAt:hr(pkI),from:from>=0?hr(from):null,to:to>=0?hr(to,3600000):null};
}
function showUVPop(dateStr,uvVal,backDi){
  var fc=window._FC,tz=fc?fc.timezone:"UTC";
  var today=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  dateStr=dateStr||today;
  var isToday=dateStr===today;
  // Live screen: use the current hour's UV when no value is given
  if(uvVal==null&&isToday&&backDi==null&&fc&&fc.hourly&&fc.hourly.uv_index){
    var h=localHourInTZ(tz);
    for(var i=0;i<fc.hourly.time.length;i++)if(fc.hourly.time[i].slice(0,10)===today&&parseInt(fc.hourly.time[i].slice(11,13))===h){uvVal=fc.hourly.uv_index[i];break;}
  }
  var st=uvDayStats(fc,dateStr);
  var show=uvVal!=null?uvVal:(st?st.peak:0),b=uvBand(show),r=Math.round(show);
  var when=isToday?"today":new Date(dateStr+"T12:00").toLocaleDateString(undefined,{weekday:"long"});
  var sub=[];
  if(st)sub.push(uvVal!=null?"Peak "+Math.round(st.peak)+" ("+uvBand(st.peak).label.toLowerCase()+") around "+st.peakAt:"Around "+st.peakAt);
  sub.push(st&&st.from?"Protection needed "+st.from+" \u2013 "+st.to:"No protection window "+when);
  var leads={
    Low:"Little risk for most people. Protection is still worth it near snow, water or sand, which reflect UV, or if you\u2019re out for hours.",
    Moderate:"Protection needed. Unprotected skin can start to burn after around half an hour for many people.",
    High:"Protection essential. Skin can burn in under 30 minutes \u2014 seek shade around the middle of the day.",
    "Very high":"Protection essential. Skin can burn in as little as 15 minutes, so keep midday time in the sun short.",
    Extreme:"Unprotected skin can burn in minutes. Avoid the midday sun where you can, and use every protection measure."
  };
  hazardPop({
    title:"UV index \u2600\uFE0F",
    col:b.col,
    headline:(uvVal!=null?(isToday&&backDi==null?"UV now ":"UV ")+r:"Peak UV "+r)+" \u2014 "+b.label,
    sub:sub.join(" \u00B7 "),
    lead:leads[b.label],
    advice:"<b>When UV is 3 or above:</b><br>"
      +"\uD83D\uDC55 <b>Cover up</b> \u2014 clothing that covers as much skin as possible, tightly woven.<br>"
      +"\uD83E\uDDF4 <b>Sunscreen</b> \u2014 SPF 30 or higher, broad-spectrum and water-resistant. Apply 20 minutes before going out and every 2 hours, or after swimming or sweating.<br>"
      +"\uD83D\uDC52 <b>Hat</b> \u2014 a broad-brimmed, legionnaire or bucket hat that shades face, ears and neck.<br>"
      +"\uD83C\uDF33 <b>Shade</b> \u2014 especially in the middle of the day, when UV is strongest.<br>"
      +"\uD83D\uDD76\uFE0F <b>Sunglasses</b> \u2014 close-fitting, wraparound, meeting sun-protection standards.",
    signs:"UV isn\u2019t heat: you can burn on a cool, windy or cloudy day, and temperature tells you nothing about it. Babies under 12 months should be kept out of direct sun when UV is 3 or above.",
    foot:"The UV index follows the World Health Organization scale: 1\u20132 low, 3\u20135 moderate, 6\u20137 high, 8\u201310 very high, 11+ extreme. Sun protection is recommended whenever it reaches 3. Forecast values include cloud cover and can change through the day. Follow your local health authority\u2019s sun-protection advice.",
    backDi:backDi});
}
function showBreakdown(tP,hP,iP,wP,score,temp,dp,wind,rP,rain,sleep){
  var lw=window._LW||{};
  if(temp==null)temp=lw.temp;if(dp==null)dp=lw.effDP;if(wind==null)wind=lw.wind;
  rP=rP||0;
  var s=sleep?gsSleep():gs(),si=scoreInfo(score),col=SBANDS[bandForScore(score)].col.replace("0.92","1");
  var deg=function(c){return String(toDisp(c).toFixed(1)).replace("-","−")+unitSym();};
  var gap=function(d){return(useFahrenheit?d*1.8:d).toFixed(1)+"°";};
  var hasT=temp!=null&&!isNaN(temp),hasD=dp!=null&&!isNaN(dp),hasW=wind!=null&&!isNaN(wind);
  var bft=hasW?beaufort(wind).n:"",wb=(hasT&&hasD)?wetBulb(temp,dp):null;
  var rows=[],lead="";
  function row(icon,name,sub,pts,bonus){
    var p=Math.round(Math.abs(pts)),ok=p===0;
    var tag=ok?"<span style='color:#1a7a3a'>✓</span>":bonus?"<span style='color:#1a7a3a'>+"+p+"</span>":"<span>−"+p+"</span>";
    rows.push("<div style='padding:7px 0;border-bottom:1px solid var(--divider)'>"
      +"<div style='display:flex;justify-content:space-between;align-items:baseline;gap:8px'>"
      +"<span style='font-size:13.5px;font-weight:800;color:var(--text)'>"+icon+" "+name+"</span>"
      +"<span style='font-size:14px;font-weight:800;color:var(--text);white-space:nowrap'>"+tag+(ok?"":" <span style='font-size:10px;color:var(--text-muted)'>pts</span>")+"</span></div>"
      +"<div style='font-size:11.5px;font-weight:600;color:var(--text-muted);margin-top:1px'>"+sub+"</div>"
      +(ok?"":"<div style='height:5px;border-radius:3px;background:var(--range-bg);margin-top:5px;overflow:hidden'><div style='height:100%;width:"+Math.max(3,Math.min(100,p))+"%;border-radius:3px;background:"+(bonus?"#3a9a2a":col)+"'></div></div>")
      +"</div>");
  }
  // Temperature
  if(Math.round(tP)>0&&hasT){
    var warm=temp>s.thi;
    row(warm?"🌡️":"🧥",warm?"Too warm":"Too cold",
      (warm?gap(temp-s.thi)+" above the "+deg(s.thi)+(sleep?" that’s too warm for you to sleep":" you start to feel hot at"):gap(s.tlo-temp)+" below the "+deg(s.tlo)+(sleep?" that’s too cold for you to sleep":" you start to feel cold at")),tP);
  }else row("🌡️","Temperature",hasT?deg(temp)+" — inside your "+(sleep?"sleeping ":"")+deg(s.tlo)+" to "+deg(s.thi)+" range":"no penalty",0);
  // Humidity
  if(Math.round(hP)>0)row("💧","Humid air",(hasD?"Dew point "+deg(dp)+" — ":"")+"you notice humidity above "+deg(s.dp),hP);
  else row("💧","Humidity",hasD?(hasT&&temp<s.tlo?"Dew point "+deg(dp)+" — humidity doesn’t count when it’s cool":"Dew point "+deg(dp)+" — comfortable"):"no penalty",0);
  // Heat stress (only relevant above the comfort ceiling)
  if(Math.round(iP)>0)row("🥵","Heat stress",(wb!=null?"Wet bulb "+deg(wb)+" — ":"")+"builds from "+deg(s.wb0)+" once it’s hot",iP);
  else if(hasT&&temp>s.thi)row("🥵","Heat stress",wb!=null?"Wet bulb "+deg(wb)+" — below "+deg(s.wb0):"no penalty",0);
  // Wind
  if(sleep&&Math.round(wP)<0)row("🍃","Breeze bonus","A breeze through an open window helps on a warm night",wP,true);
  else if(sleep)row("💨","Wind","Doesn’t count while you’re indoors asleep",0);
  else if(Math.round(wP)<0)row("🍃","Breeze bonus","A "+(bft||"pleasant breeze")+" near your ideal temperature",wP,true);
  else if(Math.round(wP)>0)row("💨","Windy",(bft?bft.charAt(0).toUpperCase()+bft.slice(1)+(hasW?" ("+Math.round(wind)+" km/h)":""):"Wind")+(hasT&&temp<s.wchill_thresh&&wind>0?" — wind chill adds to the cold":""),wP);
  else row("💨","Wind",hasW?(wind<1?"Calm":bft.charAt(0).toUpperCase()+bft.slice(1)+" ("+Math.round(wind)+" km/h)"):"no penalty",0);
  // Rain (optional preference)
  var wet=rain!=null&&!isNaN(rain)&&rain>=RAIN_MIN,rmm=wet?(rain<10?rain.toFixed(1):Math.round(rain))+" mm in the hour":"";
  if(Math.round(rP)>0)row("🌧️","Rain",rmm+(hasT&&temp<s.tlo?" — cold rain counts for more":hasT&&temp>s.thi?" — warm rain counts for less":""),rP);
  else if(wet&&sleep)row("🌧️","Rain",rmm+" — doesn’t count while you’re asleep",0);
  else if(wet&&!s.rainOn)row("🌧️","Rain",rmm+" — not counted (turned off in Preferences)",0);
  else if(s.rainOn)row("🌧️","Rain",wet?rmm:"Dry",0);
  // Headline: the biggest factor
  var f=[["the heat",hasT&&temp>s.thi?tP:0],["the cold",hasT&&temp<=s.thi?tP:0],["the humidity",hP],["heat stress",iP],["the wind",Math.max(0,wP)],["the rain",rP]];
  f.sort(function(a,b){return b[1]-a[1];});
  var tot=tP+hP+iP+Math.max(0,wP)+rP;
  if(Math.round(f[0][1])<1)lead=Math.round(wP)<0?"Every reading is inside your comfort ranges, and a pleasant breeze lifts it further.":"Every reading is inside your comfort ranges — nothing to take off.";
  else lead=(f[0][1]>=tot*0.6?"Mostly ":"Led by ")+f[0][0]+(Math.round(f[1][1])>=1?", then "+f[1][0]:"")+".";
  var over=100-tot+Math.max(0,-wP)<0;
  var cond=[hasT?deg(temp):"",hasD?"dew point "+deg(dp):"",hasW?Math.round(wind)+" km/h wind":""].filter(Boolean).join(" · ");
  var body="<div class='washing-reason'>"
    +"<div style='padding:8px 10px;border-radius:8px;background:"+hzRgba(col,0.14)+";border:1px solid "+hzRgba(col,0.45)+"'>"
    +"<div style='font-size:15px;font-weight:800;color:"+col+";line-height:1.3'>"+score+" — "+si.label+" "+si.emoji+"</div>"
    +(cond?"<div style='font-size:12px;font-weight:700;color:var(--text-muted);margin-top:2px'>"+cond+"</div>":"")
    +"</div>"
    +(sleep?"<div style='font-size:12px;font-weight:700;color:var(--text-muted);margin-top:8px'>\uD83C\uDF19 Sleep comfort: scored for sleeping, during your sleep hours ("+sleepFmt(SLEEP_FROM)+" \u2013 "+sleepFmt(SLEEP_TO)+").</div>":"")
    +"<div style='font-size:14px;font-weight:800;color:var(--text);line-height:1.5;margin-top:10px'>"+lead+"</div>"
    +"<div style='margin-top:6px'>"+rows.join("")+"</div>"
    +"<div style='display:flex;justify-content:space-between;align-items:baseline;padding-top:8px'>"
    +"<span style='font-size:13px;font-weight:800;color:var(--text-head)'>Score</span>"
    +"<span style='font-size:13px;font-weight:700;color:var(--text-muted)'>100"+(Math.round(tot)>0?" − "+Math.round(tot):"")+(Math.round(wP)<0?" + "+Math.round(-wP):"")+" = <span style='font-size:18px;font-weight:800;color:"+col+"'>"+score+"</span></span></div>"
    +(over?"<div style='font-size:11px;color:var(--text-muted);margin-top:2px'>Penalties add up to more than 100, so the score stops at 0.</div>":"")
    +"<div style='height:1px;background:var(--divider);margin:10px 0 9px'></div>"
    +"<div style='font-size:11px;color:var(--text-muted);line-height:1.6'>Each penalty comes from your Preferences: where you start to feel hot and cold, how sensitive you are to heat, cold, humidity and wind, and whether rain counts. Points are rounded, so the lines can differ from the total by one.</div>"
    +"</div>";
  document.getElementById("pop-ttl").textContent="Score breakdown";
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}
