// Comfort Score · app.js — share, refresh, re-render, UI, sliders, geocoding, search, forecast sources and fallback, MET Norway, Weather Underground, stars, PWA
// Loaded by index.html (classic script, deferred, in a fixed order). All names are global.
// ── Share ──────────────────────────────────────────────────────────────────
function shareScore(){
  if(!window._LW)return;
  var w=window._LW,res=calc(w.temp,w.effDP,w.wind,w.rain,window._currentWU?placeMinNow(false):placeMinNow()),si=scoreInfo(res.score);
  var loc=document.getElementById("live-locname").textContent;
  // TODO: update URL below once comfortscore.joshburton.au is live
  var text=loc+" right now"+(res.sleep?" (sleep comfort)":"")+": "+res.score+" \u2014 "+si.label+" "+si.emoji+"\n"+toDisp(w.temp).toFixed(1)+unitSym()+" | DP "+toDisp(w.effDP).toFixed(1)+unitSym()+" | Wind "+Math.round(w.wind)+" km/h\ncomfortscore.joshburton.au";
  if(navigator.share){navigator.share({title:"Comfort Score",text:text}).catch(function(){});}
  else{navigator.clipboard.writeText(text).then(function(){showPop("Copied!","Score copied to clipboard.");}).catch(function(){showPop("Share",text);});}
}

// ── Refresh ────────────────────────────────────────────────────────────────
function refreshWeather(){
  if(!window._currentLat&&!window._currentWU)return;
  var btn=document.getElementById("refresh-btn");btn.classList.add("spinning");
  var done=function(){btn.classList.remove("spinning");};
  if(window._currentWU)fetchWU(window._currentWU.stationId,window._currentWU.apiKey,window._currentWU.label,done);
  else fetchWeatherWithCb(window._currentLat,window._currentLon,window._currentLabel,done);
}

// ── Re-render ──────────────────────────────────────────────────────────────
function reRenderLive(){
  if(!window._LW)return;
  var w=window._LW,res=calc(w.temp,w.effDP,w.wind,w.rain,window._currentWU&&!window._FC?placeMinNow(false):placeMinNow());
  window._LW.res=res;
  renderScore("live-score-area","gauge-live",res,w.temp,w.effDP,w.wind,w.wxCode,w.rain);
}
function reRenderManual(){if(document.getElementById("manual-result").style.display==="none")return;calcManual();}
function reRenderAll(){reRenderLive();reRenderManual();if(window._FC)renderForecast(window._FC);}

