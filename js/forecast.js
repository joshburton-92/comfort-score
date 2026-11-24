// Comfort Score · forecast.js — forecast render, washing, clothing, forecast scroll, day narrative
// Loaded by index.html (classic script, deferred, in a fixed order). All names are global.
// ── Forecast + history ─────────────────────────────────────────────────────
function renderForecast(fc){
  window._FC=fc;
  render7Day(fc);
  document.getElementById("forecast-wrap").style.display="block";
}

// ── Washing feature ────────────────────────────────────────────────────────
function checkConditions(temp,dew,wind,wxCode){
  var issues=[];
  if(temp<5)issues.push("too cold");
  if(dew>temp-4)issues.push("too humid");
  if(wind>50)issues.push("too windy");
  if(wxCode!==null&&wxCode>=51)issues.push("rain");
  return issues;
}
function formatHour(h){var ampm=h>=12?"pm":"am";var h12=h%12||12;return h12+":00"+ampm;}
function toEpoch(s,tzOff){var p=parseLocalTimeStr(s);return Date.UTC(p.yr,p.mo,p.dy,p.hr,p.mn,0)-tzOff*60000;}

// Rain-amount gate — a wet weather code carrying a negligible forecast amount
// (0.1mm and under) is not enough to call a window "wet". Raise WASH_WET_MM to
// be stricter, lower it to be more cautious.
var WASH_WET_MM=0.2;
function washMm(i){var h=window._FC&&window._FC.hourly,pr=h&&h.precipitation;if(!pr||pr[i]===null||pr[i]===undefined)return null;return pr[i];}
function washWet(i,codes){
  var c=(codes&&codes[i]!==null&&codes[i]!==undefined)?codes[i]:0;
  if(c<51)return false;
  var mm=washMm(i);
  return mm===null||mm>=WASH_WET_MM;
}
function washNowIdx(tzOff){
  var h=window._FC&&window._FC.hourly;if(!h||!h.time)return -1;
  var now=Date.now(),best=-1;
  for(var i=0;i<h.time.length;i++){if(toEpoch(h.time[i],tzOff)<=now)best=i;else break;}
  return best;
}

function findBetterWindow(tzOff,sunsetEpoch,dryHours){
  if(!window._FC||!window._FC.hourly)return null;
  var h=window._FC.hourly,times=h.time||[],temps=h.temperature_2m||[],
      dews=h.dew_point_2m||[],winds=h.wind_speed_10m||[],codes=h.weather_code||[];
  var now=Date.now(),startIdx=0;
  for(var i=0;i<times.length;i++){if(toEpoch(times[i],tzOff)>=now){startIdx=i;break;}}
  var endIdx=Math.min(startIdx+12,temps.length);
  for(var j=startIdx+1;j<endIdx;j++){
    var t=temps[j],d=dews[j],w=winds[j],c=codes[j];
    if(t===null||d===null||w===null)continue;
    var slotEp=toEpoch(times[j],tzOff);
    if(sunsetEpoch&&slotEp>sunsetEpoch)break;
    var issues=checkConditions(t,d,w,washWet(j,codes)?c:0);
    if(issues.length>0)continue;
    var hoursToSunset=sunsetEpoch?(sunsetEpoch-slotEp)/3600000:6;
    // Drying quality — based on VPD, wind, temp only; not comfort score
    var slotSvp=0.6108*Math.exp(17.27*t/(t+237.3));
    var slotAvp=0.6108*Math.exp(17.27*d/(d+237.3));
    var slotVpd=slotSvp-slotAvp;
    var slotWmult=1+Math.min(1.5,w/20);
    var slotTfact=Math.max(0.3,Math.min(1.0,(t-5)/20));
    var slotDpPenalty=d>20?0.35:d>16?Math.max(0.35,1.0-(d-16)*0.1625):1.0;
    var slotDryIdx=slotVpd*slotWmult*slotTfact*slotDpPenalty;
    if(slotDryIdx>=0.7&&t>=10&&(!dryHours||hoursToSunset>=dryHours*0.8)){
      // Format time with day context — check if it's tomorrow
      var slotDate=new Date(slotEp);
      var nowDate=new Date(now);
      var isTomorrow=slotDate.getDate()!==nowDate.getDate();
      var hourStr=formatHour(new Date(slotEp).toLocaleString("en-US",{timeZone:window._FC.timezone,hour:"numeric",hour12:false}).replace(/\D/g,"")*1);
      var timeLabel=(isTomorrow?"tomorrow ":"")+hourStr;
      var res=calc(t,d,w);
      return{epoch:slotEp,timeLabel:timeLabel,score:res.score,temp:t,dew:d,wind:w};
    }
  }
  return null;
}

function findAfterRainWindow(rainStartIdx,tzOff,sunsetEpoch){
  if(!window._FC||!window._FC.hourly)return null;
  var h=window._FC.hourly,times=h.time||[],temps=h.temperature_2m||[],dews=h.dew_point_2m||[],winds=h.wind_speed_10m||[],codes=h.weather_code||[];
  for(var i=rainStartIdx+1;i<times.length;i++){
    var slotEp=toEpoch(times[i],tzOff);
    if(sunsetEpoch&&slotEp>sunsetEpoch)return null;
    if(washWet(i,codes))continue;
    var t=temps[i],d=dews[i],w=winds[i];
    if(t===null||d===null||w===null)continue;
    var hoursToSunset=sunsetEpoch?(sunsetEpoch-slotEp)/3600000:3;
    if(hoursToSunset<1)return null;
    var issues=checkConditions(t,d,w,0);
    var res=calc(t,d,w);
    return{epoch:slotEp,hour:new Date(slotEp).getHours(),hoursToSunset:hoursToSunset,score:res.score,temp:t,usable:issues.length===0&&res.score>=55&&hoursToSunset>=2};
  }
  return null;
}

function checkWashingManual(){
  window._washWind="";
  // Get values from manual inputs
  var tempDisp=parseFloat(document.getElementById("m-temp").value)||20;
  var temp=fromDisp(tempDisp);
  var mode=document.getElementById("m-mode").value;
  var effDP;
  if(mode==="dp"){
    effDP=fromDisp(parseFloat(document.getElementById("m-dp").value)||10);
  } else {
    var rh2=parseFloat(document.getElementById("m-rh").value)||60;
    var aa=17.27,bb=237.3;
    var alph=(aa*temp/(bb+temp))+Math.log(rh2/100);
    effDP=Math.round((bb*alph/(aa-alph))*10)/10;
  }
  var wind=parseFloat(document.getElementById("m-wind").value)||0;
  // Derive RH from DP and temp for VPD calculation
  var svp=0.6108*Math.exp(17.27*temp/(temp+237.3));
  var avpFromDP=0.6108*Math.exp(17.27*effDP/(effDP+237.3));
  var rh=Math.round(Math.min(100,(avpFromDP/svp)*100));

  // Freeze check
  if(temp<=0)return washingPop("Too cold to dry outside \u2744\uFE0F","Below freezing — washing will freeze on the line rather than dry. Dry inside.","#5a8aa8");

  // VPD drying index
  var avp=svp*(rh/100);
  var vpd=svp-avp;
  var wMult=1+Math.min(1.5,wind/20);
  var tFact=Math.max(0.3,Math.min(1.0,(temp-5)/20));
  var dryIdx=vpd*wMult*tFact;

  // DP penalty
  var dpPenalty=1.0;
  if(effDP>20)dpPenalty=0.35;
  else if(effDP>16)dpPenalty=Math.max(0.35,1.0-(effDP-16)*0.1625);
  dryIdx=dryIdx*dpPenalty;

  // Drying time
  var dryHours,dryLabel;
  if(dryIdx>1.8){dryHours=0.75;dryLabel="30\u201360 minutes";}
  else if(dryIdx>1.2){dryHours=1.5;dryLabel="1\u20132 hours";}
  else if(dryIdx>0.7){dryHours=3;dryLabel="2\u20134 hours";}
  else if(dryIdx>0.3){dryHours=5;dryLabel="4\u20136 hours";}
  else{dryHours=999;dryLabel=null;}

// Reason string
  var rsns=[];
  if(effDP>20)rsns.push("very high dew point ("+toDisp(effDP).toFixed(1)+unitSym()+")");
  else if(effDP>16)rsns.push("high dew point ("+toDisp(effDP).toFixed(1)+unitSym()+")");
  else if(vpd<0.3)rsns.push("the air is quite humid");
  else if(vpd>1.2&&effDP<=16)rsns.push("low humidity");
  if(wind<5)rsns.push("not much wind");
  else if(wind>=20)rsns.push(windPhrase(wind));
  if(temp>25)rsns.push("warm temperature");
  else if(temp<12)rsns.push("cool temperature");
  var rsn=rsns.length?(rsns[0].charAt(0).toUpperCase()+rsns[0].slice(1)+(rsns.length>1?" and "+rsns.slice(1).join(", "):"")+"."):
    "Conditions look reasonable.";

  // Humidity caveat
  var dpAlreadyMentioned=(effDP>16);
  var humCaveat="";
  if((vpd<0.6||effDP>16)&&dryHours>=3&&!dpAlreadyMentioned){
    humCaveat=" High humidity will slow things down.";
  } else if(effDP>18&&dryHours<3){
    humCaveat=" Note: dew point is high \u2014 washing may feel damp longer than expected.";
  }
  if(effDP>24){dryHours=999;}
  else if(effDP>18&&dryHours<=5){dryHours=5;dryLabel="4\u20136 hours (possibly longer in high humidity)";}

if(dryHours===999){
    var badRsns=[];
    if(effDP>24)badRsns.push("dew point is "+toDisp(effDP).toFixed(1)+unitSym()+" \u2014 the air is almost fully saturated");
    else if(effDP>20)badRsns.push("dew point is "+toDisp(effDP).toFixed(1)+unitSym()+" \u2014 too humid for drying");
    else if(effDP>16)badRsns.push("dew point is "+toDisp(effDP).toFixed(1)+unitSym()+" \u2014 humidity will prevent drying");
    else if(vpd<0.3)badRsns.push("air is too humid for evaporation");
    if(temp<10)badRsns.push(temp<=0?"freezing temperature":"too cold for effective drying");
    if(effDP<=16&&wind<=5)badRsns.push("not enough wind");
    if(!badRsns.length)badRsns.push("conditions are too cool, still and humid for effective drying");
    var badRsn=badRsns.length?(badRsns[0].charAt(0).toUpperCase()+badRsns[0].slice(1)+(badRsns.length>1?", and "+badRsns.slice(1).join(", "):"")+"."):
      "Conditions aren\u2019t suitable for drying.";
    var bwBad=findBetterWindow(tzOff,sunsetEpoch,3);
    var bwBadMsg=bwBad?" Conditions may improve around "+bwBad.timeLabel+" — worth checking back then.":"";
    return washingPop("Probably not today \u274C",badRsn+(bwBadMsg||" Best inside."),"#c03020");
  }

  // No daylight check in manual mode — just give the drying estimate
  var col=dryHours<=1.5?"#1a7a3a":dryHours<=3?"#3a9a2a":"#7a7000";
  var emoji=dryHours<=1.5?"\u2600\uFE0F":dryHours<=3?"\uD83D\uDC4D":"\uD83D\uDE10";
  return washingPop("Should dry in about "+dryLabel+" "+emoji,rsn+humCaveat+" (No forecast data \u2014 rain and sunset not checked.)",col);
}

// The world check costs ~198 API calls, so its raw conditions are kept for 15 minutes
// (Open-Meteo's "current" values only update every 15 min anyway). Scores are recalculated
// from the kept conditions each time, so changed comfort settings still apply.
var WORLD_TTL_MS=15*60*1000;
var _worldRaw=null,_worldRawAt=0;
function openWorldCheck(){
  document.getElementById("world-ov").classList.add("open");
  if(_worldRaw&&Date.now()-_worldRawAt<WORLD_TTL_MS){scoreWorld(_worldRaw);return;}
  document.getElementById("world-body").innerHTML="<div class='world-loading'>Checking "+WORLD_CITIES.length+" cities\u2026</div>";
  fetchWorldScores();
}
function closeWorld(){document.getElementById("world-ov").classList.remove("open");}
// Rows pass their WORLD_CITIES index rather than the name, so names carrying an
// apostrophe (Nuku'alofa, N'Djamena) can't break the onclick attribute.
function worldLoad(i){
  var c=WORLD_CITIES[i];
  if(!c)return;
  closeWorld();
  fetchWeather(c.lat,c.lon,c.name);
  window.scrollTo({top:0,behavior:"smooth"});
}

