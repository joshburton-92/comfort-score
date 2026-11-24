// Comfort Score · climate.js — Climate Explorer, nearest profile, compared with home, compare climates, liveability, climate map, Köppen
// Loaded by index.html (classic script, deferred, in a fixed order). All names are global.
// ── Climatology card ───────────────────────────────────────────────────────
function haversineKm(lat1,lon1,lat2,lon2){
  var R=6371,dLat=(lat2-lat1)*Math.PI/180,dLon=(lon2-lon1)*Math.PI/180;
  var a=Math.sin(dLat/2)*Math.sin(dLat/2)+Math.cos(lat1*Math.PI/180)*Math.cos(lat2*Math.PI/180)*Math.sin(dLon/2)*Math.sin(dLon/2);
  return R*2*Math.atan2(Math.sqrt(a),Math.sqrt(1-a));
}
// ── Nearest relevant climate profile ──────────────────────────────────────
// Candidates are ranked on distance plus height difference (100 m counts as 10 km), and
// the best one within maxKm of that combined figure is used. When it sits at a different
// height, its temperatures are shifted by the standard lapse rate (dew point less), so a
// profile from the plain is cooled for a hill town and vice versa. Rain, snow, sun and
// wind are left as they are. Returns a copy with _src (the cached row), _km and _dz
// (metres higher than the profile; null when the place's height is unknown).
var CLIM_MAX_KM=100;      // Climate Explorer, Liveability, home comparison
var CLIM_HAZARD_KM=50;    // heatwave and coldwave thresholds
var CLIM_EXACT_KM=20,CLIM_EXACT_DZ=100;   // within both: used as is, no "from" note; past 100 m: adjusted and noted
var CLIM_KM_PER_100M=10;
var CLIM_LAPSE=0.0065,CLIM_DP_LAPSE=0.002; // °C per metre
var _climMatchMemo={};
// The climate data (climatology-core.js) loads in the background. Its rows are compact
// arrays; climExpand() rebuilds the {name,…,monthly:[{month,T,tmin,…}]} shape the rest of
// the app reads. climReady() runs when the file arrives (it calls it itself) or at start-up
// if it arrived first, then redraws anything that was drawn without it.
var CLIM_MONTHS=["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];
function climExpand(C){
  var nm=C.mcols.length;
  return C.rows.map(function(r){
    var e={};
    for(var j=0;j<C.cols.length;j++){
      var c=C.cols[j],v=r[j];
      if(c==="region")e.region=C.regions[v];
      else if(c==="notes")e.hasNotes=!!v;
      else if(c==="monthly"){
        e.monthly=[];
        for(var i=0;i<12;i++){var m={month:CLIM_MONTHS[i]};for(var k=0;k<nm;k++)m[C.mcols[k]]=v[i*nm+k];e.monthly.push(m);}
      }
      else e[c]=v;
    }
    return e;
  });
}
function climReady(){
  if(window.CLIM_CORE&&typeof CLIM_CACHE==="undefined"){
    try{window.CLIM_CACHE=climExpand(window.CLIM_CORE);}catch(e){window.CLIM_FAIL=true;}
    _climMatchMemo={};window._WAVEFC=null;window._WAVEDAYS=null;
  }
  if(typeof CLIM_CACHE==="undefined"&&!window.CLIM_FAIL)return;
  if(window._currentLat!=null&&document.getElementById("clim-card").style.display==="block")showClimCard(window._currentLat,window._currentLon);
  if(window._FC&&window._renderedFor){reRenderLive();renderForecast(window._FC);}
  livMapBuildMarkers();
}
// "Learn more" text lives in climatology-notes.json, fetched the first time it's opened
var _climNotesP=null;
function climNotesKey(e){var s=(e&&e._src)||e;return s?s.region+"|"+s.name+"|"+(s.ter||""):"";}
function loadClimNotes(){
  if(!_climNotesP)_climNotesP=fetch("climatology-notes.json").then(function(r){if(!r.ok)throw new Error(r.status);return r.json();})
    .catch(function(e){_climNotesP=null;throw e;});
  return _climNotesP;
}
// adjust: lapse-adjust temperatures for a height difference over CLIM_EXACT_DZ. Only the
// heatwave/coldwave checks ask for it; Climate Explorer shows the borrowed place's own figures.
function findClimEntry(lat,lon,elev,maxKm,adjust){
  if(typeof CLIM_CACHE==="undefined"||lat==null||lon==null)return null;
  maxKm=maxKm||CLIM_MAX_KM;
  var hasZ=elev!=null&&!isNaN(elev);
  var key=lat.toFixed(4)+","+lon.toFixed(4)+","+(hasZ?Math.round(elev):"")+","+maxKm+(adjust?",a":"");
  if(_climMatchMemo.hasOwnProperty(key))return _climMatchMemo[key];
  var best=null,bestScore=Infinity,bestKm=0,bestDz=null;
  for(var i=0;i<CLIM_CACHE.length;i++){
    var e=CLIM_CACHE[i];
    var km=haversineKm(lat,lon,e.lat,e.lon);
    if(km>maxKm)continue;
    var dz=(hasZ&&e.elev!=null&&!isNaN(e.elev))?elev-e.elev:null;
    var sc=km+(dz==null?0:Math.abs(dz)/100*CLIM_KM_PER_100M);
    if(sc<=maxKm&&sc<bestScore){bestScore=sc;best=e;bestKm=km;bestDz=dz;}
  }
  var out=null;
  if(best){
    out={};for(var k in best)out[k]=best[k];
    out._src=best;out._km=bestKm;out._dz=bestDz;
    if(adjust&&bestDz!=null&&Math.abs(bestDz)>CLIM_EXACT_DZ){
      var sh=-CLIM_LAPSE*bestDz,shd=-CLIM_DP_LAPSE*bestDz,r1=function(v){return v==null?v:Math.round(v*10)/10;};
      out.monthly=best.monthly.map(function(m){
        var c={};for(var f in m)c[f]=m[f];
        ["T","tmin","tmaxMax","tminMin"].forEach(function(f){if(c[f]!=null)c[f]=r1(c[f]+sh);});
        if(c.dp!=null)c.dp=r1(Math.min(c.dp+shd,c.tmin!=null?c.tmin+2:Infinity));
        return c;
      });
      out._adj=true;
    }
  }
  _climMatchMemo[key]=out;
  return out;
}
function climIsExact(e){return !e||!e._src||(e._km<=CLIM_EXACT_KM&&(e._dz==null||Math.abs(e._dz)<=CLIM_EXACT_DZ));}
// "Climate from Mount Barker, 23 km away, 120 m lower · temperatures adjusted for height"
function climFromNote(e){
  if(climIsExact(e))return"";
  var bits=[Math.round(e._km)+" km away"];
  if(e._dz!=null&&Math.abs(e._dz)>=20)bits.push(Math.round(Math.abs(e._dz)/10)*10+" m "+(e._dz>0?"lower":"higher"));
  return"Climate from "+e.name+(e.ter?", "+e.ter:"")+", "+bits.join(", ")+(e._adj?" \u00B7 temperatures adjusted for height":"");
}
// ── Compared with home ─────────────────────────────────────────────────────
// Neutral climate similarity between the viewed location and the default ("home") location.
// Both must have a CLIM_CACHE row. Seasons are aligned across hemispheres (Adelaide's
// January is compared with London's July). Each difference is scaled to one "noticeable
// step" — 3° for temperature/dew point, 1.5x for rainfall, 15% for rain seasonality,
// 400 hrs for sunshine — then weighted into a 0–100 score.
var HOME_TWIN_MIN_KM=5000;   // "Places most like home" only lists places at least this far away
var HOME_TWIN_COUNT=5;
var SIM_W={summer:1.0,winter:1.0,dp:0.9,rain:0.8,season:0.6,sun:0.4,snow:0.5};
function getHome(){
  var d=null;
  try{d=JSON.parse(localStorage.getItem("default_loc")||"null");}catch(e){}
  if(!d||d.lat==null||d.lon==null)return null;
  var e=findClimEntry(d.lat,d.lon);
  return e?{entry:e,label:(d.label||e.name).split(",")[0]}:null;
}
function simProfile(e){
  var m=e&&e.monthly;
  if(!m||m.length<12)return null;
  if(e.lat<0)m=m.slice(6).concat(m.slice(0,6));
  var rain=0,warm=0,snow=0,su=-99,wi=99,dp=-99;
  for(var i=0;i<12;i++){
    var x=m[i];
    if(x.T==null||x.tmin==null||x.dp==null||x.rain==null)return null;
    rain+=x.rain;snow+=x.snow||0;if(i>=3&&i<=8)warm+=x.rain;
    su=Math.max(su,x.T);wi=Math.min(wi,x.tmin);dp=Math.max(dp,x.dp);
  }
  return{summer:su,winter:wi,dp:dp,rain:rain,season:rain>0?warm/rain:0.5,sun:e.sun||0,snow:snow};
}
function simDiffs(h,o){
  return{
    summer:(o.summer-h.summer)/3,
    winter:(o.winter-h.winter)/3,
    dp:(o.dp-h.dp)/3,
    rain:Math.log(Math.max(o.rain,50)/Math.max(h.rain,50))/Math.log(1.5),
    season:(o.season-h.season)/0.15,
    sun:(o.sun&&h.sun)?(o.sun-h.sun)/400:0,
    snow:(Math.log(1+o.snow)-Math.log(1+h.snow))/1.2
  };
}
function simScore(d){
  var s=0,w=0;
  for(var k in SIM_W){s+=SIM_W[k]*d[k]*d[k];w+=SIM_W[k];}
  return Math.round(100*Math.exp(-Math.sqrt(s/w)/1.6));
}
function simBand(s){return s>=90?"Almost identical":s>=75?"Very similar":s>=60?"Similar":s>=40?"Noticeably different":s>=20?"Very different":"A world apart";}
function simDetail(h,o,d){
  var words={summer:["hotter summers","milder summers"],winter:["milder winters","colder winters"],dp:["more humid","less humid"],
    rain:["wetter","drier"],season:["more summer rain","more winter rain"],sun:["sunnier","cloudier"],snow:["snowier","less snow"]};
  var list=[];
  for(var k in d)if(Math.abs(d[k])>=0.7)list.push({k:k,v:d[k],w:SIM_W[k]*Math.abs(d[k])});
  list.sort(function(a,b){return b.w-a.w;});
  return list.slice(0,3).map(function(x){
    var w=words[x.k][x.v>0?0:1];
    var deg=Math.round(x.v*3*(useFahrenheit?1.8:1)),sg=deg>0?"+":deg<0?"\u2212":"";
    if(x.k==="summer"||x.k==="winter")return w+" ("+sg+Math.abs(deg)+unitSym()+")";
    if(x.k==="dp")return w+" (dew point "+sg+Math.abs(deg)+unitSym()+")";
    if(x.k==="rain")return w+" ("+(o.rain/Math.max(h.rain,1)).toFixed(1)+"\u00D7 the rain)";
    return w;
  });
}
function renderHomeCompare(entry){
  window._climCur=entry||null;
  renderClimCompare();
  var el=document.getElementById("clim-home-cmp");
  if(!el)return;
  var ep=entry?simProfile(entry):null;
  if(!ep){el.style.display="none";el.innerHTML="";return;}
  var home=getHome(),hp=home?simProfile(home.entry):null;
  var isHome=!!(hp&&(entry._src||entry)===(home.entry._src||home.entry)),html="";
  // Away from home: one line on how this climate compares with home
  if(hp&&!isHome){
    var d=simDiffs(hp,ep),s=simScore(d),det=simDetail(hp,ep,d);
    html+="<div><span style='font-weight:800;color:var(--text-head)'>"+simBand(s)+"</span> "+(s<20?"from":"to")
      +" your home climate ("+home.label+")"+(det.length?" \u2014 "+det.join(", "):" \u2014 hard to tell apart")+"</div>";
  }
  // Every location: the most similar climates a long way away, in a dropdown
  var list=[];
  for(var i=0;i<CLIM_CACHE.length;i++){
    var e=CLIM_CACHE[i];
    if(e===(entry._src||entry))continue;
    var km=haversineKm(entry.lat,entry.lon,e.lat,e.lon);
    if(km<HOME_TWIN_MIN_KM)continue;
    var p=simProfile(e);
    if(!p)continue;
    list.push({i:i,s:simScore(simDiffs(ep,p)),km:km});
  }
  list.sort(function(a,b){return b.s-a.s;});
  if(list.length){
    html+="<details class='hiw-sec sim-dd'"+(window._simOpen?" open":"")+" ontoggle='window._simOpen=this.open'>"
      +"<summary>\uD83C\uDF0D "+(isHome?"Places most like home":"Similar locations")+"</summary><div style='padding-bottom:4px'>";
    list.slice(0,HOME_TWIN_COUNT).forEach(function(t){
      var e=CLIM_CACHE[t.i];
      html+="<div onclick='homeTwinLoad("+t.i+")' style='cursor:pointer;display:flex;gap:8px;align-items:baseline;padding:3px 0'>"
        +"<span style='font-weight:800;min-width:24px;text-align:right;color:"+climScoreCol(t.s)+"'>"+t.s+"</span>"
        +"<span style='flex:1;color:var(--text)'>"+e.name+(e.ter?", "+e.ter:"")+"</span>"
        +"<span style='font-size:10px;color:var(--text-muted)'>"+Math.round(t.km/100)*100+" km</span></div>";
    });
    html+="</div></details>";
  }
  if(!html){el.style.display="none";el.innerHTML="";return;}
  el.innerHTML=html;el.style.display="block";
}
// ── Compare climates ───────────────────────────────────────────────────────
// The place shown in the explorer (A) against any other place with a climate profile (B).
// Charts overlay the two month by month. In opposite hemispheres, "Season" shifts B by six
// months so summer sits under summer, the same alignment the similarity score uses.
var _cmpB=null,_cmpAlign="month",_cmpSel=-1,_cmpCharts=[];
function cmpA(){var e=window._climCur;return e?(e._src||e):null;}
function cmpName(e){return e.name+(e.ter?", "+e.ter:"");}
function cmpEsc(t){return String(t).replace(/&/g,"&amp;").replace(/</g,"&lt;").replace(/>/g,"&gt;");}
function cmpCloseSugg(){var b=document.getElementById("cmp-sugg");if(b){b.style.display="none";b.innerHTML="";}_cmpSel=-1;}
function cmpSuggest(){
  var inp=document.getElementById("cmp-input"),box=document.getElementById("cmp-sugg");
  var q=inp.value.trim().toLowerCase();
  if(q.length<2||typeof CLIM_CACHE==="undefined"){cmpCloseSugg();return;}
  var A=cmpA(),res=[];
  for(var i=0;i<CLIM_CACHE.length;i++){
    var e=CLIM_CACHE[i];if(e===A)continue;
    var nm=cmpName(e).toLowerCase(),at=nm.indexOf(q);
    if(at<0)continue;
    res.push({i:i,r:at===0?0:(/[ ,(-]/.test(nm.charAt(at-1))?1:2),nm:nm});
  }
  res.sort(function(a,b){return a.r-b.r||a.nm.localeCompare(b.nm);});
  res=res.slice(0,8);_cmpSel=-1;
  box.innerHTML=res.length?res.map(function(x){var e=CLIM_CACHE[x.i];
      return"<div class='cmp-opt' data-i='"+x.i+"' onmousedown='event.preventDefault()' onclick='cmpPick("+x.i+")'>"+cmpEsc(cmpName(e))+"<span>"+cmpEsc(e.region||"")+"</span></div>";}).join("")
    :"<div class='cmp-none'>No climate profile matches \u201C"+cmpEsc(inp.value.trim())+"\u201D</div>";
  box.style.display="block";
}
function cmpKey(ev){
  var box=document.getElementById("cmp-sugg"),opts=box?box.querySelectorAll(".cmp-opt"):[];
  if(ev.key==="ArrowDown"||ev.key==="ArrowUp"){
    if(!opts.length)return;ev.preventDefault();
    _cmpSel=(_cmpSel+(ev.key==="ArrowDown"?1:-1)+opts.length)%opts.length;
    for(var k=0;k<opts.length;k++)opts[k].classList.toggle("sel",k===_cmpSel);
  }else if(ev.key==="Enter"){
    if(opts.length)cmpPick(+opts[Math.max(0,_cmpSel)].getAttribute("data-i"));
  }else if(ev.key==="Escape"){ev.stopPropagation();cmpCloseSugg();}
}
function cmpPick(i){
  if(typeof CLIM_CACHE==="undefined"||!CLIM_CACHE[i])return;
  _cmpB=CLIM_CACHE[i];
  var inp=document.getElementById("cmp-input");if(inp){inp.value="";inp.blur();}
  cmpCloseSugg();renderClimCompare();
  var sec=document.getElementById("cmp-sec");if(sec)sec.scrollIntoView({behavior:"smooth",block:"start"});
}
// From a map pin's popup
function cmpPickAt(lat,lon){
  if(typeof CLIM_CACHE==="undefined")return;
  livMapToggleExpand(false);
  if(_livMap)_livMap.closePopup();
  for(var i=0;i<CLIM_CACHE.length;i++)if(CLIM_CACHE[i].lat===lat&&CLIM_CACHE[i].lon===lon){
    if(CLIM_CACHE[i]===cmpA()){showToast("That\u2019s the place already shown \u2014 pick another to compare");return;}
    cmpPick(i);return;
  }
}
function cmpClear(){_cmpB=null;renderClimCompare();}
function cmpSetAlign(a){_cmpAlign=a;renderClimCompare();}
function cmpFmt(c,v){
  if(v==null||isNaN(v))return"\u2014";
  if(c.d.u==="\u00B0")return String(v.toFixed(1)).replace("-","\u2212")+"\u00B0";
  if(c.d.u)return(c.d.u===" cm"?v.toFixed(1):Math.round(v))+c.d.u;
  return String(Math.round(v));
}
function cmpDot(v){return"<span class='cmp-sw' style='width:8px;height:8px;border-radius:50%;background:var(--cmp-"+v+");margin-right:3px'></span>";}
// Readout above each chart when no month is hovered: each place's high point (or total)
function cmpReadDefault(c){
  var A=cmpA(),B=_cmpB,agg=c.d.agg;
  function pick(arr,mo){
    var best=null,bi=-1,sum=0;
    for(var i=0;i<12;i++){var v=arr[i];if(v==null)continue;sum+=v;if(best==null||(agg==="min"?v<best:v>best)){best=v;bi=i;}}
    return agg==="sum"?cmpFmt(c,sum):cmpFmt(c,best)+" ("+mo[bi]+")";
  }
  var lab={max:"Highest",min:"Lowest",sum:"Year",best:"Best"}[agg];
  return lab+": "+cmpDot("a")+cmpEsc(A.name)+" <b>"+pick(c.a,CLIM_MONTHS)+"</b> \u00B7 "+cmpDot("b")+cmpEsc(B.name)+" <b>"+pick(c.b,c.mb)+"</b>";
}
function cmpHover(k,i){
  var c=_cmpCharts[k];if(!c)return;
  var rd=document.getElementById("cmp-rd-"+k),xh=document.getElementById("cmp-xh-"+k);
  if(!rd)return;
  if(i<0){rd.innerHTML=cmpReadDefault(c);if(xh)xh.style.opacity=0;return;}
  var A=cmpA(),B=_cmpB,mA=CLIM_MONTHS[i],mB=c.mb[i];
  rd.innerHTML="<b>"+mA+"</b> "+cmpDot("a")+cmpEsc(A.name)+" <b>"+cmpFmt(c,c.a[i])+"</b> \u00B7 "+cmpDot("b")+cmpEsc(B.name)+(mB!==mA?" ("+mB+")":"")+" <b>"+cmpFmt(c,c.b[i])+"</b>";
  if(xh){xh.setAttribute("x1",c.xs[i]);xh.setAttribute("x2",c.xs[i]);xh.style.opacity=1;}
}
function cmpNiceStep(raw){
  var p=Math.pow(10,Math.floor(Math.log(raw)/Math.LN10)),f=raw/p;
  return(f<=1?1:f<=2?2:f<=2.5?2.5:f<=5?5:10)*p;
}
function cmpChartSvg(c,k){
  var W=300,H=124,L=30,Rr=6,T=8,Bt=18,pw=W-L-Rr,ph=H-T-Bt,cw=pw/12,i;
  var vals=c.a.concat(c.b).filter(function(v){return v!=null&&!isNaN(v);});
  if(!vals.length)return"";
  var lo=c.d.zero?0:Math.min.apply(null,vals),hi=c.d.max!=null?c.d.max:Math.max.apply(null,vals);
  if(!c.d.zero){var pad=(hi-lo)*0.1||1;lo-=pad;hi+=pad;}else if(c.d.max==null)hi=hi>0?hi*1.08:1;
  var step=cmpNiceStep((hi-lo)/3);lo=Math.floor(lo/step)*step;hi=Math.ceil(hi/step-1e-9)*step;
  if(hi<=lo)hi=lo+step;
  var y=function(v){return T+ph-(v-lo)/(hi-lo)*ph;},x=function(j){return L+cw*(j+0.5);};
  c.xs=[];for(i=0;i<12;i++)c.xs.push(x(i).toFixed(1));
  var g="",m="",h="";
  for(var t=lo;t<=hi+step*1e-6;t+=step){
    var yy=y(t).toFixed(1),tl=Math.abs(t)<1e-9?"0":String(+t.toFixed(1)).replace("-","\u2212");
    g+="<line class='gl' x1='"+L+"' x2='"+(W-Rr)+"' y1='"+yy+"' y2='"+yy+"'/><text class='tk' x='"+(L-5)+"' y='"+(+yy+3)+"' text-anchor='end'>"+tl+"</text>";
  }
  for(i=0;i<12;i++)g+="<text class='tk' x='"+x(i).toFixed(1)+"' y='"+(H-4)+"' text-anchor='middle'>"+CLIM_MONTHS[i].charAt(0)+"</text>";
  if(c.d.bars){
    var bw=Math.max(2,(cw-5)/2);
    [["a",c.a,-1],["b",c.b,1]].forEach(function(s){
      for(var j=0;j<12;j++){var v=s[1][j];if(v==null||v<=0)continue;
        var bx=s[2]<0?x(j)-1-bw:x(j)+1,by=y(v),bh=y(0)-by;
        m+="<rect x='"+bx.toFixed(1)+"' y='"+by.toFixed(1)+"' width='"+bw.toFixed(1)+"' height='"+Math.max(1,bh).toFixed(1)+"' rx='1.5' style='fill:var(--cmp-"+s[0]+")'/>";}
    });
  }else{
    [["a",c.a],["b",c.b]].forEach(function(s){
      var d="",pen=false;
      for(var j=0;j<12;j++){var v=s[1][j];if(v==null){pen=false;continue;}d+=(pen?"L":"M")+x(j).toFixed(1)+" "+y(v).toFixed(1);pen=true;}
      m+="<path d='"+d+"' style='fill:none;stroke:var(--cmp-"+s[0]+");stroke-width:2;stroke-linejoin:round;stroke-linecap:round'/>";
      for(j=0;j<12;j++){var v2=s[1][j];if(v2==null)continue;m+="<circle cx='"+x(j).toFixed(1)+"' cy='"+y(v2).toFixed(1)+"' r='2.4' style='fill:var(--cmp-"+s[0]+")'/>";}
    });
  }
  for(i=0;i<12;i++)h+="<rect x='"+(L+cw*i).toFixed(1)+"' y='0' width='"+cw.toFixed(1)+"' height='"+H+"' fill='transparent' onmouseenter='cmpHover("+k+","+i+")' onclick='cmpHover("+k+","+i+")'/>";
  return"<div class='cmp-chart'><div class='cmp-ct'>"+c.d.t+"</div><div class='cmp-rd' id='cmp-rd-"+k+"'>"+cmpReadDefault(c)+"</div>"
    +"<svg viewBox='0 0 "+W+" "+H+"' role='img' aria-label='"+c.d.t+" by month for both places' onmouseleave='cmpHover("+k+",-1)'>"
    +g+"<line class='xh' id='cmp-xh-"+k+"' x1='0' x2='0' y1='"+T+"' y2='"+(T+ph)+"'/>"+m+h+"</svg></div>";
}
function renderClimCompare(){
  var sec=document.getElementById("cmp-sec"),body=document.getElementById("cmp-body");
  if(!sec||!body)return;
  var A=cmpA();
  if(!A){sec.style.display="none";body.innerHTML="";_cmpCharts=[];return;}
  sec.style.display="";
  var B=_cmpB;
  if(!B||B===A){
    _cmpCharts=[];
    body.innerHTML="<div class='cmp-hint'>See another place\u2019s climate alongside "+cmpEsc(A.name)+": type a name above, or tap a pin on the map and choose \u201CCompare with this place\u201D.</div>";
    return;
  }
  var split=(A.lat<0)!==(B.lat<0),season=split&&_cmpAlign==="season",i;
  var mA=A.monthly,mB=season?B.monthly.slice(6).concat(B.monthly.slice(0,6)):B.monthly;
  var nA=cmpEsc(A.name),nB=cmpEsc(B.name);
  var html="<div class='cmp-legend'><span class='cmp-key'><span class='cmp-sw' style='background:var(--cmp-a)'></span>"+cmpEsc(cmpName(A))+"</span>"
    +"<span class='cmp-key'><span class='cmp-sw' style='background:var(--cmp-b)'></span>"+cmpEsc(cmpName(B))+"</span>"
    +"<span style='margin-left:auto;display:flex;gap:14px'><button class='cmp-act' onclick='livMapLoad("+B.lat+","+B.lon+","+JSON.stringify(cmpName(B)).replace(/'/g,"&#39;")+")'>Load "+nB+" \u203A</button>"
    +"<button class='cmp-act' onclick='cmpClear()'>\u2715 Clear</button></span></div>";
  var pA=simProfile(A),pB=simProfile(B);
  if(pA&&pB){
    var sd=simDiffs(pA,pB),ss=simScore(sd),det=simDetail(pA,pB,sd);
    html+="<div style='font-size:12px;font-weight:600;color:var(--text-sec);line-height:1.5;margin-bottom:8px'><span style='font-weight:800;color:var(--text-head)'>"+simBand(ss)+"</span> \u2014 "
      +(det.length?nB+" against "+nA+": "+det.join(", "):"hard to tell apart")
      +" \u00B7 "+(Math.round(haversineKm(A.lat,A.lon,B.lat,B.lon)/100)*100).toLocaleString()+" km apart</div>";
  }
  if(split)html+="<div class='liv-map-toggle' style='margin:0 0 4px'><span style='font-size:11px;font-weight:700;color:var(--text-muted)'>Line up by</span>"
    +"<button class='liv-map-btn"+(season?"":" active")+"' onclick='cmpSetAlign(\"month\")'>Calendar month</button>"
    +"<button class='liv-map-btn"+(season?" active":"")+"' onclick='cmpSetAlign(\"season\")'>Season</button></div>"
    +"<div style='font-size:11px;font-weight:600;color:var(--text-muted);margin:4px 0'>"
    +(season?nB+"\u2019s months are shifted by six, so its summer sits under "+nA+"\u2019s summer. Hover or tap a month to see which is which."
      :"These places are in opposite hemispheres, so their seasons are six months apart. Choose Season to line them up.")+"</div>";
  var dT=function(v){return v==null?null:toDisp(v);};
  var defs=[
    {t:"Average high",f:function(m){return dT(m.T);},u:"\u00B0",agg:"max"},
    {t:"Average low",f:function(m){return dT(m.tmin);},u:"\u00B0",agg:"min"},
    {t:"Dew point",f:function(m){return dT(m.dp);},u:"\u00B0",agg:"max"},
    {t:"Rainfall (mm)",f:function(m){return m.rain;},u:" mm",bars:true,zero:true,agg:"sum"},
    {t:"Comfort score",f:function(m){return m.T==null||m.dp==null?null:calc(m.T,m.dp,0).score;},u:"",zero:true,max:100,agg:"best"}
  ];
  var sn=0;for(i=0;i<12;i++)sn+=(mA[i].snow||0)+(mB[i].snow||0);
  if(sn>=1)defs.push({t:"Snowfall (cm)",f:function(m){return m.snow||0;},u:" cm",bars:true,zero:true,agg:"sum"});
  _cmpCharts=defs.map(function(d){return{d:d,a:mA.map(d.f),b:mB.map(d.f),mb:mB.map(function(m){return m.month;})};});
  html+="<div class='cmp-charts'>"+_cmpCharts.map(cmpChartSvg).join("")+"</div>";
  // Summary table (each place's own calendar months)
  function ext(e,k,hiWant){var b=null,bi=-1;e.monthly.forEach(function(x,j){var v=x[k];if(v==null)return;if(b==null||(hiWant?v>b:v<b)){b=v;bi=j;}});return b==null?"\u2014":climT(b)+"&deg; ("+CLIM_MONTHS[bi]+")";}
  function rain(e){var t=0,w=0,wi=0;e.monthly.forEach(function(x,j){t+=x.rain||0;if((x.rain||0)>w){w=x.rain;wi=j;}});return Math.round(t)+" mm <span style='color:var(--text-muted);font-weight:600'>(wettest "+CLIM_MONTHS[wi]+")</span>";}
  function snow(e){var t=0;e.monthly.forEach(function(x){t+=x.snow||0;});return t>0.05?t.toFixed(1)+" cm":"None";}
  function liv(e){var v=calcLiveability(e);return v==null?"\u2014":"<span style='color:"+climScoreCol(v)+";font-weight:800'>"+v+"</span> "+livScoreLabel(v);}
  function kop(e){return(e.koppen?"<b>"+cmpEsc(e.koppen)+"</b>":"\u2014")+(e.koppen2?"<div style='font-size:11px;font-weight:600;color:var(--text-muted)'>"+cmpEsc(e.koppen2)+"</div>":"");}
  var rows=[["Climate",kop],["Elevation",function(e){return e.elev!=null?e.elev+" m":"\u2014";}],
    ["Warmest month (avg high)",function(e){return ext(e,"T",true);}],["Coolest month (avg low)",function(e){return ext(e,"tmin",false);}],
    ["Hottest day, typical year",function(e){return ext(e,"tmaxMax",true);}],["Coldest night, typical year",function(e){return ext(e,"tminMin",false);}],
    ["Most humid month (dew point)",function(e){return ext(e,"dp",true);}],["Rain per year",rain]];
  if(sn>=1)rows.push(["Snow per year",snow]);
  if(A.sun!=null||B.sun!=null)rows.push(["Sunshine per year",function(e){return e.sun!=null?Math.round(e.sun)+" hrs":"\u2014";}]);
  rows.push(["Liveability (your settings)",liv]);
  html+="<table class='cmp-tbl'><thead><tr><th></th><th><span class='cmp-sw' style='background:var(--cmp-a);margin-right:5px;vertical-align:middle'></span>"+nA+"</th>"
    +"<th><span class='cmp-sw' style='background:var(--cmp-b);margin-right:5px;vertical-align:middle'></span>"+nB+"</th></tr></thead><tbody>"
    +rows.map(function(r){return"<tr><td>"+r[0]+"</td><td>"+r[1](A)+"</td><td>"+r[1](B)+"</td></tr>";}).join("")+"</tbody></table>";
  body.innerHTML=html;
}
function homeTwinLoad(i){
  var e=CLIM_CACHE[i];
  if(!e)return;
  climFullToggle(false);
  fetchWeather(e.lat,e.lon,e.name+(e.ter?", "+e.ter:""));
  pageScrollTo(0,true);
}
// Full screen: the whole explorer as a wide two-column page (wide screens only — the button
// is hidden on phones). The map's own Expand still works on top of it.
function climFullToggle(force){
  var card=document.getElementById("clim-card"),btn=document.getElementById("clim-full-btn");
  if(!card)return;
  var on=force===undefined?!card.classList.contains("full"):force;
  if(on===card.classList.contains("full"))return;
  if(on&&!document.getElementById("clim-panel").classList.contains("open"))toggleClim();
  card.classList.toggle("full",on);
  document.body.style.overflow=on?"hidden":"";
  if(btn)btn.innerHTML=on?"&#x2715; Close":"&#x2922; Full screen";
  if(on)card.scrollTop=0;
  setTimeout(function(){initLivMap();if(_livMap)_livMap.invalidateSize();},80);
}
function toggleClim(){
  var tog=document.getElementById("clim-tog"),panel=document.getElementById("clim-panel");
  tog.classList.toggle("open");panel.classList.toggle("open");
  // Leaflet can't size itself inside a hidden panel, so build/resize the map once it's visible
  if(panel.classList.contains("open")){
    setTimeout(function(){
      initLivMap();
      if(_livMap){_livMap.invalidateSize();livMapCentre();}
    },60);
  }
}
var CLIM_SBANDS=[{max:35,col:"rgba(190,50,50,1)"},{max:55,col:"rgba(210,120,20,1)"},{max:75,col:"rgba(190,185,20,1)"},{max:90,col:"rgba(100,180,50,1)"},{max:100,col:"rgba(25,140,65,1)"}];
function climScoreCol(s){var v=Math.min(100,Math.max(0,s));for(var i=0;i<CLIM_SBANDS.length;i++)if(v<=CLIM_SBANDS[i].max)return CLIM_SBANDS[i].col;return CLIM_SBANDS[CLIM_SBANDS.length-1].col;}
// Climate figures are stored in °C; convert at display time so the unit toggle applies
function climT(v){return(v!==null&&v!==undefined&&!isNaN(v))?String(toDisp(v).toFixed(1)).replace("-","\u2212"):"\u2014";}
function showClimCard(lat,lon,elev){
  var card=document.getElementById("clim-card");
  card.style.display="block";
  livMapCentre();
  if(elev===undefined)elev=window._currentElev;
  var entry=findClimEntry(lat,lon,elev,CLIM_MAX_KM);
  var lbl=document.getElementById("clim-loc-label");
  if(!entry){
    lbl.innerHTML="<span style='color:var(--text-muted)'>"+(typeof CLIM_CACHE!=="undefined"?"No climate data within "+CLIM_MAX_KM+" km of this location yet."
      :window.CLIM_FAIL?"Climate data couldn\u2019t load \u2014 check your connection and reload.":"\u23F3 Loading climate data\u2026")+"</span>";
    document.getElementById("clim-chart-grid").innerHTML="";
    document.getElementById("clim-month-row").innerHTML="";
    document.getElementById("clim-tbody").innerHTML="";
    var es=document.getElementById("clim-summary");if(es)es.remove();
    var en=document.getElementById("clim-notes-wrap");if(en)en.remove();
    showLivCard(null);
    renderHomeCompare(null);
    return;
  }
  var kopKey=entry.koppen?koppenKey(entry.koppen):"";
  var kopHtml=kopKey?"<span onclick='showKoppenPop(\""+kopKey+"\")' style='display:inline-block;margin-left:8px;font-size:10px;font-weight:800;background:var(--card-inner);border:1px solid var(--card-inner-border);border-radius:20px;padding:2px 8px;color:var(--text-sec);cursor:pointer'>"+koppenSwatch(kopKey,9)+kopKey+" ↗</span>":"";
  var kop2Html=entry.koppen2?"<div style='font-size:11px;font-weight:600;color:var(--text-muted);margin-top:3px'>"+entry.koppen2+"</div>":"";
  var fromNote=climFromNote(entry);
  lbl.innerHTML="<div>"+entry.name+(entry.ter?", "+entry.ter:"")+" · "+entry.elev+"m"+kopHtml+"</div>"+kop2Html
    +(fromNote?"<div style='font-size:11px;font-weight:700;color:var(--text-sec);margin-top:4px'>\uD83D\uDCCD "+fromNote+"</div>":"");
  window._climMonthly=entry.monthly;
  var chartHtml="",monthHtml="";
  for(var i=0;i<entry.monthly.length;i++){
    var m=entry.monthly[i];
    var sc=calc(m.T,m.dp,0).score,col=climScoreCol(sc);
    chartHtml+="<div class='clim-bar-col' onclick='showClimMonthPop("+i+")'><span class='clim-bar-num'>"+sc+"</span><div class='clim-bar' style='height:calc(var(--clim-bar-h) * "+(sc/100).toFixed(2)+");background:"+col+";opacity:0.85'></div></div>";
    monthHtml+="<div class='clim-month-lbl' style='cursor:pointer' onclick='showClimMonthPop("+i+")'>"+m.month+"</div>";
  }
  document.getElementById("clim-chart-grid").innerHTML=chartHtml;
  document.getElementById("clim-month-row").innerHTML=monthHtml;
  function fN(v,d){return(v!==null&&v!==undefined&&!isNaN(v))?Number(v).toFixed(d):"—";}
  var tbodyHtml="";
  for(var i=0;i<entry.monthly.length;i++){
    var m=entry.monthly[i];
    var col=climScoreCol(calc(m.T,m.dp,0).score);
    tbodyHtml+="<tr style='border-left:3px solid "+col+"'>"
      +"<td style='font-weight:800;color:"+col+"'>"+m.month+"</td>"
      +"<td>"+climT(m.T)+"&deg;</td>"
      +"<td style='color:var(--text-muted)'>"+climT(m.tmin)+"&deg;</td>"
      +"<td style='color:var(--text-muted)'>"+climT(m.dp)+"&deg;</td>"
      +"<td style='color:var(--text-muted)'>"+fN(m.rain,0)+"</td>"
      +"<td style='color:var(--text-muted)'>"+(m.snow>0.05?fN(m.snow,1):"—")+"</td>"
      +"</tr>";
  }
  document.getElementById("clim-tbody").innerHTML=tbodyHtml;
  // Compute summary from monthly data
  var totalRain=0,totalSnow=0,hasSnow=false;
  for(var i=0;i<entry.monthly.length;i++){
    totalRain+=(entry.monthly[i].rain||0);
    totalSnow+=(entry.monthly[i].snow||0);
    if(entry.monthly[i].snow>0.05)hasSnow=true;
  }
  var summaryParts=[];
  summaryParts.push("🌧️ "+Math.round(totalRain)+"mm/yr");
  if(hasSnow)summaryParts.push("❄️ "+totalSnow.toFixed(1)+"cm/yr");
  if(entry.sun!=null)summaryParts.push("☀️ "+Math.round(entry.sun)+"hrs/yr");
  if(entry.wind!=null)summaryParts.push("💨 "+Math.round(entry.wind)+"km/h avg");
  var existing=document.getElementById("clim-summary");
  if(existing)existing.remove();
  var existingNotes=document.getElementById("clim-notes-wrap");
  if(existingNotes)existingNotes.remove();
  var sumDiv=document.createElement("div");
  sumDiv.id="clim-summary";
  sumDiv.style.cssText="font-size:12px;font-weight:700;color:var(--text-muted);display:flex;gap:12px;justify-content:center;margin-top:10px;padding-top:10px;border-top:1px solid var(--divider);flex-wrap:wrap";
  sumDiv.innerHTML=summaryParts.map(function(p){return"<span>"+p+"</span>";}).join("");
  document.getElementById("clim-table").after(sumDiv);
  // "Learn more" (when there are notes) and "Climate classifications" share one row
  var notesWrap=document.createElement("div");
  notesWrap.id="clim-notes-wrap";
  notesWrap.style.cssText="margin-top:8px";
  var linkCss="background:none;border:none;cursor:pointer;font-size:12px;font-weight:700;color:var(--text-sec);display:flex;align-items:center;gap:4px;padding:4px 0";
  notesWrap.innerHTML="<div style='display:flex;justify-content:space-between;align-items:center;gap:8px'>"
    +(entry.hasNotes?"<button id='clim-notes-btn' onclick='toggleClimNotes()' style='"+linkCss+"'>"
      +"<svg id='clim-notes-arrow' width='10' height='10' viewBox='0 0 10 10' fill='none' style='transition:transform 0.2s'><path d='M2 3l3 3 3-3' stroke='currentColor' stroke-width='1.5' stroke-linecap='round' stroke-linejoin='round'/></svg>"
      +"Learn more</button>":"<span></span>")
    +"<button onclick='showKoppenTable()' style='"+linkCss+"'>Climate classifications \u203A</button></div>"
    +(entry.hasNotes?"<div id='clim-notes-body' style='display:none;font-size:12px;line-height:1.65;color:var(--text-muted);padding:8px 0 4px'></div>":"");
  window._climNotesKey=climNotesKey(entry);
  sumDiv.after(notesWrap);
  renderHomeCompare(entry);
  showLivCard(entry);
}
// ── Liveability preference data ────────────────────────────────────────────
// Four temperature sliders, each checked against one figure from the climate profile:
// summer days = the warmest month's average day; hottest days = the hottest day of a typical
// year; winter days = the coolest month's average day; coldest nights = the coldest night of
// a typical year. Example places are from the climate data, in the band they belong to.
// Notches every 2° (every 200 mm for rainfall). Example places are from the climate data, in the band
// they belong to: for an "Up to" notch, places above the notch below and at or under this one.
var LIV_HEAT_BANDS=[
  {max:20,sub:"e.g. Dunedin, Dublin, Edinburgh"},
  {max:22,sub:"e.g. Wellington, Cardiff, Burnie"},
  {max:24,sub:"e.g. Albany, Christchurch, Queenstown NZ"},
  {max:26,sub:"e.g. Launceston, Mount Gambier, Berlin"},
  {max:28,sub:"e.g. Port Lincoln, Orange, Nairobi"},
  {max:30,sub:"e.g. Adelaide, Lisbon, Seoul"},
  {max:32,sub:"e.g. Cairns, Townsville, Hong Kong"},
  {max:34,sub:"e.g. Darwin, Mildura, Singapore"},
  {max:36,sub:"e.g. Broome, Athens, Cairo"},
  {max:38,sub:"e.g. Alice Springs, Dallas, Chiang Mai"},
  {max:40,sub:"e.g. Marble Bar, New Delhi, Phoenix"}
];
var LIV_HOT_BANDS=[
  {max:24,sub:"e.g. Punta Arenas, Ushuaia, Stanley"},
  {max:26,sub:"e.g. Wellington, Dublin, Edinburgh"},
  {max:28,sub:"e.g. Dunedin, Bergen, Addis Ababa"},
  {max:30,sub:"e.g. Christchurch, Queenstown NZ, Oslo"},
  {max:32,sub:"e.g. Johannesburg, Toronto, Mexico City"},
  {max:34,sub:"e.g. Launceston, Albany, Berlin"},
  {max:36,sub:"e.g. Darwin, Cairns, Singapore"},
  {max:38,sub:"e.g. Mount Gambier, Port Lincoln, Lisbon"},
  {max:40,sub:"e.g. Adelaide, Broome, Athens"},
  {max:42,sub:"e.g. Alice Springs, La Paz, Dallas"},
  {max:44,sub:"e.g. Mildura, Cairo, Tucson"},
  {max:46,sub:"e.g. New Delhi, Las Vegas, Tunis"},
  {max:99,sub:"e.g. Marble Bar, Phoenix, Khartoum"}
];
var LIV_WINTER_BANDS=[
  {min:26,sub:"e.g. Darwin, Broome, Bangkok"},
  {min:24,sub:"e.g. Cairns, Townsville, Miami"},
  {min:22,sub:"e.g. Rockhampton, São Paulo, Nouméa"},
  {min:20,sub:"e.g. New Delhi, Hanoi, Nairobi"},
  {min:18,sub:"e.g. Alice Springs, Cairo, Hong Kong"},
  {min:16,sub:"e.g. Port Lincoln, Esperance, Cape Town"},
  {min:14,sub:"e.g. Adelaide, Mildura, Lisbon"},
  {min:12,sub:"e.g. Mount Gambier, Athens, Las Vegas"},
  {min:10,sub:"e.g. Launceston, Ballarat, Wellington"},
  {min:8,sub:"e.g. Orange, Dunedin, Dublin"},
  {min:6,sub:"e.g. Queenstown NZ, Edinburgh, Vancouver"},
  {min:4,sub:"e.g. Bergen, Punta Arenas, Ushuaia"},
  {min:2,sub:"e.g. Berlin, Beijing, Seoul"},
  {min:0,sub:"e.g. Oslo, Warsaw, Halifax"},
  {min:-2,sub:"e.g. Helsinki, Toronto, Chicago"},
  {min:-4,sub:"e.g. Moscow, Saint Petersburg, Fredericton"},
  {min:-6,sub:"e.g. Edmonton, Montréal, Ottawa"},
  {min:-99,sub:"e.g. Harbin, Yakutsk, Winnipeg"}
];
var LIV_COLD_BANDS=[
  {min:16,sub:"e.g. Bangkok, Singapore, Manila"},
  {min:14,sub:"e.g. Weipa, Honolulu, Dakar"},
  {min:12,sub:"e.g. Darwin, Cairns, Nouméa"},
  {min:10,sub:"e.g. Port Douglas, Naha, Key West"},
  {min:8,sub:"e.g. Townsville, Broome, Hong Kong"},
  {min:6,sub:"e.g. Marble Bar, Casablanca, São Paulo"},
  {min:4,sub:"e.g. Port Lincoln, Lisbon, Cairo"},
  {min:2,sub:"e.g. Adelaide, Albany, New Delhi"},
  {min:0,sub:"e.g. Mount Gambier, Wellington, Athens"},
  {min:-2,sub:"e.g. Mildura, Ballarat, Tokyo"},
  {min:-4,sub:"e.g. Alice Springs, Dunedin, Dublin"},
  {min:-6,sub:"e.g. Launceston, Christchurch, Edinburgh"},
  {min:-8,sub:"e.g. Queenstown NZ, Armidale, Hamburg"},
  {min:-10,sub:"e.g. Cooma, Berlin, Punta Arenas"},
  {min:-12,sub:"e.g. Seoul, Munich, Sapporo"},
  {min:-14,sub:"e.g. Beijing, Lhasa, Salt Lake City"},
  {min:-99,sub:"e.g. Oslo, Helsinki, Moscow"}
];
var LIV_RAIN_BANDS=[
  {label:"Any",min:0,sub:"e.g. Cairo, Phoenix, Las Vegas"},
  {label:"200 mm+",min:200,sub:"e.g. Alice Springs, Mildura, Los Angeles"},
  {label:"400 mm+",min:400,sub:"e.g. Adelaide, Port Lincoln, Christchurch"},
  {label:"600 mm+",min:600,sub:"e.g. Launceston, Broome, Queenstown NZ"},
  {label:"800 mm+",min:800,sub:"e.g. Albany, Orange, Nairobi"},
  {label:"1,000 mm+",min:1000,sub:"e.g. Townsville, Wellington, Boston"},
  {label:"1,200 mm+",min:1200,sub:"e.g. Shanghai, Vancouver, Addis Ababa"},
  {label:"1,400 mm+",min:1400,sub:"e.g. Tokyo, Seoul, Busan"},
  {label:"1,600 mm+",min:1600,sub:"e.g. Darwin, Bangkok, Hanoi"},
  {label:"1,800 mm+",min:1800,sub:"e.g. Cairns, Bali, Salvador"},
  {label:"2,000 mm+",min:2000,sub:"e.g. Bergen, Singapore, Hong Kong"}
];
var LIV_SUN_BANDS=[
  {label:"Any",min:0,sub:"0hrs+ · e.g. Reykjavik, Bergen, Juneau"},
  {label:"Low",min:1400,sub:"1400hrs+ · e.g. London, Dublin, Seattle"},
  {label:"Moderate",min:1800,sub:"1800hrs+ · e.g. Sydney, Paris, Portland"},
  {label:"Sunny",min:2200,sub:"2200hrs+ · e.g. Perth, Los Angeles, Rome"},
  {label:"Very sunny",min:2800,sub:"2800hrs+ · e.g. Phoenix, Dubai, Alice Springs"}
];
var LIV_DP_BANDS=[
  {label:"Very dry (≤10°C)",max:10,sub:"e.g. Alice Springs, Las Vegas, Denver"},
  {label:"Very low (≤12°C)",max:12,sub:"e.g. Adelaide, Launceston, Christchurch"},
  {label:"Low (≤14°C)",max:14,sub:"e.g. Port Lincoln, Orange, Wellington"},
  {label:"Fairly low (≤16°C)",max:16,sub:"e.g. Albany, Esperance, Lisbon"},
  {label:"Moderate (≤18°C)",max:18,sub:"e.g. Athens, Chicago, Boston"},
  {label:"Fairly high (≤20°C)",max:20,sub:"e.g. Marble Bar, São Paulo, Harbin"},
  {label:"High (≤22°C)",max:22,sub:"e.g. Beijing, Tokyo, Casablanca"},
  {label:"Very high (≤24°C)",max:24,sub:"e.g. Cairns, Townsville, Seoul"},
  {label:"Any humidity",max:99,sub:"e.g. Darwin, Broome, New Delhi"}
];
var LIV_SNOW_BANDS=[
  {label:"None",max:0,sub:"0cm · e.g. most of Australia, southern Spain, Canary Islands"},
  {label:"Trace",max:5,sub:"≤5cm/yr · e.g. London, Paris, Bordeaux"},
  {label:"Light",max:30,sub:"≤30cm/yr · e.g. Dublin, Seoul, Vancouver"},
  {label:"Any amount",max:9999,sub:"e.g. Hokkaido, Quebec, Tromsø"}
];

var LIV_BANDS={heat:LIV_HEAT_BANDS,hot:LIV_HOT_BANDS,winter:LIV_WINTER_BANDS,cold:LIV_COLD_BANDS,dp:LIV_DP_BANDS,rain:LIV_RAIN_BANDS,sun:LIV_SUN_BANDS,snow:LIV_SNOW_BANDS};
// The notches before 24 Nov 2026. Settings saved then (no bv:2) move to the nearest new notch.
var LIV_OLD_NOTCHES={heat:[20,25,30,33,35,38,42],hot:[25,30,33,36,39,42,45,99],winter:[25,20,15,10,5,0,-99],
  cold:[15,10,5,0,-5,-10,-99],dp:[14,17,20,23,99],rain:[0,300,600,900,1400]};
// The notch nearest a value; on a tie, the more lenient one (higher for an "up to" limit, lower for a "down to" one)
function livNotch(dim,val){
  var b=LIV_BANDS[dim],key=b[0].max!==undefined?"max":"min",best=0;
  for(var i=1;i<b.length;i++){
    var d=Math.abs(b[i][key]-val),bd=Math.abs(b[best][key]-val);
    if(d<bd||(d===bd&&(key==="max"?b[i][key]>b[best][key]:b[i][key]<b[best][key])))best=i;
  }
  return best;
}
function toggleLivPref(){
  var panel=document.getElementById("liv-pref-panel");
  var tog=document.getElementById("liv-pref-tog");
  var open=panel.style.display==="none";
  panel.style.display=open?"block":"none";
  tog.querySelector("svg path").setAttribute("d",open?"M2 3l4 4 4-3":"M4 2l4 4-4 4");
}
// Temperature band labels are built from the band's °C value in the chosen unit
function livDeg(c){return String(Math.round(toDisp(c))).replace("-","\u2212")+unitSym();}
function livBandLabel(dim,b,last){
  if(dim==="heat")return"Up to "+livDeg(b.max)+(last?"+":"");
  if(dim==="hot")return b.max>=99?"Any heat":"Up to "+livDeg(b.max);
  if(dim==="winter")return b.min<=-99?"Any winter":"Down to "+livDeg(b.min);
  if(dim==="cold")return b.min<=-99?"Any cold":"Down to "+livDeg(b.min);
  if(dim==="dp")return b.max>=99?"Any humidity":b.label.split(" (")[0]+" (\u2264"+livDeg(b.max)+")";
  return b.label;
}
function livUnitText(){
  [["heat",LIV_HEAT_BANDS],["hot",LIV_HOT_BANDS],["winter",LIV_WINTER_BANDS],["cold",LIV_COLD_BANDS]].forEach(function(x){
    var sl=document.getElementById("sl-liv-"+x[0]),ends=sl&&sl.nextElementSibling;
    if(!ends||!ends.classList.contains("slider-ends")||ends.children.length<2)return;
    var bb=x[1];
    ends.children[0].textContent=livBandLabel(x[0],bb[0],false);
    ends.children[1].textContent=livBandLabel(x[0],bb[bb.length-1],true);
  });
  var lw=document.querySelector("label[for=req-summer-warm]"),lc=document.querySelector("label[for=req-winter-cool]");
  if(lw)lw.textContent="Summer must be warm (warmest month \u2265"+livDeg(18)+" avg max)";
  if(lc)lc.textContent="Winter must be cool (coldest month <"+livDeg(18)+" avg max)";
}
function onLivBand(dim){
  var b=LIV_BANDS[dim];
  var v=parseInt(document.getElementById("sl-liv-"+dim).value);
  document.getElementById("liv-"+dim+"-val").textContent=livBandLabel(dim,b[v],v===b.length-1);
  document.getElementById("liv-"+dim+"-sub").textContent=b[v].sub;
  saveLivPrefs();
  renderLivScore();
}
function onLivSens(id){
  var v=parseInt(document.getElementById("sl-liv-"+id).value);
  var labels=["Mild","Low","Moderate","High","Severe"];
  var lbl=labels[Math.round(v/25)];
  document.getElementById("liv-"+id+"-val").textContent=lbl;
  saveLivPrefs();
  renderLivScore();
}
function saveLivPrefs(){
  var p={bv:2,
    heat:parseInt(document.getElementById("sl-liv-heat").value),
    hot:parseInt(document.getElementById("sl-liv-hot").value),
    winter:parseInt(document.getElementById("sl-liv-winter").value),
    cold:parseInt(document.getElementById("sl-liv-cold").value),coldV:2,
    rain:parseInt(document.getElementById("sl-liv-rain").value),
    sun:parseInt(document.getElementById("sl-liv-sun").value),
    snow:parseInt(document.getElementById("sl-liv-snow").value),
    dp:parseInt(document.getElementById("sl-liv-dp").value),
    tsens:parseInt(document.getElementById("sl-liv-tsens").value),
    hsens:parseInt(document.getElementById("sl-liv-hsens").value),
    lsens:parseInt(document.getElementById("sl-liv-lsens").value),
    hfHeat:document.getElementById("hf-liv-heat").checked,
    hfHot:document.getElementById("hf-liv-hot").checked,
    hfWinter:document.getElementById("hf-liv-winter").checked,
    hfCold:document.getElementById("hf-liv-cold").checked,
    hfDp:document.getElementById("hf-liv-dp").checked,
    hfRain:document.getElementById("hf-liv-rain").checked,
    hfSun:document.getElementById("hf-liv-sun").checked,
    hfSnow:document.getElementById("hf-liv-snow").checked,
    reqSummerWarm:document.getElementById("req-summer-warm").checked,
    reqWinterCool:document.getElementById("req-winter-cool").checked
  };
  localStorage.setItem("liv_prefs",JSON.stringify(p));
}
function loadLivPrefs(){
  var p=JSON.parse(localStorage.getItem("liv_prefs")||"{}");
  function sv(id,val){var el=document.getElementById(id);if(el)el.value=val;}
  function sc(id,val){var el=document.getElementById(id);if(el)el.checked=val;}
  // The number of notches comes from the band lists, not the page, so the two can't disagree
  for(var d in LIV_BANDS){var el=document.getElementById("sl-liv-"+d);if(el)el.max=LIV_BANDS[d].length-1;}
  // A saved notch, or the default value's notch. Settings from before bv:2 count the old notches.
  var oldNotches=p.bv!==2;
  function notch(dim,saved,def){
    if(saved===undefined||saved===null)return livNotch(dim,def);
    if(!oldNotches||!LIV_OLD_NOTCHES[dim])return saved;
    var ov=LIV_OLD_NOTCHES[dim][Math.max(0,Math.min(saved,LIV_OLD_NOTCHES[dim].length-1))];
    return livNotch(dim,ov);
  }
  sv("sl-liv-heat",notch("heat",p.heat,30));
  var oldCold=p.cold!==undefined?p.cold+(p.coldV===2?0:2):undefined; // before coldV:2 the scale started at 5°C
  var cold=notch("cold",oldCold,-5);
  sv("sl-liv-cold",cold);
  // Hottest days and winter days were once worked out from the other two sliders. For settings
  // saved before they had their own, start them at the typical gaps in the climate data: the
  // hottest day runs about 6° above the warmest month's average day, and the coolest month's
  // average day about 15° above the coldest night.
  function near(bands,v,key){var bi=0;for(var i=0;i<bands.length;i++)if(Math.abs(bands[i][key]-v)<Math.abs(bands[bi][key]-v))bi=i;return bi;}
  var heatMax=LIV_HEAT_BANDS[notch("heat",p.heat,30)].max,coldMin=LIV_COLD_BANDS[cold].min;
  sv("sl-liv-hot",p.hot!==undefined?notch("hot",p.hot):near(LIV_HOT_BANDS,heatMax+6,"max"));
  sv("sl-liv-winter",p.winter!==undefined?notch("winter",p.winter):coldMin<=-99?LIV_WINTER_BANDS.length-1:near(LIV_WINTER_BANDS,coldMin+15,"min"));
  sv("sl-liv-rain",notch("rain",p.rain,600));
  sv("sl-liv-sun",p.sun!==undefined?p.sun:2);
  sv("sl-liv-snow",p.snow!==undefined?p.snow:0);
  sv("sl-liv-dp",notch("dp",p.dp,20));
  sv("sl-liv-tsens",p.tsens!==undefined?p.tsens:50);
  sv("sl-liv-hsens",p.hsens!==undefined?p.hsens:50);
  sv("sl-liv-lsens",p.lsens!==undefined?p.lsens:50);
  sc("hf-liv-heat",p.hfHeat||false);
  sc("hf-liv-hot",p.hfHot!==undefined?p.hfHot:(p.hfHeat||false));
  sc("hf-liv-winter",p.hfWinter||false);
  sc("hf-liv-cold",p.hfCold||false);
  sc("hf-liv-dp",p.hfDp||false);
  sc("hf-liv-rain",p.hfRain||false);
  sc("hf-liv-sun",p.hfSun||false);
  sc("hf-liv-snow",p.hfSnow||false);
  sc("req-summer-warm",p.reqSummerWarm||false);
  sc("req-winter-cool",p.reqWinterCool||false);
  ["heat","hot","winter","cold","dp","rain","sun","snow"].forEach(function(d){onLivBand(d);});
  ["tsens","hsens","lsens"].forEach(function(s){onLivSens(s);});
  livUnitText();
}
function getLivPrefs(){
  return{
    heatMax:LIV_HEAT_BANDS[parseInt(document.getElementById("sl-liv-heat").value)].max,
    hotMax:LIV_HOT_BANDS[parseInt(document.getElementById("sl-liv-hot").value)].max,
    winterMin:LIV_WINTER_BANDS[parseInt(document.getElementById("sl-liv-winter").value)].min,
    coldMin:LIV_COLD_BANDS[parseInt(document.getElementById("sl-liv-cold").value)].min,
    rainMin:LIV_RAIN_BANDS[parseInt(document.getElementById("sl-liv-rain").value)].min,
    rainMax:LIV_RAIN_BANDS[parseInt(document.getElementById("sl-liv-rain").value)].min*2.5,
    sunMin:LIV_SUN_BANDS[parseInt(document.getElementById("sl-liv-sun").value)].min,
    snowMax:LIV_SNOW_BANDS[parseInt(document.getElementById("sl-liv-snow").value)].max,
    dpMax:LIV_DP_BANDS[parseInt(document.getElementById("sl-liv-dp").value)].max,
    hfDp:document.getElementById("hf-liv-dp").checked,
    tsens:parseInt(document.getElementById("sl-liv-tsens").value)/100,
    hsens:parseInt(document.getElementById("sl-liv-hsens").value)/100,
    lsens:parseInt(document.getElementById("sl-liv-lsens").value)/100,
    hfHeat:document.getElementById("hf-liv-heat").checked,
    hfHot:document.getElementById("hf-liv-hot").checked,
    hfWinter:document.getElementById("hf-liv-winter").checked,
    hfCold:document.getElementById("hf-liv-cold").checked,
    hfRain:document.getElementById("hf-liv-rain").checked,
    hfSun:document.getElementById("hf-liv-sun").checked,
    hfSnow:document.getElementById("hf-liv-snow").checked,
    reqSummerWarm:document.getElementById("req-summer-warm").checked,
    reqWinterCool:document.getElementById("req-winter-cool").checked,
    windT:(function(el){return el?parseInt(el.value)/100:0.5;})(document.getElementById("sl-wind"))
  };
}
// One place's liveability, worked out once: the figures it's scored on, the 0–100 score for
// each of the nine parts, and the total. calcLiveability(), the summary line, the rule-out
// list and the breakdown popup all read from here, so they can't disagree.
var LIV_WEIGHTS=[15,10,15,10,20,10,10,7,3]; // summer, hottest days, winter, coldest nights, humidity, rain, sun, wind, snow
// Wind preference also sets how much wind counts: 20 points at Hate wind, 7 at Neutral (the
// weights above), 3 at Love wind. The other eight parts share the rest in the same proportions.
function livWeights(p){
  var t=p&&p.windT!=null?p.windT:0.5;
  var ww=t<=0.5?20-26*t:7-8*(t-0.5),k=(100-ww)/(100-LIV_WEIGHTS[7]);
  return LIV_WEIGHTS.map(function(w,i){return i===7?ww:w*k;});
}
function livCompute(entry,p){
  p=p||getLivPrefs();
  var M=entry.monthly;
  var st=M.reduce(function(mx,m){return Math.max(mx,m.T||0);},0);
  var wt=M.reduce(function(mn,m){return Math.min(mn,m.T||999);},999);
  var peakDp=M.reduce(function(mx,m){return Math.max(mx,m.dp||0);},0);
  var hotmaxMax=M.reduce(function(mx,m){return Math.max(mx,m.tmaxMax||0);},0);
  var coldtminMin=M.reduce(function(mn,m){return Math.min(mn,m.tminMin!==undefined?m.tminMin:999);},999);
  var totalRain=M.reduce(function(s,m){return s+(m.rain||0);},0);
  var totalSnow=M.reduce(function(s,m){return s+(m.snow||0);},0);
  var totalPrecip=totalRain; // Rainfall column = total precipitation (rain + melted snow), so snow isn't added again
  var sun=entry.sun||0;
  var wind=entry.wind||0;
  // Which month each extreme falls in (for the breakdown's wording)
  function idx(f){for(var i=0;i<12;i++)if(f(M[i]))return i;return 0;}
  var mon={st:idx(function(m){return(m.T||0)===st;}),wt:idx(function(m){return(m.T||999)===wt;}),dp:idx(function(m){return(m.dp||0)===peakDp;}),
    hot:idx(function(m){return(m.tmaxMax||0)===hotmaxMax;}),cold:idx(function(m){return(m.tminMin!==undefined?m.tminMin:999)===coldtminMin;})};
  // Sensitivity → slope factor: mild=0.5, severe=3.0
  function slope(sens){return 0.5+sens*2.5;}
  var ts=slope(p.tsens),hs=slope(p.hsens),ls=slope(p.lsens);
  // Score a value against a ceiling (lower is worse above ceiling)
  function scoreCeil(val,ceil,sens,hardFail){
    if(hardFail&&val>ceil)return 0;
    if(val<=ceil)return 100;
    var excess=(val-ceil)/Math.max(1,ceil*0.1+1);
    return Math.max(0,100-excess*sens*40);
  }
  // Score a value against a floor (lower is worse below floor)
  function scoreFloor(val,floor,sens,hardFail){
    if(val===999||val===-99)return 100;
    if(hardFail&&val<floor)return 0;
    if(val>=floor)return 100;
    var deficit=(floor-val)/Math.max(1,Math.abs(floor)*0.1+1);
    return Math.max(0,100-deficit*sens*40);
  }
  // Score rainfall — penalise below min, soft penalise above band max
  function scoreRain(val,minPref,maxPref,sens,hardFail){
    if(hardFail&&val<minPref)return 0;
    if(minPref===0)return 100;
    if(val<minPref){
      var deficit=(minPref-val)/Math.max(1,minPref*0.2);
      return Math.max(0,100-deficit*sens*40);
    }
    if(val>maxPref){
      var excess=(val-maxPref)/Math.max(1,maxPref*0.2);
      return Math.max(0,100-excess*ls*20);
    }
    return 100;
  }
  // Wind: the limit comes from Wind preference (the slider the comfort score uses), set against
  // yearly average wind: Hate wind 10 km/h, Neutral 17, Love wind 24. Most places average 10–15 km/h;
  // only the windiest 5% (Wellington, Esperance, Punta Arenas) average 20 or more. Lifestyle
  // sensitivity sets how fast the score falls past the limit: about 9 points a km/h at Moderate.
  var windCeil=Math.round(10+(p.windT!=null?p.windT:0.5)*14);
  function scoreWind(val,ceil,sens){return val<=ceil?100:Math.max(0,100-(val-ceil)*sens*5);}
  var s=[
    scoreCeil(st,p.heatMax,ts,p.hfHeat),           // summer heat
    scoreCeil(hotmaxMax,p.hotMax,ts,p.hfHot),      // hottest days
    scoreFloor(wt,p.winterMin,ts,p.hfWinter),      // winter days
    scoreFloor(coldtminMin,p.coldMin,ts,p.hfCold), // extreme cold
    scoreCeil(peakDp,p.dpMax,hs,p.hfDp),           // peak humidity
    scoreRain(totalPrecip,p.rainMin,p.rainMax,ls,p.hfRain), // rainfall (total precipitation)
    scoreFloor(sun,p.sunMin,ls,p.hfSun),           // sunshine
    scoreWind(wind,windCeil,ls),                   // wind
    scoreCeil(totalSnow,p.snowMax,ls,p.hfSnow)     // snowfall
  ];
  // Hard fail check — any triggered hard fail zeros the whole score
  var hard=(p.hfHeat&&st>p.heatMax)||(p.hfHot&&hotmaxMax>p.hotMax)||(p.hfWinter&&wt<p.winterMin)||(p.hfCold&&coldtminMin<p.coldMin)||
    (p.hfDp&&peakDp>p.dpMax)||(p.hfRain&&totalPrecip<p.rainMin)||(p.hfSun&&sun<p.sunMin)||
    (p.hfSnow&&totalSnow>p.snowMax)||(p.reqSummerWarm&&st<18)||(p.reqWinterCool&&wt>=18);
  var W=livWeights(p);
  var raw=Math.round(s.reduce(function(t,v,i){return t+v*W[i]/100;},0));
  raw=Math.max(0,Math.min(100,raw));
  return{p:p,st:st,wt:wt,peakDp:peakDp,hotmaxMax:hotmaxMax,coldtminMin:coldtminMin,totalRain:totalRain,totalSnow:totalSnow,
    totalPrecip:totalPrecip,sun:sun,wind:wind,windCeil:windCeil,mon:mon,s:s,w:W,hard:!!hard,raw:raw,score:hard?0:raw};
}
function calcLiveability(entry){
  if(!entry||!entry.monthly||entry.monthly.length<12)return null;
  return livCompute(entry).score;
}
function livScoreLabel(s){
  if(s>90)return"Excellent";
  if(s>75)return"Good";
  if(s>55)return"Moderate";
  if(s>35)return"Poor";
  return"Very poor";
}
// Plain-English reasons a location breaks any "Rule out" limit (or seasonality requirement),
// quoting the location's figure against the user's limit. Empty array = not ruled out.
// Mirrors the zero-score checks at the top of calcLiveability() — keep the two in step.
function livRuleOutReasons(entry){
  if(!entry||!entry.monthly||entry.monthly.length<12)return[];
  var L=livCompute(entry),p=L.p,st=L.st,wt=L.wt,peakDp=L.peakDp,hotmaxMax=L.hotmaxMax,coldtminMin=L.coldtminMin;
  var totalSnow=L.totalSnow,totalPrecip=L.totalPrecip,sun=L.sun;
  function t(v){return String(toDisp(v)).replace("-","\u2212")+unitSym();}
  function n(v){return Math.round(v).toLocaleString("en-AU");}
  function cm(v){return v<10?(Math.round(v*10)/10):Math.round(v);}
  var r=[];
  if(p.hfHeat&&st>p.heatMax)r.push("Summer days too hot: the warmest month averages "+t(st)+", above your "+t(p.heatMax)+" limit");
  if(p.hfHot&&hotmaxMax>p.hotMax)r.push("Hottest days too hot: the hottest day of a typical year reaches "+t(hotmaxMax)+", above your "+t(p.hotMax)+" limit");
  if(p.hfWinter&&wt<p.winterMin)r.push("Winter days too cold: the coolest month averages "+t(wt)+", below your "+t(p.winterMin)+" limit");
  if(p.hfCold&&coldtminMin<p.coldMin)r.push("Coldest nights too cold: the coldest night of a typical year drops to "+t(coldtminMin)+", below your "+t(p.coldMin)+" limit");
  if(p.hfDp&&peakDp>p.dpMax)r.push("Too humid: the dew point peaks at "+t(peakDp)+" in the most humid month, above your "+t(p.dpMax)+" limit");
  if(p.hfRain&&totalPrecip<p.rainMin)r.push("Too dry: "+n(totalPrecip)+" mm of rain a year, below your "+n(p.rainMin)+" mm minimum");
  if(p.hfSun&&sun<p.sunMin)r.push("Not sunny enough: "+n(sun)+" hours of sunshine a year, below your "+n(p.sunMin)+"-hour minimum");
  if(p.hfSnow&&totalSnow>p.snowMax)r.push("Too snowy: "+cm(totalSnow)+" cm of snow a year"+(p.snowMax>0?", above your "+p.snowMax+" cm limit":", and you've chosen none"));
  if(p.reqSummerWarm&&st<18)r.push("No warm summer: the warmest month averages "+t(st)+", below the "+t(18)+" you require");
  if(p.reqWinterCool&&wt>=18)r.push("No cool winter: the coolest month averages "+t(wt)+", above the "+t(18)+" you require");
  return r;
}
function livScoreAnnotations(entry){
  if(!entry||!entry.monthly||entry.monthly.length<12)return"";
  // Ruled-out locations: list each broken limit with the figures behind it
  var ruled=livRuleOutReasons(entry);
  if(ruled.length)return"Ruled out by your limits:\n\u00B7 "+ruled.join("\n\u00B7 ");
  var L=livCompute(entry),S=L.s,p=L.p,coldtminMin=L.coldtminMin,totalSnow=L.totalSnow,totalPrecip=L.totalPrecip;
  var dims=[
    {
      score:S[0],
      pos:"pleasant summers",
      mild_neg:"summers occasionally hot",
      neg:"summers regularly too hot",
      bad:"summers severely hot"
    },
    {
      score:S[1],
      pos:"heatwaves uncommon",
      mild_neg:"heatwaves at the edge of tolerance",
      neg:"heatwaves too frequent or intense",
      bad:"hottest days far beyond your tolerance"
    },
    {
      score:S[2],
      pos:"mild winters",
      mild_neg:"winters on the cool side",
      neg:"winters uncomfortably cold",
      bad:"winters severely cold"
    },
    {
      score:S[3],
      pos:coldtminMin>5?"cold nights rare or mild":null,
      mild_neg:"cold nights push your tolerance",
      neg:"coldest nights beyond your tolerance",
      bad:"severe overnight lows"
    },
    {
      score:S[4],
      pos:"air stays dry and comfortable",
      mild_neg:"can get sticky in peak season",
      neg:"humid season exceeds tolerance",
      bad:"oppressively humid"
    },
    (function(){
      var rs=S[5];
      var tooWet=totalPrecip>p.rainMax;
      return{
        score:rs,
        pos:"rainfall well matched",
        mild_neg:tooWet?"can be quite wet":"a little drier than ideal",
        neg:tooWet?"exceeds rainfall preference":"insufficient rainfall",
        bad:tooWet?"exceptionally high rainfall":"severe moisture deficit"
      };
    })(),
    {
      score:S[6],
      pos:"excellent sunshine",
      mild_neg:"sunshine below preference",
      neg:"overcast and grey",
      bad:"persistently overcast"
    },
    {
      score:S[7],
      pos:L.wind<10?"calm and sheltered":"wind suits you",
      mild_neg:"occasionally breezy",
      neg:"frequently windy",
      bad:"persistently windy"
    },
    (function(){
      var ss=S[8];
      var snowMild=totalSnow<5,snowModerate=totalSnow<30;
      return{
        score:ss,
        pos:"no meaningful snowfall",
        mild_neg:"occasional light snow",
        neg:snowMild?"a little snow despite your preference":snowModerate?"some snowfall most winters":"significant snowfall",
        bad:snowMild?"a little snow despite your preference":snowModerate?"snowfall beyond your tolerance":"heavy snow season"
      };
    })()
  ];
  // Build candidate phrases — negatives by severity, positives by how strong
  // Widen mild_neg zone (50–82) and lower positive threshold (70+)
  // so most dimensions contribute something to the summary
  var candidates=[];
  for(var i=0;i<dims.length;i++){
    var d=dims[i];
    var s=d.score;
    var phrase=null,priority=0,positive=false;
    if(s<30){phrase=d.bad;priority=200-s*2;}
    else if(s<50){phrase=d.neg;priority=150-s;}
    else if(s<82){phrase=d.mild_neg;priority=82-s;}
    else if(s>=70){phrase=d.pos;priority=s-70;positive=true;}
    if(phrase&&phrase!==null)candidates.push({phrase:phrase,priority:priority,positive:positive});
  }
  // Negatives sorted by severity, positives by strength; negatives always precede positives
  candidates.sort(function(a,b){
    if(a.positive!==b.positive)return a.positive?1:-1;
    return b.priority-a.priority;
  });
  // Up to 3 negatives and 2 positives, cap total at 5
  var negs=candidates.filter(function(c){return!c.positive;}).slice(0,3);
  var pos=candidates.filter(function(c){return c.positive;}).slice(0,2);
  var picked=negs.concat(pos).map(function(c){return c.phrase;});
  if(picked.length===0)return"well-matched climate";
  return picked.join(" · ");
}
function renderLivScore(){
  livMapScheduleRebuild();
  var card=document.getElementById("liv-card");
  if(!card||card.style.display==="none")return;
  var entry=window._livEntry;
  if(!entry)return;
  var score=calcLiveability(entry);
  if(score===null)return;
  var locEl=document.getElementById("liv-score-loc");
  var numEl=document.getElementById("liv-score-num");
  var lblEl=document.getElementById("liv-score-lbl");
  var barEl=document.getElementById("liv-vol-bar");
  if(locEl)locEl.textContent=entry.name+(entry.ter?", "+entry.ter:"");
  if(numEl){
    var col=climScoreCol(score);
    numEl.style.color=col;
    numEl.style.textShadow="0 0 18px "+col+"80";
    numEl.textContent=score;
  }
  if(lblEl)lblEl.textContent=livRuleOutReasons(entry).length?"Ruled out":livScoreLabel(score);
  if(barEl)drawGauge("liv-vol-bar",score);
  var annEl=document.getElementById("liv-score-ann");
  if(annEl)annEl.textContent=livScoreAnnotations(entry);
}
function showLivCard(entry){
  var card=document.getElementById("liv-card");
  if(!card)return;
  if(!entry){card.style.display="none";return;}
  window._livEntry=entry;
  card.style.display="block";
  renderLivScore();
}
// ── Liveability breakdown popup ────────────────────────────────────────────
// Tap the liveability score: what lifts it, what holds it back, and what the climate
// would feel like against your Liveability preferences.
var LIV_MONTHS=["January","February","March","April","May","June","July","August","September","October","November","December"];
function showLivBreakdown(){
  var entry=window._livEntry;
  if(!entry||!entry.monthly||entry.monthly.length<12)return;
  var L=livCompute(entry),p=L.p,s=L.s,ruled=livRuleOutReasons(entry);
  var deg=function(c){return String(toDisp(c)).replace("-","−")+unitSym();};
  var n=function(v){return Math.round(v).toLocaleString("en-AU");};
  var cm=function(v){return v<10?(Math.round(v*10)/10):Math.round(v);};
  var mon=function(k){return LIV_MONTHS[L.mon[k]];};
  var lvl=function(x){return x>=99.5?0:x>=75?1:x>=45?2:3;};
  var noCold=p.coldMin<=-99;
  var rows=[];
  function row(i,icon,name,fig,feel){
    var w=L.w[i],lost=(100-s[i])*w/100;
    rows.push({i:i,lost:lost,html:function(col){
      var r=Math.round(lost),ok=r===0;
      return"<div style='padding:7px 0;border-bottom:1px solid var(--divider)'>"
        +"<div style='display:flex;justify-content:space-between;align-items:baseline;gap:8px'>"
        +"<span style='font-size:13.5px;font-weight:800;color:var(--text)'>"+icon+" "+name+"</span>"
        +"<span style='font-size:14px;font-weight:800;color:var(--text);white-space:nowrap'>"
        +(ok?"<span style='color:#1a7a3a'>✓</span>":"−"+r+" <span style='font-size:10px;color:var(--text-muted)'>of "+Math.round(w)+"</span>")+"</span></div>"
        +"<div style='font-size:11.5px;font-weight:600;color:var(--text-muted);margin-top:1px'>"+fig+"</div>"
        +"<div style='font-size:12.5px;font-weight:600;color:var(--text);margin-top:3px;line-height:1.45'>"+feel+"</div>"
        +(ok?"":"<div style='height:5px;border-radius:3px;background:var(--range-bg);margin-top:5px;overflow:hidden'><div style='height:100%;width:"+Math.max(3,Math.min(100,100-s[i]))+"%;border-radius:3px;background:"+climScoreCol(s[i])+"'></div></div>")
        +"</div>";
    }});
  }
  // 1 — Summer heat
  row(0,"☀️","Summer heat","Warmest month ("+mon("st")+"): days average "+deg(L.st)+" · your limit "+deg(p.heatMax),
    [L.st>=p.heatMax-2?"Summers run warm, right up near the top of your range.":L.st>=18?"Summer days stay comfortably inside your range.":"Summers stay cool — days rarely get properly warm.",
     "Summer afternoons run a little warmer than you’d like.","Summer days would regularly feel too hot for you.","Summers would be far too hot for you, for months at a time."][lvl(s[0])]);
  // 2 — Hottest days
  row(1,"🔥","Hottest days","The hottest day of a typical year reaches "+deg(L.hotmaxMax)+(p.hotMax>=99?" · any heat suits you":" · your limit "+deg(p.hotMax)),
    ["Heatwaves rarely push past what you can handle.","The hottest days of the year would test you.","Heatwaves would regularly go beyond what you can handle.","The hottest days go far beyond what you can handle."][lvl(s[1])]);
  // 3 — Winter days
  row(2,"🧥","Winter days","Coolest month ("+mon("wt")+"): days average "+deg(L.wt)+(p.winterMin<=-99?" · any winter suits you":" · your limit "+deg(p.winterMin)),
    [L.wt>=20?"Barely a winter at all — days stay warm year-round.":"Winter days stay comfortable for you.",
     "Winter days are a little cooler than you’d like.","Winter days would feel genuinely cold to you.","Winters would be harsh for you."][lvl(s[2])]);
  // 4 — Coldest nights
  row(3,"🌙","Coldest nights","The coldest night of a typical year drops to "+deg(L.coldtminMin)+" ("+mon("cold")+")"+(noCold?" · any cold suits you":" · your limit "+deg(p.coldMin)),
    [noCold||L.coldtminMin>=p.coldMin+5?"Cold nights stay well clear of your limit.":"The coldest nights come close to your limit, but stay above it.",
     "The coldest nights dip a little below what you’d like.","Cold snaps would go well beyond your limit.","Severe cold nights, far below your limit."][lvl(s[3])]);
  // 5 — Humidity
  var dpw=L.peakDp<=10?"Even at its most humid, the air stays crisp and dry.":L.peakDp<=16?"Even the most humid month stays comfortable.":L.peakDp<=18?"The humid season is noticeable, but not sticky.":L.peakDp<=21?"The humid season feels sticky.":L.peakDp<=24?"The humid season is muggy and close.":"The humid season is oppressive.";
  row(4,"💧","Humidity","Most humid month ("+mon("dp")+"): dew point averages "+deg(L.peakDp)+(p.dpMax>=99?" · any humidity suits you":" · your limit "+deg(p.dpMax)),
    dpw+(s[4]<99.5?" That’s more humid than you’re comfortable with.":""));
  // 6 — Rainfall
  var wetter=L.totalPrecip>p.rainMax;
  row(5,"🌧️","Rainfall",n(L.totalPrecip)+" mm a year"+(L.totalSnow>0?" (snow included, as melted water)":"")+(p.rainMin===0?" · any amount suits you":" · you like "+n(p.rainMin)+"–"+n(p.rainMax)+" mm"),
    lvl(s[5])===0?"Rainfall sits in the range you like."
      :["",(wetter?"A little wetter":"A little drier")+" than you’d like.",(wetter?"Noticeably wetter":"Noticeably drier")+" than you’d like.",(wetter?"Far wetter":"Far drier")+" than you’d like."][lvl(s[5])]);
  // 7 — Sunshine
  row(6,"🌤️","Sunshine",n(L.sun)+" hours a year"+(p.sunMin===0?" · any amount suits you":" · you want at least "+n(p.sunMin)),
    [L.sun>=2800?"Very sunny — clear skies most days.":L.sun>=2200?"Plenty of sunshine.":"Enough sunshine for you.",
     "A little greyer than you’d like.","Often grey — less sun than you want.","Persistently grey and overcast for you."][lvl(s[6])]);
  // 8 — Wind
  if(entry.wind==null)row(7,"💨","Wind","No wind figure for this place","Not counted against it.");
  else row(7,"💨","Wind","Averages "+n(L.wind)+" km/h · your limit "+n(L.windCeil)+" km/h, from Wind preference",
    [L.wind<10?"Generally calm.":"Breezy at times, but within what you like.","Breezier than you’d like.","Frequently windy for you.","Persistently windy."][lvl(s[7])]);
  // 9 — Snow
  row(8,"☃️","Snow",(L.totalSnow<0.05?"No snow":cm(L.totalSnow)+" cm a year")+(p.snowMax>=9999?" · any amount suits you":p.snowMax===0?" · you’d prefer none":" · your limit "+p.snowMax+" cm"),
    lvl(s[8])===0?(L.totalSnow<0.05?"Snow is essentially unheard of.":"Some snow, within what you’re happy with."):lvl(s[8])<3?"More snow than you’d like.":"A proper snow season, well beyond your limit.");
  // Headline: what holds it back, and what works in its favour
  var col=climScoreCol(L.score),lbl=ruled.length?"Ruled out":livScoreLabel(L.score);
  var NAMES=["summer heat","the hottest days","winter cold","cold nights","humidity",wetter?"too much rain":"too little rain","too little sun","wind","snow"];
  var GOOD=["comfortable summers","few extreme hot days","mild winters","mild nights","comfortable air","rainfall you like","plenty of sun","calm conditions","no snow worries"];
  var losses=rows.filter(function(r){return Math.round(r.lost)>=1;}).sort(function(a,b){return b.lost-a.lost;});
  var totLost=rows.reduce(function(t,r){return t+r.lost;},0);
  var lead;
  if(!losses.length)lead="A complete match — this climate meets every preference you’ve set.";
  else lead=(losses[0].lost>=totLost*0.6?"Held back mostly by ":"Held back by ")+NAMES[losses[0].i]+(losses.length>1&&losses[0].lost<totLost*0.6?", then "+NAMES[losses[1].i]:"")+".";
  var goods=rows.filter(function(r){return s[r.i]>=99.5&&LIV_WEIGHTS[r.i]>=10;}).slice(0,3).map(function(r){return GOOD[r.i];});
  if(losses.length&&goods.length)lead+=" In its favour: "+goods.join(", ")+".";
  rows.sort(function(a,b){return b.lost-a.lost||a.i-b.i;});
  var from=climFromNote(entry);
  var body="<div class='washing-reason'>"
    +"<div style='padding:8px 10px;border-radius:8px;background:"+hzRgba(col,0.14)+";border:1px solid "+hzRgba(col,0.45)+"'>"
    +"<div style='font-size:15px;font-weight:800;color:"+col+";line-height:1.3'>"+L.score+" — "+lbl+"</div>"
    +"<div style='font-size:12px;font-weight:700;color:var(--text-muted);margin-top:2px'>"+entry.name+(entry.ter?", "+entry.ter:"")+"</div>"
    +(from?"<div style='font-size:11px;font-weight:600;color:var(--text-muted);margin-top:2px'>📍 "+from+"</div>":"")
    +"</div>"
    +(ruled.length?"<div style='font-size:13px;font-weight:700;color:var(--text);line-height:1.5;margin-top:10px'>Ruled out by your limits:<div style='font-weight:600;margin-top:2px'>· "+ruled.join("<br>· ")+"</div>"
      +"<div style='font-weight:600;color:var(--text-muted);margin-top:4px'>Without those limits it would score "+L.raw+". Here’s how that breaks down:</div></div>"
      :"<div style='font-size:14px;font-weight:800;color:var(--text);line-height:1.5;margin-top:10px'>"+lead+"</div>")
    +"<div style='margin-top:6px'>"+rows.map(function(r){return r.html(col);}).join("")+"</div>"
    +"<div style='display:flex;justify-content:space-between;align-items:baseline;padding-top:8px'>"
    +"<span style='font-size:13px;font-weight:800;color:var(--text-head)'>Score</span>"
    +"<span style='font-size:13px;font-weight:700;color:var(--text-muted)'>100"+(Math.round(totLost)>0?" − "+Math.round(totLost):"")+" = <span style='font-size:18px;font-weight:800;color:"+col+"'>"+L.raw+"</span>"
    +(ruled.length?" → <span style='font-size:18px;font-weight:800;color:"+col+"'>0</span>":"")+"</span></div>"
    +"<div style='height:1px;background:var(--divider);margin:10px 0 9px'></div>"
    +"<div style='font-size:11px;color:var(--text-muted);line-height:1.6'>Each part can take off up to the points shown (“of 15”), out of 100 in all. Your Liveability preferences set the limits, and the sensitivity sliders set how fast points drop once a limit is passed: temperature for heat and cold, humidity for dew point, and lifestyle for rain, sun, wind and snow. Based on long-term climate averages, not the current weather. Points are rounded, so the lines can differ from the total by one.</div>"
    +"</div>";
  document.getElementById("pop-ttl").textContent="Liveability breakdown";
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}

// ── Liveability map ────────────────────────────────────────────────────────
var _livMap=null;
var _livMapMarkers=[];
var _livMapFilter="exc";
var _livMapRebuildTimer=null;
function livMapScheduleRebuild(){
  if(!_livMap&&_livView!=="list")return;
  if(_livMapRebuildTimer)clearTimeout(_livMapRebuildTimer);
  _livMapRebuildTimer=setTimeout(livMapBuildMarkers,180);
}

var LIV_MAP_REGIONS=[
  {name:"Australia",bounds:[[-44,112],[-10,154]],test:function(lat,lon){return lat>=-44&&lat<=-10&&lon>=112&&lon<=154;}},
  {name:"New Zealand",bounds:[[-47,165],[-34,178]],test:function(lat,lon){return lat>=-47&&lat<=-34&&lon>=165&&lon<=178;}},
  {name:"South East Asia",bounds:[[-10,95],[25,141]],test:function(lat,lon){return lat>=-10&&lat<=25&&lon>=95&&lon<=141;}},
  {name:"China & Taiwan",bounds:[[18,73],[54,135]],test:function(lat,lon){return lat>=18&&lat<=54&&lon>=73&&lon<=135;}},
  {name:"Japan & Korea",bounds:[[24,122],[46,146]],test:function(lat,lon){return lat>=24&&lat<=46&&lon>=122&&lon<=146;}},
  {name:"South Asia",bounds:[[5,60],[38,100]],test:function(lat,lon){return lat>=5&&lat<=38&&lon>=60&&lon<=100;}},
  {name:"British Isles",bounds:[[49,-11],[61,2]],test:function(lat,lon){return lat>=49&&lat<=61&&lon>=-11&&lon<=2;}},
  {name:"Scandinavia & Nordic",bounds:[[54,4],[72,32]],test:function(lat,lon){return lat>=54&&lat<=72&&lon>=4&&lon<=32;}},
  {name:"Western Europe",bounds:[[36,-10],[55,16]],test:function(lat,lon){return lat>=36&&lat<=55&&lon>=-10&&lon<=16;}},
  {name:"Central & Eastern Europe",bounds:[[44,12],[56,32]],test:function(lat,lon){return lat>=44&&lat<=56&&lon>=12&&lon<=32;}},
  {name:"United States",bounds:[[24,-126],[50,-65]],test:function(lat,lon){return lat>=24&&lat<=50&&lon>=-126&&lon<=-65;}},
  {name:"Canada & Alaska",bounds:[[42,-141],[70,-52]],test:function(lat,lon){return lat>=42&&lat<=70&&lon>=-141&&lon<=-52;}},
  {name:"N & Andean S America",bounds:[[-5,-82],[12,-60]],test:function(lat,lon){return lat>=-5&&lat<=12&&lon>=-82&&lon<=-60;}},
  {name:"Southern Cone & Atlantic",bounds:[[-56,-75],[-20,-34]],test:function(lat,lon){return lat>=-56&&lat<=-20&&lon>=-75&&lon<=-34;}},
  {name:"East Africa",bounds:[[-12,28],[15,42]],test:function(lat,lon){return lat>=-12&&lat<=15&&lon>=28&&lon<=42;}},
  {name:"Southern Africa",bounds:[[-35,16],[-15,38]],test:function(lat,lon){return lat>=-35&&lat<=-15&&lon>=16&&lon<=38;}}
];

// Centre the map on the loaded place, zoomed to suit its region (zoom 5 outside the listed
// regions). Re-centres only when the place changes, so panning isn't undone by a redraw, and
// waits while the map is hidden (it can't size itself then) — toggleClim() catches up.
var _livMapCentredFor=null;
function livMapCentre(){
  if(!_livMap)return;
  var lat=window._currentLat,lon=window._currentLon;
  var el=document.getElementById("liv-map");
  if(!el||!el.offsetWidth)return;
  if(lat==null||lon==null){if(!_livMapCentredFor){_livMap.fitBounds(LIV_MAP_REGIONS[0].bounds,{padding:[10,10]});_livMapCentredFor="none";}return;}
  var key=lat+","+lon;
  if(_livMapCentredFor===key)return;
  _livMapCentredFor=key;
  var z=5;
  for(var i=0;i<LIV_MAP_REGIONS.length;i++)if(LIV_MAP_REGIONS[i].test(lat,lon)){z=_livMap.getBoundsZoom(LIV_MAP_REGIONS[i].bounds,false,L.point(20,20));break;}
  _livMap.setView([lat,lon],z);
}
function initLivMap(){
  if(_livMap)return;
  if(typeof L==="undefined")return;
  // Scroll-wheel zoom is off in the card (so the page scrolls past the map on a laptop)
  // and switched on only in the expanded view — see livMapToggleExpand()
  _livMap=L.map("liv-map",{zoomControl:true,scrollWheelZoom:false});
  L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",{
    attribution:"\u00a9 OpenStreetMap contributors",
    maxZoom:13
  }).addTo(_livMap);
  _livMap.setView([0,0],2);
  livMapCentre();
  _livMap.on("move",livMapWrapMarkers);
  if(_livView==="list")livView("list");
  livMapBuildMarkers();
}

function livMapBuildMarkers(){
  if(_livView==="list")livListRender();
  if(!_livMap)return;
  if(typeof CLIM_CACHE==="undefined")return;
  _livMapMarkers.forEach(function(m){_livMap.removeLayer(m);});
  _livMapMarkers=[];
  // Pins are drawn in the order they're added, so add the lowest scores first —
  // that way better-scoring pins always sit on top where pins overlap
  var items=[];
  for(var i=0;i<CLIM_CACHE.length;i++){
    var entry=CLIM_CACHE[i];
    if(entry.lat===null||entry.lat===undefined||entry.lon===null||entry.lon===undefined)continue;
    var score=calcLiveability(entry);
    if(score===null)continue;
    if(_livMapFilter==="exc"&&score<=90)continue;
    items.push({e:entry,s:score});
  }
  items.sort(function(a,b){return a.s-b.s;});
  for(var j=0;j<items.length;j++){
    var entry=items[j].e,score=items[j].s;
    var col=climScoreCol(score);
    var radius=score>=75?8:score>=60?7:6;
    (function(e,s,c){
      var marker=L.circleMarker([e.lat,e.lon],{
        radius:radius,
        fillColor:c,
        color:"rgba(0,0,0,0.35)",
        weight:1.5,
        fillOpacity:0.9
      });
      var ro=livRuleOutReasons(e);
      var popHtml="<div style='font-size:13px;font-weight:800;color:"+c+";margin-bottom:2px'>"+s+" \u2014 "+(ro.length?"Ruled out":livScoreLabel(s))+"</div>"
        +"<div style='font-size:12px;font-weight:700;margin-bottom:6px'>"+e.name+(e.ter?", "+e.ter:"")+"</div>"
        +(ro.length?"<div style='font-size:11px;line-height:1.4;color:#777;margin-bottom:6px'>"+ro.map(function(x){return x.split(":")[0];}).join(" \u00B7 ")+"</div>":"")
        +"<button onclick='livMapLoad("+e.lat+","+e.lon+","+JSON.stringify(e.name+(e.ter?", "+e.ter:"")).replace(/'/g,"&#39;")+")' "
        +"style='font-size:11px;font-weight:800;padding:4px 12px;border-radius:20px;border:1px solid #2a9fd6;background:#2a9fd6;color:#fff;cursor:pointer;width:100%'>"
        +"Load in Comfort Score</button>"
        +"<button onclick='cmpPickAt("+e.lat+","+e.lon+")' "
        +"style='font-size:11px;font-weight:800;padding:4px 12px;border-radius:20px;border:1px solid #2a9fd6;background:transparent;color:#2a9fd6;cursor:pointer;width:100%;margin-top:5px'>"
        +"Compare with this place</button>";
      marker.bindPopup(popHtml,{maxWidth:200,className:"liv-map-popup"});
      marker.addTo(_livMap);
      marker._origLon=e.lon;
      _livMapMarkers.push(marker);
    })(entry,score,col);
  }
  livMapWrapMarkers();
}

// The tiles repeat endlessly east-west but each pin exists once, at its real longitude.
// Keep every pin on whichever copy of the world is nearest the map centre, so pins are
// always there however far you pan — and both sides of the date line show together.
function livMapWrapMarkers(){
  if(!_livMap)return;
  var c=_livMap.getCenter().lng;
  for(var i=0;i<_livMapMarkers.length;i++){
    var m=_livMapMarkers[i],ll=m.getLatLng();
    var lon=m._origLon+360*Math.round((c-m._origLon)/360);
    if(ll.lng!==lon)m.setLatLng([ll.lat,lon]);
  }
}

function livMapFilter(mode){
  _livMapFilter=mode;
  document.getElementById("liv-map-btn-exc").classList.toggle("active",mode==="exc");
  document.getElementById("liv-map-btn-all").classList.toggle("active",mode==="all");
  _livListShown=100;
  livMapBuildMarkers();
}

// ── Climate map as a list ──────────────────────────────────────────────────
// The same places as the map (and the same Excellent only / Show all filter), ranked by your
// Liveability score: one list best first, or grouped by region with each region's best first.
// Tapping a place loads it, as "Load in Comfort Score" does on a pin; ⇄ compares it.
var _livView=(function(){try{return localStorage.getItem("liv_view")==="list"?"list":"map";}catch(e){return"map";}})();
var _livSort=(function(){try{return localStorage.getItem("liv_sort")==="region"?"region":"score";}catch(e){return"score";}})();
var _livListShown=100,_livRegOpen={};
function livSeg(a,b,onA){
  var x=document.getElementById(a),y=document.getElementById(b);
  if(x){x.classList.toggle("active",onA);x.setAttribute("aria-pressed",onA?"true":"false");}
  if(y){y.classList.toggle("active",!onA);y.setAttribute("aria-pressed",onA?"false":"true");}
}
function livView(v){
  _livView=v==="list"?"list":"map";
  try{localStorage.setItem("liv_view",_livView);}catch(e){}
  livSeg("liv-view-map","liv-view-list",_livView==="map");
  var map=document.getElementById("liv-map"),list=document.getElementById("liv-list");
  if(map)map.style.display=_livView==="map"?"":"none";
  if(list)list.style.display=_livView==="list"?"":"none";
  if(_livView==="list"){_livListShown=100;livListRender();}
  else{initLivMap();if(_livMap)setTimeout(function(){_livMap.invalidateSize();livMapCentre();},40);}
}
function livListSort(s){
  _livSort=s==="region"?"region":"score";
  try{localStorage.setItem("liv_sort",_livSort);}catch(e){}
  _livListShown=100;
  livListRender();
  var b=document.getElementById("liv-list-body");if(b)b.scrollTop=0;
}
function livListItems(){
  var all=[];
  for(var i=0;i<CLIM_CACHE.length;i++){
    var e=CLIM_CACHE[i];
    if(e.lat==null||e.lon==null)continue;
    var s=calcLiveability(e);
    if(s===null)continue;
    all.push({i:i,e:e,s:s});
  }
  // Best first; equal scores alphabetically, so the order doesn't jump about
  all.sort(function(a,b){return b.s-a.s||a.e.name.localeCompare(b.e.name);});
  for(var k=0;k<all.length;k++)all[k].rank=k+1;
  return all;
}
function livAttr(t){return cmpEsc(t).replace(/'/g,"&#39;").replace(/"/g,"&quot;");}
function livListRow(x,rank,sub){
  var e=x.e,c=climScoreCol(x.s),nm=e.name+(e.ter?", "+e.ter:""),cur=x.e===cmpA();
  return"<div class='liv-row"+(cur?" cur":"")+"'>"
    +"<span class='liv-rank'>"+rank+"</span>"
    +"<button class='liv-row-main' onclick='livListLoad("+x.i+")' title='Load "+livAttr(nm)+"'>"
    +"<span class='liv-row-name'>"+cmpEsc(e.name)+(cur?" · shown above":"")+"</span>"
    +"<span class='liv-row-sub'>"+cmpEsc(sub)+(livRuleOutReasons(e).length?" · ruled out":"")+"</span></button>"
    +"<span class='liv-row-score' style='color:"+c+"'>"+x.s+"</span>"
    +"<button class='liv-row-cmp' onclick='livListCmp("+x.i+")' aria-label='Compare with "+livAttr(nm)+"' title='Compare with this place'>⇄</button>"
    +"</div>";
}
function livListRender(){
  var body=document.getElementById("liv-list-body"),note=document.getElementById("liv-list-note");
  if(!body||_livView!=="list")return;
  livSeg("liv-sort-score","liv-sort-region",_livSort==="score");
  if(typeof CLIM_CACHE==="undefined"){body.innerHTML="<div class='liv-empty'>⏳ Loading climate data…</div>";if(note)note.textContent="";return;}
  var all=livListItems(),exc=_livMapFilter==="exc";
  var shown=exc?all.filter(function(x){return x.s>90;}):all;
  var here=cmpA(),hereX=null;
  for(var k=0;k<all.length;k++)if(all[k].e===here){hereX=all[k];break;}
  var n=function(v){return v.toLocaleString("en-AU");};
  if(note)note.textContent=(exc?n(shown.length)+" Excellent places (over 90)":"All "+n(all.length)+" places")
    +(hereX?" · "+hereX.e.name+" ranks #"+n(hereX.rank)+" of "+n(all.length):"");
  if(!shown.length){body.innerHTML="<div class='liv-empty'>No place scores over 90 with your current preferences. Tap <b>Show all</b> to see every place in order.</div>";return;}
  var html="";
  if(_livSort==="score"){
    var lim=Math.min(shown.length,_livListShown);
    for(var j=0;j<lim;j++){var x=shown[j];html+=livListRow(x,x.rank,(x.e.ter?x.e.ter+" · ":"")+x.e.region);}
    if(shown.length>lim)html+="<button class='liv-more' onclick='_livListShown+=200;livListRender()'>Show more ("+n(shown.length-lim)+" to go)</button>";
  }else{
    // Regions in order of their best place; the region of the place shown above starts open
    var regs={},order=[];
    shown.forEach(function(x){var r=x.e.region;if(!regs[r]){regs[r]=[];order.push(r);}regs[r].push(x);});
    var hereReg=here&&here.region;
    order.forEach(function(r){
      var L=regs[r],open=_livRegOpen.hasOwnProperty(r)?_livRegOpen[r]:r===hereReg;
      html+="<details class='liv-reg'"+(open?" open":"")+" ontoggle='_livRegOpen["+JSON.stringify(r).replace(/'/g,"&#39;")+"]=this.open'>"
        +"<summary>"+cmpEsc(r)+"<span class='liv-reg-meta'>"+n(L.length)+(L.length===1?" place":" places")+" · best "+L[0].s+"</span></summary>";
      L.forEach(function(x,q){html+=livListRow(x,q+1,x.e.ter||r);});
      html+="</details>";
    });
  }
  body.innerHTML=html;
}
function livListLoad(i){
  var e=CLIM_CACHE[i];if(!e)return;
  livMapLoad(e.lat,e.lon,e.name+(e.ter?", "+e.ter:""));
}
function livListCmp(i){
  var e=CLIM_CACHE[i];if(!e)return;
  if(e===cmpA()){showToast("That’s the place already shown — pick another to compare");return;}
  livMapToggleExpand(false);
  cmpPick(i);
}
function livMapToggleExpand(force){
  var wrap=document.getElementById("liv-map-wrap"),btn=document.getElementById("liv-map-btn-expand");
  if(!wrap)return;
  var expand=(force===undefined)?!wrap.classList.contains("expanded"):force;
  if(expand===wrap.classList.contains("expanded"))return;
  wrap.classList.toggle("expanded",expand);
  var climFull=document.getElementById("clim-card").classList.contains("full");
  document.body.style.overflow=(expand||climFull)?"hidden":"";
  if(btn)btn.innerHTML=expand?"&#x2715; Close":"&#x2922; Expand";
  initLivMap();
  if(_livMap){
    if(expand)_livMap.scrollWheelZoom.enable();else _livMap.scrollWheelZoom.disable();
    setTimeout(function(){_livMap.invalidateSize();},60);
  }
}
document.addEventListener("keydown",function(e){
  if(e.key!=="Escape")return;
  var w=document.getElementById("liv-map-wrap");
  if(w&&w.classList.contains("expanded"))livMapToggleExpand(false);
  else if(!document.getElementById("pop-ov").classList.contains("open"))climFullToggle(false);
});

function livMapLoad(lat,lon,label){
  livMapToggleExpand(false);
  climFullToggle(false);
  var popups=document.querySelectorAll(".leaflet-popup");
  for(var i=0;i<popups.length;i++)popups[i].style.display="none";
  // The pin's own height, so its own climate profile is matched straight away
  var pin=typeof CLIM_CACHE!=="undefined"?CLIM_CACHE.filter(function(e){return e.lat===lat&&e.lon===lon;})[0]:null;
  fetchWeatherWithCb(lat,lon,label,null,pin&&pin.elev!=null?pin.elev:undefined);
  pageScrollTo(0,true);
}

// ── Köppen explainers ──────────────────────────────────────────────────────
// Criteria follow Peel et al. (2007), as used for this app's climate profiles: monthly
// MEAN temperatures, 0°C between C and D. Colours are the Beck et al. (2018) map legend
// used on Wikipedia. Examples are places in this app's climate data, at their cached
// coordinates, so each one loads its own climate profile (types with none have no examples).
var KOPPEN_COL={Af:"0,0,255",Am:"0,120,255",Aw:"70,170,250",As:"70,170,250",
  BWh:"255,0,0",BWk:"255,150,150",BWn:"255,150,150",BSh:"245,165,0",BSk:"255,220,100",
  Csa:"255,255,0",Csb:"200,200,0",Csc:"150,150,0",Cwa:"150,255,150",Cwb:"100,200,100",Cwc:"50,150,50",
  Cfa:"200,255,80",Cfb:"100,255,80",Cfc:"50,200,0",Dsa:"255,0,255",Dsb:"200,0,200",Dsc:"150,50,150",Dsd:"150,100,150",
  Dwa:"170,175,255",Dwb:"90,120,220",Dwc:"75,80,180",Dwd:"50,0,135",Dfa:"0,255,255",Dfb:"55,200,255",Dfc:"0,125,125",Dfd:"0,70,95",
  ET:"178,178,178",EF:"102,102,102"};
var KOP_C="The coldest month averages above 0°C but below 18°C, and at least one month averages above 10°C.";
var KOP_D="The coldest month averages 0°C or below, and at least one month averages above 10°C.";
var KOP_S=" Dry summer (s): the driest summer month gets under 40 mm and less than a third of the wettest winter month.";
var KOP_W=" Dry winter (w): the driest winter month gets less than a tenth of the wettest summer month.";
var KOP_F=" No dry season (f): rain falls in every season, meeting neither the dry-summer nor the dry-winter test.";
var KOP_A=" Hot summer (a): the warmest month averages 22°C or more.";
var KOP_B=" Warm summer (b): the warmest month averages below 22°C, with at least four months above 10°C.";
var KOP_CC=" Cold summer (c): only one to three months average above 10°C.";
var KOP_DD=" Very cold winter (d): the coldest month averages below −38°C.";
var KOP_DRY="Annual rainfall is below a dryness threshold of 20 × the mean annual temperature, plus 280 mm when most rain falls in the warm half of the year or 140 mm when it is spread evenly.";
var KOPPEN_DATA={
  // A — Tropical
  "Af":{name:"Tropical Rainforest",sum:"Hot and wet all year, with no dry season.",
    features:"Temperatures barely change through the year, afternoon storms are frequent and humidity stays high. Dense evergreen rainforest is the natural cover.",
    calc:"Every month averages 18°C or more, and even the driest month gets at least 60 mm of rain.",
    examples:[["Singapore",1.29,103.85],["Belém, Brazil",-1.45,-48.47],["Innisfail, QLD",-17.52,146.03]]},
  "Am":{name:"Tropical Monsoon",sum:"Hot all year, with a very wet monsoon and a short dry season.",
    features:"A long wet season brings rain heavy enough to carry the land through a brief dry season. Forest stays green year-round, though some trees drop their leaves in the dry months.",
    calc:"Every month averages 18°C or more. The driest month gets under 60 mm, but at least 100 mm minus 1/25 of the annual rainfall — so the wetter the year, the drier the dry season can be.",
    examples:[["Cairns, QLD",-16.92,145.77],["Jakarta, Indonesia",-6.18,106.83],["Miami, USA",25.77,-80.19]]},
  "Aw":{name:"Tropical Savanna",sum:"Hot all year, with a wet summer and a long dry winter.",
    features:"The year divides into a humid wet season of storms and a dry season of clear skies and lower humidity. Grassland with scattered trees is typical, and fire is common late in the dry season.",
    calc:"Every month averages 18°C or more, the driest month is too dry for a monsoon climate (under 100 mm minus 1/25 of the annual rainfall), and the dry season falls in the cooler, low-sun half of the year.",
    examples:[["Darwin, NT",-12.46,130.84],["Bangkok, Thailand",13.75,100.49],["Ho Chi Minh City, Vietnam",10.78,106.7]]},
  "As":{name:"Tropical Savanna (Dry Summer)",sum:"Hot all year, with the dry season in summer instead of winter.",
    features:"The wet-and-dry rhythm of a tropical savanna in reverse: most rain comes in the cooler months, often from onshore winds or a retreating monsoon. Uncommon, found mainly on a few tropical coasts.",
    calc:"As for tropical savanna, but the dry season falls in the warmer, high-sun half of the year.",
    examples:[["Dili, Timor-Leste",-8.55,125.58],["São Tomé",0.34,6.73]]},
  // B — Arid
  "BWh":{name:"Hot Desert",sum:"Very hot, very dry, and sunny almost every day.",
    features:"Rain is scarce and unreliable. Summer days are extremely hot, while clear skies let nights cool sharply. Vegetation is sparse or absent.",
    calc:KOP_DRY+" Desert (W): less than half the threshold. Hot (h): the mean annual temperature is 18°C or more.",
    examples:[["Alice Springs, NT",-23.7,133.88],["Cairo, Egypt",30.05,31.24],["Phoenix, USA",33.45,-112.07]]},
  "BWk":{name:"Cold Desert",sum:"Very dry, with warm to hot summers and cold winters.",
    features:"Rain is scarce, often because mountains block moist air or the land sits high or far inland. Summers can be hot, winters freeze, and the daily temperature swing is large.",
    calc:KOP_DRY+" Desert (W): less than half the threshold. Cold (k): the mean annual temperature is below 18°C.",
    examples:[["Berri, SA",-34.29,140.6],["St George, USA",37.11,-113.58],["Antofagasta, Chile",-23.65,-70.4]]},
  "BWn":{name:"Fog Desert",sum:"A cool coastal desert where fog, not rain, brings most of the moisture.",
    features:"Cold ocean currents chill the air offshore, so rain almost never falls but low cloud and fog are frequent, and temperatures stay mild for a desert. Found on the coasts of Peru and northern Chile, Namibia and the western Sahara.",
    calc:KOP_DRY+" Desert (W): less than half the threshold. Fog (n, from the German Nebel): frequent fog. Peel et al. (2007) don’t use the n suffix; it is an older extension still seen in some references.",
    examples:[]},
  "BSh":{name:"Hot Semi-Arid (Steppe)",sum:"Hot and dry, with a short, unreliable rainy season.",
    features:"Wetter than a desert — enough rain for grassland and scrub — but too dry and erratic for reliable farming without irrigation. Droughts are common.",
    calc:KOP_DRY+" Steppe (S): between half and all of the threshold. Hot (h): the mean annual temperature is 18°C or more.",
    examples:[["Longreach, QLD",-23.44,144.25],["Tucson, USA",32.22,-110.97],["Niamey, Niger",13.52,2.11]]},
  "BSk":{name:"Cold Semi-Arid (Steppe)",sum:"Dry, with warm summers and cold winters.",
    features:"Grassland and scrub country, often in the rain shadow of mountains or deep inland. Large swings between seasons and between day and night; winters bring frost and some snow.",
    calc:KOP_DRY+" Steppe (S): between half and all of the threshold. Cold (k): the mean annual temperature is below 18°C.",
    examples:[["Mildura, VIC",-34.2,142.15],["Denver, USA",39.74,-104.98],["Santiago, Chile",-33.44,-70.65]]},
  // C — Temperate
  "Csa":{name:"Hot-Summer Mediterranean",sum:"Hot, dry summers and mild, wet winters.",
    features:"Long, sunny summers with little rain, and most of the year’s rain in the cooler months. Frost is rare at low levels. Native vegetation is drought- and fire-adapted shrubland and open woodland.",
    calc:KOP_C+KOP_S+KOP_A,
    examples:[["Adelaide, SA",-34.93,138.6],["Perth, WA",-31.95,115.86],["Athens, Greece",37.9756,23.7348]]},
  "Csb":{name:"Warm-Summer Mediterranean",sum:"Warm, dry summers and mild, wet winters.",
    features:"The Mediterranean pattern with gentler summers, usually from altitude or a cool coast. Sea breezes and summer fog are common on the coast.",
    calc:KOP_C+KOP_S+KOP_B,
    examples:[["Paracombe, SA",-34.85,138.77],["San Francisco, USA",37.78,-122.42],["Cape Town, South Africa",-33.92,18.42]]},
  "Csc":{name:"Cold-Summer Mediterranean",sum:"Short, cool, dry summers and mild, wet winters.",
    features:"Very rare. Found mostly high on mountains in otherwise Mediterranean regions, such as the Cascades and Sierra Nevada, and occasionally on cool, exposed coasts. The growing season is short.",
    calc:KOP_C+KOP_S+KOP_CC,
    examples:[]},
  "Cwa":{name:"Monsoon-Influenced Humid Subtropical",sum:"Hot, wet summers and mild, dry winters.",
    features:"The summer monsoon brings heat, humidity and heavy rain; winters are sunny, dry and mild to cool. Common across northern India, southern China and the higher parts of southern Africa.",
    calc:KOP_C+KOP_W+KOP_A,
    examples:[["Hong Kong",22.28,114.16],["Hanoi, Vietnam",21.0283,105.854],["Pretoria, South Africa",-25.75,28.19]]},
  "Cwb":{name:"Subtropical Highland",sum:"Mild all year, with a wet summer and a dry winter.",
    features:"Altitude tempers what would otherwise be a tropical climate: days are warm rather than hot, nights are cool, and the seasons change mainly in rainfall rather than temperature.",
    calc:KOP_C+KOP_W+KOP_B,
    examples:[["Nairobi, Kenya",-1.29,36.82],["Mexico City, Mexico",19.43,-99.13],["Kunming, China",25.04,102.72]]},
  "Cwc":{name:"Cold Subtropical Highland",sum:"Cool all year at high altitude, with a wet summer.",
    features:"Found only at very high elevations in the tropics and subtropics, such as the Bolivian altiplano. Days are mild, nights often freeze, and the dry season brings clear skies.",
    calc:KOP_C+KOP_W+KOP_CC,
    examples:[]},
  "Cfa":{name:"Humid Subtropical",sum:"Hot, humid summers and mild winters, with rain all year.",
    features:"Summers are sticky with thunderstorms; winters are mild with occasional frost. Rain falls in every season, often peaking in summer. Common on the east coasts of continents.",
    calc:KOP_C+KOP_F+KOP_A,
    examples:[["Brisbane, QLD",-27.47,153.03],["Sydney, NSW",-33.87,151.21],["Shanghai, China",31.23,121.47]]},
  "Cfb":{name:"Oceanic",sum:"Mild all year, with rain spread through every season.",
    features:"Neither summers nor winters are extreme, cloud is frequent, and rain comes often but rarely heavily. Common on mid-latitude west coasts and in temperate highlands.",
    calc:KOP_C+KOP_F+KOP_B,
    examples:[["Canberra, ACT",-35.28,149.13],["Melbourne, VIC",-37.81,144.96],["Hobart, TAS",-42.88,147.32]]},
  "Cfc":{name:"Subpolar Oceanic",sum:"Cool summers and mild winters, with frequent wind and rain.",
    features:"The cold-summer edge of the oceanic climate: short, cool summers, winters that hover around freezing without deep cold, and persistent cloud. Trees struggle in the most exposed places.",
    calc:KOP_C+KOP_F+KOP_CC,
    examples:[["Tórshavn, Faroe Islands",62.01,-6.77],["Auckland Island",-50.52,166.22]]},
  // D — Continental
  "Dsa":{name:"Mediterranean-Influenced Hot-Summer Continental",sum:"Hot, dry summers and cold, snowy winters.",
    features:"A Mediterranean rainfall pattern at continental temperatures, usually on high plateaus beside Mediterranean regions. Rare; found in eastern Turkey, north-western Iran and parts of the American Intermountain West.",
    calc:KOP_D+KOP_S+KOP_A,
    examples:[]},
  "Dsb":{name:"Mediterranean-Influenced Warm-Summer Continental",sum:"Warm, dry summers and cold, snowy winters.",
    features:"Mostly mountain valleys and plateaus beside Mediterranean climates, such as the Sierra Nevada. Heavy winter snow gives way to sunny, dry summers.",
    calc:KOP_D+KOP_S+KOP_B,
    examples:[["South Lake Tahoe, USA",38.93,-119.98],["Flagstaff, USA",35.2,-111.65]]},
  "Dsc":{name:"Mediterranean-Influenced Subarctic",sum:"Short, cool, dry summers and long, cold winters.",
    features:"A rare subarctic type where summer is the drier season. Found at high elevations in western North America and Central Asia, and in a few northern places such as north Iceland.",
    calc:KOP_D+KOP_S+KOP_CC,
    examples:[]},
  "Dsd":{name:"Mediterranean-Influenced Extreme Subarctic",sum:"Brief, dry summers and extremely cold winters.",
    features:"One of the rarest climates on Earth, limited to small, remote areas of the Russian Far East. No well-known towns have it.",
    calc:KOP_D+KOP_S+KOP_DD,
    examples:[]},
  "Dwa":{name:"Monsoon-Influenced Hot-Summer Continental",sum:"Hot, humid summers and very cold, dry winters.",
    features:"Siberian air rules winter, bringing clear, bitterly cold and dry weather; the summer monsoon brings heat and most of the year’s rain. Typical of northern China and Korea.",
    calc:KOP_D+KOP_W+KOP_A,
    examples:[["Beijing, China",39.91,116.39],["Seoul, South Korea",37.57,127],["Harbin, China",45.76,126.63]]},
  "Dwb":{name:"Monsoon-Influenced Warm-Summer Continental",sum:"Warm, wet summers and cold, dry winters.",
    features:"Like the hot-summer version but cooler in summer, from latitude, a cool sea or altitude. Found in the Russian Far East, northern Korea and the high country of south-western China.",
    calc:KOP_D+KOP_W+KOP_B,
    examples:[["Chongjin, North Korea",41.78,129.82],["Hulunbuir, China",49.21,119.74]]},
  "Dwc":{name:"Monsoon-Influenced Subarctic",sum:"Short, mild, wet summers and long, very cold, dry winters.",
    features:"Boreal forest country in north-eastern Asia and the high Himalaya, with most of the year’s precipitation in summer and little snow despite the cold.",
    calc:KOP_D+KOP_W+KOP_CC,
    examples:[]},
  "Dwd":{name:"Monsoon-Influenced Extreme Subarctic",sum:"Brief summers and extremely cold, very dry winters.",
    features:"Confined to north-eastern Siberia. Winters are among the coldest on Earth, with little snowfall, while summer days can be surprisingly warm.",
    calc:KOP_D+KOP_W+KOP_DD,
    examples:[]},
  "Dfa":{name:"Hot-Summer Humid Continental",sum:"Hot, humid summers and cold, snowy winters.",
    features:"Large seasonal swings, with precipitation in every season and thunderstorms in summer. Deciduous forest and prairie are typical.",
    calc:KOP_D+KOP_F+KOP_A,
    examples:[["Chicago, USA",41.88,-87.62],["Sapporo, Japan",43.06,141.35],["Boston, USA",42.36,-71.06]]},
  "Dfb":{name:"Warm-Summer Humid Continental",sum:"Warm summers and long, cold, snowy winters.",
    features:"Precipitation in every season, a reliable winter snow cover, and mixed forest. Widespread across eastern Europe, southern Canada and the northern United States.",
    calc:KOP_D+KOP_F+KOP_B,
    examples:[["Helsinki, Finland",60.17,24.97],["Oslo, Norway",59.91,10.74],["Warsaw, Poland",52.24,21.03]]},
  "Dfc":{name:"Subarctic",sum:"Short, cool summers and long, severe winters.",
    features:"Boreal (taiga) forest dominates, the growing season is brief, and permafrost is common further north.",
    calc:KOP_D+KOP_F+KOP_CC,
    examples:[["Tromsø, Norway",69.65,18.96],["Fort Nelson, Canada",58.81,-122.69],["Atlin, Canada",59.57,-133.7]]},
  "Dfd":{name:"Extreme Subarctic",sum:"Brief, warm summers and the harshest winters outside Antarctica.",
    features:"Winter lows fall below −60°C, yet summer days can pass 30°C — the largest annual temperature range on Earth. Confined to eastern Siberia.",
    calc:KOP_D+KOP_F+KOP_DD,
    examples:[]},
  // E — Polar
  "ET":{name:"Tundra",sum:"No true summer — the warmest month stays below 10°C.",
    features:"Too cold for trees: mosses, lichens, grasses and low shrubs grow in a short thaw above permafrost. Found on Arctic coasts, sub-Antarctic islands and mountains above the tree line.",
    calc:"The warmest month averages above 0°C but below 10°C.",
    examples:[["Mount Wellington summit, TAS",-42.9,147.24],["Kosciuszko summit, NSW",-36.45,148.26],["Mount Washington, USA",44.27,-71.3]]},
  "EF":{name:"Ice Cap",sum:"Below freezing in every month of the year.",
    features:"Permanent ice and snow with no vegetation. Covers most of Antarctica and the interior of Greenland.",
    calc:"Every month averages 0°C or below.",
    examples:[]}
};
// Codes in the climate data sometimes arrive mis-cased (Bsk, bwh, Et); fix the case before lookup
function koppenKey(code){
  var c=String(code||"").trim();
  if(!c)return"";
  var g=c.charAt(0).toUpperCase();
  if(g==="B")return"B"+c.charAt(1).toUpperCase()+c.slice(2).toLowerCase();
  if(g==="E")return"E"+c.slice(1).toUpperCase();
  return g+c.slice(1).toLowerCase();
}
// What each letter of a code means, e.g. Csb → Temperate · dry summer · warm summer
function koppenLetters(code){
  var g=code.charAt(0),a=code.charAt(1),b=code.charAt(2);
  var G={A:"Tropical",B:"Arid",C:"Temperate",D:"Continental",E:"Polar"};
  var S=g==="A"?{f:"rainforest",m:"monsoon",w:"dry winter",s:"dry summer"}
    :g==="B"?{W:"desert",S:"steppe"}:g==="E"?{T:"tundra",F:"ice cap"}
    :{s:"dry summer",w:"dry winter",f:"no dry season"};
  var T=g==="B"?{h:"hot",k:"cold",n:"fog"}:{a:"hot summer",b:"warm summer",c:"cold summer",d:"very cold winter"};
  var out=[];
  if(G[g])out.push("<b>"+g+"</b> "+G[g].toLowerCase());
  if(a&&S[a])out.push("<b>"+a+"</b> "+S[a]);
  if(b&&T[b])out.push("<b>"+b+"</b> "+T[b]);
  return out.join(" · ");
}
function koppenSwatch(code,size){
  var rgb=KOPPEN_COL[koppenKey(code)];
  if(!rgb)return"";
  return"<span style='display:inline-block;width:"+size+"px;height:"+size+"px;border-radius:3px;background:rgb("+rgb+");border:1px solid rgba(0,0,0,0.25);vertical-align:-1px;margin-right:5px'></span>";
}
function showKoppenPop(code){
  var key=koppenKey(code),k=KOPPEN_DATA[key];
  var ttl=document.getElementById("pop-ttl"),bd=document.getElementById("pop-body");
  if(!k){
    ttl.textContent=key||"Climate type";
    bd.innerHTML="<div class='washing-reason'>No explainer is available for the climate code “"+key+"”."+"<div onclick='showKoppenTable(\""+key+"\")' style='margin-top:12px;padding-top:10px;border-top:1px solid var(--divider);text-align:center;font-size:12.5px;font-weight:800;color:var(--text-sec);cursor:pointer'>Climate classifications \u203A</div>"+"</div>";
    document.getElementById("pop-ov").classList.add("open");
    return;
  }
  var rgb=KOPPEN_COL[key]||"128,128,128";
  var rule="<div style='height:1px;background:var(--divider);margin:11px 0 10px'></div>";
  var band="<div style='padding:8px 10px;border-radius:8px;background:rgba("+rgb+",0.22);border:1px solid rgba("+rgb+",0.6);display:flex;align-items:center;gap:10px'>"
    +"<span style='flex-shrink:0;width:22px;height:22px;border-radius:5px;background:rgb("+rgb+");border:1px solid rgba(0,0,0,0.25)'></span>"
    +"<div><div style='font-size:15px;font-weight:800;color:var(--text);line-height:1.2'>"+key+"</div>"
    +"<div style='font-size:11.5px;font-weight:600;color:var(--text);opacity:0.8;line-height:1.4'>"+koppenLetters(key)+"</div></div></div>";
  var ex="";
  if(k.examples.length){
    ex=rule+"<div style='font-size:12px;font-weight:700;color:var(--text-muted);margin-bottom:6px'>Places with this climate — tap to load</div><div style='display:flex;flex-wrap:wrap;gap:6px'>";
    for(var i=0;i<k.examples.length;i++){
      ex+="<span class='ann' onclick='loadKoppenExample(\""+key+"\","+i+")' style='cursor:pointer;color:var(--text);background:rgba("+rgb+",0.16);border-color:rgba("+rgb+",0.55)'>"+k.examples[i][0]+"</span>";
    }
    ex+="</div>";
  }else{
    ex=rule+"<div style='font-size:12px;font-weight:600;color:var(--text-muted);line-height:1.6'>None of the places in this app\u2019s climate data have this climate type yet, so there are no examples to load.</div>";
  }
  bd.innerHTML="<div class='washing-reason'>"+band
    +"<div style='font-size:14px;font-weight:800;color:var(--text);line-height:1.5;margin-top:10px'>"+k.sum+"</div>"
    +"<div style='font-size:12.5px;font-weight:600;color:var(--text);line-height:1.65;margin-top:4px'>"+k.features+"</div>"
    +ex+rule
    +"<div style='font-size:11px;color:var(--text-muted);line-height:1.6'>How it’s classified: "+k.calc
    +" Temperatures are monthly means of day and night, following Peel et al. (2007)"
    +(/^[CD]/.test(key)?", which puts the temperate–continental boundary at 0°C (some sources use −3°C)":"")
    +". Places near a boundary can change type between climate periods.</div>"
    +"<div onclick='showKoppenTable(\""+key+"\")' style='margin-top:12px;padding-top:10px;border-top:1px solid var(--divider);text-align:center;font-size:12.5px;font-weight:800;color:var(--text-sec);cursor:pointer'>Climate classifications \u203A</div>"
    +"</div>";
  ttl.textContent=k.name;
  document.getElementById("pop-ov").classList.add("open");
}

// ── Climate classifications table ─────────────────────────────────────────
// Every Köppen code, A to E, in its map colour. The current location's code is outlined;
// tap any code for its explainer. fromCode adds a back link to the explainer it came from.
var KOPPEN_TABLE=[
  ["A","Tropical",[[["Af","Am","Aw","As"],""]]],
  ["B","Arid",[[["BWh","BWk","BWn"],"desert"],[["BSh","BSk"],"steppe"]]],
  ["C","Temperate",[[["Csa","Csb","Csc"],"dry summer"],[["Cwa","Cwb","Cwc"],"dry winter"],[["Cfa","Cfb","Cfc"],"no dry season"]]],
  ["D","Continental",[[["Dsa","Dsb","Dsc","Dsd"],"dry summer"],[["Dwa","Dwb","Dwc","Dwd"],"dry winter"],[["Dfa","Dfb","Dfc","Dfd"],"no dry season"]]],
  ["E","Polar",[[["ET","EF"],""]]]
];
function showKoppenTable(fromCode){
  var cur=window._climCur&&window._climCur.koppen?koppenKey(window._climCur.koppen):"";
  var chip=function(c){
    var rgb=KOPPEN_COL[c]||"128,128,128",p=rgb.split(",").map(Number);
    var txt=(0.299*p[0]+0.587*p[1]+0.114*p[2])/255>0.55?"#111":"#fff";
    var nm=KOPPEN_DATA[c]?KOPPEN_DATA[c].name:c;
    return"<span onclick='showKoppenPop(\""+c+"\")' title='"+nm.replace(/'/g,"&#39;")+"' style='display:inline-flex;align-items:center;justify-content:center;width:46px;height:30px;border-radius:7px;cursor:pointer;font-size:12.5px;font-weight:800;background:rgb("+rgb+");color:"+txt+";"
      +(c===cur?"border:2.5px solid var(--text);box-shadow:0 0 0 2px var(--pop-bg) inset":"border:1px solid rgba(0,0,0,0.2)")+"'>"+c+"</span>";
  };
  var html="<div class='washing-reason'>"
    +"<div style='font-size:12.5px;font-weight:600;color:var(--text);line-height:1.6;margin-bottom:10px'>The Köppen system sorts climates by temperature and rainfall. The first letter is the main group, the second the rainfall pattern (or desert and steppe), and the third how hot the summer — or cold the winter — gets. Tap a code to read about it.</div>";
  KOPPEN_TABLE.forEach(function(g){
    html+="<div style='margin-top:10px'><div style='font-size:12px;font-weight:800;color:var(--text-head);margin-bottom:5px'>"+g[0]+" \u00B7 "+g[1]+"</div>";
    g[2].forEach(function(r){
      html+="<div style='display:flex;align-items:center;gap:8px;margin-bottom:5px'><div style='display:flex;gap:5px;flex-shrink:0;width:199px'>"+r[0].map(chip).join("")+"</div>"
        +(r[1]?"<div style='font-size:10.5px;font-weight:700;color:var(--text-muted);line-height:1.2'>"+r[1]+"</div>":"")+"</div>";
    });
    html+="</div>";
  });
  html+="<div style='height:1px;background:var(--divider);margin:11px 0 9px'></div>"
    +"<div style='font-size:11px;color:var(--text-muted);line-height:1.6'>"+(cur?"Outlined: this location ("+cur+"). ":"")+"Colours match the Köppen–Geiger world map (Beck et al., 2018); codes follow Peel et al. (2007), plus As and BWn.</div>"
    +(fromCode?"<div onclick='showKoppenPop(\""+fromCode+"\")' style='margin-top:12px;padding-top:10px;border-top:1px solid var(--divider);text-align:center;font-size:12px;font-weight:700;color:var(--text-muted);cursor:pointer'>\u2190 Back to "+fromCode+"</div>":"")
    +"</div>";
  document.getElementById("pop-ttl").textContent="Climate classifications";
  document.getElementById("pop-body").innerHTML=html;
  document.getElementById("pop-ov").classList.add("open");
}
function loadKoppenExample(code,i){
  var ex=KOPPEN_DATA[code]&&KOPPEN_DATA[code].examples[i];
  if(!ex)return;
  closePop();
  fetchWeather(ex[1],ex[2],ex[0]);
  pageScrollTo(0,true);
}

function toggleClimNotes(){
  var body=document.getElementById("clim-notes-body");
  var arrow=document.getElementById("clim-notes-arrow");
  if(!body)return;
  var open=body.style.display==="none";
  body.style.display=open?"block":"none";
  arrow.style.transform=open?"rotate(0deg)":"rotate(-90deg)";
  if(!open||body.getAttribute("data-loaded"))return;
  var key=window._climNotesKey;
  body.textContent="\u23F3 Loading\u2026";
  loadClimNotes().then(function(N){
    if(window._climNotesKey!==key||!body.isConnected)return;
    body.innerHTML=N[key]||"No notes for this place yet.";body.setAttribute("data-loaded","1");
  }).catch(function(){
    if(window._climNotesKey===key)body.textContent="The notes couldn\u2019t load \u2014 check your connection and try again.";
  });
}
function showClimMonthPop(i){
  if(!window._climMonthly)return;
  var m=window._climMonthly[i];
  var fN=function(v,d){return(v!==null&&v!==undefined&&!isNaN(v))?Number(v).toFixed(d):"—";};
  function sc(v,dp){if(v===null||v===undefined||isNaN(v))return null;return calc(v,dp,0).score;}
  function chip(s){if(s===null)return "<span style='color:var(--text-muted)'>—</span>";var c=climScoreCol(s);return "<span style='display:inline-block;padding:1px 7px;border-radius:12px;font-size:11px;font-weight:800;background:"+c.replace(",1)",",.15)")+"22;color:"+c+"'>"+s+"</span>";}
  var body="<table style='width:100%;border-collapse:collapse'>"
    +"<tr><td style='color:var(--text-muted);font-size:12px;padding:5px 0'>Warmest day avg</td><td style='text-align:right;font-weight:800;font-size:13px'>"+climT(m.tmaxMax)+"°</td><td style='text-align:right;padding-left:8px'>"+chip(sc(m.tmaxMax,m.dp))+"</td></tr>"
    +"<tr><td style='color:var(--text);font-size:12px;padding:5px 0'>Average high</td><td style='text-align:right;font-weight:800;font-size:13px'>"+climT(m.T)+"°</td><td style='text-align:right;padding-left:8px'>"+chip(sc(m.T,m.dp))+"</td></tr>"
    +"<tr><td style='color:var(--text);font-size:12px;padding:5px 0'>Average low</td><td style='text-align:right;font-weight:800;font-size:13px'>"+climT(m.tmin)+"°</td><td style='text-align:right;padding-left:8px'>"+chip(sc(m.tmin,m.dp))+"</td></tr>"
    +"<tr><td style='color:var(--text-muted);font-size:12px;padding:5px 0'>Coldest night avg</td><td style='text-align:right;font-weight:800;font-size:13px'>"+climT(m.tminMin)+"°</td><td style='text-align:right;padding-left:8px'>"+chip(sc(m.tminMin,m.dp))+"</td></tr>"
    +"<tr><td colspan='3' style='padding:3px 0'><div style='height:1px;background:var(--divider)'></div></td></tr>"
    +"<tr><td style='color:var(--text-muted);font-size:12px;padding:5px 0'>Avg dew point</td><td style='text-align:right;font-weight:800;font-size:13px' colspan='2'>"+climT(m.dp)+"°</td></tr>"
    +"<tr><td style='color:var(--text-muted);font-size:12px;padding:5px 0'>Rainfall</td><td style='text-align:right;font-weight:800;font-size:13px' colspan='2'>"+fN(m.rain,0)+" mm</td></tr>"
    +(m.snow>0.05?"<tr><td style='color:var(--text-muted);font-size:12px;padding:5px 0'>Snowfall</td><td style='text-align:right;font-weight:800;font-size:13px' colspan='2'>"+fN(m.snow,1)+" cm</td></tr>":"")
    +"</table>"
    +"<div style='font-size:10px;color:var(--text-muted);margin-top:10px;line-height:1.5'>Comfort scores at avg dew point, calm wind. Warmest/coldest are the avg of each year\u2019s single extreme day.</div>";
  document.getElementById("pop-ttl").textContent=m.month;
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}