// ── UI ─────────────────────────────────────────────────────────────────────
function switchTab(tab){document.getElementById("page-live").classList.toggle("active",tab==="live");document.getElementById("page-manual").classList.toggle("active",tab==="manual");document.body.classList.toggle("manual-mode",tab==="manual");var mb=document.getElementById("manual-btn");if(mb){mb.classList.toggle("active",tab==="manual");mb.title=tab==="manual"?"Back to live weather":"Manual input";}}
function toggleManual(){setView("forecast");switchTab(document.getElementById("page-manual").classList.contains("active")?"live":"manual");pageScrollTo(0,true);}
function toggleMode(){var m=document.getElementById("m-mode").value;document.getElementById("m-dp-row").style.display=(m==="dp")?"flex":"none";document.getElementById("m-rh-row").style.display=(m==="rh")?"flex":"none";}
function calcManual(){
  var tempDisp=parseFloat(document.getElementById("m-temp").value)||20;
  var temp=fromDisp(tempDisp);
  var mode=document.getElementById("m-mode").value;
  var effDP;
  if(mode==="dp"){
    effDP=fromDisp(parseFloat(document.getElementById("m-dp").value)||10);
  } else {
    // Magnus formula for accurate RH -> DP conversion
    var rh2=parseFloat(document.getElementById("m-rh").value)||60;
    var aa=17.27,bb=237.3;
    var alph=(aa*temp/(bb+temp))+Math.log(rh2/100);
    effDP=Math.round((bb*alph/(aa-alph))*10)/10;
  }
  var wind=parseFloat(document.getElementById("m-wind").value)||0;
  var rain=Math.max(0,parseFloat(document.getElementById("m-rain").value)||0);
  var r=calc(temp,effDP,wind,rain);
  document.getElementById("manual-result").style.display="block";
  renderScore("manual-score-area","gauge-manual",r,temp,effDP,wind,null,rain);
}
function toggleAdv(){document.getElementById("adv-tog").classList.toggle("open");document.getElementById("s-panel").classList.toggle("open");}
function togglePref(){document.getElementById("pref-tog").classList.toggle("open");document.getElementById("pref-panel").classList.toggle("open");}
// ── Views: Forecast / Climate ──────────────────────────────────────────────
// One page with three views. Climate adds #climate to the address and Learn adds #learn (or
// #learn/<lesson>), so each can be linked to and Back steps between them. Each view keeps its own
// scroll position. Learn's lessons live in js/learn.js, loaded the first time Learn opens.
var _view="forecast",_viewScroll={forecast:0,climate:0,learn:0},_learnLesson="",_learnScroll={};
if("scrollRestoration" in history)history.scrollRestoration="manual";   // setView() restores each view's scroll itself
function setView(v,fromHistory,lesson){
  v=v==="climate"||v==="learn"?v:"forecast";
  lesson=v==="learn"?(lesson||""):"";
  var body=document.body;
  if(v===_view&&body.classList.contains("view-"+v)){
    if(v!=="learn"||lesson===_learnLesson)return;
    // a different lesson inside Learn
    _learnScroll[_learnLesson]=pageScrollY();
    _learnLesson=lesson;
    if(!fromHistory)history.pushState({view:"learn"},"","#learn"+(lesson?"/"+lesson:""));
    learnShow(lesson,fromHistory?(_learnScroll[lesson]||0):0);
    return;
  }
  if(body.classList.contains("view-"+_view))_viewScroll[_view]=pageScrollY();
  var same=v==="learn"&&lesson===_learnLesson;
  _view=v;if(v==="learn")_learnLesson=lesson;
  ["forecast","climate","learn"].forEach(function(t){
    body.classList.toggle("view-"+t,t===v);
    var el=document.getElementById("tab-"+t);if(!el)return;
    el.classList.toggle("active",t===v);
    if(t===v)el.setAttribute("aria-current","page");else el.removeAttribute("aria-current");
  });
  if(v!=="forecast"&&document.getElementById("page-manual").classList.contains("active"))switchTab("live");
  if(v==="climate"){
    if(!document.getElementById("clim-panel").classList.contains("open"))toggleClim();
    else setTimeout(function(){initLivMap();if(_livMap){_livMap.invalidateSize();livMapCentre();}},60);
  }else{
    livMapToggleExpand(false);
    climFullToggle(false);
  }
  if(v!=="learn")document.title="Comfort Score";
  if(!fromHistory){
    if(v==="climate")history.pushState({view:"climate"},"","#climate");
    else if(v==="learn")history.pushState({view:"learn"},"","#learn"+(lesson?"/"+lesson:""));
    else history.pushState({view:"forecast"},"",location.pathname+location.search);
  }
  if(v==="learn")learnShow(lesson,same?_viewScroll.learn:(_learnScroll[lesson]||0));
  else pageScrollTo(_viewScroll[v]||0);
}
// Opens a lesson ("" for the list of lessons). Used by links inside the lessons.
function learnGo(id){setView("learn",false,id||"");}
// The Learn tab: back to the lesson you were reading, or to the list if you're already in Learn.
function learnTab(){setView("learn",false,_view==="learn"?"":_learnLesson);}
var _learnLoading=null;
function learnShow(lesson,y){
  var draw=function(){if(_view!=="learn"||_learnLesson!==lesson)return;learnRender(lesson);pageScrollTo(y||0);};
  if(window.LEARN_READY){draw();return;}
  var box=document.getElementById("learn-page");
  if(box&&!box.innerHTML)box.innerHTML="<div class='card learn-loading'>Loading lessons\u2026</div>";
  if(_learnLoading){_learnLoading.push(draw);return;}
  _learnLoading=[draw];
  var s=document.createElement("script");s.src="js/learn.js?v=2";
  s.onload=function(){var q=_learnLoading;_learnLoading=null;q.forEach(function(f){f();});};
  s.onerror=function(){_learnLoading=null;if(box)box.innerHTML="<div class='card learn-loading'>Couldn\u2019t load the lessons. Check your connection and try again.</div>";};
  document.head.appendChild(s);
}
function viewFromAddress(){
  var m=location.hash.match(/^#learn(?:\/([\w-]+))?$/);
  if(m)setView("learn",true,m[1]||"");
  else setView(location.hash==="#climate"?"climate":"forecast",true);
}
window.addEventListener("popstate",viewFromAddress);
window.addEventListener("hashchange",viewFromAddress);
// ── Sliders ────────────────────────────────────────────────────────────────
var SLIDER_MAPS={
 heat:{labels:["Mild","Moderate","Sensitive","Severe"],thr:[25,50,75],apply:function(t){setAdv("s-hw",Math.round(lerp(0.8,2.0,t)*10)/10);setAdv("s-tmax",Math.round(lerp(50,90,t)));}},
 cold:{labels:["Mild","Moderate","Sensitive","Severe"],thr:[25,50,75],apply:function(t){setAdv("s-coolmax",Math.round(lerp(15,55,t)));setAdv("s-coldmax",Math.round(lerp(50,150,t)/5)*5);}},
  hum:{labels:["Prefer dry","Mild","Moderate","Tolerant"],thr:[25,50,75],apply:function(t){setAdv("s-dp",Math.round(lerp(6,18,t)*2)/2);setAdv("s-hmax",Math.round(lerp(70,30,t)));setAdv("s-hexp",Math.round(lerp(0.4,0.9,t)*20)/20);setAdv("s-hdp_ceil",Math.round(lerp(20,32,t)*2)/2);}},
  wind:{labels:["Hate wind","Neutral","Like it","Love wind"],thr:[25,50,75],apply:function(t){setAdv("s-wmax",Math.round(lerp(30,8,t)));setAdv("s-cws",Math.round(lerp(2.5,0.5,t)*10)/10);setAdv("s-pwhi",Math.round(lerp(10,40,t)));setAdv("s-pwlo",Math.round(lerp(15,5,t)));}}
  }
function lerp(a,b,t){return a+(b-a)*t;}
function setAdv(id,val){var el=document.getElementById(id);if(el)el.value=val;}
function sliderLabel(key,pos){var m=SLIDER_MAPS[key];if(pos<=m.thr[0])return m.labels[0];if(pos<=m.thr[1])return m.labels[1];if(pos<=m.thr[2])return m.labels[2];return m.labels[3];}
function updateTrack(id,val){var el=document.getElementById(id);if(el)el.style.background="linear-gradient(to right,var(--range-fill) "+val+"%,var(--range-bg) "+val+"%)";}
var slidersLocked=localStorage.getItem("sliders_locked")==="1";
function toggleSliderLock(){
  slidersLocked=!slidersLocked;
  localStorage.setItem("sliders_locked",slidersLocked?"1":"0");
  applySliderLock();
}
function applySliderLock(){
  var btn=document.getElementById("slider-lock-btn");
  var sliders=document.querySelectorAll("#pref-panel input[type=range]");
  for(var i=0;i<sliders.length;i++){
    sliders[i].classList.toggle("locked",slidersLocked);
  }
  if(btn)btn.textContent=slidersLocked?"\uD83D\uDD12 Locked":"\uD83D\uDD13 Unlocked";
}

function onTempPref(){
  var thiEl=document.getElementById("pref-thi");
  var tloEl=document.getElementById("pref-tlo");
  if(!thiEl||!tloEl)return;
  var thiVal=parseFloat(thiEl.value);
  var tloVal=parseFloat(tloEl.value);
  // Convert to Celsius for storage
  var thiC=useFahrenheit?fromDisp(thiVal):thiVal;
  var tloC=useFahrenheit?fromDisp(tloVal):tloVal;
  // Sanity check — cold threshold must be below hot threshold
  if(tloC>=thiC){tloC=thiC-3;tloEl.value=Math.round(useFahrenheit?toDisp(tloC):tloC);}
  // Set the thresholds
  setAdv("s-thi",Math.round(thiC*2)/2);
  setAdv("s-tlo",Math.round(tloC*2)/2);
_tlo=Math.round(tloC*2)/2;
  _thi=Math.round(thiC*2)/2;
  localStorage.setItem("pref_thi",_thi);
  localStorage.setItem("pref_tlo",_tlo);
  // Recalibrate cold zone relative to cold threshold
  // coldfloor is always 20C below the cold threshold — scales with tolerance
  var coldFloor=Math.round(tloC-20);
  setAdv("s-coldfloor",coldFloor);
  // coolmax stays modest — the cool zone (0C to tlo) is narrow for cold-tolerant people
  // and the cold threshold slider handles severity above that via coldmax/coldexp
  var coolMax=Math.max(10,Math.min(40,Math.round((18-tloC)*1.5)));
  setAdv("s-coolmax",coolMax);
  saveSettings();
  scheduleRender();
}

function initTempPrefs(){
var thi=parseFloat(localStorage.getItem("pref_thi"))||_thi||22;
  var tlo=parseFloat(localStorage.getItem("pref_tlo"))||_tlo||18;
  var thiEl=document.getElementById("pref-thi");
  var tloEl=document.getElementById("pref-tlo");
  if(thiEl)thiEl.value=useFahrenheit?Math.round(toDisp(thi)):thi;
  if(tloEl)tloEl.value=useFahrenheit?Math.round(toDisp(tlo)):tlo;
  var unit=unitSym();
  var thiU=document.getElementById("pref-thi-unit");
  var tloU=document.getElementById("pref-tlo-unit");
  if(thiU)thiU.textContent=unit;
  if(tloU)tloU.textContent=unit;
  _thi=thi;
  _tlo=tlo;
  // Recalibrate cold zone to match saved threshold
  onTempPref();
}
function onSlider(key){var el=document.getElementById("sl-"+key);if(!el)return;var pos=parseInt(el.value),t=pos/100;SLIDER_MAPS[key].apply(t);document.getElementById(key+"-val").textContent=sliderLabel(key,pos);updateTrack("sl-"+key,pos);saveSettings();scheduleRender();if(key==="wind"&&typeof renderLivScore==="function")renderLivScore();}

function advToSlider(key){
  function gv(id,def){var el=document.getElementById(id);return el?parseFloat(el.value)||def:def;}
  var t=0.5;
if(key==="heat"){var hw=gv("s-hw",1.2);t=(hw-0.8)/(2.0-0.8);}
  else if(key==="cold"){var coldmax=gv("s-coldmax",100);t=(coldmax-50)/(150-50);}
  else if(key==="hum"){var dp=gv("s-dp",12);t=(dp-6)/(18-6);}
  else if(key==="wind"){var wmax=parseFloat(gv("s-wmax",20))||20;t=1-(wmax-8)/(30-8);}
  return Math.round(Math.max(0,Math.min(1,t))*100);
}

function syncSlidersFromAdv(){var keys=["heat","cold","hum","wind"];for(var i=0;i<keys.length;i++){var key=keys[i],pos=advToSlider(key);var el=document.getElementById("sl-"+key);if(el)el.value=pos;var lbl=document.getElementById(key+"-val");if(lbl)lbl.textContent=sliderLabel(key,pos);updateTrack("sl-"+key,pos);}}

// ── Geocoding ──────────────────────────────────────────────────────────────
function revGeo(lat,lon){return fetch("https://nominatim.openstreetmap.org/reverse?lat="+lat+"&lon="+lon+"&format=json&zoom=10",{headers:{"Accept-Language":"en","User-Agent":"ComfortScoreApp/1.0"}}).then(function(r){return r.json();}).then(function(d){if(d&&d.address){var a=d.address;var parts=[a.suburb||a.town||a.village||a.city_district||a.city||"",a.city||a.municipality||"",a.state||""].filter(Boolean);var u=parts.filter(function(v,i,arr){return arr.indexOf(v)===i;});return u.slice(0,3).join(", ")||d.display_name.split(",").slice(0,2).join(",").trim();}return null;}).catch(function(){return null;});}
function nomLabel(p){var a=p.address||{};var name=a.suburb||a.town||a.village||a.city_district||a.city||a.municipality||a.county||p.display_name.split(",")[0].trim();return[name,a.state||"",a.country||""].filter(Boolean).join(", ");}
function nomSub(p){var a=p.address||{},parts=[];if(a.suburb&&(a.city||a.municipality))parts.push(a.city||a.municipality);if(a.state)parts.push(a.state);if(a.country)parts.push(a.country);return parts.filter(Boolean).join(", ")||(p.type||"");}
// ── Search popup ───────────────────────────────────────────────────────────
function openSearch(msg){
  document.getElementById("search-status").textContent=msg||"";
  document.getElementById("search-ov").classList.add("open");
  setTimeout(function(){var i=document.getElementById("city-input");i.focus();i.select();},60);
}
function closeSearch(){document.getElementById("search-ov").classList.remove("open");}
function searchMsg(t){document.getElementById("search-status").textContent=t;}
// Loading a place switches back to live weather if manual input was showing
function goLive(){if(document.getElementById("page-manual").classList.contains("active"))switchTab("live");}
function detectLocation(){
  var fromPop=document.getElementById("search-ov").classList.contains("open");
  if(!navigator.geolocation){if(fromPop)searchMsg("Location isn\u2019t available on this device \u2014 search for a place instead.");else{document.getElementById("live-status").textContent="";openSearch("Location isn\u2019t available on this device \u2014 search for a place instead.");}return;}
  if(fromPop)searchMsg("Finding your location\u2026");else document.getElementById("live-status").textContent="Detecting your location...";
  navigator.geolocation.getCurrentPosition(function(pos){
    var lat=pos.coords.latitude,lon=pos.coords.longitude;
    closeSearch();goLive();
    document.getElementById("live-status").textContent="Looking up location...";
    revGeo(lat,lon).then(function(name){fetchWeather(lat,lon,name||(lat.toFixed(2)+"\u00B0, "+lon.toFixed(2)+"\u00B0"));});
  },function(){
    document.getElementById("live-status").textContent="";
    openSearch("Location access is turned off \u2014 search for a place instead.");
  });
}
function searchCity(){
  var city=document.getElementById("city-input").value.trim();if(!city)return;
  searchMsg("Searching\u2026");document.getElementById("results-list").style.display="none";
  fetch("https://nominatim.openstreetmap.org/search?q="+encodeURIComponent(city)+"&format=json&limit=10&addressdetails=1",{headers:{"Accept-Language":"en","User-Agent":"ComfortScoreApp/1.0"}})
  .then(function(r){return r.json();}).then(function(d){
    if(!d||!d.length){searchMsg("No results found. Try adding a state or country.");return;}
    window._SR=d;
    if(d.length===1){selectResult(0);return;}
    searchMsg("Multiple results \u2014 tap one:");
    var list=document.getElementById("results-list"),html="";
    for(var i=0;i<d.length;i++){html+="<div class='result-item' onclick='selectResult("+i+")'><div>"+nomLabel(d[i])+"</div><div class='result-sub'>"+nomSub(d[i])+"</div></div>";}
    list.innerHTML=html;list.style.display="block";
  }).catch(function(e){searchMsg("Search failed: "+e.message);});
}
function selectResult(i){
  var p=window._SR[i];if(!p)return;
  document.getElementById("results-list").style.display="none";searchMsg("");
  document.getElementById("city-input").value="";
  closeSearch();goLive();
  fetchWeather(parseFloat(p.lat),parseFloat(p.lon),nomLabel(p));
}
// ── Forecast sources and fallback ───────────────────────────────────────────
// Error for a refused weather request (e.g. 429 = Open-Meteo's free daily limit reached)
function apiError(status){
  var e=new Error(status===429?"The weather service\u2019s free request limit has been reached for now \u2014 try again later.":"Weather service error "+status);
  e.friendly=status===429;e.status=status;return e;
}
// getForecast() asks Open-Meteo directly. After FC_SLOW_MS the status line says it's slow;
// after FC_SWITCH_MS (or straight away if the request fails) it gives up on the direct
// request and tries, in order:
//   1. Open-Meteo again through our Worker (/api/om) — same data, different route;
//   2. MET Norway through our Worker (/api/met), converted to Open-Meteo's shape;
//   3. the last Open-Meteo forecast saved on this device for this place (up to 7 days old).
// The result carries _src ("om", "om-proxy", "met" or "stored") for the source note.
var FC_SLOW_MS=10000,FC_SWITCH_MS=20000,FC_ALT_MS=15000,FC_STORE_MAX=3,FC_STORE_DAYS=7;
var FC_HOURLY="temperature_2m,relative_humidity_2m,dew_point_2m,wind_speed_10m,wind_gusts_10m,precipitation,weather_code,uv_index,cape,lifted_index";
var FC_DAILY="sunrise,sunset,weather_code,precipitation_sum,precipitation_hours,snowfall_sum,wind_speed_10m_max,temperature_2m_max,temperature_2m_min";
function omQuery(lat,lon,curVars){
  return"latitude="+lat+"&longitude="+lon+"&current="+curVars+"&hourly="+FC_HOURLY+"&daily="+FC_DAILY
    +"&wind_speed_unit=kmh&timezone=auto&forecast_days=10&past_days=32";
}
function fetchJSONTimeout(url,ms,ctl){
  ctl=ctl||new AbortController();
  var t=setTimeout(function(){ctl.abort();},ms);
  return fetch(url,{signal:ctl.signal}).then(function(r){
    if(!r.ok)return r.json().catch(function(){return{};}).then(function(j){var e=apiError(r.status);if(j&&j.reason&&r.status!==429)e.message+=" — "+j.reason;throw e;});
    return r.json();
  }).then(function(j){clearTimeout(t);return j;},function(e){clearTimeout(t);throw e;});
}
// Models sometimes flag snow in heavy, cold rain well above freezing (seen at Occidental,
// California: "snow" at 8–13°C). Snow can't reach the ground once the wet-bulb temperature
// is above about 2°C, so those hours count as rain, and a day with no hour cold enough for
// snow loses its snowfall total and snow icon.
var SNOW_WB_MAX=2,SNOW_TO_RAIN={71:61,73:63,75:65,77:61,85:80,86:82};
function fcSnowOk(t,dp){if(t==null)return true;if(dp==null)return t<=4;return wetBulb(t,dp)<=SNOW_WB_MAX;}
function fcFixSnow(d){
  try{
    if(!d||!d.hourly||!d.hourly.weather_code||!d.hourly.time)return d;
    var H=d.hourly,c=H.weather_code,T=H.temperature_2m||[],DP=H.dew_point_2m||[],P=H.precipitation||[],cold={};
    for(var i=0;i<H.time.length;i++){
      var ok=fcSnowOk(T[i],DP[i]),day=H.time[i].slice(0,10);
      if(ok&&(P[i]>0||SNOW_TO_RAIN[c[i]]!==undefined))cold[day]=1;
      if(!ok&&SNOW_TO_RAIN[c[i]]!==undefined)c[i]=SNOW_TO_RAIN[c[i]];
    }
    var cu=d.current;
    if(cu&&SNOW_TO_RAIN[cu.weather_code]!==undefined&&!fcSnowOk(cu.temperature_2m,cu.dew_point_2m))cu.weather_code=SNOW_TO_RAIN[cu.weather_code];
    var D=d.daily;
    if(D&&D.time)for(var j=0;j<D.time.length;j++){
      var dy=D.time[j];if(cold[dy])continue;
      if(D.snowfall_sum&&D.snowfall_sum[j]>0)D.snowfall_sum[j]=0;
      if(D.weather_code&&SNOW_TO_RAIN[D.weather_code[j]]!==undefined){
        var w=null;for(var k=0;k<H.time.length;k++)if(H.time[k].slice(0,10)===dy&&c[k]!=null&&(w==null||c[k]>w))w=c[k];
        D.weather_code[j]=w!=null?w:SNOW_TO_RAIN[D.weather_code[j]];
      }
    }
  }catch(e){}
  return d;
}
function getForecast(lat,lon,curVars,onMsg){
  onMsg=onMsg||function(){};
  var q=omQuery(lat,lon,curVars),ctl=new AbortController(),switched=false,firstErr=null;
  return new Promise(function(resolve,reject){
    var tSlow=setTimeout(function(){onMsg("Fetching weather – but taking longer than usual…");},FC_SLOW_MS);
    var tSwitch=setTimeout(function(){alt();},FC_SWITCH_MS);
    function ok(d,src){clearTimeout(tSlow);clearTimeout(tSwitch);d._src=src;fcFixSnow(d);if(src==="om"||src==="om-proxy")fcStoreSave(lat,lon,d);resolve(d);}
    function alt(){
      if(switched)return;switched=true;clearTimeout(tSlow);clearTimeout(tSwitch);ctl.abort();
      onMsg("Open-Meteo not responding – attempting to fetch from an alternate source…");
      fetchJSONTimeout("/api/om?"+q,FC_ALT_MS).then(function(d){if(!d||!d.hourly)throw new Error("bad");ok(d,"om-proxy");})
      .catch(function(){
        return fetchJSONTimeout("/api/met?lat="+lat+"&lon="+lon,FC_ALT_MS).then(function(m){ok(metToOm(m,lat,lon),"met");});
      }).catch(function(){
        var s=fcStoreGet(lat,lon);
        if(s){resolve(s);return;}
        var e=new Error("Couldn’t get the weather — Open-Meteo isn’t responding and the backup source failed too. Try again in a few minutes.");
        e.friendly=true;e.first=firstErr;reject(e);
      });
    }
    fetchJSONTimeout("https://api.open-meteo.com/v1/forecast?"+q,FC_SWITCH_MS+5000,ctl)
      .then(function(d){if(!switched)ok(d,"om");})
      .catch(function(e){if(switched)return;firstErr=e;alt();});
  });
}

// Last good Open-Meteo forecasts, kept on this device (most recent FC_STORE_MAX places)
function fcKey(lat,lon){return(+lat).toFixed(2)+","+(+lon).toFixed(2);}
function fcStoreLoad(){try{return JSON.parse(localStorage.getItem("fc_store")||"[]");}catch(e){return[];}}
function fcStoreSave(lat,lon,d){
  try{
    var k=fcKey(lat,lon),list=fcStoreLoad().filter(function(x){return x.k!==k;});
    list.unshift({k:k,lat:+lat,lon:+lon,t:Date.now(),d:d});
    list=list.slice(0,FC_STORE_MAX);
    try{localStorage.setItem("fc_store",JSON.stringify(list));}
    catch(e){localStorage.setItem("fc_store",JSON.stringify(list.slice(0,1)));}
  }catch(e){}
}
// Nearest saved forecast within 20 km, at most FC_STORE_DAYS old
function fcStoreFind(lat,lon){
  var best=null;
  fcStoreLoad().forEach(function(x){
    var km=haversineKm(lat,lon,x.lat,x.lon);
    if(km<=20&&Date.now()-x.t<FC_STORE_DAYS*864e5&&(!best||x.t>best.t))best=x;
  });
  return best;
}
// Saved forecast as a stand-in: "current" is taken from its hour that matches now
function fcStoreGet(lat,lon){
  var x=fcStoreFind(lat,lon);if(!x)return null;
  var d=x.d,i=fcNowIdx(d);if(i<0)return null;
  var H=d.hourly;
  d.current={time:H.time[i],temperature_2m:H.temperature_2m[i],relative_humidity_2m:H.relative_humidity_2m[i],dew_point_2m:H.dew_point_2m[i],
    wind_speed_10m:H.wind_speed_10m[i],wind_gusts_10m:H.wind_gusts_10m[i],weather_code:H.weather_code[i]};
  d._src="stored";d._storedAt=x.t;fcFixSnow(d);
  return d;
}

// ── MET Norway → Open-Meteo shape ──
// MET gives UTC times, hourly for the first ~2–3 days then 6-hourly, and no CAPE or lifted
// index. 6-hourly stretches are filled in hour by hour (straight-line between steps, rain
// spread evenly). The time zone comes from a saved forecast for this place if there is one,
// else this device's own zone if it's plausibly the same, else a fixed offset from longitude.
var MET_WMO={clearsky:0,fair:1,partlycloudy:2,cloudy:3,fog:45,
  lightrain:61,rain:63,heavyrain:65,lightrainshowers:80,rainshowers:81,heavyrainshowers:82,
  lightsleet:61,sleet:63,heavysleet:65,lightsleetshowers:80,sleetshowers:81,heavysleetshowers:82,
  lightsnow:71,snow:73,heavysnow:75,lightsnowshowers:85,snowshowers:85,heavysnowshowers:86};
function metCode(sym){
  if(!sym)return null;
  sym=sym.replace(/_(day|night|polartwilight)$/,"");
  if(sym.indexOf("thunder")>-1)return sym.indexOf("heavy")===0?99:95;
  return MET_WMO[sym]!==undefined?MET_WMO[sym]:null;
}
function fcGuessTZ(lat,lon){
  try{
    var my=Intl.DateTimeFormat().resolvedOptions().timeZone;
    if(my&&Math.abs(getTZOffsetMin(my)/60-lon/15)<=2)return my;
  }catch(e){}
  var h=Math.max(-12,Math.min(14,Math.round(lon/15)));
  return h===0?"UTC":"Etc/GMT"+(h>0?"-":"+")+Math.abs(h);
}
function fcLocalStr(ms,offMin){return new Date(ms+offMin*60000).toISOString().slice(0,16);}
// Hourly rows sit on the local hour, as Open-Meteo's do (matters in half-hour zones like Adelaide)
function fcLocalHourStr(ms,offMin){return fcLocalStr(ms,offMin).slice(0,13)+":00";}
// Sunrise/sunset (NOAA-style approximation), as local "YYYY-MM-DDTHH:MM" strings
function sunTimesLocal(lat,lon,dateStr,offMin){
  var rad=Math.PI/180,p=dateStr.split("-");
  var J=Date.UTC(+p[0],+p[1]-1,+p[2],12)/864e5+2440587.5-offMin/1440;
  var n=Math.round(J-2451545.0+0.0008),Js=n-lon/360;
  var M=(357.5291+0.98560028*Js)%360,Mr=M*rad;
  var C=1.9148*Math.sin(Mr)+0.02*Math.sin(2*Mr)+0.0003*Math.sin(3*Mr);
  var L=((M+C+180+102.9372)%360)*rad;
  var Jt=2451545+Js+0.0053*Math.sin(Mr)-0.0069*Math.sin(2*L);
  var dec=Math.asin(Math.sin(L)*Math.sin(23.44*rad));
  var cw=(Math.sin(-0.833*rad)-Math.sin(lat*rad)*Math.sin(dec))/(Math.cos(lat*rad)*Math.cos(dec));
  if(cw>1)return[dateStr+"T12:00",dateStr+"T12:00"];   // polar night
  if(cw<-1)return[dateStr+"T00:00",dateStr+"T23:59"];  // midnight sun
  var w=Math.acos(cw)/rad/360,toMs=function(j){return(j-2440587.5)*864e5;};
  return[fcLocalStr(toMs(Jt-w),offMin),fcLocalStr(toMs(Jt+w),offMin)];
}
function metToOm(m,lat,lon){
  var ts=m.properties.timeseries,saved=fcStoreFind(lat,lon);
  var tz=saved?saved.d.timezone:fcGuessTZ(lat,lon),off=Math.round(getTZOffsetMin(tz));
  var KEYS=FC_HOURLY.split(","),H={time:[]};KEYS.forEach(function(k){H[k]=[];});
  var rows={}; // UTC hour (ms) → row
  function row(ms){return rows[ms]||(rows[ms]={});}
  function inst(e){
    var x=e.data.instant.details,c=x.cloud_area_fraction;
    var uv=x.ultraviolet_index_clear_sky!=null?x.ultraviolet_index_clear_sky*(c!=null?1-0.75*Math.pow(c/100,3.4):1):null;
    return{t:x.air_temperature,rh:x.relative_humidity,dp:x.dew_point_temperature,
      w:x.wind_speed!=null?x.wind_speed*3.6:null,g:x.wind_speed_of_gust!=null?x.wind_speed_of_gust*3.6:null,uv:uv};
  }
  for(var i=0;i<ts.length;i++){
    var e=ts[i],t0=Date.parse(e.time),a=inst(e),r=row(t0);
    r.t=a.t;r.rh=a.rh;r.dp=a.dp;r.w=a.w;r.g=a.g;r.uv=a.uv;
    var nx=ts[i+1],t1=nx?Date.parse(nx.time):null,step=t1?(t1-t0)/36e5:0;
    // Open-Meteo's hourly rain and weather are for the hour just ended, so MET's
    // "next hour" lands on the following hour's row
    if(e.data.next_1_hours&&step<=1){
      var r1=row(t0+36e5);r1.p=e.data.next_1_hours.details.precipitation_amount;r1.c=metCode(e.data.next_1_hours.summary.symbol_code);
      if(i===0){r.p=0;r.c=r1.c;}
    }else if(nx&&step>1){
      var n6=e.data.next_6_hours||e.data.next_12_hours,b=inst(nx);
      var pr=n6&&n6.details&&n6.details.precipitation_amount!=null?n6.details.precipitation_amount/step:0;
      var cd=n6&&n6.summary?metCode(n6.summary.symbol_code):null;
      for(var k=1;k<=step;k++){
        var f=k/step,rk=row(t0+k*36e5),lerp=function(u,v){return u==null||v==null?(k<step?u:v):u+(v-u)*f;};
        if(k<step){rk.t=lerp(a.t,b.t);rk.rh=lerp(a.rh,b.rh);rk.dp=lerp(a.dp,b.dp);rk.w=lerp(a.w,b.w);rk.g=lerp(a.g,b.g);rk.uv=lerp(a.uv,b.uv);}
        rk.p=pr;rk.c=cd;
        if(i===0&&k===1&&r.c==null){r.p=0;r.c=cd;}
      }
    }
  }
  var times=Object.keys(rows).map(Number).sort(function(x,y){return x-y;}).filter(function(ms){return rows[ms].t!=null;});
  var r1d=function(v){return v==null?null:Math.round(v*10)/10;};
  // Earlier hours (including the past days the heat and cold checks need) from a saved
  // Open-Meteo forecast for this place, when there is one
  var firstStr=fcLocalHourStr(times[0],off);
  if(saved){
    var S=saved.d.hourly;
    for(var j=0;j<S.time.length&&S.time[j]<firstStr;j++){
      H.time.push(S.time[j]);KEYS.forEach(function(k){H[k].push(S[k]?S[k][j]:null);});
    }
  }
  times.forEach(function(ms){
    var r=rows[ms];
    H.time.push(fcLocalHourStr(ms,off));
    H.temperature_2m.push(r1d(r.t));H.relative_humidity_2m.push(r.rh==null?null:Math.round(r.rh));H.dew_point_2m.push(r1d(r.dp));
    H.wind_speed_10m.push(r1d(r.w));H.wind_gusts_10m.push(r1d(r.g));H.precipitation.push(r.p==null?0:Math.round(r.p*10)/10);
    H.weather_code.push(r.c);H.uv_index.push(r.uv==null?null:Math.round(r.uv*10)/10);H.cape.push(null);H.lifted_index.push(null);
  });
  // Daily summaries from the hourly rows
  var D={time:[]};FC_DAILY.split(",").forEach(function(k){D[k]=[];});
  var by={};
  H.time.forEach(function(s,ix){var day=s.slice(0,10);(by[day]=by[day]||[]).push(ix);});
  var days=Object.keys(by).sort();
  days.forEach(function(day,di){
    var ix=by[day];if(di===days.length-1&&ix.length<12)return; // drop a short last day
    var v=function(k){return ix.map(function(q){return H[k][q];}).filter(function(x){return x!=null;});};
    var mx=function(a){return a.length?Math.max.apply(null,a):null;},mn=function(a){return a.length?Math.min.apply(null,a):null;};
    var pr=v("precipitation"),snow=0;
    ix.forEach(function(q){var c=H.weather_code[q],tt=H.temperature_2m[q];if((c>=71&&c<=77)||c===85||c===86||(H.precipitation[q]>0&&tt!=null&&tt<=0.5))snow+=(H.precipitation[q]||0)*0.7;});
    var st=sunTimesLocal(lat,lon,day,off);
    D.time.push(day);D.sunrise.push(st[0]);D.sunset.push(st[1]);
    D.weather_code.push(mx(v("weather_code")));
    D.precipitation_sum.push(Math.round(pr.reduce(function(s,x){return s+x;},0)*10)/10);
    D.precipitation_hours.push(pr.filter(function(x){return x>=0.1;}).length);
    D.snowfall_sum.push(Math.round(snow*10)/10);
    D.wind_speed_10m_max.push(mx(v("wind_speed_10m")));
    D.temperature_2m_max.push(mx(v("temperature_2m")));D.temperature_2m_min.push(mn(v("temperature_2m")));
  });
  var d={latitude:lat,longitude:lon,elevation:m.geometry&&m.geometry.coordinates?m.geometry.coordinates[2]:(saved?saved.d.elevation:null),
    timezone:tz,utc_offset_seconds:off*60,hourly:H,daily:D};
  var ni=fcNowIdx(d);if(ni<0)ni=H.time.indexOf(firstStr);
  d.current={time:H.time[ni],temperature_2m:H.temperature_2m[ni],relative_humidity_2m:H.relative_humidity_2m[ni],dew_point_2m:H.dew_point_2m[ni],
    wind_speed_10m:H.wind_speed_10m[ni],wind_gusts_10m:H.wind_gusts_10m[ni],weather_code:H.weather_code[ni],precipitation:H.precipitation[ni]};
  d._metPastDays=!!saved;
  return d;
}
// Line under the location saying where the forecast came from, when it isn't Open-Meteo
function fcSourceNote(d,station){
  if(!d||d._src==="om"||d._src==="om-proxy")return"";
  if(d._src==="met")return"Open-Meteo isn’t responding — forecast from <a href='https://www.met.no/en' target='_blank' rel='noopener'>MET Norway</a> (<a href='https://creativecommons.org/licenses/by/4.0/' target='_blank' rel='noopener'>CC BY 4.0</a>), converted for this app. Storm ratings use weather codes only"+(d._metPastDays?".":"; heatwave and coldwave checks need recent days and are off until Open-Meteo is back.");
  if(d._src==="stored"){
    var h=(Date.now()-d._storedAt)/36e5;
    return"Open-Meteo and the backup aren’t responding — showing the forecast saved "+(h<1?"under an hour":h<48?Math.round(h)+" hours":Math.round(h/24)+" days")+" ago."+(station?"":" Current conditions are that forecast’s figures for this hour.");
  }
  return"";
}
function fetchWeather(lat,lon,label){fetchWeatherWithCb(lat,lon,label,null);}
// elevHint: the place's height when already known (Climate Explorer pins). The climate card
// is drawn straight away from it (or from distance alone), without waiting for the forecast;
// with no hint it's redrawn with the forecast's height once that arrives.
function fetchWeatherWithCb(lat,lon,label,cb,elevHint){
  goLive();
  document.getElementById("live-status").textContent="Fetching weather...";
  window._currentLat=lat;window._currentLon=lon;window._currentLabel=label;window._currentWU=null;
  window._currentElev=elevHint!=null?elevHint:null;
  window._renderedFor=null;gdacsCheck(lat,lon);
  showClimCard(lat,lon,window._currentElev);
  var aqUrl="https://air-quality-api.open-meteo.com/v1/air-quality?latitude="+lat+"&longitude="+lon+"&hourly=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,dust,grass_pollen&timezone=auto&forecast_days=5";
  // Fetch weather and AQ in parallel; wait for both before rendering (AQ gives up after 20 s)
  window._AQ=null;
  var same=function(){return window._currentLat===lat&&window._currentLon===lon&&!window._currentWU;};
  var weatherPromise=getForecast(lat,lon,"temperature_2m,relative_humidity_2m,dew_point_2m,wind_speed_10m,wind_gusts_10m,weather_code",
    function(msg){if(same())document.getElementById("live-status").textContent=msg;});
  var aqPromise=fetchJSONTimeout(aqUrl,FC_SWITCH_MS).catch(function(){return null;});
  Promise.all([weatherPromise,aqPromise]).then(function(results){
    var d=results[0],aq=results[1];
    if(!same())return; // another place was loaded while this one was slow
    window._AQ=aq;
    var cur=d.current,temp=cur.temperature_2m,effDP=cur.dew_point_2m,rh=cur.relative_humidity_2m,wind=cur.wind_speed_10m,wxCode=cur.weather_code;
    var rain=hourRainNow(d);
    var res=calc(temp,effDP,wind,rain,placeMinNow(d));
    window._LW={temp:temp,effDP:effDP,rh:rh,wind:wind,gust:cur.wind_gusts_10m,rain:rain,res:res,wxCode:wxCode};
    document.getElementById("live-status").textContent="";
    document.getElementById("live-result").style.display="block";
    document.getElementById("live-locname").textContent=label;
    document.getElementById("utility-row").style.display="block";
    if(elevHint==null)window._currentElev=d.elevation;
    if(elevHint==null)showClimCard(lat,lon,d.elevation);
    var elevStr=d.elevation!=null?" · "+Math.round(d.elevation)+"m ASL":"";
    document.getElementById("live-obstime").textContent=(d._src==="stored"?"Saved forecast for ":d._src==="met"?"Forecast for ":"Observed ")+fmtObsTime(cur.time,d.timezone)+elevStr;
    var srcEl=document.getElementById("live-src"),srcNote=fcSourceNote(d);
    srcEl.innerHTML=srcNote;srcEl.style.display=srcNote?"block":"none";
    // renderScore's live-screen pills (UV, AQI, fire danger, heatwave) are gated
    // on window._FC, which renderForecast sets. Assigning it here instead means
    // renderScore sees THIS location's forecast rather than nothing on first
    // load and the previous location's on every load after.
    window._FC=d;
    window._renderedFor=lat+","+lon;
    renderChips(temp,effDP,rh,wind,d);
    renderScore("live-score-area","gauge-live",res,temp,effDP,wind,wxCode,rain);
    renderForecast(d);
    updateHomeBtn();
    if(cb)cb();
  }).catch(function(e){if(same())document.getElementById("live-status").textContent=(e.friendly?"":"Fetch failed: ")+e.message;if(cb)cb();});
}

// ── Weather Underground ────────────────────────────────────────────────────
function fetchWU(stationId,apiKey,label,cb){
  var sid=stationId||document.getElementById("wu-station-id").value.trim();
  var key=apiKey||localStorage.getItem("wu_api_key")||document.getElementById("wu-api-key").value.trim();
  var lbl=label||("WU: "+sid);
  if(!sid){showStatusWU("Enter a station ID.");return;}
  if(!key){showStatusWU("Enter your WU API key above.");return;}
  showStatusWU("Fetching from "+sid+"...");
  document.getElementById("live-status").textContent="Fetching station "+sid+"...";
  fetch("https://api.weather.com/v2/pws/observations/current?stationId="+encodeURIComponent(sid)+"&format=json&units=m&apiKey="+encodeURIComponent(key))
  .then(function(r){if(!r.ok)throw new Error("HTTP "+r.status);return r.json();})
  .then(function(d){
    if(!d.observations||!d.observations.length)throw new Error("No data returned");
    var obs=d.observations[0],m=obs.metric,temp=m.temp,rh=obs.humidity,wind=m.windSpeed,dew=m.dewpt;
    var rain=m.precipRate!=null?m.precipRate:null;
    var res=calc(temp,dew,wind,rain,placeMinNow(false));
    window._LW={temp:temp,effDP:dew,rh:rh,wind:wind,gust:m.windGust,rain:rain,res:res,wxCode:null};
    window._currentLat=obs.lat;window._currentLon=obs.lon;window._currentLabel=lbl;
    window._currentWU={stationId:sid,apiKey:key,label:lbl};window._FC=null;
    document.getElementById("live-src").style.display="none";
    document.getElementById("live-status").textContent="";
    document.getElementById("wu-status").textContent="";document.getElementById("wu-status").style.display="none";
    document.getElementById("live-result").style.display="block";
    document.getElementById("live-locname").textContent=lbl;
    document.getElementById("utility-row").style.display="block";
    window._currentElev=m.elev!=null?m.elev:null;
    showClimCard(obs.lat||0,obs.lon||0,window._currentElev);
    var obsTime=obs.obsTimeLocal||obs.obsTimeUtc||"";
    document.getElementById("live-obstime").textContent=obsTime?"Observed "+obsTime.slice(0,16).replace("T"," "):"";
    renderChips(temp,dew,rh,wind);
    renderScore("live-score-area","gauge-live",res,temp,dew,wind,null,rain);
    document.getElementById("forecast-wrap").style.display="none";
    if(obs.lat&&obs.lon)fetchForecastOnly(obs.lat,obs.lon);
    if(cb)cb();
  }).catch(function(e){var msg="WU fetch failed: "+e.message;document.getElementById("live-status").textContent=msg;showStatusWU(msg);if(cb)cb();});
}
// Forecast for a Weather Underground station: the station gives current conditions, the
// forecast comes from getForecast() (same fallbacks), with its progress on the status line.
function fetchForecastOnly(lat,lon){
  var wu=window._currentWU,st=document.getElementById("live-status");
  var same=function(){return window._currentWU===wu;};
  st.textContent="Station readings shown \u2014 fetching the forecast\u2026";
  var aqUrl="https://air-quality-api.open-meteo.com/v1/air-quality?latitude="+lat+"&longitude="+lon+"&hourly=us_aqi,pm2_5,pm10,ozone,nitrogen_dioxide,sulphur_dioxide,dust,grass_pollen&timezone=auto&forecast_days=5";
  window._AQ=null;
  var fcPromise=getForecast(lat,lon,"weather_code",function(msg){
    if(same())st.textContent="Station readings shown \u2014 "+msg.replace("Fetching weather","fetching the forecast");
  });
  var aqPromise=fetchJSONTimeout(aqUrl,FC_SWITCH_MS).catch(function(){return null;});
  Promise.all([fcPromise,aqPromise]).then(function(results){
    var d=results[0],aq=results[1];
    if(!same())return; // another place or station was loaded meanwhile
    st.textContent="";
    var srcEl=document.getElementById("live-src"),srcNote=fcSourceNote(d,true);
    srcEl.innerHTML=srcNote;srcEl.style.display=srcNote?"block":"none";
    window._AQ=aq;
    if(d.current&&d.current.weather_code!==undefined&&window._LW){
      window._LW.wxCode=d.current.weather_code;
    }
    window._renderedFor=window._currentLat+","+window._currentLon;
    gdacsCheck(window._currentLat,window._currentLon);
    renderForecast(d); // sets window._FC first
    if(window._LW){
      var w=window._LW,res=calc(w.temp,w.effDP,w.wind,w.rain,placeMinNow(d));
      // Re-render live score after _FC and _AQ are both set
      renderScore("live-score-area","gauge-live",res,w.temp,w.effDP,w.wind,w.wxCode!==undefined?w.wxCode:null,w.rain);
    }
  }).catch(function(){
    if(same())st.textContent="Station readings shown, but the forecast couldn\u2019t load \u2014 Open-Meteo isn\u2019t responding and the backup source failed too. Try again in a few minutes.";
  });
}
function showStatusWU(msg){var el=document.getElementById("wu-status");el.textContent=msg;el.style.display=msg?"":"none";}

// ── Stars ──────────────────────────────────────────────────────────────────
function loadStars(){return JSON.parse(localStorage.getItem("comfort_stars")||"[]");}
function saveStars(s){localStorage.setItem("comfort_stars",JSON.stringify(s));}
function openStars(){document.getElementById("star-save-row").style.display="none";renderStarsList();document.getElementById("stars-ov").classList.add("open");}
function closeStars(){document.getElementById("stars-ov").classList.remove("open");}
function renderStarsList(){
  var stars=loadStars(),html="";
  // Default location row at top
  var def=localStorage.getItem("default_loc");
  if(def){
    try{
      var defObj=JSON.parse(def);
      var defName=defObj.label||defObj.name||"Unknown";
      var defSub=defObj.type==="wunderground"?"WU station: "+defObj.stationId:"Saved location";
      html+="<div class='star-item' style='border-color:rgba(42,159,214,0.4);background:rgba(42,159,214,0.06)'>"
        +"<div style='flex:1' onclick='loadDefault()'>"
        +"<div id='def-name-display' class='star-item-name' style='color:#2a9fd6'>\u2302 "+defName+"</div>"
        +"<div class='star-item-type'>Default · "+defSub+"</div>"
        +"<input id='def-name-input' class='star-item-input' style='display:none' value='"+defName.replace(/'/g,"&#39;")+"' onkeydown='if(event.key===\"Enter\")saveDefaultName()'/>"
        +"</div>"
        +"<button class='star-item-edit' title='Edit name' onclick='toggleEditDefault()'>&#9998;</button>"
        +"<button class='star-item-del' title='Clear default' onclick='clearDefaultLoc()'>&#10005;</button>"
        +"</div>";
    }catch(e){}
  }
  if(!stars.length){html+="<div class='star-empty'>No saved locations yet.<br/>Search or detect a location then tap \u2605 to save it.</div>";}
  else{
    for(var i=0;i<stars.length;i++){
      var s=stars[i],sub=s.type==="wunderground"?"WU station: "+s.stationId:"";
      html+="<div class='star-item'>"
        +"<div style='flex:1' onclick='loadStar("+i+")'>"
        +"<div id='star-name-display-"+i+"' class='star-item-name'>\u2605 "+s.name+"</div>"
        +(sub?"<div class='star-item-type'>"+sub+"</div>":"")
        +"<input id='star-name-input-"+i+"' class='star-item-input' style='display:none' value='"+s.name.replace(/'/g,"&#39;")+"' onkeydown='if(event.key===\"Enter\")saveStar("+i+")'/>"
        +"</div>"
        +"<button class='star-item-edit' title='Edit name' onclick='toggleEditStar(event,"+i+")'>&#9998;</button>"
        +"<button class='star-item-del' onclick='deleteStar(event,"+i+")'>&#10005;</button>"
        +"</div>";
    }
  }
  document.getElementById("stars-list").innerHTML=html;
}
function toggleEditStar(e,i){
  e.stopPropagation();
  var disp=document.getElementById("star-name-display-"+i);
  var inp=document.getElementById("star-name-input-"+i);
  if(inp.style.display==="none"){
    disp.style.display="none";inp.style.display="block";inp.focus();inp.select();
  } else {
    saveStar(i);
  }
}
function saveStar(i){
  var inp=document.getElementById("star-name-input-"+i);
  if(!inp)return;
  var name=inp.value.trim();
  if(!name)return;
  var stars=loadStars();
  stars[i].name=name;
  saveStars(stars);
  renderStarsList();
}
function toggleEditDefault(){
  var disp=document.getElementById("def-name-display");
  var inp=document.getElementById("def-name-input");
  if(!disp||!inp)return;
  if(inp.style.display==="none"){
    disp.style.display="none";inp.style.display="block";inp.focus();inp.select();
  } else {
    saveDefaultName();
  }
}
function saveDefaultName(){
  var inp=document.getElementById("def-name-input");
  if(!inp)return;
  var name=inp.value.trim();
  if(!name)return;
  var def=localStorage.getItem("default_loc");
  if(!def)return;
  try{
    var d=JSON.parse(def);
    d.label=name;
    localStorage.setItem("default_loc",JSON.stringify(d));
    renderStarsList();
    showToast("Default location renamed");
  }catch(e){}
}
function loadStar(i){var s=loadStars()[i];closeStars();if(s.type==="wunderground")fetchWU(s.stationId,s.apiKey,s.name,null);else fetchWeather(s.lat,s.lon,s.name);}
function deleteStar(e,i){e.stopPropagation();var stars=loadStars();stars.splice(i,1);saveStars(stars);renderStarsList();}
function loadDefault(){
  var def=localStorage.getItem("default_loc");
  if(!def)return;
  try{
    var d=JSON.parse(def);
    closeStars();
    if(d.type==="wunderground"){fetchWU(d.stationId,d.apiKey,d.label,null);}
    else{fetchWeather(d.lat,d.lon,d.label);}
  }catch(e){}
}
function clearDefaultLoc(){
  localStorage.removeItem("default_loc");
  updateHomeBtn();
  renderStarsList();
  showToast("Default location cleared");
}
function toggleDefaultLoc(){
  if(!window._currentLat&&!window._currentWU)return;
  var existing=localStorage.getItem("default_loc");
  var current;
  if(window._currentWU){
    current=JSON.stringify({type:"wunderground",stationId:window._currentWU.stationId,apiKey:window._currentWU.apiKey,label:window._currentWU.label,lat:window._currentLat,lon:window._currentLon});
  } else {
    current=JSON.stringify({type:"location",lat:window._currentLat,lon:window._currentLon,label:window._currentLabel});
  }
  if(existing===current){
    localStorage.removeItem("default_loc");
    updateHomeBtn();
    renderStarsList();
    showToast("Default location cleared");
  } else {
    localStorage.setItem("default_loc",current);
    updateHomeBtn();
    renderStarsList();
    var name=(window._currentWU?window._currentWU.label:window._currentLabel)||"";
    showToast("\u2302 Default set to "+name.split(",")[0]);
  }
}
function updateHomeBtn(){
  // Setting or clearing home changes the "compared with home" line on the current location
  if(window._climCur!==undefined)renderHomeCompare(window._climCur);
  var btn=document.getElementById("loc-home-btn");
  if(!btn)return;
  var existing=localStorage.getItem("default_loc");
  if(!existing){btn.classList.remove("is-default");return;}
  try{
    var def=JSON.parse(existing);
    var match=false;
    if(def.type==="wunderground"&&window._currentWU&&def.stationId===window._currentWU.stationId)match=true;
    if(def.type==="location"&&window._currentLat&&Math.abs(def.lat-window._currentLat)<0.001&&Math.abs(def.lon-window._currentLon)<0.001)match=true;
    if(match)btn.classList.add("is-default");else btn.classList.remove("is-default");
  }catch(e){btn.classList.remove("is-default");}
}
function showToast(msg){
  var t=document.getElementById("toast");
  if(!t){t=document.createElement("div");t.id="toast";t.style.cssText="position:fixed;bottom:24px;left:50%;transform:translateX(-50%);background:rgba(20,40,60,0.92);color:#c8e8f0;font-size:13px;font-weight:700;padding:8px 18px;border-radius:20px;z-index:9999;pointer-events:none;transition:opacity 0.3s";document.body.appendChild(t);}
  t.textContent=msg;t.style.opacity="1";
  clearTimeout(window._toastTimer);
  window._toastTimer=setTimeout(function(){t.style.opacity="0";},2200);
}
function promptSaveLoc(){if(!window._currentLabel)return;document.getElementById("star-name-input").value=window._currentLabel.split(",")[0];document.getElementById("star-save-row").style.display="block";renderStarsList();document.getElementById("stars-ov").classList.add("open");setTimeout(function(){document.getElementById("star-name-input").focus();},100);}
function cancelSaveLoc(){document.getElementById("star-save-row").style.display="none";}
function confirmSaveLoc(){var name=document.getElementById("star-name-input").value.trim();if(!name)return;var stars=loadStars(),entry;if(window._currentWU){entry={type:"wunderground",name:name,stationId:window._currentWU.stationId,apiKey:window._currentWU.apiKey};}else{if(!window._currentLat)return;entry={type:"location",name:name,lat:window._currentLat,lon:window._currentLon};}for(var i=0;i<stars.length;i++){var s=stars[i],dup=false;if(entry.type==="wunderground"&&s.type==="wunderground"&&s.stationId===entry.stationId)dup=true;if(entry.type==="location"&&s.type==="location"&&Math.abs(s.lat-entry.lat)<0.001&&Math.abs(s.lon-entry.lon)<0.001)dup=true;if(dup){stars[i]=entry;saveStars(stars);document.getElementById("star-save-row").style.display="none";renderStarsList();return;}}stars.push(entry);saveStars(stars);document.getElementById("star-save-row").style.display="none";renderStarsList();}

// ── PWA ────────────────────────────────────────────────────────────────────
var deferredPrompt=null;
window.addEventListener("beforeinstallprompt",function(e){e.preventDefault();deferredPrompt=e;document.getElementById("install-banner").classList.add("show");});
function installApp(){if(deferredPrompt){deferredPrompt.prompt();deferredPrompt.userChoice.then(function(){deferredPrompt=null;document.getElementById("install-banner").classList.remove("show");});}}
window.addEventListener("appinstalled",function(){document.getElementById("install-banner").classList.remove("show");});
function initLivPrefs(){loadLivPrefs();}
function clearAndReload(){if("serviceWorker" in navigator){navigator.serviceWorker.getRegistrations().then(function(regs){Promise.all(regs.map(function(r){return r.unregister();})).then(function(){caches.keys().then(function(keys){Promise.all(keys.map(function(k){return caches.delete(k);})).then(function(){window.location.reload(true);});});});});}else{window.location.reload(true);}}
if("serviceWorker" in navigator){
  // When an updated service worker takes over from an older one, reload once so the
  // page runs under the new one (an old worker can't fail a request after the swap).
  var _hadSW=!!navigator.serviceWorker.controller,_swReloaded=false;
  navigator.serviceWorker.addEventListener("controllerchange",function(){if(_hadSW&&!_swReloaded){_swReloaded=true;location.reload();}});
  navigator.serviceWorker.register("sw.js",{updateViaCache:"none"}).then(function(r){r.update();}).catch(function(){});
}