function fetchWorldScores(){
  var lats=WORLD_CITIES.map(function(c){return c.lat;}).join(",");
  var lons=WORLD_CITIES.map(function(c){return c.lon;}).join(",");
  var url="https://api.open-meteo.com/v1/forecast?latitude="+lats+"&longitude="+lons
    +"&current=temperature_2m,dew_point_2m,wind_speed_10m,precipitation"
    +"&wind_speed_unit=kmh&timezone=auto&forecast_days=1";
  fetch(url).then(function(r){if(!r.ok)throw apiError(r.status);return r.json();}).then(function(data){
    // data is array when multiple locations
    var results=Array.isArray(data)?data:[data];
    var raw=[];
    for(var i=0;i<results.length;i++){
      var d=results[i];
      // "current" rain is the total over the last interval (usually 15 min) — scale to mm per hour
      var cu=d&&d.current,rr=cu&&cu.precipitation!=null?cu.precipitation*3600/(cu.interval||900):null;
      raw.push(cu?{temp:cu.temperature_2m,dp:cu.dew_point_2m,wind:cu.wind_speed_10m,rain:rr}:null);
    }
    if(!raw.some(function(x){return x;}))throw new Error("No data returned");
    _worldRaw=raw;_worldRawAt=Date.now();
    scoreWorld(raw);
  }).catch(function(e){
    document.getElementById("world-body").innerHTML="<div class='world-loading'>"+(e.friendly?"":"Failed to load: ")+e.message+"</div>";
  });
}
function scoreWorld(raw){
  var scored=[];
  for(var i=0;i<raw.length&&i<WORLD_CITIES.length;i++){
    var c=raw[i];
    if(!c)continue;
    scored.push({
      idx:i,
      name:WORLD_CITIES[i].name,
      cc:WORLD_CITIES[i].cc,
      score:calc(c.temp,c.dp,c.wind,c.rain).score,
      rain:c.rain,
      temp:c.temp,
      dp:c.dp,
      wind:c.wind
    });
  }
  renderWorldResults(scored);
}

function renderWorldResults(scored){
  window._worldScored=scored;
  renderWorldBody();
}
function shuffleWorld(){renderWorldBody();}
function renderWorldBody(){
  var scored=window._worldScored;
  if(!scored)return;
  var sorted=scored.slice().sort(function(a,b){return b.score-a.score;});
  var topScore=sorted[0].score;
  var bottomScore=sorted[sorted.length-1].score;
  var topPool=sorted.filter(function(c){return c.score===topScore;});
  var bottomPool=sorted.filter(function(c){return c.score===bottomScore;});
  // Shuffle helper
  function pick5(arr){
    var a=arr.slice();
    for(var i=a.length-1;i>0;i--){var j=Math.floor(Math.random()*(i+1));var t=a[i];a[i]=a[j];a[j]=t;}
    return a.slice(0,5);
  }
  var top=topPool.length>5?pick5(topPool):topPool.slice(0,5);
  var bottom=bottomPool.length>5?pick5(bottomPool):bottomPool.length>=5?bottomPool.slice(0,5):sorted.slice(-5).reverse();
  // Pinned cities
  var pinned=[];
  for(var pi=0;pi<PINNED_CITIES.length;pi++){
    for(var si=0;si<scored.length;si++){
      if(scored[si].name===PINNED_CITIES[pi]){pinned.push(scored[si]);break;}
    }
  }
  function row(c){
    var nc=SBANDS[bandForScore(c.score)].col.replace("0.92","1");
    return "<div class='world-row' onclick='worldLoad("+c.idx+")'>"
      +"<div class='world-score' style='color:"+nc+"'>"+c.score+"</div>"
      +"<div class='world-name'>"+c.name+"</div>"
      +"<div class='world-cc'>"+c.cc+" \u00B7 "+(c.rain!=null&&c.rain>=RAIN_MIN?"\uD83C\uDF27\uFE0F ":"")+toDisp(c.temp).toFixed(1)+unitSym()+"</div></div>";
  }
  var shuffleBtn="<button onclick='shuffleWorld()' style='background:none;border:1px solid var(--card-border);border-radius:20px;padding:2px 10px;font-size:10px;font-weight:800;color:var(--text-sec);cursor:pointer;margin-left:6px;vertical-align:middle'>shuffle</button>";
  var html="";
  html+="<div class='world-section'>\uD83C\uDFC6 Top 5 right now"+(topPool.length>5?shuffleBtn:"")+"</div>";
  for(var i=0;i<top.length;i++)html+=row(top[i]);
  html+="<div class='world-section'>\uD83C\uDF0D World</div>";
  for(var i=0;i<pinned.length;i++)html+=row(pinned[i]);
  html+="<div class='world-section'>\uD83C\uDF21\uFE0F Bottom 5 right now"+(bottomPool.length>5?shuffleBtn:"")+"</div>";
  for(var i=0;i<bottom.length;i++)html+=row(bottom[i]);
  var agoMin=Math.floor((Date.now()-_worldRawAt)/60000);
  if(_worldRawAt&&agoMin>=1)html+="<div style='font-size:10px;font-weight:600;color:var(--text-muted);text-align:center;margin-top:10px'>Conditions checked "+agoMin+" min ago</div>";
  document.getElementById("world-body").innerHTML=html;
}

