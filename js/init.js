// Comfort Score · init.js — start-up: runs last
// Loaded by index.html (classic script, deferred, in a fixed order). All names are global.
// ── Init ───────────────────────────────────────────────────────────────────
initRainPref();
buildSettings();
climReady();
syncSlidersFromAdv();
initUnit();
initOnboard();
initLivFeature();
initLivPrefs();
applySliderLock();
initTempPrefs();
viewFromAddress();
(function(){
  var p=new URLSearchParams(window.location.search);
  var lat=parseFloat(p.get('lat')),lon=parseFloat(p.get('lon')),label=p.get('label')||'';
  if(!isNaN(lat)&&!isNaN(lon)){fetchWeather(lat,lon,label||null);return;}
  var def=localStorage.getItem("default_loc");
  if(def){
    try{
      var d=JSON.parse(def);
      if(d.type==="wunderground"){fetchWU(d.stationId,d.apiKey,d.label,null);return;}
      fetchWeather(d.lat,d.lon,d.label);
      return;
    }catch(e){}
  }
  detectLocation();
})();