function checkWashing(){
  if(!window._FC)return;
  window._washWind="";
  var wi0=fcNowIdx(window._FC);
  if(wi0>=0){
    var wIdx=[];for(var wk=wi0;wk<=wi0+12&&wk<window._FC.hourly.time.length;wk++)wIdx.push(wk);
    var Ww=windOver(window._FC,wIdx);
    if(Ww.lvl)window._washWind=(tcActive()?"\uD83C\uDF00 Cyclone winds":"\uD83D\uDCA8 "+windName(Ww.lvl))+" from "+fcHourLabel(window._FC,Ww.first)+", gusting to "+Math.round(Ww.gust)+" km/h \u2014 peg everything firmly and bring it in before then, or dry inside.";
  }
  var fc=window._FC,tz=fc.timezone;
  window._tzOff=getTZOffsetMin(tz);
  var tzOff=window._tzOff;
  var temp=window._LW.temp,effDP=window._LW.effDP,rh=window._LW.rh,wind=window._LW.wind,wxNow=window._LW.wxCode||0;
  var now=Date.now();
  var todayDateStr=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  var todayDayIdx=fc.daily.time?fc.daily.time.indexOf(todayDateStr):0;
  if(todayDayIdx<0)todayDayIdx=0;
  var sunriseEpoch=toEpoch(fc.daily.sunrise[todayDayIdx],tzOff);
  var sunsetEpoch=toEpoch(fc.daily.sunset[todayDayIdx],tzOff);
  if(now>sunsetEpoch){
    var tmrwMsg="Hang it out tomorrow morning when there's a full day of drying ahead.";
    var tmrwColour="#5a8aa8";
    if(fc.daily.sunrise.length>1){
      var tmrwSunrise=toEpoch(fc.daily.sunrise[todayDayIdx+1],tzOff);
      var tmrwSunset=toEpoch(fc.daily.sunset[todayDayIdx+1],tzOff);
      var htimes=fc.hourly.time,htemps=fc.hourly.temperature_2m,hdps=fc.hourly.dew_point_2m,hwinds=fc.hourly.wind_speed_10m,hcodes=fc.hourly.weather_code||[];
      var tmrwRainByNoon=false,tmrwFirstSlot=null,tmrwAfternoonOk=false;
      for(var ti=0;ti<htimes.length;ti++){
        var tSlotMs=toEpoch(htimes[ti],tzOff);
        if(tSlotMs<tmrwSunrise)continue;
        if(tSlotMs>tmrwSunset)break;
        var tCode=hcodes[ti]||0,tTemp=htemps[ti],tDp=hdps[ti],tWind=hwinds[ti];
        if(tTemp===null||tDp===null||tWind===null)continue;
        var tHour=parseInt(new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",hour12:false}).format(new Date(tSlotMs)),10);
                var tWet=washWet(ti,hcodes);
        if(tWet&&tHour<=12)tmrwRainByNoon=true;
        if(!tmrwFirstSlot&&!tWet)tmrwFirstSlot={temp:tTemp,dp:tDp,wind:tWind};
        if(!tWet&&tHour>=12&&tHour<=16&&!tmrwAfternoonOk){
          var tSvp=0.6108*Math.exp(17.27*tTemp/(tTemp+237.3));
          var tAvp=0.6108*Math.exp(17.27*tDp/(tDp+237.3));
          var tVpd=tSvp-tAvp;
          var tWm=1+Math.min(1.5,tWind/20);
          var tTf=Math.max(0.3,Math.min(1.0,(tTemp-5)/20));
          var tDpPen=tDp>20?0.35:tDp>16?Math.max(0.35,1.0-(tDp-16)*0.1625):1.0;
          var tAfScore=calc(tTemp,tDp,tWind).score;
          if(tVpd*tWm*tTf*tDpPen>0.3&&tAfScore>=70)tmrwAfternoonOk=true;
        }
      }
      if(tmrwRainByNoon){
        tmrwMsg=tmrwAfternoonOk?"Tomorrow morning looks wet — dry inside overnight, or try again in the afternoon.":"Tomorrow morning looks wet — best to dry inside. Check the forecast before hanging out tomorrow.";
        tmrwColour="#b06010";
      } else if(tmrwFirstSlot){
        var fSvp=0.6108*Math.exp(17.27*tmrwFirstSlot.temp/(tmrwFirstSlot.temp+237.3));
        var fAvp=0.6108*Math.exp(17.27*tmrwFirstSlot.dp/(tmrwFirstSlot.dp+237.3));
        var fVpd=fSvp-fAvp;
        var fWm=1+Math.min(1.5,tmrwFirstSlot.wind/20);
        var fTf=Math.max(0.3,Math.min(1.0,(tmrwFirstSlot.temp-5)/20));
        var fDpPen=tmrwFirstSlot.dp>20?0.35:tmrwFirstSlot.dp>16?Math.max(0.35,1.0-(tmrwFirstSlot.dp-16)*0.1625):1.0;
        var fDryIdx=fVpd*fWm*fTf*fDpPen;
        var fScore=calc(tmrwFirstSlot.temp,tmrwFirstSlot.dp,tmrwFirstSlot.wind).score;
        var fPoor=fDryIdx<=0.15||fScore<70;
        if(fPoor){
          var fHumidHeat=tmrwFirstSlot.temp>22&&tmrwFirstSlot.dp>16;
          var fColdCalm=tmrwFirstSlot.temp<14&&tmrwFirstSlot.wind<8;
          var fReason=fHumidHeat?"high humidity means clothes may feel damp even after drying":fColdCalm?"not enough warmth or airflow":"conditions aren\u2019t ideal for drying";
          tmrwMsg=tmrwAfternoonOk?"Tomorrow morning isn\u2019t great \u2014 "+fReason+". Dry inside overnight, or wait until the afternoon.":"Tomorrow morning isn\u2019t great \u2014 "+fReason+". Best to dry inside and check the forecast.";
          tmrwColour="#b06010";
        }
      }
    }
    return washingPop("Sun\u2019s down \uD83C\uDF19",tmrwMsg,tmrwColour);
  }
  if(now<sunriseEpoch){
    var mornMsg="Hang it out after sunrise for best results.";
    var mornColour="#5a8aa8";
    var mhtimes=fc.hourly.time,mhtemps=fc.hourly.temperature_2m,mhdps=fc.hourly.dew_point_2m,mhwinds=fc.hourly.wind_speed_10m,mhcodes=fc.hourly.weather_code||[];
    var mornRain=false,mornFirstSlot=null,mornAfternoonOk=false;
    for(var mi=0;mi<mhtimes.length;mi++){
      var mSlotMs=toEpoch(mhtimes[mi],tzOff);
      if(mSlotMs<sunriseEpoch)continue;
      if(mSlotMs>sunsetEpoch)break;
      var mCode=mhcodes[mi]||0,mTemp=mhtemps[mi],mDp=mhdps[mi],mWind=mhwinds[mi];
      if(mTemp===null||mDp===null||mWind===null)continue;
      var mHour=parseInt(new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",hour12:false}).format(new Date(mSlotMs)),10);
            var mWet=washWet(mi,mhcodes);
      if(mWet&&mHour<=12)mornRain=true;
      if(!mornFirstSlot&&!mWet)mornFirstSlot={temp:mTemp,dp:mDp,wind:mWind};
      if(!mWet&&mHour>=12&&mHour<=16&&!mornAfternoonOk){
        var mSvp=0.6108*Math.exp(17.27*mTemp/(mTemp+237.3));
        var mAvp=0.6108*Math.exp(17.27*mDp/(mDp+237.3));
        var mVpd=mSvp-mAvp;
        var mWm=1+Math.min(1.5,mWind/20);
        var mTf=Math.max(0.3,Math.min(1.0,(mTemp-5)/20));
        var mDpPen=mDp>20?0.35:mDp>16?Math.max(0.35,1.0-(mDp-16)*0.1625):1.0;
        var mAfScore=calc(mTemp,mDp,mWind).score;
        if(mVpd*mWm*mTf*mDpPen>0.3&&mAfScore>=70)mornAfternoonOk=true;
      }
    }
    if(mornRain){
      mornMsg=mornAfternoonOk?"This morning looks wet — conditions may improve in the afternoon.":"This morning looks wet — best to dry inside. Check the forecast before hanging out.";
      mornColour="#b06010";
    } else if(mornFirstSlot){
      var mfSvp=0.6108*Math.exp(17.27*mornFirstSlot.temp/(mornFirstSlot.temp+237.3));
      var mfAvp=0.6108*Math.exp(17.27*mornFirstSlot.dp/(mornFirstSlot.dp+237.3));
      var mfVpd=mfSvp-mfAvp;
      var mfWm=1+Math.min(1.5,mornFirstSlot.wind/20);
      var mfTf=Math.max(0.3,Math.min(1.0,(mornFirstSlot.temp-5)/20));
      var mfDpPen=mornFirstSlot.dp>20?0.35:mornFirstSlot.dp>16?Math.max(0.35,1.0-(mornFirstSlot.dp-16)*0.1625):1.0;
      var mfDryIdx=mfVpd*mfWm*mfTf*mfDpPen;
      var mfScore=calc(mornFirstSlot.temp,mornFirstSlot.dp,mornFirstSlot.wind).score;
      var mfPoor=mfDryIdx<=0.15||mfScore<70;
      if(mfPoor){
        var mfHumidHeat=mornFirstSlot.temp>22&&mornFirstSlot.dp>16;
        var mfColdCalm=mornFirstSlot.temp<14&&mornFirstSlot.wind<8;
        var mfReason=mfHumidHeat?"high humidity means clothes may feel damp even after drying":mfColdCalm?"not enough warmth or airflow":"conditions aren\u2019t ideal for drying";
        mornMsg=mornAfternoonOk?"This morning isn\u2019t great \u2014 "+mfReason+". Conditions may improve in the afternoon.":"This morning isn\u2019t great \u2014 "+mfReason+". Best to dry inside and check the forecast.";
        mornColour="#b06010";
      }
    }
    return washingPop("Sun hasn\u2019t risen yet \uD83C\uDF19",mornMsg,mornColour);
  }
  if(sunsetEpoch<now&&fc.daily.sunrise.length>todayDayIdx+1){
    sunriseEpoch=toEpoch(fc.daily.sunrise[todayDayIdx+1],tzOff);
    sunsetEpoch=toEpoch(fc.daily.sunset[todayDayIdx+1],tzOff);
  }
  window._sunsetEpoch=sunsetEpoch;
  var hoursLeft=sunsetEpoch?Math.max(0,(sunsetEpoch-now)/3600000):6;
  // Freeze check — highest priority after night checks
  // But first scan for a warmer window later today
  if(temp<=0){
    var warmWindowMsg="";
    var times2=fc.hourly.time,temps2=fc.hourly.temperature_2m,dews2=fc.hourly.dew_point_2m,winds2=fc.hourly.wind_speed_10m,codes2=fc.hourly.weather_code||[];
    for(var fi=0;fi<times2.length;fi++){
      var fSlotMs=toEpoch(times2[fi],tzOff);
      if(fSlotMs<=now)continue;
      if(sunsetEpoch&&fSlotMs>sunsetEpoch)break;
      var fTemp=temps2[fi],fDew=dews2[fi],fWind=winds2[fi],fCode=codes2[fi]||0;
      if(fTemp===null||fTemp<=0)continue;
      if(washWet(fi,codes2))continue;
      var fHoursLeft=sunsetEpoch?(sunsetEpoch-fSlotMs)/3600000:3;
      if(fHoursLeft<1)break;
      var fTimeLabel=fmtFcTime(times2[fi],tz);
      warmWindowMsg=" Should warm above freezing around "+fTimeLabel+" \u2014 consider hanging out then if conditions hold.";
      break;
    }
    return washingPop("Below freezing \u2744\uFE0F","Washing will freeze on the line rather than dry."+warmWindowMsg+(warmWindowMsg?"":" Best to dry inside."),"#5a8aa8");
  }
    var times=fc.hourly.time,wxCodes=fc.hourly.weather_code||[];
  var nowMm=washMm(washNowIdx(tzOff));
  var rainingNow=wxNow>=51&&(nowMm===null||nowMm>=WASH_WET_MM);
  var rainStartIdx=null,rainInHours=null;
  for(var i=0;i<times.length;i++){
    var slotMs=toEpoch(times[i],tzOff);
    if(slotMs<now)continue;
    if(sunsetEpoch&&slotMs>sunsetEpoch)break;
    if(washWet(i,wxCodes)){rainInHours=Math.round((slotMs-now)/3600000);rainStartIdx=i;break;}
  }
  // VPD drying index
  var svp=0.6108*Math.exp(17.27*temp/(temp+237.3));
  var avp=svp*(rh/100);
  var vpd=svp-avp;
  var wMult=1+Math.min(1.5,wind/20);
  var tFact=Math.max(0.3,Math.min(1.0,(temp-5)/20));
  var dryIdx=vpd*wMult*tFact;
  // DP penalty
  var dpPenalty=1.0;
  if(effDP>20)dpPenalty=0.35;
  else if(effDP>16)dpPenalty=Math.max(0.35,1.0-(effDP-16)*0.1625);
  dryIdx=dryIdx*dpPenalty;
  // Drying time
  var dryHours,dryLabel;
  if(dryIdx>1.8){dryHours=0.75;dryLabel="30\u201360 minutes";}
  else if(dryIdx>1.2){dryHours=1.5;dryLabel="1\u20132 hours";}
  else if(dryIdx>0.7){dryHours=3;dryLabel="2\u20134 hours";}
  else if(dryIdx>0.3){dryHours=5;dryLabel="4\u20136 hours";}
  else{dryHours=999;dryLabel=null;}
  // Reason string
  var rsns=[];
  if(effDP>20)rsns.push("very high dew point ("+toDisp(effDP).toFixed(1)+unitSym()+")");
  else if(effDP>16)rsns.push("high dew point ("+toDisp(effDP).toFixed(1)+unitSym()+")");
  else if(vpd<0.3)rsns.push("the air is quite humid");
  else if(vpd>1.2&&effDP<=16)rsns.push("low humidity");
  if(wind<5)rsns.push("not much wind");
  else if(wind>=20)rsns.push(windPhrase(wind));
  if(temp>25)rsns.push("warm temperature");
  else if(temp<12)rsns.push("cool temperature");
  var rsn=rsns.length?(rsns[0].charAt(0).toUpperCase()+rsns[0].slice(1)+(rsns.length>1?" and "+rsns.slice(1).join(", "):"")+"."):
    "Conditions look reasonable.";
  // Humidity caveat
  var dpAlreadyMentioned=(effDP>16);
  var humCaveat="";
  if((vpd<0.6||effDP>16)&&dryHours>=3&&!dpAlreadyMentioned){
    humCaveat=" High humidity will slow things down \u2014 check the forecast and bring it in if the weather turns.";
  } else if(effDP>18&&dryHours<3){
    humCaveat=" Note: dew point is high ("+toDisp(effDP).toFixed(1)+unitSym()+") \u2014 washing may feel damp longer than expected.";
  }
  if(effDP>18&&dryHours<=5){dryHours=5;dryLabel="4\u20136 hours (possibly longer in high humidity)";}
// Rain now
  if(rainingNow){
    var rainIntro=wxNow>=95?"Thunderstorm outside.":wxNow>=80?"Showers outside.":wxNow>=61?"Rain outside.":"Drizzle outside.";
    var rainReasons=[];
if(effDP>24)rainReasons.push("dew point is "+toDisp(effDP).toFixed(1)+unitSym()+" \u2014 the air is almost fully saturated");
    else if(effDP>20)rainReasons.push("dew point is "+toDisp(effDP).toFixed(1)+unitSym()+" \u2014 very humid air will prevent drying even if the rain clears");
    else if(effDP>16)rainReasons.push("dew point is "+toDisp(effDP).toFixed(1)+unitSym()+" \u2014 high humidity will slow drying significantly");
    if(effDP<=20&&wind<5)rainReasons.push("almost no wind to help evaporation");
    if(effDP<=20&&temp>32)rainReasons.push("heat and humidity together mean the air can\u2019t absorb much moisture");
    else if(temp<10)rainReasons.push("cool temperature will slow drying");
    if(hoursLeft<2)rainReasons.push("less than 2 hours of daylight left");
    var rainBody=rainIntro;
    if(rainReasons.length){
      rainBody+=" Even if it clears: "+rainReasons[0].charAt(0).toUpperCase()+rainReasons[0].slice(1);
      for(var ri=1;ri<rainReasons.length;ri++)rainBody+=", and "+rainReasons[ri];
      rainBody+=".";
    }
    var clearAfterIdx=null;
    for(var j=0;j<times.length;j++){
      var slotMs2=toEpoch(times[j],tzOff);
      if(slotMs2<now)continue;
      if(!washWet(j,wxCodes)){clearAfterIdx=j;break;}
    }
    if(clearAfterIdx!==null){
      var clearWindow=findAfterRainWindow(clearAfterIdx-1,tzOff,sunsetEpoch);
      if(clearWindow&&clearWindow.usable&&dryHours!==999&&clearWindow.hoursToSunset>=dryHours){
        return washingPop("Raining now \uD83C\uDF27\uFE0F",rainBody+" Should clear around "+formatHour(clearWindow.hour)+" with about "+Math.round(clearWindow.hoursToSunset)+" hours of daylight left \u2014 worth trying then if conditions improve.","#b06010");
      }
      if(clearWindow&&(dryHours===999||clearWindow.hoursToSunset<dryHours)){
        var postRainIssue=dryHours===999?"conditions will still be too poor for drying after it clears":"not enough daylight left after it clears";
        return washingPop("Raining now \uD83C\uDF27\uFE0F",rainBody+" Rain may clear around "+formatHour(clearWindow.hour)+" but "+postRainIssue+". Best to dry inside.","#c03020");
      }
    }
    var bwRain=findBetterWindow(tzOff,sunsetEpoch,3);
    var bwRainMsg=bwRain?" Conditions may improve around "+bwRain.timeLabel+".":"";
    return washingPop("Raining now \uD83C\uDF27\uFE0F",rainBody+(bwRainMsg||" Best to dry inside."),"#c03020");
  }
  // Rain forecast
  if(rainInHours!==null){
    if(rainInHours<=1){var bwIm=findBetterWindow(tzOff,sunsetEpoch,3);var bwImMsg=bwIm?" Conditions may improve around "+bwIm.timeLabel+".":"";return washingPop("Rain on the way \uD83C\uDF27\uFE0F","Rain expected within the hour."+(bwImMsg||" Best to dry inside today."),"#c03020");}
    var afterRainWindow=findAfterRainWindow(rainStartIdx,tzOff,sunsetEpoch);
    if(afterRainWindow&&afterRainWindow.usable&&afterRainWindow.hoursToSunset>=dryHours){
      return washingPop("Rain expected in ~"+rainInHours+" hour"+(rainInHours===1?"":"s")+" \u26A0\uFE0F",
        "Rain arrives around "+fmtFcTime(times[rainStartIdx],tz)+
        " but should clear by "+formatHour(afterRainWindow.hour)+
        " with "+Math.round(afterRainWindow.hoursToSunset)+" hours of daylight left. You could hang washing out then.","#b06010");
    }
    if(dryHours<=rainInHours-0.5&&dryHours!==999){
      return washingPop("Rain in ~"+rainInHours+" hours \u26A0\uFE0F","Might just get it dry in time if you hang it out now. "+rsn+" Bring it in before the rain arrives.","#b06010");
    }
    var bwLater=findBetterWindow(tzOff,sunsetEpoch,3);var bwLaterMsg=bwLater?" Conditions may improve around "+bwLater.timeLabel+".":"";return washingPop("Rain expected later \uD83C\uDF27\uFE0F","Rain arriving around "+fmtFcTime(times[rainStartIdx],tz)+". Probably not enough time to dry."+(bwLaterMsg||" Best inside today."),"#c03020");
  }
// Check for a better window — used by all failure paths below
  function betterWindowSuffix(){
    var bw=findBetterWindow(tzOff,sunsetEpoch,dryHours===999?3:dryHours);
    if(bw&&bw.score>=80&&bw.temp>=10){
      var bwFreeze="";
      if(fc.daily.sunrise.length>todayDayIdx+1){
        var bwNextSunrise=toEpoch(fc.daily.sunrise[todayDayIdx+1],tzOff);
        var bwTemps=fc.hourly.temperature_2m||[],bwTimes=fc.hourly.time;
        for(var bwi=0;bwi<bwTimes.length;bwi++){
          var bwMs=toEpoch(bwTimes[bwi],tzOff);
          if(bwMs<=sunsetEpoch)continue;
          if(bwMs>bwNextSunrise)break;
          if(bwTemps[bwi]!==null&&bwTemps[bwi]<=0){bwFreeze=" \u26A0\uFE0F Bring it in before dark \u2014 forecast drops below freezing tonight.";break;}
        }
      }
      return " Conditions should improve around "+bw.timeLabel+" ("+toDisp(bw.temp).toFixed(1)+unitSym()+", score "+bw.score+") \u2014 worth trying then."+bwFreeze;
    }
    return "";
  }

  // No rain
if(dryHours===999){
    var bwMsg=betterWindowSuffix();
    var title=bwMsg?"Not right now \u23F3":"Probably not today \u274C";
    var colour=bwMsg?"#b06010":"#c03020";
    var badReasons=[];
    if(effDP>24)badReasons.push("dew point is "+toDisp(effDP).toFixed(1)+unitSym()+" \u2014 the air is almost fully saturated");
    else if(effDP>20)badReasons.push("dew point is "+toDisp(effDP).toFixed(1)+unitSym()+" \u2014 too humid for drying");
    else if(effDP>16)badReasons.push("dew point is "+toDisp(effDP).toFixed(1)+unitSym()+" \u2014 humidity will prevent drying");
    else if(vpd<0.3)badReasons.push("air is too humid for evaporation");
    if(temp<10)badReasons.push(temp<=0?"freezing temperature":"too cold for effective drying");
    if(effDP<=16&&wind<=5)badReasons.push("not enough wind");
    if(!badReasons.length)badReasons.push("conditions are too cool, still and humid for effective drying");
    var reason=badReasons.length?(badReasons[0].charAt(0).toUpperCase()+badReasons[0].slice(1)+(badReasons.length>1?", and "+badReasons.slice(1).join(", "):"")+"."):
      "Conditions aren\u2019t suitable for drying.";
    return washingPop(title,reason+(bwMsg||" Best inside."),colour);
  }
  if(dryHours>hoursLeft+0.5){
    var bwMsg2=betterWindowSuffix();
    return washingPop("Cutting it close \u26A0\uFE0F","Needs about "+dryLabel+" but only "+Math.round(hoursLeft)+" hour"+(Math.round(hoursLeft)===1?"":"s")+" of daylight left. "+rsn+humCaveat+" Bring it in at sunset regardless."+(bwMsg2||""),"#b06010");
  }
  // Good to go — still check for better window if conditions are poor
  var currentRes=calc(temp,effDP,wind);
  var currentIssues=checkConditions(temp,effDP,wind,wxNow);
  var conditionsArePoor=currentRes.score<75||currentIssues.length>0;
  if(conditionsArePoor){
    var better=findBetterWindow(tzOff,sunsetEpoch,dryHours===999?3:dryHours);
    if(better&&better.score>=80&&better.temp>=10&&better.score>currentRes.score+10){
      rsn+=" Might be worth waiting until "+better.timeLabel+" ("+toDisp(better.temp).toFixed(1)+unitSym()+", score "+better.score+").";
    }
  }
  var col=dryHours<=1.5?"#1a7a3a":dryHours<=3?"#3a9a2a":"#7a7000";
  var emoji=dryHours<=1.5?"\u2600\uFE0F":dryHours<=3?"\uD83D\uDC4D":"\uD83D\uDE10";
  var sunsetCaveat=(dryHours>=3&&hoursLeft>dryHours&&hoursLeft-dryHours<0.5&&hoursLeft<5)?" Bring it in before dark.":"";
  var fcDegradeCaveat="";
  var freezeCaveat="";
  if(fc.daily.sunrise.length>todayDayIdx+1){
    var nextSunrise=toEpoch(fc.daily.sunrise[todayDayIdx+1],tzOff);
    var fctimes=fc.hourly.time,fctemps=fc.hourly.temperature_2m||[];
    for(var fci=0;fci<fctimes.length;fci++){
      var fcSlotMs=toEpoch(fctimes[fci],tzOff);
      if(fcSlotMs<=sunsetEpoch)continue;
      if(fcSlotMs>nextSunrise)break;
      if(fctemps[fci]!==null&&fctemps[fci]<=0){freezeCaveat=" \u26A0\uFE0F Forecast drops below freezing tonight \u2014 bring it in before dark.";break;}
    }
  }
  return washingPop("Should dry in about "+dryLabel+" "+emoji,(hoursLeft>dryHours+1?"Plenty of daylight left. ":"")+rsn+humCaveat+(freezeCaveat||fcDegradeCaveat||sunsetCaveat),col);
}
function washingPop(title,reason,colour){
  document.getElementById("pop-ttl").textContent="Will washing dry? 🧺";
  document.getElementById("pop-body").innerHTML="<div class='washing-reason'>"
    +"<div style='padding:8px 10px;border-radius:8px;background:"+hzRgba(colour,0.12)+";border:1px solid "+hzRgba(colour,0.45)+"'>"
    +"<div style='font-size:15px;font-weight:800;color:"+colour+";line-height:1.35'>"+title+"</div></div>"
    +"<div style='font-size:13.5px;font-weight:600;color:var(--text);line-height:1.6;margin-top:10px'>"+reason+"</div>"
    +(window._washWind?"<div style='font-size:13px;font-weight:800;color:var(--text);line-height:1.55;margin-top:8px'>"+window._washWind+"</div>":"")
    +"<div style='height:1px;background:var(--divider);margin:11px 0 9px'></div>"
    +"<div style='font-size:11px;color:var(--text-muted);line-height:1.6'>Drying time is estimated from how thirsty the air is (vapour pressure deficit), wind and temperature. When a forecast is available, the next few hours are also checked for rain, sunset and overnight frost.</div>"
    +"</div>";
  document.getElementById("pop-ov").classList.add("open");
}

// ── Clothing recommendation ────────────────────────────────────────────────
function whatToWear(temp,wind,wxCode,s,dp){
  // BOM apparent temperature: Ta + 0.33×e − 0.70×ws − 4.00
  // e = vapour pressure from dew point, ws = wind in m/s
  var e=dp!==null&&dp!==undefined?6.105*Math.exp(25.22*(dp-273.16)/dp-5.31*Math.log(dp/273.16)):null;
  // Simpler: e from dew point in Celsius directly
  var dpC=dp!==null&&dp!==undefined?dp:temp-10; // fallback if no dp
  var eVp=6.105*Math.exp(17.27*dpC/(237.7+dpC));
  var wsMs=wind/3.6; // km/h to m/s
  var apparentTemp=temp+0.33*eVp-0.70*wsMs-4.00;
  var layers,layerLabel;
  if(apparentTemp>=s.thi+3){layers=0;layerLabel="T-shirt 👕";}
  else if(apparentTemp>=s.tlo){layers=1;layerLabel="Light top or shirt 👔";}
  else if(apparentTemp>=s.tlo-6){layers=2;layerLabel="Light jacket 🧥";}
  else if(apparentTemp>=s.tlo-12){layers=3;layerLabel="Warm jacket + layers 🧣";}
  else{layers=4;layerLabel="Bundle up — multiple layers essential 🧣";}
  var windProof=wind>s.pwhi*1.5;
  var isSnow=wxCode!==null&&((wxCode>=71&&wxCode<=77)||(wxCode>=85&&wxCode<=86));
  var isRain=!isSnow&&wxCode!==null&&wxCode>=51;
  var extra="";
      if(isSnow){
    // Snow: waterproof insulation over everything, boots matter
    if(layers<=1)layerLabel="Warm jacket + layers 🧣";
    extra="Waterproof outer layer + warm underlayers — and waterproof boots ❄️";
  } else if(isRain&&windProof){
    extra=(layers>=3?"Over your mid layer: ":"")+"Windproof rain jacket ☔";
    if(layers>=2)layerLabel=layers>=3?"Warm mid layer":"Light top or shirt 👔";
  } else if(isRain){
    extra=(layers>=3?"Over your mid layer: ":"")+"Rain jacket ☔";
    if(layers>=2)layerLabel=layers>=3?"Warm mid layer":"Light top or shirt 👔";
  } else if(windProof){
    extra="+ windproof layer 🌬️";
  }
  return{layerLabel:layerLabel,extra:extra,apparentTemp:apparentTemp,layers:layers,coldTier:coldTier(temp,wind)};
}
function showWearPop(temp,wind,wxCode,dp){
  var fromTitle=document.getElementById("pop-ttl").textContent;
  var fromBody=document.getElementById("pop-body").innerHTML;
  var dpVal=dp!==null&&dp!==undefined?dp:(window._LW?window._LW.effDP:null);
      var s=gs(),w=whatToWear(temp,wind,wxCode,s,dpVal);
  var nc=w.layers===0?"#c07020":w.layers===1?"#2a9a60":w.layers<=3?"#2a7fa8":"#5a4aaa";
  var uvNow=0;
  if(window._FC&&window._FC.hourly){
    var uvHrs=window._FC.hourly.uv_index||[],uvTimes=window._FC.hourly.time||[];
    var nowHr=localHourInTZ(window._FC.timezone);
    for(var ui=0;ui<uvTimes.length;ui++){if(parseInt(uvTimes[ui].slice(11,13))===nowHr&&uvHrs[ui]!=null){uvNow=uvHrs[ui];break;}}
  }
  var uvSunW=uvNow>=3?(uvNow<6?"UV "+Math.round(uvNow)+" \u2014 Sun protection recommended \uD83D\uDD76\uFE0F":uvNow<8?"UV "+Math.round(uvNow)+" \u2014 Sunscreen + hat recommended \uD83E\uDDF4":uvNow<11?"UV "+Math.round(uvNow)+" \u2014 Sunscreen, hat & shade essential \uD83E\uDDF4":"UV "+Math.round(uvNow)+" \u2014 Avoid direct sun \u2620\uFE0F"):null;
  var hasWindRain=!!(w.extra&&w.extra.indexOf("indproof rain")>-1);
  var hasRain=!hasWindRain&&!!(w.extra&&w.extra.indexOf("ain jacket")>-1);
  var tooHot=(dpVal!==null&&temp>35&&dpVal>25)||(temp>45);
  var justGetWet=dpVal!==null&&dpVal>25&&(hasRain||hasWindRain||!!(w.extra&&w.extra.indexOf("get wet")>-1));
  if(justGetWet){hasRain=false;hasWindRain=false;}
  var baseDispLayers=w.layers<=1?0:w.layers-1;
var dispLayers=(hasRain||hasWindRain)?Math.max(0,baseDispLayers-1):baseDispLayers;
  var layerWord=dispLayers===1?"layer":"layers";
  var outerLine=justGetWet?"<div style='font-size:15px;font-weight:700;color:var(--text-muted);margin-top:2px'>Honestly, just get wet \uD83C\uDF27\uFE0F</div>"
    :hasWindRain?"<div style='font-size:15px;font-weight:700;color:var(--text-muted);margin-top:2px'>+ 1 wind/rainproof jacket</div>"
    :hasRain?"<div style='font-size:15px;font-weight:700;color:var(--text-muted);margin-top:2px'>+ 1 rain jacket</div>":"";
  var body="<div class='washing-reason'>"
        +(tooHot
      ?"<div style='font-size:22px;font-weight:800;color:"+nc+";margin-bottom:10px'>Little to none</div>"
      :w.coldTier>=2
      ?"<div style='font-size:22px;font-weight:800;color:"+nc+";margin-bottom:10px'>Polar conditions \u2014 specialist gear required \uD83E\uDD76</div>"
      :w.coldTier>=1
      ?"<div style='font-size:22px;font-weight:800;color:"+nc+";margin-bottom:10px'>Extreme cold \u2014 full coverage essential \uD83E\uDD76</div>"
      :dispLayers===0
            ?(hasWindRain?"<div style='font-size:22px;font-weight:800;color:"+nc+";margin-bottom:10px'>Wind/rainproof jacket recommended</div>"
      :hasRain?"<div style='font-size:22px;font-weight:800;color:"+nc+";margin-bottom:10px'>Rain jacket recommended</div>"
      :"<div style='font-size:22px;font-weight:800;color:"+nc+";margin-bottom:10px'>No layers required</div>")
      :"<div style='font-size:42px;font-weight:800;color:"+nc+";line-height:1;margin-bottom:2px'>"+dispLayers+"</div>"
      +"<div style='font-size:16px;font-weight:700;color:"+nc+";margin-bottom:10px'>"+layerWord+"</div>")
        +(dispLayers===0&&(hasRain||hasWindRain)?"":outerLine)
    +"<div style='font-size:12px;color:var(--text-muted);margin-top:12px;padding-top:10px;border-top:1px solid var(--divider)'>"+toDisp(temp).toFixed(1)+unitSym()+" &nbsp;&middot;&nbsp; "+Math.round(wind)+" km/h</div>"
        +(tooHot||justGetWet||w.coldTier>=1?"":"<div style='font-size:11px;color:var(--text-muted);margin-top:8px;font-style:italic'>\u201CA layer\u201D goes on top of your shirt, dress, or singlet</div>")
    +(uvSunW?"<div onclick='showUVPop()' style='cursor:pointer;font-size:12px;font-weight:700;color:var(--text-muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--divider)'>\u2600\uFE0F "+uvSunW+" \u203A</div>":"")
    +"</div>";
  document.getElementById("pop-ttl").innerHTML="What to wear?";
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}
function checkWhatToWear(){
  if(!window._LW)return;
  var w=window._LW;
  document.getElementById("pop-ttl").textContent="";
  document.getElementById("pop-body").innerHTML="";
  showWearPop(w.temp,w.wind,w.wxCode||null,w.effDP);
}

// ── Forecast scroll ────────────────────────────────────────────────────────
function fc7Scroll(dir){
  var strip=document.getElementById("forecast-strip-7");
  if(!strip)return;
  strip.scrollBy({left:dir*220,behavior:"smooth"});
}

// Tile body: high/low temperature, comfort range with the best hour, rain and peak wind.
// Daily figures are located by date, never by a fixed offset.
function fcTileBody(fc,dateStr,hi,hiCol,hiTime,lo,loCol){
  var d=fc.daily||{},i=d.time?d.time.indexOf(dateStr):-1;
  var g=function(a){return(i>=0&&a&&a[i]!=null)?a[i]:null;};
  var tx=g(d.temperature_2m_max),tn=g(d.temperature_2m_min),rn=g(d.precipitation_sum),sn=g(d.snowfall_sum),wx=g(d.wind_speed_10m_max);
  var t=function(c){return String(Math.round(toDisp(c))).replace("-","\u2212")+"\u00B0";};
  var rain=sn!=null&&sn>=0.5?"\u2744\uFE0F "+sn.toFixed(1)+"cm":rn!=null&&rn>=0.2?"\uD83C\uDF27\uFE0F "+(rn<10?rn.toFixed(1):Math.round(rn))+"mm":"No rain";
  return(tx!=null&&tn!=null?"<div class='fc-temps'><span class='fc-tmax'>"+t(tx)+"</span><span class='fc-tmin'>"+t(tn)+"</span></div>":"")
    +"<div class='fc-scores'><span style='color:"+hiCol+"'>\u2191"+hi+"</span><span style='color:"+loCol+"'>\u2193"+lo+"</span></div>"
    +"<div class='fc-hitime'>best "+hiTime+"</div>"
    +"<div class='fc-meta'>"+rain+"</div>"
    +(wx!=null?"<div class='fc-meta'>\uD83D\uDCA8 "+Math.round(wx)+" km/h</div>":"");
}
function render7Day(fc){
  var times=fc.hourly.time,temps=fc.hourly.temperature_2m,dps=fc.hourly.dew_point_2m,winds=fc.hourly.wind_speed_10m,uvs=fc.hourly.uv_index||[],precips=fc.hourly.precipitation||[];
  var tz=fc.timezone,tzOff=getTZOffsetMin(tz);
  var days={};
  for(var i=0;i<times.length;i++){
    try{
      var p=parseLocalTimeStr(times[i]);
      var utcMs=Date.UTC(p.yr,p.mo,p.dy,p.hr,p.mn,0)-tzOff*60000;
      var dateStr=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date(utcMs));
      if(!days[dateStr])days[dateStr]=[];
      days[dateStr].push({idx:i,utcMs:utcMs,temp:temps[i],dp:dps[i],wind:winds[i],rain:precips[i]||0});
    }catch(e){}
  }
  var todayStr=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  var todayDayIdx=fc.daily&&fc.daily.time?fc.daily.time.indexOf(todayStr):0;
  if(todayDayIdx<0)todayDayIdx=0;
  // Today tile — score from remaining future hours, all hours stored for popup
  var todayHtml="";
  if(days[todayStr]){
    var nowMs=Date.now();
    var todayAll=days[todayStr].filter(function(s){return s.temp!==null&&s.dp!==null&&s.wind!==null;});
    var todayFuture=todayAll.filter(function(s){return s.utcMs>nowMs;});
    var useSlots=todayFuture.length?todayFuture:todayAll;
    if(useSlots.length){
      var tmx=-1,tmn=999,tmxS=null,tmnS=null;
      for(var ti=0;ti<useSlots.length;ti++){var ts=useSlots[ti],tr=calc(ts.temp,ts.dp,ts.wind,ts.rain);if(tr.score>tmx){tmx=tr.score;tmxS=ts;}if(tr.score<tmn){tmn=tr.score;tmnS=ts;}}
      var tmxNc=SBANDS[bandForScore(tmx)].col.replace("0.92","1");
      var tmnNc=SBANDS[bandForScore(tmn)].col.replace("0.92","1");
      var tmxTime=new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",hour12:true}).format(new Date(tmxS.utcMs)).toLowerCase().replace(" ","");
      var tmnTime=new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",hour12:true}).format(new Date(tmnS.utcMs)).toLowerCase().replace(" ","");
      var tWxCode=(fc.daily&&fc.daily.weather_code)?fc.daily.weather_code[todayDayIdx]:null;
      if(tWxCode===undefined)tWxCode=null;
      var tWst=wxStyle(tWxCode);
      todayHtml="<div class='fc-slot-7' style='"+(tWst.bg?"background:"+tWst.bg+";":"")+"' onclick='show7DaySlot(0)'>"
        +"<div class='fc-day'>Today"+(tWst.emoji?" "+tWst.emoji:"")+"</div>"
        +fcTileBody(fc,todayStr,tmx,tmxNc,tmxTime,tmn,tmnNc)
        +waveTileTags(fc,todayStr)+wbTileTag(useSlots,true)+wcTileTag(useSlots,true)+hypoTileTag(useSlots,fc.hourly.weather_code,true)+stormTileTag(fc,useSlots,true)+windTileTag(fc,useSlots,true)+"</div>"
        +"<div style='width:2px;background:var(--card-border);border-radius:2px;margin:4px 6px;align-self:stretch'></div>";
    }
  }
  var dateKeys=Object.keys(days).sort().filter(function(d){return d>todayStr;}).slice(0,7);
  var html=todayHtml;
  for(var di=0;di<dateKeys.length;di++){
    var key=dateKeys[di];
    var slots=days[key].filter(function(s){return s.temp!==null&&s.dp!==null&&s.wind!==null;});
    if(!slots.length)continue;
    var maxScore=-1,minScore=999,maxSlot=null,minSlot=null;
    for(var si=0;si<slots.length;si++){var s=slots[si],r=calc(s.temp,s.dp,s.wind,s.rain);if(r.score>maxScore){maxScore=r.score;maxSlot=s;}if(r.score<minScore){minScore=r.score;minSlot=s;}}
    var maxNc=SBANDS[bandForScore(maxScore)].col.replace("0.92","1");
    var minNc=SBANDS[bandForScore(minScore)].col.replace("0.92","1");
    var dayLabel=new Intl.DateTimeFormat("en-AU",{timeZone:tz,weekday:"short"}).format(new Date(slots[0].utcMs));
    var maxTime=new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",hour12:true}).format(new Date(maxSlot.utcMs)).toLowerCase().replace(" ","");
    var minTime=new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",hour12:true}).format(new Date(minSlot.utcMs)).toLowerCase().replace(" ","");
    var dWxCode=(fc.daily&&fc.daily.weather_code)?fc.daily.weather_code[todayDayIdx+di+1]:null;
    if(dWxCode===undefined)dWxCode=null;
    var dWst=wxStyle(dWxCode);
    html+="<div class='fc-slot-7' style='"+(dWst.bg?"background:"+dWst.bg+";":"")+"' onclick='show7DaySlot("+(di+1)+")'>"
      +"<div class='fc-day'>"+dayLabel+(dWst.emoji?" "+dWst.emoji:"")+"</div>"
      +fcTileBody(fc,key,maxScore,maxNc,maxTime,minScore,minNc)
      +waveTileTags(fc,key)+wbTileTag(slots,false)+wcTileTag(slots,false)+hypoTileTag(slots,fc.hourly.weather_code,false)+stormTileTag(fc,slots,false)+windTileTag(fc,slots,false)+"</div>";
  }
  document.getElementById("forecast-row-7").innerHTML=html;
  window._7dayData=days;
  window._7dayKeys=[todayStr].concat(dateKeys);
  window._7dayTZ=tz;
  if(window._LW){var lw=window._LW;renderChips(lw.temp,lw.effDP,lw.rh,lw.wind,fc);}
}

// Reopens the hour popup a hazard or UV popup was opened from
function hourBack(){var h=window._hourBack;if(h)show7DayHourSlot(h.idx,h.di,h.t);}
function show7DayHourSlot(idx,di,timeStr){
  if(!window._FC)return;
  window._hourBack={idx:idx,di:di,t:timeStr};
  var fc=window._FC,tz=fc.timezone;
  var t=fc.hourly.temperature_2m[idx],dp=fc.hourly.dew_point_2m[idx],w=fc.hourly.wind_speed_10m[idx];
    var precips=fc.hourly.precipitation||[];
  var rain2h=(precips[idx]||0)+(precips[idx+1]||0);
  var uvVal=(fc.hourly.uv_index||[])[idx]||0;
    var uvSun=uvVal>=3?(uvVal<6?"UV "+Math.round(uvVal)+" \u2014 Sun protection recommended \uD83D\uDD76\uFE0F":uvVal<8?"UV "+Math.round(uvVal)+" \u2014 Sunscreen + hat recommended \uD83E\uDDF4":uvVal<11?"UV "+Math.round(uvVal)+" \u2014 Sunscreen, hat & shade essential \uD83E\uDDF4":"UV "+Math.round(uvVal)+" \u2014 Avoid direct sun \u2620\uFE0F"):null;
  var r=calc(t,dp,w,precips[idx]),si=scoreInfo(r.score),s=gs();
  var wxCode=(fc.hourly.weather_code||[])[idx];
  if(wxCode===undefined)wxCode=null;
  var nc=SBANDS[bandForScore(r.score)].col.replace("0.92","1");
  var anns=getAnnotations(t,dp,w,r.score,s,r.iP,r.wP,wxCode);
  var gustExtra=withGust(anns,(fc.hourly.wind_gusts_10m||[])[idx],!!windHourPill(fc,idx));
  var annHtml="";
  for(var i=0;i<anns.length;i++){annHtml+="<span class='ann "+anns[i].c+"'>"+anns[i].t.replace(" \u2139\uFE0F","")+"</span> ";}
  annHtml+=wetBulbPill(t,dp,"h");
  annHtml+=gustExtra;
  annHtml+=coldPill(t,w,"h");
  annHtml+=hypoPill(t,w,wxCode,precips[idx],"h");
  annHtml+=stormHourPill(fc,idx);
  annHtml+=windHourPill(fc,idx);
    var ww=whatToWear(t,w,wxCode,s,dp);
  var hasWindRain=!!(ww.extra&&ww.extra.indexOf("indproof rain")>-1);
  var hasRain=!hasWindRain&&!!(ww.extra&&ww.extra.indexOf("ain jacket")>-1);
  var tooHot=(dp!==null&&t>35&&dp>25)||(t>45);
  var justGetWet=dp!==null&&dp>25&&(hasRain||hasWindRain||!!(ww.extra&&ww.extra.indexOf("get wet")>-1));
  if(justGetWet){hasRain=false;hasWindRain=false;}
  var baseDispLayers=ww.layers<=1?0:ww.layers-1;
var dispLayers=(hasRain||hasWindRain)?Math.max(0,baseDispLayers-1):baseDispLayers;
  var layerWord=dispLayers===1?"layer":"layers";
  var wearNc=ww.layers===0?"#c07020":ww.layers<=1?"#2a9a60":ww.layers<=3?"#2a7fa8":"#5a4aaa";
  var outerLine=justGetWet?"Honestly, just get wet \uD83C\uDF27\uFE0F":hasWindRain?"+ 1 wind/rainproof jacket":hasRain?"+ 1 rain jacket":"";
  var rainStr=rain2h>=0.05?rain2h.toFixed(1)+"mm":"—";
  var body="<div class='washing-reason'>"
    +"<div style='font-size:15px;font-weight:800;color:"+nc+";margin-bottom:6px'>"+r.score+" \u2014 "+si.label+"</div>"
    +"<div style='margin-bottom:8px'>\uD83C\uDF21\uFE0F "+toDisp(t).toFixed(1)+unitSym()+" &nbsp;\u00B7&nbsp; \uD83D\uDCA7 DP "+toDisp(dp).toFixed(1)+unitSym()+" &nbsp;\u00B7&nbsp; \uD83D\uDCA8 "+Math.round(w)+" km/h &nbsp;\u00B7&nbsp; \uD83C\uDF27\uFE0F "+rainStr+"</div>"
    +(annHtml?"<div style='margin-bottom:10px'>"+annHtml+"</div>":"")
                +"<div style='border-top:1px solid var(--divider);padding-top:10px'>"
    +"<div style='font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px'>What to wear</div>"
        +(tooHot
            ?"<div style='font-size:18px;font-weight:800;color:"+wearNc+"'>No layers required &nbsp;\u00B7&nbsp; <span style='color:var(--text-muted)'>Honestly, it's too hot for any clothes at all.</span></div>"
      :ww.coldTier>=2
      ?"<div style='font-size:18px;font-weight:800;color:"+wearNc+"'>Polar conditions \u2014 specialist gear required \uD83E\uDD76</div>"
      :ww.coldTier>=1
      ?"<div style='font-size:18px;font-weight:800;color:"+wearNc+"'>Extreme cold \u2014 full coverage essential \uD83E\uDD76</div>"
            :dispLayers===0
      ?(hasWindRain?"<div style='font-size:18px;font-weight:800;color:"+wearNc+"'>Wind/rainproof jacket recommended</div>"
      :hasRain?"<div style='font-size:18px;font-weight:800;color:"+wearNc+"'>Rain jacket recommended</div>"
      :"<div style='font-size:18px;font-weight:800;color:"+wearNc+"'>No layers required"+(outerLine?" &nbsp;\u00B7&nbsp; <span style='color:var(--text-muted)'>"+outerLine+"</span>":"")+"</div>")
      :"<div style='display:flex;align-items:baseline;gap:8px'>"
      +"<div style='font-size:28px;font-weight:800;color:"+wearNc+";line-height:1'>"+dispLayers+"</div>"
      +"<div style='font-size:14px;font-weight:700;color:"+wearNc+"'>"+layerWord+(outerLine?" &nbsp;\u00B7&nbsp; <span style='color:var(--text-muted)'>"+outerLine+"</span>":"")+"</div></div>")
    +(tooHot||justGetWet||ww.coldTier>=1?"":"<div style='font-size:11px;color:var(--text-muted);margin-top:8px;font-style:italic'>\u201CA layer\u201D goes on top of your shirt, dress, or singlet</div>")
    +(uvSun?"<div onclick='showUVPop(\""+fc.hourly.time[idx].slice(0,10)+"\","+uvVal+",\"h\")' style='cursor:pointer;font-size:12px;font-weight:700;color:var(--text-muted);margin-top:8px;padding-top:8px;border-top:1px solid var(--divider)'>\u2600\uFE0F "+uvSun+" \u203A</div>":"")
    +"</div>"
    +"<div style='margin-top:12px;padding-top:10px;border-top:1px solid var(--divider);text-align:center;font-size:12px;font-weight:700;color:var(--text-muted);cursor:pointer' onclick='show7DaySlot("+di+")'>← Back</div>"
    +"</div>";
  document.getElementById("pop-ttl").textContent=timeStr||"";
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}
// ── Personalised day narrative ─────────────────────────────────────────────
var NARR_WORDS=[{min:95,w:"glorious"},{min:91,w:"beautiful"},{min:81,w:"comfortable"},{min:76,w:"pleasant"},{min:66,w:"reasonable"},{min:56,w:"middling"},{min:46,w:"uncomfortable"},{min:36,w:"unpleasant"},{min:-1,w:"brutal"}];
function narrCap(t){return t.charAt(0).toUpperCase()+t.slice(1);}
function narrArticle(w){return /^[aeiou]/i.test(w)?"an":"a";}
function narrLabelList(a){return a.length>1?a.slice(0,-1).join(", ")+" and "+a[a.length-1]:a[0];}
// Peak-wind wording for a single period, in Beaufort terms. Only a fresh breeze
// (29 km/h) or more is worth a mention; lighter winds are left to the pills.
function narrWindWord(mx,s){
  if(mx===null||mx===undefined||mx<29)return"";
  return windPhrase(mx);
}
function narrWxClass(code){
  if(code===null||code===undefined)return{r:2,adj:"partly cloudy",nadj:"partly cloudy",p:false};
  if(code>=95)return{r:8,adj:"stormy",nadj:"stormy",p:true};
  if(code>=85&&code<=86)return{r:7,adj:"snowy",nadj:"snowy",p:true};
  if(code>=80&&code<=82)return{r:6,adj:"showery",nadj:"showery",p:true};
  if(code>=71&&code<=77)return{r:7,adj:"snowy",nadj:"snowy",p:true};
  if(code>=66&&code<=67)return{r:7,adj:"icy",nadj:"icy",p:true};
  if(code>=61&&code<=65)return{r:6,adj:"rainy",nadj:"rainy",p:true};
  if(code>=56&&code<=57)return{r:5,adj:"sleety",nadj:"sleety",p:true};
  if(code>=51&&code<=55)return{r:5,adj:"drizzly",nadj:"drizzly",p:true};
  if(code>=45&&code<=48)return{r:4,adj:"foggy",nadj:"foggy",p:false};
  if(code===3)return{r:3,adj:"overcast",nadj:"overcast",p:false};
  if(code===2)return{r:2,adj:"partly cloudy",nadj:"partly cloudy",p:false};
  if(code===1)return{r:1,adj:"mostly sunny",nadj:"mostly clear",p:false};
  return{r:0,adj:"sunny",nadj:"clear",p:false};
}
function narrPeriods(slots,tz,hcodes,precips,onlyFuture){
  var defs=[{lo:6,hi:11,label:"morning",night:false},{lo:12,hi:17,label:"afternoon",night:false},{lo:18,hi:22,label:"evening",night:true}];
  var nowMs=Date.now(),out=[];
  for(var p=0;p<defs.length;p++){
        var d=defs[p],ts=0,ds=0,ws=0,wmx=-1,sc=0,n=0,rain=0,counts={},codes={};
    for(var i=0;i<slots.length;i++){
      var sl=slots[i];
      if(sl.temp===null||sl.dp===null||sl.wind===null)continue;
      if(onlyFuture&&sl.utcMs<nowMs-1800000)continue;
      var lh=parseInt(new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"2-digit",hour12:false}).format(new Date(sl.utcMs)),10);
      if(lh===24)lh=0;
      if(lh<d.lo||lh>d.hi)continue;
            ts+=sl.temp;ds+=sl.dp;ws+=sl.wind;if(sl.wind>wmx)wmx=sl.wind;sc+=calc(sl.temp,sl.dp,sl.wind,sl.rain).score;n++;
      rain+=(precips[sl.idx]||0);
      var c=hcodes[sl.idx];
      if(c!==undefined&&c!==null){var cl=narrWxClass(c);if(!counts[cl.adj])counts[cl.adj]=0;counts[cl.adj]++;codes[cl.adj]=cl;}
    }
    if(n<2)continue;
    var best=null,bestN=0,worst=null;
    for(var k in counts){
      if(counts[k]>bestN){bestN=counts[k];best=codes[k];}
      if(codes[k].p&&counts[k]>=2&&(!worst||codes[k].r>worst.r))worst=codes[k];
    }
    var cls=worst||best||narrWxClass(null);
    if(cls.p&&rain<0.1)cls={r:3,adj:"mostly cloudy",nadj:"mostly cloudy",p:false};
        out.push({label:d.label,night:d.night,t:ts/n,dp:ds/n,w:ws/n,wx:wmx,score:Math.round(sc/n),rain:rain,cls:cls,n:n});
  }
  return out;
}
function dayNarrative(slots,tz,hcodes,precips,isToday){
  var ps=narrPeriods(slots,tz,hcodes,precips,!!isToday);
  if(!ps.length)return null;
  var s=gs(),i;
  // 1 — comfort verdict
  var tot=0,tn=0,mn=999,mx=-1,bestP=ps[0],mt=0,md=0,mw=0;
  for(i=0;i<ps.length;i++){
    tot+=ps[i].score*ps[i].n;tn+=ps[i].n;
    mt+=ps[i].t*ps[i].n;md+=ps[i].dp*ps[i].n;mw+=ps[i].w*ps[i].n;
    if(ps[i].score<mn)mn=ps[i].score;
    if(ps[i].score>mx){mx=ps[i].score;bestP=ps[i];}
  }
  var mean=Math.round(tot/Math.max(1,tn));
  mt=mt/Math.max(1,tn);md=md/Math.max(1,tn);mw=mw/Math.max(1,tn);
  var pk=-99,totRain=0;
  for(i=0;i<ps.length;i++){if(ps[i].t>pk)pk=ps[i].t;totRain+=ps[i].rain;}
  var wi=0;while(wi<NARR_WORDS.length-1&&mean<NARR_WORDS[wi].min)wi++;
  if(totRain>=8)wi=Math.max(wi,5);else if(totRain>=2)wi=Math.max(wi,2);
  var word=NARR_WORDS[wi].w;
  var spanN=ps.length>=3?"day":ps.map(function(p){return p.label;}).join(" and ");
  var s1=narrCap(narrArticle(word)+" "+word+" "+spanN)+".";
  if(ps.length>1&&(mx-mn)>=20)s1+=" Best in the "+bestP.label+".";
  // 2 — character
  var ct=pk>=s.thi?pk:mt;
  var tw=ct>=s.thi+16?"sweltering":ct>=s.thi+10?"hot":ct>=s.thi+2?"warm":ct>=s.tlo?"mild":ct>=s.tlo-5?"cool":ct>=s.tlo-12?"chilly":ct>=-2?"cold":"bitterly cold";
  var gap=mt-md,hw="";
  if(md>=24)hw="oppressive";
  else if(md>=20)hw="muggy";
  else if(md>=s.dp+3)hw=(mt<s.tlo&&gap<4)?"damp":"humid";
  else if(mt<s.tlo&&gap<3)hw="damp";
  else if(md<=0)hw="very dry";
  else if(md<=5)hw="dry";
  var parts=[tw];if(hw)parts.push(hw);
  var s2=narrCap(parts.length===1?parts[0]:parts.slice(0,-1).join(", ")+" and "+parts[parts.length-1])+".";
    // 3 — how the weather moves through the day, with noteworthy wind folded in
  var runs=[];
  for(i=0;i<ps.length;i++){
    var last=runs.length?runs[runs.length-1]:null;
    if(last&&last.r===ps[i].cls.r){last.labels.push(ps[i].label);last.idx.push(i);if(!ps[i].night)last.allNight=false;}
    else runs.push({r:ps[i].cls.r,cls:ps[i].cls,labels:[ps[i].label],idx:[i],allNight:ps[i].night,wind:""});
  }
  var wgroups=[],wmap={};
  for(i=0;i<ps.length;i++){
    var pw=narrWindWord(ps[i].wx,s);
    if(!pw)continue;
    if(!wmap[pw]){wmap[pw]={word:pw,labels:[],idx:[]};wgroups.push(wmap[pw]);}
    wmap[pw].labels.push(ps[i].label);wmap[pw].idx.push(i);
  }
  // A wind group whose periods exactly match a weather run folds into that run's
  // adjective; anything else trails the sentence as its own clause.
  var wclauses=[];
  for(i=0;i<wgroups.length;i++){
    var g=wgroups[i],hit=null;
    for(var ri=0;ri<runs.length;ri++)if(runs[ri].idx.join()===g.idx.join()){hit=runs[ri];break;}
    if(hit)hit.wind=g.word;
    else{
      var contig=g.idx.length>1&&g.idx[g.idx.length-1]-g.idx[0]===g.idx.length-1;
      wclauses.push(g.word+(contig?" through the ":" in the ")+narrLabelList(g.labels));
    }
  }
  function rAdj(rn){return rn.allNight?rn.cls.nadj:rn.cls.adj;}
  function rW(rn){return rn.wind?" with "+rn.wind:"";}
  function rLbl(rn){return narrLabelList(rn.labels);}
  var s3;
  if(runs.length===1){
    s3=ps.length>=3?narrCap(rAdj(runs[0]))+rW(runs[0])+" all day.":narrCap(rAdj(runs[0]))+" through the "+rLbl(runs[0])+rW(runs[0])+".";
  }else if(runs.length===2){
    var a1=rAdj(runs[0]),a2=rAdj(runs[1]),c1=rW(runs[0])?",":"";
    if(runs[1].r<runs[0].r)s3=narrCap(narrArticle(a1)+" "+a1+" "+rLbl(runs[0]))+rW(runs[0])+c1+(runs[1].cls.p?" easing to ":" clearing to ")+narrArticle(a2)+" "+a2+" "+rLbl(runs[1])+rW(runs[1])+".";
    else s3=narrCap(narrArticle(a1)+" "+a1+" "+rLbl(runs[0]))+rW(runs[0])+c1+" turning "+a2+" in the "+rLbl(runs[1])+rW(runs[1])+".";
  }else{
    s3=narrCap(narrArticle(rAdj(runs[0]))+" "+rAdj(runs[0])+" "+rLbl(runs[0]))+rW(runs[0])+", "+rAdj(runs[1])+" by the "+rLbl(runs[1])+rW(runs[1])+", then "+rAdj(runs[2])+" for the "+rLbl(runs[2])+rW(runs[2])+".";
  }
  if(wclauses.length){
    var wj=wclauses.join(" and ");
    if(wclauses.length>1)for(i=0;i<wclauses.length;i++)if(wclauses[i].indexOf(" and ")>-1){wj=wclauses.slice(0,-1).join(", ")+", and "+wclauses[wclauses.length-1];break;}
    s3=s3.replace(/\.$/,"")+", with "+wj+".";
  }
  return{s1:s1,s2:s2,s3:s3,mean:mean,wordScore:Math.min(mean,NARR_WORDS[wi].min)};
}
function show7DaySlot(di){
  if(!window._7dayData||!window._7dayKeys)return;
  var dateKey=window._7dayKeys[di];
  if(!dateKey||!window._7dayData[dateKey])return;
  var slots=window._7dayData[dateKey];
  var tz=window._7dayTZ;
  var fc=window._FC;
  var dayLabel=new Intl.DateTimeFormat("en-AU",{timeZone:tz,weekday:"long",month:"short",day:"numeric"}).format(new Date(slots[0].utcMs));
    var hourlyPrecip=fc&&fc.hourly&&fc.hourly.precipitation?fc.hourly.precipitation:[];
  var hcodes=fc&&fc.hourly&&fc.hourly.weather_code?fc.hourly.weather_code:[];
  // Daily summary from API
  var dailySummary="";
  if(fc&&fc.daily){
    var dIdx=window._7dayKeys.indexOf(dateKey);
    var dCodes=fc.daily.weather_code||[];
    var dRain=fc.daily.precipitation_sum||[];
    var dRainHrs=fc.daily.precipitation_hours||[];
    var dSnow=fc.daily.snowfall_sum||[];
    var dWindMax=fc.daily.wind_speed_10m_max||[];
    var dTmax=fc.daily.temperature_2m_max||[];
    var dTmin=fc.daily.temperature_2m_min||[];
    var tz7=fc.timezone;
    var todayStr7=new Intl.DateTimeFormat("en-CA",{timeZone:tz7,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    var todayDayIdx7=fc.daily.time?fc.daily.time.indexOf(todayStr7):0;
    if(todayDayIdx7<0)todayDayIdx7=0;
        var dOff=todayDayIdx7+dIdx;
    var wxDay=dCodes[dOff]!==undefined?dCodes[dOff]:null;
    var wxInfo=wxDay!==null?wxStyle(wxDay):null;
    var rainSum=dRain[dOff]!=null?dRain[dOff]:null;
    var rainHrs=dRainHrs[dOff]!=null?Math.round(dRainHrs[dOff]):null;
    var snowSum=dSnow[dOff]!=null?dSnow[dOff]:null;
    var windMax=dWindMax[dOff]!=null?Math.round(dWindMax[dOff]):null;
    var tMax=dTmax[dOff]!=null?toDisp(dTmax[dOff]).toFixed(1):null;
    var tMin=dTmin[dOff]!=null?toDisp(dTmin[dOff]).toFixed(1):null;
        var narr=dayNarrative(slots,tz,hcodes,hourlyPrecip,di===0);
    var condLine;
    if(narr){
      var nCol=SBANDS[bandForScore(narr.wordScore)].col.replace("0.92","1");
      condLine="<div style='font-size:13px;color:var(--text);font-weight:700;line-height:1.45;margin-bottom:4px'>"
        +(wxInfo&&wxInfo.emoji?wxInfo.emoji+" ":"")
        +"<span style='font-weight:800;color:"+nCol+"'>"+narr.s1+"</span> "
                                +narr.s2+" "+narr.s3+"</div>";
    }else{
      var cl0=(wxInfo?wxInfo.emoji+" ":"")+(wxDay!==null?(wxFromCode(wxDay)||{t:""}).t:"");
      condLine=cl0?"<div style='font-size:13px;color:var(--text)'>"+cl0+"</div>":"";
    }
    var rainLine;
    if(snowSum!=null&&snowSum>=0.5&&(rainSum==null||snowSum*10>rainSum)){
      rainLine="❄️ "+snowSum.toFixed(1)+"cm snow"+(rainSum!=null&&rainSum>0?" + "+rainSum.toFixed(1)+"mm rain":"")+" over "+rainHrs+"h";
    }else if(rainSum!=null&&rainSum>0){
      rainLine="🌧️ "+rainSum.toFixed(1)+"mm over "+rainHrs+"h";
    }else{
      rainLine="No rain expected";
    }
    var rangeLine=(tMax!==null&&tMin!==null)?(tMin+unitSym()+" – "+tMax+unitSym()):"";
    var dayGust=null,gArr=fc.hourly&&fc.hourly.wind_gusts_10m?fc.hourly.wind_gusts_10m:[];
    for(var gi=0;gi<slots.length;gi++){var gv=gArr[slots[gi].idx];if(gv!=null&&(dayGust===null||gv>dayGust))dayGust=gv;}
    var windLine=windMax!==null?("Peak wind "+windMax+" km/h ("+beaufort(windMax).n+")"+(dayGust!==null&&dayGust>GUST_SHOW?", gusts to "+Math.round(dayGust)+" km/h":"")):"";
    var fireLine="";
    var dayMaxFFDI=getMaxFFDIForDay(fc,dateKey);
    var dayFI=dayMaxFFDI!==null?ffdiInfo(dayMaxFFDI):null;
            if(dayFI)fireLine="<div style='color:"+dayFI.col+";cursor:pointer' onclick='showFireDangerPop(null,"+dayMaxFFDI+","+(fc.daily&&fc.daily.precipitation_sum?Math.round(calcDroughtFactor(fc.daily.precipitation_sum.slice(Math.max(0,dOff-20),dOff))*10)/10:5)+","+di+")'>🔥 Fire danger peak: "+dayFI.label+" ("+dayMaxFFDI+")</div>";
    var uvHrs2=fc.hourly&&fc.hourly.uv_index?fc.hourly.uv_index:[];
    var dayMaxUV=0;
    for(var ui=0;ui<slots.length;ui++){
      var usl=slots[ui];
      var ulh=parseInt(new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"2-digit",hour12:false}).format(new Date(usl.utcMs)));
      if(ulh>=9&&ulh<=17){var uvv=uvHrs2[usl.idx]||0;if(uvv>dayMaxUV)dayMaxUV=uvv;}
    }
    // Heatwave line — sits at the top of the summary card, not above it
    var hwLine="";
    if(!window._HWDAYS&&fc&&typeof findClimEntry==="function"){
      var heE=findClimEntry(fc.latitude,fc.longitude,fc.elevation,CLIM_HAZARD_KM,true),heC=heE?hwClimatology(heE):null;
      if(heC)window._HWDAYS=heatwaveDays(fc,heC);
    }
    var hwDay=window._HWDAYS?hwForDate(window._HWDAYS,dateKey):null;
    if(hwDay){
      hwLine="<div onclick='showHeatwavePop(\""+dateKey+"\","+di+")' style='cursor:pointer;margin:-2px -4px 6px;padding:7px 9px;border-radius:8px;background:"
        +hwDay.col.replace("1)","0.14)")+";border:1px solid "+hwDay.col.replace("1)","0.45)")+"'>"
        +"<div style='font-size:14px;font-weight:800;color:"+hwDay.col+";display:flex;justify-content:space-between;align-items:center'>"
        +"<span>\uD83C\uDF21\uFE0F "+hwDay.label+"</span><span>"+hwDay.scale+"/10 \u203A</span></div></div>";
    }
    // Heat-stress line — the day's peak wet bulb, if dangerous (Today: remaining hours only)
    var wbLine="";
    var wbPk=dayPeakWetBulb(slots,di===0);
    if(wbPk&&wbPk.w>=WB_DANGER){
      var wbExt=wbPk.w>=WB_EXTREME,wbCol=wbExt?"rgba(220,30,80,1)":"rgba(230,105,0,1)";
      var wbHr=new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",hour12:true}).format(new Date(wbPk.slot.utcMs)).toLowerCase().replace(" ","");
      wbLine="<div onclick='showWetBulbPop("+wbPk.slot.temp+","+wbPk.slot.dp+","+di+")' style='cursor:pointer;margin:-2px -4px 6px;padding:7px 9px;border-radius:8px;background:"
        +wbCol.replace("1)","0.14)")+";border:1px solid "+wbCol.replace("1)","0.45)")+"'>"
        +"<div style='font-size:14px;font-weight:800;color:"+wbCol+";display:flex;justify-content:space-between;align-items:center;gap:8px;line-height:1.3'>"
        +"<span>"+(wbExt?"\uD83D\uDEA8 Extremely dangerous heat":"\uD83E\uDD75 Dangerously hot")+" around "+wbHr+"</span>"
        +"<span style='white-space:nowrap'>"+toDisp(wbPk.w).toFixed(1)+unitSym()+" WB \u203A</span></div></div>";
    }
    // Dangerous-cold line — the day's lowest wind chill, if dangerous (Today: remaining hours only)
    var wcLine="";
    var wcPk=dayMinWindChill(slots,di===0);
    if(wcPk&&wcPk.wc<=WC_DANGER){
      var wcExt=wcPk.wc<=WC_EXTREME,wcCol=wcExt?"rgba(110,80,230,1)":"rgba(20,130,210,1)";
      var wcHr=new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",hour12:true}).format(new Date(wcPk.slot.utcMs)).toLowerCase().replace(" ","");
      wcLine="<div onclick='showColdPop("+wcPk.slot.temp+","+(wcPk.slot.wind||0)+","+di+")' style='cursor:pointer;margin:-2px -4px 6px;padding:7px 9px;border-radius:8px;background:"
        +wcCol.replace("1)","0.14)")+";border:1px solid "+wcCol.replace("1)","0.45)")+"'>"
        +"<div style='font-size:14px;font-weight:800;color:"+wcCol+";display:flex;justify-content:space-between;align-items:center;gap:8px;line-height:1.3'>"
        +"<span>"+(wcExt?"\uD83D\uDEA8 Extremely dangerous cold":"\uD83E\uDD76 Dangerously cold")+" around "+wcHr+"</span>"
        +"<span style='white-space:nowrap'>"+String(Math.round(toDisp(wcPk.wc))).replace("-","\u2212")+unitSym()+" WC \u203A</span></div></div>";
    }
    // Hypothermia line — at least HYPO_HOURS cold, wet, windy hours (Today: remaining hours only)
    var hypoLine="";
    var hy=dayHypo(slots,hcodes,di===0);
    if(hy){
      var hyCol="rgba(40,120,150,1)";
      var hyHr=new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",hour12:true}).format(new Date(hy.first.utcMs)).toLowerCase().replace(" ","");
      hypoLine="<div onclick='showHypoPop("+hy.worst.temp+","+hy.worst.wind+","+di+","+hy.n+")' style='cursor:pointer;margin:-2px -4px 6px;padding:7px 9px;border-radius:8px;background:"
        +hyCol.replace("1)","0.14)")+";border:1px solid "+hyCol.replace("1)","0.45)")+"'>"
        +"<div style='font-size:14px;font-weight:800;color:"+hyCol+";display:flex;justify-content:space-between;align-items:center;gap:8px;line-height:1.3'>"
        +"<span>\uD83C\uDF27\uFE0F Hypothermia risk from "+hyHr+"</span>"
        +"<span style='white-space:nowrap'>"+hy.n+" hr"+(hy.n>1?"s":"")+" \u203A</span></div></div>";
    }
    // Storm line — the day's worst storm rating (Today: remaining hours only)
    var stormLine="";
    var stIdx=[];for(var si2=0;si2<slots.length;si2++){if(di===0&&slots[si2].utcMs<Date.now()-3600000)continue;stIdx.push(slots[si2].idx);}
    var St=fc?stormOver(fc,stIdx):{lvl:0};
    if(St.lvl){
      var stCol=STORM_COL[St.lvl];
      stormLine="<div onclick='showStormPop("+stIdx[0]+","+stIdx[stIdx.length-1]+","+di+")' style='cursor:pointer;margin:-2px -4px 6px;padding:7px 9px;border-radius:8px;background:"
        +stCol.replace("1)","0.14)")+";border:1px solid "+stCol.replace("1)","0.45)")+"'>"
        +"<div style='font-size:14px;font-weight:800;color:"+stCol+";display:flex;justify-content:space-between;align-items:center;gap:8px;line-height:1.3'>"
        +"<span>\u26C8\uFE0F "+STORM_LBL[St.lvl]+" from "+fcHourLabel(fc,St.first)+"</span>"
        +"<span style='white-space:nowrap'>\u203A</span></div></div>";
    }
    // Damaging-wind line (cyclone winds when a cyclone's wind zone covers the place)
    var windLineHz="";
    var Wd=fc?windOver(fc,stIdx):{lvl:0};
    if(Wd.lvl){
      var tcW=tcActive(),wCol=tcW?"rgba(200,30,50,1)":WIND_COL[Wd.lvl];
      windLineHz="<div onclick='"+(tcW?"showTCPop("+di+")":"showWindPop("+stIdx[0]+","+stIdx[stIdx.length-1]+","+di+")")+"' style='cursor:pointer;margin:-2px -4px 6px;padding:7px 9px;border-radius:8px;background:"
        +wCol.replace("1)","0.14)")+";border:1px solid "+wCol.replace("1)","0.45)")+"'>"
        +"<div style='font-size:14px;font-weight:800;color:"+wCol+";display:flex;justify-content:space-between;align-items:center;gap:8px;line-height:1.3'>"
        +"<span>"+(tcW?"\uD83C\uDF00 Cyclone winds":"\uD83D\uDCA8 "+windName(Wd.lvl))+" from "+fcHourLabel(fc,Wd.first)+"</span>"
        +"<span style='white-space:nowrap'>"+Math.round(Wd.gust)+" km/h \u203A</span></div></div>";
    }
    // Coldwave line — mirrors the heatwave line
    var cwLine="";
    if(!window._CWDAYS&&fc&&typeof findClimEntry==="function"){
      var ceE=findClimEntry(fc.latitude,fc.longitude,fc.elevation,CLIM_HAZARD_KM,true),ceC=ceE?cwClimatology(ceE):null;
      if(ceC)window._CWDAYS=coldwaveDays(fc,ceC);
    }
    var cwDay=window._CWDAYS?hwForDate(window._CWDAYS,dateKey):null;
    if(cwDay){
      cwLine="<div onclick='showColdwavePop(\""+dateKey+"\","+di+")' style='cursor:pointer;margin:-2px -4px 6px;padding:7px 9px;border-radius:8px;background:"
        +cwDay.col.replace("1)","0.14)")+";border:1px solid "+cwDay.col.replace("1)","0.45)")+"'>"
        +"<div style='font-size:14px;font-weight:800;color:"+cwDay.col+";display:flex;justify-content:space-between;align-items:center'>"
        +"<span>"+(cwDay.cooler?"\uD83C\uDF43 ":"\u2744\uFE0F ")+cwDay.label+"</span><span>"+cwDay.scale+"/10 \u203A</span></div></div>";
    }
    // Warmer/cooler than usual — only on days with no heatwave or coldwave
    var anLine="",anD=(!hwDay&&!cwDay)?anomFor(fc,dateKey):null;
    if(anD){
      var anCol=anD.warm?"rgba(215,110,30,1)":"rgba(30,135,165,1)";
      var anHi=Math.abs(anD.zH)>=Math.abs(anD.zL),anDv=Math.round((anHi?anD.hi-anD.n.hi:anD.lo-anD.n.lo)*(useFahrenheit?1.8:1));
      anLine="<div onclick='showAnomPop(\""+dateKey+"\","+di+")' style='cursor:pointer;margin:-2px -4px 6px;padding:7px 9px;border-radius:8px;background:"
        +anCol.replace("1)","0.1)")+";border:1px solid "+anCol.replace("1)","0.35)")+"'>"
        +"<div style='font-size:13.5px;font-weight:800;color:"+anCol+";display:flex;justify-content:space-between;align-items:center;gap:8px;line-height:1.3'>"
        +"<span>"+(anD.warm?"\u2197\uFE0F ":"\u2198\uFE0F ")+anD.label+"</span>"
        +"<span style='white-space:nowrap'>"+(anDv>0?"+":"\u2212")+Math.abs(anDv)+"\u00B0 "+(anHi?"high":"low")+" \u203A</span></div></div>";
    }
    var uvDayLine=dayMaxUV>=3?(dayMaxUV<6?"UV "+Math.round(dayMaxUV)+" \u2014 Sun protection recommended \uD83D\uDD76\uFE0F":dayMaxUV<8?"UV "+Math.round(dayMaxUV)+" \u2014 Sunscreen + hat recommended \uD83E\uDDF4":dayMaxUV<11?"UV "+Math.round(dayMaxUV)+" \u2014 Sunscreen, hat & shade essential \uD83E\uDDF4":"UV "+Math.round(dayMaxUV)+" \u2014 Avoid direct sun \u2620\uFE0F"):"";
    dailySummary="<div style='background:var(--card-inner);border:1px solid var(--card-inner-border);border-radius:10px;padding:8px 10px;margin-bottom:10px;font-size:12px;font-weight:700;color:var(--text-muted);line-height:1.9'>"
      +hwLine
      +cwLine
      +anLine
      +wbLine
      +wcLine
      +hypoLine
      +stormLine
      +windLineHz
      +condLine
      +(rangeLine?"<div>🌡️ "+rangeLine+"</div>":"")
      +"<div>"+rainLine+"</div>"
      +(windLine?"<div>💨 "+windLine+"</div>":"")
      +fireLine
      +(uvDayLine?"<div style='cursor:pointer' onclick='showUVPop(\""+dateKey+"\",null,"+di+")'>\u2600\uFE0F "+uvDayLine+" \u203A</div>":"")
      +"</div>";
  }
  // 2-hourly table — even local hours only
  var tblRows="";
  for(var i=0;i<slots.length;i++){
    var sl=slots[i];
    if(sl.temp===null||sl.dp===null||sl.wind===null)continue;
    var localHr=parseInt(new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"2-digit",hour12:false}).format(new Date(sl.utcMs)));
    if(localHr%2!==0)continue;
    var timeStr=new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",hour12:true}).format(new Date(sl.utcMs)).toLowerCase().replace(" ","");
    var r=calc(sl.temp,sl.dp,sl.wind,sl.rain);
        var scoreCol=SBANDS[bandForScore(r.score)].col.replace("0.92","1");
    var rowBg=SBANDS[bandForScore(r.score)].col.replace("0.92","0.10");
    var rain2h=(hourlyPrecip[sl.idx]||0)+(hourlyPrecip[sl.idx+1]||0);
    var rainStr=rain2h>=0.05?rain2h.toFixed(1):"—";
        tblRows+="<tr style='border-top:1px solid var(--divider);background:"+rowBg+";cursor:pointer' onclick='show7DayHourSlot("+sl.idx+","+di+",\""+timeStr+"\")'>"
            +"<td style='padding:5px 8px 5px 6px;font-weight:800;color:var(--text);white-space:nowrap;border-right:1px solid var(--divider);border-left:2px solid var(--divider)'>"+timeStr+"</td>"
      +"<td style='padding:5px 4px'>"+toDisp(sl.temp).toFixed(1)+unitSym()+"</td>"
      +"<td style='padding:5px 4px;color:var(--text-muted)'>"+toDisp(sl.dp).toFixed(1)+unitSym()+"</td>"
      +"<td style='padding:5px 4px;color:var(--text-muted)'>"+Math.round(sl.wind)+"</td>"
      +"<td style='padding:5px 4px;color:var(--text-muted)'>"+rainStr+"</td>"
                  +"<td style='padding:5px 6px 5px 6px;text-align:right;border-left:2px solid var(--divider);border-right:2px solid var(--divider)'>"
      +"<span style='font-size:14px;font-weight:800;color:"+scoreCol+"'>"+r.score+"</span></td>"
      +"</tr>";
  }
    var tbl="<div style='background:var(--card-inner);border:1px solid var(--card-inner-border);border-radius:10px;padding:8px 10px;margin-bottom:10px'><table style='width:100%;border-collapse:collapse;font-size:12px;font-weight:700'>"
    +"<thead><tr>"
        +"<th style='text-align:left;font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;padding-bottom:6px;padding-left:6px;border-left:2px solid var(--divider)'>Time</th>"
    +"<th style='text-align:left;font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;padding-bottom:6px'>Temp</th>"
    +"<th style='text-align:left;font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;padding-bottom:6px'>DP</th>"
    +"<th style='text-align:left;font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;padding-bottom:6px;padding-right:10px'>km/h</th>"
    +"<th style='text-align:left;font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;padding-bottom:6px'>mm</th>"
        +"<th style='text-align:right;font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;padding-bottom:6px;padding-left:8px;padding-right:6px;border-left:2px solid var(--divider);border-right:2px solid var(--divider)'>Score</th>"
    +"</tr></thead>"
        +"<tbody>"+tblRows+"</tbody>"
    +"</table></div>";
    // Daytime wear summary (9am–5pm)
  var gs2=gs();
  var dayMinL=99,dayMaxL=-1,dayNeedWind=false,dayNeedRain=false,dayJustWet=false;
  for(var wi=0;wi<slots.length;wi++){
    var wsl=slots[wi];
    if(wsl.temp===null||wsl.dp===null||wsl.wind===null)continue;
    var wlh=parseInt(new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"2-digit",hour12:false}).format(new Date(wsl.utcMs)));
    if(wlh<9||wlh>17)continue;
    var ww=whatToWear(wsl.temp,wsl.wind,hcodes[wsl.idx]||null,gs2,wsl.dp);
                var wwWindRain=!!(ww.extra&&ww.extra.indexOf("indproof rain")>-1);
    var wwRain=!wwWindRain&&!!(ww.extra&&ww.extra.indexOf("ain jacket")>-1);
    var wwWet=wsl.dp!==null&&wsl.dp>25&&(wwRain||wwWindRain||!!(ww.extra&&ww.extra.indexOf("get wet")>-1));
    if(wwWet){wwRain=false;wwWindRain=false;dayJustWet=true;}
    var wwBase=ww.layers<=1?0:ww.layers-1;
    var wwDisp=(wwRain||wwWindRain)?Math.max(0,wwBase-1):wwBase;
    if(wwDisp<dayMinL)dayMinL=wwDisp;
    if(wwDisp>dayMaxL)dayMaxL=wwDisp;
    if(wwWindRain)dayNeedWind=true;
    if(wwRain)dayNeedRain=true;
  }
  var wearSection="";
  if(dayMaxL>=0){
    // Layer counts exclude the jacket. With no layers needed, the jacket itself is the
    // headline, so the card never says "No layers required" above a rain jacket.
    var lyr=function(n){return n+" "+(n===1?"layer":"layers");};
    var jacket=dayNeedWind?"wind/rainproof jacket":dayNeedRain?"rain jacket":"";
    var layerRange,outerDesc="";
    if(dayMaxL===0)layerRange=jacket?narrCap(jacket)+" recommended":"No layers required";
    else{
      layerRange=dayMinL===dayMaxL?lyr(dayMaxL):dayMinL===0?"Up to "+lyr(dayMaxL):(dayMinL+"\u2013"+dayMaxL+" layers");
      if(jacket)outerDesc="+ 1 "+jacket;
    }
    if(!jacket&&dayJustWet)outerDesc="Honestly, just get wet \uD83C\uDF27\uFE0F";
        var wearDetail="<div style='font-size:18px;font-weight:800;color:var(--text);margin-bottom:2px'>"+layerRange+"</div>"
            +(outerDesc?"<div style='font-size:13px;font-weight:700;color:var(--text-muted)'>"+outerDesc+"</div>":"")
      +"<div style='font-size:11px;color:var(--text-muted);margin-top:6px'>Tap any hourly row to expand</div>";
    wearSection="<div style='background:var(--card-inner);border:1px solid var(--card-inner-border);border-radius:10px;padding:8px 10px;margin-bottom:10px'>"
      +"<div style='cursor:pointer;font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;display:flex;justify-content:space-between;align-items:center' onclick=\"var el=document.getElementById('wd"+di+"');var op=el.style.display!=='none';el.style.display=op?'none':'block';this.querySelector('.wdch').textContent=op?'\u25B8':'\u25BE'\">"
      +"<span>What to wear \uD83E\uDDE5</span><span class='wdch'>\u25B8</span></div>"
      +"<div id='wd"+di+"' style='display:none;margin-top:8px'>"
      +"<div style='font-size:10px;font-weight:800;color:var(--text-muted);text-transform:uppercase;letter-spacing:0.04em;margin-bottom:6px'>Daytime (9am\u20135pm)</div>"
      +wearDetail+"</div></div>";
  }
  var totalDays=window._7dayKeys.length;
    var prevLabel=di>0?(di===1?"Today":new Intl.DateTimeFormat("en-AU",{timeZone:tz,weekday:"short"}).format(new Date(window._7dayData[window._7dayKeys[di-1]][0].utcMs))):"";
  var nextLabel=di<totalDays-1?new Intl.DateTimeFormat("en-AU",{timeZone:tz,weekday:"short"}).format(new Date(window._7dayData[window._7dayKeys[di+1]][0].utcMs)):"";
  var navHtml="<div style='display:flex;justify-content:space-between;align-items:center;margin-top:12px;padding-top:10px;border-top:1px solid var(--divider)'>"
    +(di>0?"<span style='font-size:13px;font-weight:800;color:var(--text-sec);cursor:pointer;padding:4px 8px' onclick='show7DaySlot("+(di-1)+")'>← "+prevLabel+"</span>":"<span></span>")
    +(di<totalDays-1?"<span style='font-size:13px;font-weight:800;color:var(--text-sec);cursor:pointer;padding:4px 8px' onclick='show7DaySlot("+(di+1)+")'>"+nextLabel+" →</span>":"<span></span>")
    +"</div>";
    var body="<div class='washing-reason'>"+dailySummary+wearSection+tbl+navHtml+"</div>";
  document.getElementById("pop-ttl").textContent=dayLabel;
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}

