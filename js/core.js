// Comfort Score · core.js — constants, weather-code pills, Beaufort, onboarding, units, time, settings, comfort calc, rain, display
// Loaded by index.html (classic script, deferred, in a fixed order). All names are global.
// ── Constants ──────────────────────────────────────────────────────────────
var SBANDS=[{max:35,col:"rgba(190,50,50,0.92)"},{max:55,col:"rgba(210,120,20,0.92)"},{max:75,col:"rgba(190,185,20,0.92)"},{max:90,col:"rgba(100,180,50,0.92)"},{max:100,col:"rgba(25,140,65,0.92)"}];
var WORLD_CITIES=[
  {name:"Jakarta",lat:-6.21,lon:106.85,cc:"ID"},
  {name:"Dhaka",lat:23.72,lon:90.41,cc:"BD"},
  {name:"Tokyo",lat:35.69,lon:139.69,cc:"JP"},
  {name:"Delhi",lat:28.66,lon:77.23,cc:"IN"},
  {name:"Shanghai",lat:31.23,lon:121.47,cc:"CN"},
  {name:"Guangzhou",lat:23.13,lon:113.26,cc:"CN"},
  {name:"Cairo",lat:30.06,lon:31.25,cc:"EG"},
  {name:"Manila",lat:14.6,lon:120.98,cc:"PH"},
  {name:"Kolkata",lat:22.57,lon:88.36,cc:"IN"},
  {name:"Seoul",lat:37.57,lon:126.98,cc:"KR"},
  {name:"Karachi",lat:24.86,lon:67.01,cc:"PK"},
  {name:"Mumbai",lat:19.08,lon:72.88,cc:"IN"},
  {name:"Sao Paulo",lat:-23.55,lon:-46.63,cc:"BR"},
  {name:"Bangkok",lat:13.75,lon:100.52,cc:"TH"},
  {name:"Mexico City",lat:19.43,lon:-99.13,cc:"MX"},
  {name:"Beijing",lat:39.91,lon:116.39,cc:"CN"},
  {name:"Lahore",lat:31.55,lon:74.34,cc:"PK"},
  {name:"Istanbul",lat:41.01,lon:28.95,cc:"TR"},
  {name:"Moscow",lat:55.75,lon:37.62,cc:"RU"},
  {name:"Ho Chi Minh City",lat:10.82,lon:106.63,cc:"VN"},
  {name:"Buenos Aires",lat:-34.61,lon:-58.38,cc:"AR"},
  {name:"New York",lat:40.71,lon:-74.01,cc:"US"},
  {name:"Shenzhen",lat:22.54,lon:114.06,cc:"CN"},
  {name:"Bengaluru",lat:12.97,lon:77.59,cc:"IN"},
  {name:"Osaka",lat:34.69,lon:135.5,cc:"JP"},
  {name:"Lagos",lat:6.45,lon:3.4,cc:"NG"},
  {name:"Los Angeles",lat:34.05,lon:-118.24,cc:"US"},
  {name:"Chennai",lat:13.08,lon:80.27,cc:"IN"},
  {name:"Kinshasa",lat:-4.32,lon:15.32,cc:"CD"},
  {name:"Bogota",lat:4.71,lon:-74.07,cc:"CO"},
  {name:"Lima",lat:-12.05,lon:-77.04,cc:"PE"},
  {name:"London",lat:51.51,lon:-0.13,cc:"GB"},
  {name:"Rio de Janeiro",lat:-22.91,lon:-43.17,cc:"BR"},
  {name:"Paris",lat:48.86,lon:2.35,cc:"FR"},
  {name:"Hyderabad",lat:17.38,lon:78.49,cc:"IN"},
  {name:"Tehran",lat:35.69,lon:51.39,cc:"IR"},
  {name:"Luanda",lat:-8.84,lon:13.23,cc:"AO"},
  {name:"Bandung",lat:-6.92,lon:107.61,cc:"ID"},
  {name:"Kuala Lumpur",lat:3.14,lon:101.69,cc:"MY"},
  {name:"Dar es Salaam",lat:-6.79,lon:39.21,cc:"TZ"},
  {name:"Suzhou",lat:31.3,lon:120.62,cc:"CN"},
  {name:"Ahmedabad",lat:23.03,lon:72.57,cc:"IN"},
  {name:"Hangzhou",lat:30.25,lon:120.17,cc:"CN"},
  {name:"Wuhan",lat:30.59,lon:114.31,cc:"CN"},
  {name:"Tianjin",lat:39.14,lon:117.18,cc:"CN"},
  {name:"Alexandria",lat:31.2,lon:29.92,cc:"EG"},
  {name:"Nagoya",lat:35.18,lon:136.91,cc:"JP"},
  {name:"Johannesburg",lat:-26.2,lon:28.04,cc:"ZA"},
  {name:"Chongqing",lat:29.56,lon:106.55,cc:"CN"},
  {name:"Riyadh",lat:24.69,lon:46.72,cc:"SA"},
  {name:"Surat",lat:21.17,lon:72.83,cc:"IN"},
  {name:"Surabaya",lat:-7.25,lon:112.75,cc:"ID"},
  {name:"Pune",lat:18.52,lon:73.86,cc:"IN"},
  {name:"Khartoum",lat:15.55,lon:32.53,cc:"SD"},
  {name:"Nanjing",lat:32.06,lon:118.78,cc:"CN"},
  {name:"Santiago",lat:-33.45,lon:-70.67,cc:"CL"},
  {name:"Chicago",lat:41.88,lon:-87.63,cc:"US"},
  {name:"Chengdu",lat:30.66,lon:104.07,cc:"CN"},
  {name:"Xian",lat:34.27,lon:108.95,cc:"CN"},
  {name:"Hong Kong",lat:22.32,lon:114.17,cc:"HK"},
  {name:"Baghdad",lat:33.34,lon:44.4,cc:"IQ"},
  {name:"Madrid",lat:40.42,lon:-3.7,cc:"ES"},
  {name:"Houston",lat:29.76,lon:-95.37,cc:"US"},
  {name:"Dallas",lat:32.78,lon:-96.8,cc:"US"},
  {name:"Toronto",lat:43.65,lon:-79.38,cc:"CA"},
  {name:"Miami",lat:25.77,lon:-80.19,cc:"US"},
  {name:"Belo Horizonte",lat:-19.92,lon:-43.94,cc:"BR"},
  {name:"Singapore",lat:1.35,lon:103.82,cc:"SG"},
  {name:"Philadelphia",lat:39.95,lon:-75.17,cc:"US"},
  {name:"Atlanta",lat:33.75,lon:-84.39,cc:"US"},
  {name:"Fukuoka",lat:33.59,lon:130.4,cc:"JP"},
  {name:"Barcelona",lat:41.39,lon:2.15,cc:"ES"},
  {name:"Saint Petersburg",lat:59.93,lon:30.32,cc:"RU"},
  {name:"Washington DC",lat:38.91,lon:-77.04,cc:"US"},
  {name:"Yangon",lat:16.87,lon:96.19,cc:"MM"},
  {name:"Guadalajara",lat:20.66,lon:-103.35,cc:"MX"},
  {name:"Adelaide",lat:-34.93,lon:138.6,cc:"AU"},
  {name:"Brisbane",lat:-27.47,lon:153.02,cc:"AU"},
  {name:"Hobart",lat:-42.88,lon:147.33,cc:"AU"},
  {name:"Melbourne",lat:-37.81,lon:144.96,cc:"AU"},
  {name:"Sydney",lat:-33.87,lon:151.21,cc:"AU"},
  {name:"Darwin",lat:-12.46,lon:130.84,cc:"AU"},
  {name:"Perth",lat:-31.95,lon:115.86,cc:"AU"},
  {name:"Auckland",lat:-36.87,lon:174.77,cc:"NZ"},
  {name:"Christchurch",lat:-43.53,lon:172.64,cc:"NZ"},
  {name:"Reykjavik",lat:64.13,lon:-21.9,cc:"IS"},
  {name:"Torshavn",lat:62.01,lon:-6.77,cc:"FO"},
  {name:"Vancouver",lat:49.25,lon:-123.12,cc:"CA"},
  {name:"Honolulu",lat:21.31,lon:-157.86,cc:"US"},
  {name:"Dubai",lat:25.2,lon:55.27,cc:"AE"},
  {name:"Nairobi",lat:-1.29,lon:36.82,cc:"KE"},
  {name:"Cape Town",lat:-33.93,lon:18.42,cc:"ZA"},
  {name:"Accra",lat:5.56,lon:-0.2,cc:"GH"},
  {name:"Casablanca",lat:33.59,lon:-7.62,cc:"MA"},
  {name:"Addis Ababa",lat:9.03,lon:38.74,cc:"ET"},
  {name:"Ankara",lat:39.93,lon:32.86,cc:"TR"},
  {name:"Warsaw",lat:52.23,lon:21.01,cc:"PL"},
  {name:"Berlin",lat:52.52,lon:13.4,cc:"DE"},
  {name:"Rome",lat:41.9,lon:12.5,cc:"IT"},
  {name:"Amsterdam",lat:52.37,lon:4.9,cc:"NL"},
  {name:"Stockholm",lat:59.33,lon:18.07,cc:"SE"},
  {name:"Oslo",lat:59.91,lon:10.75,cc:"NO"},
  {name:"Helsinki",lat:60.17,lon:24.94,cc:"FI"},
  {name:"Vienna",lat:48.21,lon:16.37,cc:"AT"},
  {name:"Zurich",lat:47.38,lon:8.54,cc:"CH"},
  {name:"Lisbon",lat:38.72,lon:-9.14,cc:"PT"},
  {name:"Athens",lat:37.98,lon:23.73,cc:"GR"},
  {name:"Kyiv",lat:50.45,lon:30.52,cc:"UA"},
  {name:"Colombo",lat:6.93,lon:79.85,cc:"LK"},
  {name:"Kathmandu",lat:27.71,lon:85.32,cc:"NP"},
  {name:"Ulaanbaatar",lat:47.91,lon:106.88,cc:"MN"},
  {name:"Almaty",lat:43.26,lon:76.93,cc:"KZ"},
  {name:"Tashkent",lat:41.3,lon:69.27,cc:"UZ"},
  {name:"Baku",lat:40.41,lon:49.87,cc:"AZ"},
  {name:"Tbilisi",lat:41.69,lon:44.83,cc:"GE"},
  {name:"Beirut",lat:33.89,lon:35.5,cc:"LB"},
  {name:"Amman",lat:31.96,lon:35.95,cc:"JO"},
  {name:"Tel Aviv",lat:32.08,lon:34.78,cc:"IL"},
  {name:"Phnom Penh",lat:11.56,lon:104.92,cc:"KH"},
  {name:"Vientiane",lat:17.97,lon:102.6,cc:"LA"},
  {name:"Taipei",lat:25.05,lon:121.53,cc:"TW"},
  {name:"Kabul",lat:34.52,lon:69.18,cc:"AF"},
  {name:"Islamabad",lat:33.72,lon:73.04,cc:"PK"},
  {name:"Quito",lat:-0.22,lon:-78.51,cc:"EC"},
  {name:"La Paz",lat:-16.5,lon:-68.15,cc:"BO"},
  {name:"Asuncion",lat:-25.29,lon:-57.65,cc:"PY"},
  {name:"Montevideo",lat:-34.9,lon:-56.19,cc:"UY"},
  {name:"Panama City",lat:8.99,lon:-79.52,cc:"PA"},
  {name:"San Jose",lat:9.93,lon:-84.08,cc:"CR"},
  {name:"Guatemala City",lat:14.64,lon:-90.51,cc:"GT"},
  {name:"Havana",lat:23.13,lon:-82.38,cc:"CU"},
  {name:"Port of Spain",lat:10.65,lon:-61.52,cc:"TT"},
  {name:"Dakar",lat:14.72,lon:-17.47,cc:"SN"},
  {name:"Abidjan",lat:5.35,lon:-4.0,cc:"CI"},
  {name:"Maputo",lat:-25.97,lon:32.59,cc:"MZ"},
  {name:"Antananarivo",lat:-18.91,lon:47.54,cc:"MG"},
  {name:"Lusaka",lat:-15.42,lon:28.28,cc:"ZM"},
  {name:"Harare",lat:-17.83,lon:31.05,cc:"ZW"},
  {name:"Algiers",lat:36.74,lon:3.06,cc:"DZ"},
  {name:"Tripoli",lat:32.9,lon:13.18,cc:"LY"},
  {name:"Tunis",lat:36.82,lon:10.17,cc:"TN"},
  {name:"Muscat",lat:23.61,lon:58.59,cc:"OM"},
  {name:"Kuwait City",lat:29.37,lon:47.98,cc:"KW"},
  {name:"Ashgabat",lat:37.95,lon:58.38,cc:"TM"},
  {name:"Timbuktu",lat:16.77,lon:-3.0,cc:"ML"},
  {name:"Mombasa",lat:-4.05,lon:39.67,cc:"KE"},
  {name:"Ouagadougou",lat:12.37,lon:-1.53,cc:"BF"},
  {name:"Yakutsk",lat:62.03,lon:129.73,cc:"RU"},
  {name:"Murmansk",lat:68.97,lon:33.07,cc:"RU"},
  {name:"Longyearbyen",lat:78.22,lon:15.65,cc:"NO"},
  {name:"Death Valley",lat:36.46,lon:-116.87,cc:"US"},
  {name:"Cherrapunji",lat:25.3,lon:91.7,cc:"IN"},
  {name:"Arica",lat:-18.48,lon:-70.33,cc:"CL"},
  {name:"Verkhoyansk",lat:67.55,lon:133.39,cc:"RU"},
  {name:"Suva",lat:-18.14,lon:178.44,cc:"FJ"},
  {name:"Port Moresby",lat:-9.44,lon:147.18,cc:"PG"},
  {name:"Nuku'alofa",lat:-21.14,lon:-175.22,cc:"TO"},
  {name:"Kingston",lat:17.99,lon:-76.79,cc:"JM"},
  {name:"Bridgetown",lat:13.1,lon:-59.62,cc:"BB"},
  {name:"Winnipeg",lat:49.9,lon:-97.14,cc:"CA"},
  {name:"Whitehorse",lat:60.72,lon:-135.05,cc:"CA"},
  {name:"Phoenix",lat:33.45,lon:-112.07,cc:"US"},
  {name:"Anchorage",lat:61.22,lon:-149.9,cc:"US"},
  {name:"New Orleans",lat:29.95,lon:-90.07,cc:"US"},
  {name:"Valletta",lat:35.9,lon:14.51,cc:"MT"},
  {name:"Palermo",lat:38.12,lon:13.36,cc:"IT"},
  {name:"Minsk",lat:53.9,lon:27.57,cc:"BY"},
  {name:"Noumea",lat:-22.27,lon:166.46,cc:"NC"},
  {name:"Papeete",lat:-17.54,lon:-149.57,cc:"PF"},
  {name:"Honiara",lat:-9.43,lon:160.05,cc:"SB"},
  {name:"Apia",lat:-13.83,lon:-171.77,cc:"WS"},
  {name:"Funafuti",lat:-8.52,lon:179.2,cc:"TV"},
  {name:"Male",lat:4.17,lon:73.51,cc:"MV"},
  {name:"Djibouti",lat:11.59,lon:43.15,cc:"DJ"},
  {name:"Mogadishu",lat:2.05,lon:45.34,cc:"SO"},
  {name:"Niamey",lat:13.51,lon:2.11,cc:"NE"},
  {name:"N'Djamena",lat:12.11,lon:15.04,cc:"TD"},
  {name:"Bamako",lat:12.65,lon:-8.0,cc:"ML"},
  {name:"Conakry",lat:9.54,lon:-13.68,cc:"GN"},
  {name:"Freetown",lat:8.49,lon:-13.23,cc:"SL"},
  {name:"Libreville",lat:0.39,lon:9.45,cc:"GA"},
  {name:"Brazzaville",lat:-4.27,lon:15.28,cc:"CG"},
  {name:"Kampala",lat:0.32,lon:32.58,cc:"UG"},
  {name:"Kigali",lat:-1.95,lon:30.06,cc:"RW"},
  {name:"Lilongwe",lat:-13.97,lon:33.79,cc:"MW"},
  {name:"Windhoek",lat:-22.56,lon:17.08,cc:"NA"},
  {name:"Gaborone",lat:-24.65,lon:25.91,cc:"BW"},
  {name:"Mbabane",lat:-26.32,lon:31.13,cc:"SZ"},
  {name:"Maseru",lat:-29.32,lon:27.48,cc:"LS"},
  {name:"Prague",lat:50.08,lon:14.44,cc:"CZ"},
  {name:"Budapest",lat:47.5,lon:19.04,cc:"HU"},
  {name:"Bucharest",lat:44.43,lon:26.1,cc:"RO"},
  {name:"Sofia",lat:42.7,lon:23.32,cc:"BG"},
  {name:"Belgrade",lat:44.8,lon:20.46,cc:"RS"},
  {name:"Vilnius",lat:54.69,lon:25.28,cc:"LT"},
  {name:"Riga",lat:56.95,lon:24.11,cc:"LV"},
  {name:"Tallinn",lat:59.44,lon:24.75,cc:"EE"},
  {name:"Ushuaia",lat:-54.8,lon:-68.3,cc:"AR"}
];
var PINNED_CITIES=["New York","London","Dubai","Tokyo","Sydney"];
var _tlo=18;
var _thi=22;
var _coolmax=35;

// ── WMO weather code pill ──────────────────────────────────────────────────
function wxFromCode(code){
  if(code===0)return{c:"ann-wx",t:"clear sky \u2600\uFE0F"};
  if(code===1)return{c:"ann-wx",t:"mostly clear \uD83C\uDF24\uFE0F"};
  if(code===2)return{c:"ann-wx",t:"partly cloudy \u26C5"};
  if(code===3)return{c:"ann-wx",t:"overcast \u2601\uFE0F"};
  if(code>=45&&code<=48)return{c:"ann-wx",t:"foggy \uD83C\uDF2B\uFE0F"};
  if(code>=51&&code<=55)return{c:"ann-wx",t:"drizzle \uD83C\uDF26\uFE0F"};
  if(code>=56&&code<=57)return{c:"ann-wx",t:"freezing drizzle \uD83C\uDF27\uFE0F"};
  if(code>=61&&code<=63)return{c:"ann-wx",t:"raining \uD83C\uDF27\uFE0F"};
  if(code===65)return{c:"ann-wx",t:"heavy rain \uD83C\uDF27\uFE0F"};
  if(code>=66&&code<=67)return{c:"ann-wx",t:"freezing rain \uD83C\uDF27\uFE0F"};
  if(code>=71&&code<=73)return{c:"ann-wx",t:"snowing \u2744\uFE0F"};
  if(code===75)return{c:"ann-wx",t:"heavy snow \u2744\uFE0F"};
  if(code===77)return{c:"ann-wx",t:"snow grains \uD83C\uDF28\uFE0F"};
  if(code>=80&&code<=82)return{c:"ann-wx",t:"rain showers \uD83C\uDF26\uFE0F"};
  if(code>=85&&code<=86)return{c:"ann-wx",t:"snow showers \uD83C\uDF28\uFE0F"};
  if(code>=95&&code<=99)return{c:"ann-wx",t:"thunderstorm \u26C8\uFE0F"};
  return null;
}

// ── Forecast slot wx tint + emoji ─────────────────────────────────────────
function wxStyle(code,isNight){
  var dark=window.matchMedia&&window.matchMedia('(prefers-color-scheme:dark)').matches;
  if(code===null||code===undefined)return{bg:'',emoji:''};
  if(code<=1)  return isNight?{bg:dark?'rgba(20,40,100,0.35)':'rgba(20,40,120,0.18)',emoji:'🌙'}:{bg:dark?'rgba(255,210,80,0.13)':'rgba(255,200,40,0.18)',emoji:'☀️'};
  if(code===2) return isNight?{bg:dark?'rgba(20,40,100,0.35)':'rgba(20,40,120,0.18)',emoji:'🌙'}:{bg:dark?'rgba(180,200,220,0.10)':'rgba(160,185,210,0.14)',emoji:'⛅'};
  if(code===3) return isNight?{bg:dark?'rgba(15,30,80,0.45)':'rgba(15,30,100,0.24)',emoji:'☁️'}:{bg:dark?'rgba(150,165,180,0.12)':'rgba(140,155,170,0.15)',emoji:'☁️'};
  if(code>=45&&code<=48) return{bg:dark?'rgba(160,170,185,0.13)':'rgba(150,160,175,0.16)',emoji:'🌫️'};
  if(code>=51&&code<=57) return{bg:dark?'rgba(80,150,220,0.15)':'rgba(80,140,210,0.14)',emoji:'🌦️'};
  if(code>=61&&code<=67) return{bg:dark?'rgba(60,120,210,0.20)':'rgba(50,110,200,0.16)',emoji:'🌧️'};
  if(code>=71&&code<=77) return{bg:dark?'rgba(180,210,240,0.16)':'rgba(170,205,235,0.20)',emoji:'❄️'};
  if(code>=80&&code<=82) return{bg:dark?'rgba(60,120,210,0.20)':'rgba(50,110,200,0.16)',emoji:'🌧️'};
  if(code>=85&&code<=86) return{bg:dark?'rgba(180,210,240,0.16)':'rgba(170,205,235,0.20)',emoji:'❄️'};
  if(code>=95&&code<=99) return{bg:dark?'rgba(130,80,200,0.20)':'rgba(110,60,190,0.14)',emoji:'⛈️'};
  return{bg:'',emoji:''};
}

// ── Beaufort wind ──────────────────────────────────────────────────────────
// WMO Beaufort scale on the hourly mean wind at 10 m (km/h lower bounds).
// n = name for pills, p = phrase for sentences, e = pill emoji.
var BEAUFORT=[
  {f:12,min:118,n:"hurricane force",p:"hurricane-force winds",e:"\uD83C\uDF2A\uFE0F"},
  {f:11,min:103,n:"violent storm",p:"violent storm-force winds",e:"\uD83C\uDF2A\uFE0F"},
  {f:10,min:89,n:"storm",p:"storm-force winds",e:"\uD83C\uDF2A\uFE0F"},
  {f:9,min:75,n:"strong gale",p:"strong gales",e:"\uD83C\uDF2A\uFE0F"},
  {f:8,min:62,n:"gale",p:"gales",e:"\uD83C\uDF00"},
  {f:7,min:50,n:"near gale",p:"near-gale winds",e:"\uD83C\uDF00"},
  {f:6,min:39,n:"strong breeze",p:"a strong breeze",e:"\uD83D\uDCA8"},
  {f:5,min:29,n:"fresh breeze",p:"a fresh breeze",e:"\uD83D\uDCA8"},
  {f:4,min:20,n:"moderate breeze",p:"a moderate breeze",e:"\uD83C\uDF2C\uFE0F"},
  {f:3,min:12,n:"gentle breeze",p:"a gentle breeze",e:"\uD83C\uDF43"},
  {f:2,min:6,n:"light breeze",p:"a light breeze",e:"\uD83C\uDF43"},
  {f:1,min:1,n:"light air",p:"light air",e:""},
  {f:0,min:-1,n:"calm",p:"calm air",e:""}
];
function beaufort(kmh){
  var v=(kmh==null||isNaN(kmh))?0:kmh;
  for(var i=0;i<BEAUFORT.length;i++)if(v>=BEAUFORT[i].min)return BEAUFORT[i];
  return BEAUFORT[BEAUFORT.length-1];
}
function windPhrase(kmh){return beaufort(kmh).p;}
// Pill from a gentle breeze up. Within your pleasant-wind range near your ideal
// temperature, breezes (up to a strong breeze) read as "nice".
function windBeaufort(wind,temp,s){
  if(wind==null||isNaN(wind)||wind<6)return null;
  var b=beaufort(wind);
  var nice=b.f<=6&&wind>=s.pwlo&&wind<=s.pwhi&&temp>=s.tlo&&Math.abs(temp-(s.tlo+s.thi)/2)<6;
  if(nice)return{c:"ann-breeze",t:"nice "+b.n+" \uD83C\uDF43",w:1};
  if(b.f<3)return null;
  return{c:b.f===3?"ann-breeze":"ann-wind",t:b.n+" "+b.e,w:1};
}
// Gusts are shown separately once they pass GUST_SHOW km/h
var GUST_SHOW=50;
// Gusts join the wind pill ("strong breeze, gusts to 83 km/h 💨") rather than adding a
// second pill; standalone only when there's no wind pill. Skipped when a damaging-wind or
// cyclone alert already covers them. Returns any extra pill HTML.
function withGust(anns,g,skip){
  if(skip||g==null||isNaN(g)||g<=GUST_SHOW)return"";
  for(var i=0;i<anns.length;i++)if(anns[i].w){
    anns[i]={c:anns[i].c.replace("ann-breeze","ann-wind"),t:anns[i].t.replace(/^nice /,"").replace(/ (\S+)$/,", gusts to "+Math.round(g)+" km/h $1"),w:1};
    return"";
  }
  return gustPill(g);
}
function gustPill(g){
  if(g==null||isNaN(g)||g<=GUST_SHOW)return"";
  return"<span class='ann ann-wind'>gusts to "+Math.round(g)+" km/h \uD83D\uDCA8</span>";
}

// ── Onboarding ─────────────────────────────────────────────────────────────
function initOnboard(){if(!localStorage.getItem("comfort_onboarded"))document.getElementById("onboard-card").style.display="block";}
function dismissOnboard(){document.getElementById("onboard-card").style.display="none";localStorage.setItem("comfort_onboarded","1");}
function initLivFeature(){if(!localStorage.getItem("comfort_liv_feature_v1"))document.getElementById("liv-feature-card").style.display="block";}
function dismissLivFeature(){document.getElementById("liv-feature-card").style.display="none";localStorage.setItem("comfort_liv_feature_v1","1");}

// ── Unit system ────────────────────────────────────────────────────────────
var useFahrenheit=false;
function toDisp(c){return useFahrenheit?Math.round((c*9/5+32)*10)/10:Math.round(c*10)/10;}
function fromDisp(v){return useFahrenheit?Math.round(((v-32)*5/9)*10)/10:v;}
function unitSym(){return useFahrenheit?"\u00B0F":"\u00B0C";}
function detectUnitFromLocale(){var r=(navigator.language||"").split("-")[1]||"";return["US","LR","MM"].indexOf(r.toUpperCase())!==-1?"F":"C";}
function setUnit(unit){
  useFahrenheit=(unit==="F");localStorage.setItem("comfort_unit",unit);
  document.getElementById("btn-c").classList.toggle("active",!useFahrenheit);
  document.getElementById("btn-f").classList.toggle("active",useFahrenheit);
  document.getElementById("unit-temp").textContent=unitSym();
  document.getElementById("unit-dp").textContent=unitSym();
  if(window._LW)renderChips(window._LW.temp,window._LW.effDP,window._LW.rh,window._LW.wind);
  reRenderAll();
  initTempPrefs();
  initSleepPrefs();
  ["heat","hot","winter","cold","dp"].forEach(function(d){if(document.getElementById("sl-liv-"+d))onLivBand(d);});
  livUnitText();
  if(window._currentLat!=null&&document.getElementById("clim-card").style.display==="block")showClimCard(window._currentLat,window._currentLon);
}
function initUnit(){
  var unit=localStorage.getItem("comfort_unit")||detectUnitFromLocale();
  useFahrenheit=(unit==="F");
  document.getElementById("btn-c").classList.toggle("active",!useFahrenheit);
  document.getElementById("btn-f").classList.toggle("active",useFahrenheit);
  document.getElementById("unit-temp").textContent=unitSym();
  document.getElementById("unit-dp").textContent=unitSym();
}
function moonPhase(){
  // Calculates moon age in days and returns emoji + name
  var known=new Date(Date.UTC(2000,0,6,18,14,0)); // known new moon
  var now=new Date();
  var age=((now-known)/(1000*60*60*24))%29.53059;
  if(age<0)age+=29.53059;
  var emoji,name;
  if(age<1.85)      {emoji="🌑";name="New moon";}
  else if(age<5.54) {emoji="🌒";name="Waxing crescent";}
  else if(age<9.22) {emoji="🌓";name="First quarter";}
  else if(age<12.91){emoji="🌔";name="Waxing gibbous";}
  else if(age<16.61){emoji="🌕";name="Full moon";}
  else if(age<20.30){emoji="🌖";name="Waning gibbous";}
  else if(age<23.99){emoji="🌗";name="Last quarter";}
  else if(age<27.68){emoji="🌘";name="Waning crescent";}
  else              {emoji="🌑";name="New moon";}
  return{emoji:emoji,name:name};
}
function renderChips(temp,effDP,rh,wind,fc){
  var moon=moonPhase();
  window._sunMoonData={moon:moon,tidesHtml:"<span style='color:var(--text-muted)'>Loading tides\u2026</span>"};
  var deg=function(c){return String(toDisp(c).toFixed(1)).replace("-","\u2212")+unitSym();};
  var hiLo="";
  if(fc&&fc.daily&&fc.daily.time){
    var hlDay=new Intl.DateTimeFormat("en-CA",{timeZone:fc.timezone,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()),hlI=fc.daily.time.indexOf(hlDay);
    var hx=hlI>=0&&fc.daily.temperature_2m_max?fc.daily.temperature_2m_max[hlI]:null,hn=hlI>=0&&fc.daily.temperature_2m_min?fc.daily.temperature_2m_min[hlI]:null;
    if(hx!=null&&hn!=null)hiLo="\u2191"+String(Math.round(toDisp(hx))).replace("-","\u2212")+"\u00B0 \u2193"+String(Math.round(toDisp(hn))).replace("-","\u2212")+"\u00B0 today";
  }
  // Sun tile leads with whichever of sunrise/sunset comes next
  var sunLbl="Sunrise",sunVal="\u2014",sunSub="";
  if(fc&&fc.daily&&fc.daily.sunrise&&fc.daily.time){
    var sTz=fc.timezone,sOff=getTZOffsetMin(sTz),sI=fc.daily.time.indexOf(new Intl.DateTimeFormat("en-CA",{timeZone:sTz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()));
    var fmtS=function(x){return x?new Intl.DateTimeFormat("en-AU",{timeZone:sTz,hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(toEpoch(x,sOff))).toLowerCase().replace(" ",""):"";};
    var srS=sI>=0?fc.daily.sunrise[sI]:null,ssS=sI>=0?fc.daily.sunset[sI]:null,nxS=sI>=0?fc.daily.sunrise[sI+1]:null,nowS=Date.now();
    if(srS&&ssS){
      if(nowS<toEpoch(srS,sOff)){sunLbl="Sunrise";sunVal=fmtS(srS);sunSub="sunset "+fmtS(ssS);}
      else if(nowS<toEpoch(ssS,sOff)){sunLbl="Sunset";sunVal=fmtS(ssS);sunSub=nxS?"sunrise "+fmtS(nxS):"";}
      else{sunLbl="Sunrise";sunVal=nxS?fmtS(nxS):"\u2014";sunSub="sunset was "+fmtS(ssS);}
    }
  }
  var uvNow=null;
  if(fc&&fc.hourly&&fc.hourly.uv_index){
    var uvTz=fc.timezone,uvH=localHourInTZ(uvTz),uvDay=new Intl.DateTimeFormat("en-CA",{timeZone:uvTz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    for(var ui=0;ui<fc.hourly.time.length;ui++){if(fc.hourly.time[ui].slice(0,10)===uvDay&&parseInt(fc.hourly.time[ui].slice(11,13))===uvH){uvNow=fc.hourly.uv_index[ui];break;}}
  }
  var uvLbl=uvNow==null?"":uvNow<3?"Low":uvNow<6?"Moderate":uvNow<8?"High":uvNow<11?"Very high":"Extreme";
  var gust=window._LW&&window._LW.gust;
  var bft=beaufort(wind).n;
  var tile=function(lbl,val,sub,tap){return"<div class='cond-tile"+(tap?" tap":"")+"'"+(tap?" onclick='"+tap+"'":"")+"><div class='cond-lbl'>"+lbl+"</div><div class='cond-val'>"+val+"</div><div class='cond-sub'>"+sub+"</div></div>";};
  document.getElementById("live-chips").innerHTML=
    tile("Temperature",deg(temp),hiLo)
   +tile("Dew point",deg(effDP),rh+"% humidity")
   +tile("Wind",Math.round(wind)+"<span style='font-size:11px'> km/h</span>",(gust!=null&&gust>GUST_SHOW)?"gusts to "+Math.round(gust):bft.charAt(0).toUpperCase()+bft.slice(1))
   +tile("UV index \u203A",uvNow==null?"\u2014":String(Math.round(uvNow)),uvLbl||"no data","showUVPop()")
   +tile(sunLbl,sunVal,sunSub)
   +tile("Moon &amp; tides \u203A",moon.emoji,moon.name,"showSunMoonPop()");
  fetchTides();
}
function showSunMoonPop(){
  var d=window._sunMoonData||{},fc=window._FC;
  var tile=function(lbl,val,sub){return"<div class='cond-tile'><div class='cond-lbl'>"+lbl+"</div><div class='cond-val'>"+val+"</div><div class='cond-sub'>"+(sub||"&nbsp;")+"</div></div>";};
  var sr="—",ss="—",len="";
  if(fc&&fc.daily&&fc.daily.sunrise&&fc.daily.time){
    var tz=fc.timezone,off=getTZOffsetMin(tz),i=fc.daily.time.indexOf(new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date()));
    var fmt=function(x){return new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(toEpoch(x,off))).toLowerCase().replace(" ","");};
    if(i>=0&&fc.daily.sunrise[i]&&fc.daily.sunset[i]){
      sr=fmt(fc.daily.sunrise[i]);ss=fmt(fc.daily.sunset[i]);
      var mins=Math.round((toEpoch(fc.daily.sunset[i],off)-toEpoch(fc.daily.sunrise[i],off))/60000);
      len=Math.floor(mins/60)+"h "+(mins%60)+"m of daylight";
    }
  }
  var age=((Date.now()-Date.UTC(2000,0,6,18,14,0))/86400000)%29.53059;if(age<0)age+=29.53059;
  var illum=Math.round(50*(1-Math.cos(2*Math.PI*age/29.53059)));
  var m=d.moon||moonPhase();
  var body="<div class='washing-reason'>"
    +"<div class='cond-grid' style='grid-template-columns:repeat(2,minmax(0,1fr))'>"
    +tile("🌅 Sunrise",sr,len)
    +tile("🌇 Sunset",ss,"")
    +tile("Moon",m.emoji,m.name)
    +tile("Illuminated",illum+"%",age<14.77?"waxing":"waning")
    +"</div>"
    +"<div style='height:1px;background:var(--divider);margin:11px 0 9px'></div>"
    +"<div style='font-size:12px;font-weight:800;color:var(--text-muted);margin-bottom:4px'>🌊 Tides today</div>"
    +"<div style='font-size:13px;font-weight:700;color:var(--text);line-height:1.8'>"+(d.tidesHtml||"<span style='color:var(--text-muted)'>Loading tides…</span>")+"</div>"
    +"<div style='font-size:11px;color:var(--text-muted);line-height:1.6;margin-top:8px'>Tides are modelled sea-level heights from the nearest ocean grid point, not port predictions — inland they may be far away or missing. Use official tide tables for boating and fishing.</div>"
    +"</div>";
  document.getElementById("pop-ttl").textContent="Sun, moon & tides";
  document.getElementById("pop-body").innerHTML=body;
  document.getElementById("pop-ov").classList.add("open");
}
function fetchTides(){
  if(!window._currentLat||!window._currentLon)return;
  var url="https://marine-api.open-meteo.com/v1/marine?latitude="+window._currentLat+"&longitude="+window._currentLon+"&hourly=sea_level_height_msl&timezone=auto&forecast_days=2";
  fetch(url).then(function(r){return r.ok?r.json():null;}).then(function(data){
    if(!data||!data.hourly)return;
    var times=data.hourly.time,heights=data.hourly.sea_level_height_msl;
    if(!times||!heights)return;
    var tz=data.timezone||"auto";
    var todayStr=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
    var tides=[];
    for(var i=1;i<times.length-1;i++){
      if(times[i].slice(0,10)!==todayStr)continue;
      var prev=heights[i-1],cur=heights[i],next=heights[i+1];
      if(prev==null||cur==null||next==null)continue;
      var isHigh=cur>prev&&cur>next,isLow=cur<prev&&cur<next;
      if(!isHigh&&!isLow)continue;
      var tLabel=new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(times[i])).toLowerCase().replace(" ","");
      tides.push({type:isHigh?"High":"Low",time:tLabel,h:Math.round(cur*100)/100});
    }
    var html=tides.length
      ?tides.map(function(t){return(t.type==="High"?"\uD83D\uDD3C":"\uD83D\uDD3D")+" <b>"+t.type+"</b>&ensp;"+t.time+"&ensp;<span style='color:var(--text-muted)'>"+t.h+"m</span>";}).join("<br>")
      :"<span style='color:var(--text-muted)'>No tide data for this location</span>";
    if(window._sunMoonData)window._sunMoonData.tidesHtml=html;
  }).catch(function(){if(window._sunMoonData)window._sunMoonData.tidesHtml="<span style='color:var(--text-muted)'>Tide data unavailable</span>";});
}
// ── Page scroll ────────────────────────────────────────────────────────────
// The page scrolls inside <body>, not the window (html and body both have overflow-x:hidden),
// so window.scrollTo alone does nothing. These work whichever of the two is scrolling.
function pageScrollY(){return window.scrollY||document.body.scrollTop||0;}
function pageScrollTo(y,smooth){var o={top:y||0,behavior:smooth?"smooth":"auto"};document.body.scrollTo(o);window.scrollTo(o);}

// ── Time helpers ───────────────────────────────────────────────────────────
function parseLocalTimeStr(s){var p=s.split("T"),d=p[0].split("-"),t=(p[1]||"00:00").split(":");return{yr:+d[0],mo:+d[1]-1,dy:+d[2],hr:+t[0],mn:+t[1]};}
function getTZOffsetMin(tz){
  try{var now=new Date(),parts={};new Intl.DateTimeFormat("en-US",{timeZone:tz,hour12:false,year:"numeric",month:"2-digit",day:"2-digit",hour:"2-digit",minute:"2-digit",second:"2-digit"}).formatToParts(now).forEach(function(p){parts[p.type]=p.value;});var localAsUTC=Date.UTC(+parts.year,+parts.month-1,+parts.day,parts.hour==="24"?0:+parts.hour,+parts.minute,+parts.second);return(localAsUTC-now.getTime())/60000;}catch(e){return 0;}
}
function fmtObsTime(timeStr,tz){
  try{var p=parseLocalTimeStr(timeStr),tzOff=getTZOffsetMin(tz),utcMs=Date.UTC(p.yr,p.mo,p.dy,p.hr,p.mn,0)-tzOff*60000;return new Intl.DateTimeFormat("en-AU",{timeZone:tz,weekday:"short",hour:"numeric",minute:"2-digit",hour12:true}).format(new Date(utcMs)).replace(",","");}catch(e){return timeStr.slice(11,16);}
}
function fmtFcTime(timeStr,tz){
  try{var p=parseLocalTimeStr(timeStr),tzOff=getTZOffsetMin(tz),utcMs=Date.UTC(p.yr,p.mo,p.dy,p.hr,p.mn,0)-tzOff*60000;return new Intl.DateTimeFormat("en-AU",{timeZone:tz,hour:"numeric",hour12:true}).format(new Date(utcMs)).toLowerCase().replace(" ","");}catch(e){return timeStr.slice(11,16);}
}
function localHourInTZ(tz){
  try{var parts={};new Intl.DateTimeFormat("en-US",{timeZone:tz,hour12:false,hour:"2-digit"}).formatToParts(new Date()).forEach(function(p){parts[p.type]=p.value;});var h=parseInt(parts.hour);return h===24?0:h;}catch(e){return new Date().getHours();}
}

// ── Settings ───────────────────────────────────────────────────────────────
var SETTINGS=[
  {grp:"Temperature"},
  {id:"s-hw",label:"Heat penalty weight (x)",val:1.2,step:0.1,title:"Heat sensitivity",info:"Controls whether heat or cold bothers you more. At 1.0 they are equal. Raise this if a hot day ruins your comfort more than a cold one would at the same distance from ideal."},
  {id:"s-tmax",label:"Temp max penalty (pts)",val:70,step:1,title:"Temperature penalty ceiling",info:"The maximum number of score points that temperature alone can take off. Raising this allows extreme heat or cold to push scores lower."},
  {id:"s-coldmax",label:"Cold zone max pts",val:100,step:5,title:"Sub-zero penalty ceiling",info:"The maximum additional penalty for temperatures below 0C, stacked on top of the cool zone."},
  {id:"s-coldexp",label:"Cold curve exponent",val:1.2,step:0.1,title:"Sub-zero penalty shape",info:"Controls how the freezing penalty ramps up. Above 1.0 the penalty accelerates, so -10C hurts much more than twice -5C."},
  {grp:"Humidity"},
  {id:"s-dp",label:"DP threshold (C)",val:12,step:0.5,title:"Humidity sensitivity threshold",info:"The dew point above which you start noticing humidity. Raise it if you only mind humidity in tropical conditions. Lower it if even mild humidity bothers you."},
  {id:"s-hmax",label:"Humidity max penalty (pts)",val:50,step:1,title:"Humidity penalty ceiling",info:"The maximum score points humidity can take off. Raise this if humidity affects your comfort more than temperature does."},
  {id:"s-hdp_ceil",label:"Humidity DP ceiling (C)",val:26,step:0.5,title:"Extreme humidity reference point",info:"The dew point at which humidity penalty reaches its maximum. Lower this if you want tropical-level dew points to hit maximum penalty sooner."},
  {id:"s-hexp",label:"Humidity curve exponent",val:0.6,step:0.05,title:"Humidity penalty shape",info:"Controls how the humidity penalty ramps up. Below 1.0, even mild humidity gets a meaningful penalty quickly, then levels off toward maximum."},
  {id:"s-wb0",label:"Heat stress starts (wet bulb \u00B0C)",val:21,step:0.5,title:"Heat stress threshold",info:"Above your comfort ceiling, a heat-stress penalty starts once the wet-bulb temperature passes this value. Wet bulb combines heat and humidity into one number: it is the lowest temperature sweat can cool you to. The penalty builds over the next 8\u00B0C of wet bulb. Lower this if hot, humid days wear you down quickly."},
  {id:"s-wbmax",label:"Heat stress max penalty (pts)",val:25,step:1,title:"Heat stress penalty ceiling",info:"The maximum score points the heat-stress (wet bulb) penalty can take off. It sits on top of the temperature and humidity penalties, so it mainly separates hot-and-humid from hot-and-dry."},
  {grp:"Wind"},
  {id:"s-wmax",label:"Wind max penalty (pts)",val:20,step:1,title:"Wind penalty ceiling",info:"The maximum score points wind can take off. A gentle breeze in comfortable conditions can add a small bonus to the score."},
  {id:"s-wchill_thresh",label:"Wind chill threshold (C)",val:10,step:0.5,title:"Wind chill activation temperature",info:"Wind only adds a chill penalty when below this temperature. Lower this to make wind chill kick in only at genuinely cold temperatures."},
  {id:"s-cws",label:"Cold wind sensitivity (x)",val:1.5,step:0.1,title:"Wind chill intensity",info:"How aggressively wind amplifies cold discomfort below the threshold."},
  {id:"s-pwlo",label:"Pleasant wind low (km/h)",val:10,step:1,title:"Comfortable breeze — lower end",info:"The minimum wind speed that starts to feel like a pleasant breeze. Within this range a small score bonus applies near ideal temperatures."},
  {id:"s-pwhi",label:"Pleasant wind high (km/h)",val:20,step:1,title:"Comfortable breeze — upper end",info:"The maximum wind speed that still feels pleasant. Above this, wind starts becoming a nuisance."},
  {id:"s-swt",label:"Wind discomfort threshold (km/h)",val:35,step:1,title:"Wind discomfort threshold",info:"Wind above this speed is uncomfortable regardless of temperature. The penalty accelerates beyond this point."},
  {grp:"Rain"},
  {id:"s-rmax",label:"Rain max penalty (pts)",val:15,step:1,title:"Rain penalty",info:"Points taken off for heavy rain (4 mm or more in an hour) at a comfortable temperature. Lighter rain takes off less. Below your cold threshold the penalty grows, up to two and a half times this value in cold, windy rain. Only applies when \u201CRain lowers my score\u201D is on in Preferences."}
];
function showPop(title,text){document.getElementById("pop-ttl").textContent=title;document.getElementById("pop-body").textContent=text;document.getElementById("pop-ov").classList.add("open");}
function closePop(){document.getElementById("pop-ov").classList.remove("open");}
// Folds each bold heading + its paragraph in "How it works" into a tap-to-open section.
// Works on the rendered popup, so new sections added to the text get the same treatment.
function hiwCollapse(wrap){
  if(!wrap)return;
  var isHead=function(el){return el&&/font-weight:\s*800/.test(el.getAttribute("style")||"");};
  var kids=[].slice.call(wrap.children);
  for(var i=0;i<kids.length;i++){
    var h=kids[i];
    if(!isHead(h))continue;
    var d=document.createElement("details"),s=document.createElement("summary");
    d.className="hiw-sec";s.textContent=h.textContent;
    wrap.insertBefore(d,h);d.appendChild(s);
    var c=kids[i+1];
    if(c&&!isHead(c)){c.style.margin="0 0 10px";d.appendChild(c);i++;}
    h.remove();
  }
}
// In the Google Play app (a Trusted Web Activity, opened with an android-app:// referrer) the
// external tip link is hidden: Play's payments policy doesn't allow links to outside payments.
(function(){try{if(document.referrer.indexOf("android-app://")===0)sessionStorage.setItem("cs_play","1");
  if(sessionStorage.getItem("cs_play"))document.documentElement.classList.add("in-play");}catch(e){}})();
function showHowItWorks(){
  var body="<div class='washing-reason pop-body-scroll'>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>The Comfort Score</div>"
    +"<div style='margin-bottom:12px'>A score from 0–100 representing how comfortable it is to be outside, personalised to your preferences. 100 is perfect. Penalties are applied for heat, cold, humidity, and wind — and rain, if you choose — based on your comfort range settings, so two people in the same place can get different scores.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Why dew point, not humidity?</div>"
    +"<div style='margin-bottom:12px'>Relative humidity tells you how full the air is compared to its capacity — but capacity changes with temperature. A 70% humidity day at 10°C feels crisp; at 30°C it's oppressive. Dew point measures the actual moisture in the air regardless of temperature, making it a far better indicator of how sticky or clammy conditions feel. Once it is hotter than your comfort ceiling, the score also uses wet-bulb temperature, which combines heat and humidity into the lowest temperature sweat can cool you to — so the same humidity costs more the hotter it gets. When wet bulb reaches 28°C a “Dangerously hot” warning appears, and at 31°C “Extremely dangerous heat”.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Wind 💨</div>"
    +"<div style='margin-bottom:12px'>Wind is described on the Beaufort scale, using the average wind speed at 10 m — the measure the scale is defined on. Pills name everything from a gentle breeze (12 km/h) up to hurricane force (118 km/h and above); when the wind sits within your pleasant-wind range close to your ideal temperature, it reads as a “nice” breeze. Day summaries mention wind from a fresh breeze (29 km/h) up. Gusts are brief bursts well above the average, so they’re shown separately once they pass 50 km/h.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Storms ⛈️</div>"
    +"<div style='margin-bottom:12px'>A modelled storm indicator, not an official warning. Each forecast hour is rated from the forecast’s thunderstorm signal, storm energy (CAPE) and atmospheric stability: <b>Storms possible</b> when showers have enough energy to turn thundery, <b>Thunderstorms likely</b> when thunder is forecast with moderate energy or more, and <b>Severe storms possible</b> when those storms come with very heavy rain (10 mm or more in an hour), gusts of 90 km/h or more, or hail. The alert strip looks six hours ahead; the 7-day tiles show likely and severe storms. Storms are small and hard to place, so treat timing and location as a guide, and follow your local weather service for official warnings.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Damaging winds 💨</div>"
    +"<div style='margin-bottom:12px'>Shown when forecast gusts reach 80 km/h (<b>Damaging winds</b>) or 125 km/h (<b>Destructive winds</b>): in the alert strip for the next six hours, and on the 7-day tiles, day and hour views. Gusts during forecast thunderstorms are left to the storm alert, and when a tropical cyclone’s wind zone covers the place they show as cyclone winds. The washing check warns when damaging gusts are due in the next 12 hours.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Tropical cyclones 🌀</div>"
    +"<div style='margin-bottom:12px'>Current tropical cyclones (hurricanes and typhoons) come from GDACS, the United Nations and European Commission’s Global Disaster Alert and Coordination System. When a cyclone’s centre is within 1,000 km and this place lies inside its modelled wind zone (60, 90 or 120 km/h along its track), the alert strip shows the cyclone and the winds possible; otherwise a quiet note shows it nearby. GDACS’s Green, Orange and Red alerts rate the cyclone’s overall humanitarian impact, not the conditions at this place. The wind zone can include where the storm has already been, so always check the official forecast track and warnings.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Rain 🌧️</div>"
    +"<div style='margin-bottom:12px'>Optional and off by default — switch it on with “Rain lowers my score” in Preferences. Rain counts from 0.2 mm in an hour, taking off about 2 points for a light shower, 7 for steady rain (1 mm) and 15 for heavy rain (4 mm or more). Below the temperature where you start to feel cold it counts for more, and wind adds to it, up to 38 points in cold, windy rain; warm rain above your heat threshold counts half. Forecast scores use each hour’s forecast rainfall. The climate averages in Climate Explorer are scored dry.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Clothing recommendation</div>"
    +"<div style='margin-bottom:12px'>Layers are calculated from your comfort floor and ceiling, adjusted for wind chill. The outer layer accounts for rain and wind independently — a rain jacket replaces rather than adds to the insulating layer recommendation.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Will washing dry?</div>"
    +"<div style='margin-bottom:12px'>A drying index is calculated from vapour pressure deficit, wind, and temperature. This estimates how quickly moisture evaporates from fabric. Forecast slots are scanned to find usable drying windows, accounting for sunset, incoming rain, and overnight freezes.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Where in the world?</div>"
    +"<div style='margin-bottom:12px'>Compares current conditions against nearly 200 cities worldwide, showing the top and bottom scorers alongside five major reference cities. Scores are calculated using your current preference settings, including rain if you've switched it on — so the ranking reflects your personal comfort profile, not a universal standard. A 🌧️ marks cities where it's raining. Tap any city to load its full Comfort Score.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Climate Explorer</div>"
    +"<div style='margin-bottom:12px'>Tap Climate at the top to open the Climate Explorer. It shows monthly climate averages for the most relevant climate profile within about 100 km, chosen on distance and height (100 m of height counts as 10 km). When that profile is more than 20 km away the Explorer names it. It shows that profile's own figures, not adjusted for any difference in height; the heatwave, coldwave and warmer/cooler checks do adjust temperatures, by about 0.65°C per 100 m. It covers average highs and lows, dew point, rainfall, and snowfall across the year, plus annual sunshine hours and wind. Tap any month bar or label for a detailed breakdown. Beneath that, the Liveability Score rates how well the location's year-round climate matches your liveability preferences, and the climate map shows how every location in the database scores for you — tap any marker to load it. Data sourced from national meteorological services and WMO records. Each location uses the closest suitable station or dataset available; where a figure isn't recorded there, it has been estimated from the surrounding terrain and nearby stations. Some values, particularly for remote or data-sparse locations, are therefore approximate — and because the heatwave index is built from these figures, its readings are only as reliable as the climate data behind them.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>UV Index</div>"
    +"<div style='margin-bottom:12px'>The standard WHO UV index scale. Only shown when UV reaches 3 (moderate) or above — below that no sun protection is typically needed.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Air Quality 😷</div>"
    +"<div style='margin-bottom:12px'>Shows the US AQI (Air Quality Index) from 0–500. The pill appears when AQI is Good (≤50) or above. Tapping it shows a breakdown of PM2.5, PM10, ozone, nitrogen dioxide, sulphur dioxide, dust, and pollen. PM2.5 (fine particulate matter) is the primary driver of health risk — it penetrates deep into the lungs and is the main concern during bushfire smoke events. Pollen data is only available for Europe. Data from Open-Meteo Air Quality API.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Fire Danger 🔥</div>"
    +"<div style='margin-bottom:12px'>Uses the McArthur FFDI formula — temperature, humidity, wind, and an estimated drought factor — mapped to the current Australian Fire Danger Rating System (AFDRS) bands introduced in September 2022. The drought factor is calculated from recent rainfall weighted by daily evaporative demand: rain suppresses fire risk for longer in cool, humid conditions and decays faster in hot, dry conditions. It may still understate risk during prolonged dry periods. The official AFDRS also accounts for fuel type and vegetation, which this app cannot determine. Always check with your local fire authority for official ratings and total fire ban declarations.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Dangerous cold 🥶</div>"
    +"<div style='margin-bottom:12px'>Uses the North American wind chill index — how cold bare skin feels once wind is taken into account — with thresholds from Environment Canada's frostbite risk table. At a wind chill of −28°C or below a “Dangerously cold” warning appears (exposed skin can freeze in 10–30 minutes); at −40°C or below, “Extremely dangerous cold” (5–10 minutes). The What to Wear advice switches to full coverage and specialist gear at the same two points.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Hypothermia risk 🌧️</div>"
    +"<div style='margin-bottom:12px'>The cold hazard of mild climates: rain soaks clothing and wind strips its warmth, so a few degrees above zero can be more dangerous than a dry frost. The warning appears when it is 8°C or colder, the wind averages 30 km/h or more, and it is raining. In the forecast, a day is flagged when at least two such hours are expected. It stays quiet when a frostbite warning is already showing.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Heatwaves & coldwaves 🌡️❄️</div>"
    +"<div style='margin-bottom:12px'>Both use the Excess Heat and Excess Cold Factor methods developed by Nairn and Fawcett, which compare each three-day spell with the local climate and with the month before it — so what counts as a heatwave or coldwave depends on where you are and what you've become used to. Thresholds come from this app's own climate data for the location, so they only appear where it has a climate profile within about 50 km, adjusted for height the same way. Intensity is shown out of 10: 1–3 low, 4–7 severe, 8–10 extreme. Heatwaves rated 1/10 — the faintest, and the most common — aren't shown. Low-intensity cold spells are called cold snaps. When a spell is unusually cool for the place but still mild — an average of 18°C or more across day and night, as in the tropics — it's shown as a “Cooler spell” from 4/10 up, and not shown below that. Both are independent calculations, not official warnings.</div>"
    +"<div style='margin-bottom:12px'><b>Warmer or cooler than usual</b> compares each forecast day\u2019s high and low with the normal for that date at that place, from the same climate data. How far counts as unusual depends on the place \u2014 it\u2019s worked out from how much temperatures there normally swing, so a few degrees above average is ordinary in Adelaide in summer but rare in Singapore. It shows as warmer or cooler, or \u201Cmuch\u201D warmer or cooler, and only on days with no heatwave or coldwave.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>About the data, and AI</div>"
    +"<div style='margin-bottom:12px'>The climate profiles behind Climate Explorer, the Liveability Score and the heatwave, coldwave and warmer/cooler checks are synthesised from real data: published records from national weather services and the World Meteorological Organization. They were compiled with the help of Claude, Anthropic\u2019s AI model, to Comfort Score\u2019s own proprietary scope \u2014 which places are included, which stations and periods are used, how gaps are filled and how the figures are combined. Where a figure isn\u2019t recorded it has been estimated, so treat values as approximate. The Learn lessons were also written with Claude\u2019s help and checked against the sources listed with each one. Live forecasts, air quality, tropical cyclones and climate-driver readings come straight from the agencies below; the app only does its own calculations on them. Comfort Score is a guide only: for official forecasts and warnings, always follow your national weather service and emergency services.</div>"
    +"<div style='font-size:13px;font-weight:800;color:var(--text-head);margin-bottom:4px'>Data sources</div>"
    +"<div>Weather and air quality: Open-Meteo (open-meteo.com); backup forecasts from MET Norway (CC BY 4.0) · Tropical cyclones: GDACS (UN and European Commission) · Climate drivers and CO\u2082 in Learn: Bureau of Meteorology and NOAA · Geocoding: Nominatim / OpenStreetMap · Map: \u00a9 OpenStreetMap contributors, with Leaflet · Personal weather stations: Weather Underground API. Forecasts are fetched live. Settings stored locally on your device only.</div>"
    +"</div>";
  document.getElementById("pop-ttl").textContent="How it works";
  document.getElementById("pop-body").innerHTML=body;
  hiwCollapse(document.querySelector("#pop-body .pop-body-scroll"));
  document.getElementById("pop-ov").classList.add("open");
}
function buildSettings(){
  var saved=JSON.parse(localStorage.getItem("comfort_settings")||"{}"),html="";
  for(var i=0;i<SETTINGS.length;i++){var s=SETTINGS[i];if(s.grp){html+="<div class='sgrp-title'>"+s.grp+"</div>";continue;}var v=(saved[s.id]!==undefined)?saved[s.id]:s.val;html+="<div class='sitem'><div class='sitem-hdr'><label for='"+s.id+"'>"+s.label+"</label><div class='ibtn' onclick='showPop(SETTINGS["+i+"].title,SETTINGS["+i+"].info)'>i</div></div><input type='number' id='"+s.id+"' value='"+v+"' step='"+s.step+"' onchange='onAdvChange()'/></div>";}
  document.getElementById("sgrid").innerHTML=html;
  document.getElementById("wu-api-key").value=localStorage.getItem("wu_api_key")||"";
}
function saveSettings(){var out={};for(var i=0;i<SETTINGS.length;i++){if(!SETTINGS[i].id)continue;var el=document.getElementById(SETTINGS[i].id);if(el)out[SETTINGS[i].id]=parseFloat(el.value);}localStorage.setItem("comfort_settings",JSON.stringify(out));}
function saveWuKey(){localStorage.setItem("wu_api_key",document.getElementById("wu-api-key").value.trim());}
var _renderTimer=null;
function onAdvChange(){saveSettings();syncSlidersFromAdv();scheduleRender();}
function scheduleRender(){if(_renderTimer)clearTimeout(_renderTimer);_renderTimer=setTimeout(function(){reRenderAll();_renderTimer=null;},120);}

// ── Get settings ───────────────────────────────────────────────────────────
function gs(){
  function v(id){var el=document.getElementById(id);return el?(parseFloat(el.value)||0):0;}
  return{tlo:_tlo||18,thi:_thi||22,hw:v("s-hw")||1.2,tmax:v("s-tmax")||70,coolmax:_coolmax||35,coldfloor:v("s-coldfloor")||-15,coldmax:v("s-coldmax")||100,coldexp:v("s-coldexp")||1.2,dp:v("s-dp")||12,hmax:v("s-hmax")||50,hdp_ceil:v("s-hdp_ceil")||26,hexp:v("s-hexp")||0.6,wb0:v("s-wb0")||21,wbmax:v("s-wbmax")||25,wmax:v("s-wmax")||20,wchill_thresh:v("s-wchill_thresh")||10,cws:v("s-cws")||1.5,pwlo:v("s-pwlo")||10,pwhi:v("s-pwhi")||20,swt:v("s-swt")||35,rmax:v("s-rmax")||15,rainOn:rainCounts()};
}

// ── Calc ───────────────────────────────────────────────────────────────────
// ── Rain ───────────────────────────────────────────────────────────────────
// Optional rain penalty (Preferences → "Rain lowers my score"). Counts from 0.2 mm in
// the hour, rising with intensity to s.rmax at 4 mm/h. Below your cold threshold it
// grows — up to 2.5× s.rmax when 15°C under it and windy, the soaking-through-clothes
// conditions behind the hypothermia warning. Halved above your heat threshold.
var RAIN_MIN=0.2,RAIN_FULL=4,RAIN_COLD_SPAN=15,RAIN_WIND_FULL=40;
var RAIN_INFO="Turn this on and rain takes points off your comfort score.\n\nHow much depends on how hard it is raining: about 2 points for a light shower (0.2 mm in an hour), 7 for steady rain (1 mm), and 15 for heavy rain (4 mm or more).\n\nCold rain counts for more. Below the temperature where you start to feel cold, the penalty grows the colder it gets, and wind adds to it \u2014 cold, windy rain can take off up to 38 points, two and a half times the heavy-rain figure. Warm rain above your heat threshold counts half.\n\nForecast scores use each hour\u2019s forecast rainfall; climate averages aren\u2019t affected. Turn it off if you don\u2019t mind rain and only want temperature, humidity and wind to count.";
function rainCounts(){var el=document.getElementById("pref-rain");return el?el.checked:false;}
function rainPenalty(temp,wind,rain,s){
  if(!s.rainOn||rain==null||isNaN(rain)||rain<RAIN_MIN)return 0;
  var fI=Math.min(1,Math.sqrt((rain-0.1)/(RAIN_FULL-0.1)));
  var coldF=Math.max(0,Math.min(1,(s.tlo-temp)/RAIN_COLD_SPAN));
  var windF=Math.max(0,Math.min(1,(wind||0)/RAIN_WIND_FULL));
  var mult=temp>s.thi?0.5:1+coldF*0.75*(1+windF);
  return s.rmax*fI*mult;
}
function onRainPref(){localStorage.setItem("pref_rain",document.getElementById("pref-rain").checked?"1":"0");scheduleRender();}
function initRainPref(){var el=document.getElementById("pref-rain");if(el)el.checked=localStorage.getItem("pref_rain")==="1";}
// ── Sleep comfort ──────────────────────────────────────────────────────────
// Optional (Preferences → Sleep comfort). During your sleep hours, at the place's local time,
// the score judges conditions for sleeping rather than being out and about: your own
// too-cold and too-warm limits for sleeping, a steeper penalty for warmth (it builds over
// 12° above your limit instead of up to 45°C), a gentler one for cold (blankets help),
// wind only as a breeze through an open window on a warm night, and no rain.
var SLEEP_ON=false,SLEEP_FROM=21*60,SLEEP_TO=7*60,SLEEP_TLO=12,SLEEP_THI=20;
var SLEEP_INFO="Turn this on and, during your sleep hours, the score judges the weather for sleeping instead of for being out and about. 23\u00B0C is lovely in the afternoon but warm for sleeping.\n\nSleep hours: type the times you\u2019re usually asleep, such as 9 pm and 7 am (21:00 and 07:00 work too). They follow the local time of the place you\u2019re looking at.\n\nToo warm and too cold to sleep: your own limits for sleeping. Points come off faster for warmth than in the daytime score, because a warm night is hard to escape, and more gently for cold, because blankets help. Humidity still counts. Wind counts only as a breeze through an open window on a warm night, and rain doesn\u2019t count at all.\n\nWhere it shows: the main score during your sleep hours (marked \uD83C\uDF19), the overnight hours in each day\u2019s table and hour popups, and a \u201CTonight\u201D line in each day popup. The day tiles\u2019 best and worst scores use your waking hours only.";
// A typed time: "21:00", "2100", "21", "9pm", "9:30 pm" → minutes after midnight, or null
function sleepParse(t){
  var m=/^(\d{1,2})(?::?(\d{2}))?(am|pm|a|p)?$/.exec(String(t||"").trim().toLowerCase().replace(/[\s.]+/g,""));
  if(!m)return null;
  var h=+m[1],mi=m[2]?+m[2]:0;
  if(mi>59)return null;
  if(m[3]){if(h<1||h>12)return null;h=h%12+(m[3].charAt(0)==="p"?12:0);}
  else if(h>24)return null;
  return(h%24)*60+mi;
}
function sleepFmt(min){
  var h=Math.floor(min/60),mi=min%60,ap=h<12?"am":"pm",h12=h%12||12;
  return h12+(mi?":"+(mi<10?"0":"")+mi:"")+" "+ap;
}
function inSleep(min){
  if(!SLEEP_ON||min==null||isNaN(min)||SLEEP_FROM===SLEEP_TO)return false;
  return SLEEP_FROM<SLEEP_TO?(min>=SLEEP_FROM&&min<SLEEP_TO):(min>=SLEEP_FROM||min<SLEEP_TO);
}
// Minutes after midnight of a forecast hour ("2026-11-24T21:00", already local to the place)
function fcMin(timeStr){return timeStr?sleepParse(String(timeStr).slice(11,16)):null;}
// The time now at the place: the forecast's UTC offset, or this device's clock (fc false or none)
function placeMinNow(fc){
  if(fc!==false)fc=fc||window._FC;
  var off=fc&&fc.utc_offset_seconds!=null?fc.utc_offset_seconds:-new Date().getTimezoneOffset()*60;
  return((Math.floor((Date.now()/1000+off)/60)%1440)+1440)%1440;
}
function gsSleep(){
  var s=gs();
  s.tlo=SLEEP_TLO;s.thi=SLEEP_THI;s.hceil=SLEEP_THI+12;
  s.coldfloor=SLEEP_TLO-25;s.coldmax=s.coldmax*0.6;
  s.coolmax=Math.max(8,Math.min(25,Math.round((18-SLEEP_TLO)*0.8)));
  s.rainOn=false;s.sleep=true;
  return s;
}
function sleepTempsShow(){
  var u=unitSym(),f=function(c){return Math.round(useFahrenheit?toDisp(c):c);};
  var a=document.getElementById("sleep-thi"),b=document.getElementById("sleep-tlo");
  if(a)a.value=f(SLEEP_THI);if(b)b.value=f(SLEEP_TLO);
  ["sleep-thi-unit","sleep-tlo-unit"].forEach(function(id){var e=document.getElementById(id);if(e)e.textContent=u;});
}
function initSleepPrefs(){
  try{
    SLEEP_ON=localStorage.getItem("sleep_on")==="1";
    var f=parseInt(localStorage.getItem("sleep_from")),t=parseInt(localStorage.getItem("sleep_to"));
    var lo=parseFloat(localStorage.getItem("sleep_tlo")),hi=parseFloat(localStorage.getItem("sleep_thi"));
    if(!isNaN(f))SLEEP_FROM=f;if(!isNaN(t))SLEEP_TO=t;if(!isNaN(lo))SLEEP_TLO=lo;if(!isNaN(hi))SLEEP_THI=hi;
  }catch(e){}
  var on=document.getElementById("pref-sleep");if(on)on.checked=SLEEP_ON;
  var opts=document.getElementById("sleep-opts");if(opts)opts.style.display=SLEEP_ON?"":"none";
  var a=document.getElementById("sleep-from"),b=document.getElementById("sleep-to");
  if(a)a.value=sleepFmt(SLEEP_FROM);if(b)b.value=sleepFmt(SLEEP_TO);
  sleepTempsShow();
}
function onSleepPref(){
  SLEEP_ON=document.getElementById("pref-sleep").checked;
  document.getElementById("sleep-opts").style.display=SLEEP_ON?"":"none";
  var a=document.getElementById("sleep-from"),b=document.getElementById("sleep-to");
  var f=sleepParse(a.value),t=sleepParse(b.value);
  if(f===null||t===null)showToast("Type a time like 9 pm or 21:00");
  if(f!==null)SLEEP_FROM=f;if(t!==null)SLEEP_TO=t;
  a.value=sleepFmt(SLEEP_FROM);b.value=sleepFmt(SLEEP_TO);
  var hi=parseFloat(document.getElementById("sleep-thi").value),lo=parseFloat(document.getElementById("sleep-tlo").value);
  if(!isNaN(hi))SLEEP_THI=Math.round((useFahrenheit?fromDisp(hi):hi)*2)/2;
  if(!isNaN(lo))SLEEP_TLO=Math.round((useFahrenheit?fromDisp(lo):lo)*2)/2;
  if(SLEEP_TLO>=SLEEP_THI)SLEEP_TLO=SLEEP_THI-3;   // too cold must sit below too warm
  sleepTempsShow();
  try{
    localStorage.setItem("sleep_on",SLEEP_ON?"1":"0");
    localStorage.setItem("sleep_from",SLEEP_FROM);localStorage.setItem("sleep_to",SLEEP_TO);
    localStorage.setItem("sleep_tlo",SLEEP_TLO);localStorage.setItem("sleep_thi",SLEEP_THI);
  }catch(e){}
  scheduleRender();
}
// Rain over the hour to now, from the forecast's hourly data (located by date and hour)
function hourRainNow(fc){
  if(!fc||!fc.hourly||!fc.hourly.precipitation)return null;
  var tz=fc.timezone,h=localHourInTZ(tz);
  var day=new Intl.DateTimeFormat("en-CA",{timeZone:tz,year:"numeric",month:"2-digit",day:"2-digit"}).format(new Date());
  for(var i=0;i<fc.hourly.time.length;i++)if(fc.hourly.time[i].slice(0,10)===day&&parseInt(fc.hourly.time[i].slice(11,13))===h)return fc.hourly.precipitation[i];
  return null;
}
// hr: minutes after midnight at the place, for sleep comfort; leave it out for the daytime score
function calc(temp,dp,wind,rain,hr){
  var sl=inSleep(hr),s=sl?gsSleep():gs();
  var tP=0;
if(temp>=s.thi){
  tP=Math.min(1,(temp-s.thi)/Math.max(1,(s.hceil||45)-s.thi))*s.tmax*s.hw;
} else if(temp>=s.tlo){
  tP=0;
} else if(s.tlo>=0){
  // Normal case: tlo is above freezing, cool zone then cold zone
  if(temp>=0){tP=((s.tlo-temp)/Math.max(1,s.tlo))*s.coolmax;}
  else{var cf=Math.min(1,Math.abs(temp)/Math.max(1,Math.abs(s.coldfloor)));tP=s.coolmax+Math.pow(cf,s.coldexp)*s.coldmax;}
} else {
  // tlo is below freezing — add a transition zone just below tlo
  // to avoid the cliff from 0 penalty to full cold zone in one step
  var transWidth=Math.min(5,Math.abs(s.tlo)*0.5+2);
  var transBottom=s.tlo-transWidth;
  if(temp>=transBottom){
    // Gentle transition slope
    tP=((s.tlo-temp)/transWidth)*s.coolmax*0.5;
  } else {
    // Full cold zone below transition
    var cf=Math.min(1,Math.abs(temp-transBottom)/Math.max(1,Math.abs(s.coldfloor)-transWidth));
    tP=s.coolmax*0.5+Math.pow(cf,s.coldexp)*s.coldmax;
  }
}
tP=Math.min(s.tmax,tP);
  var hP=0;
  if(dp<s.dp)hP=Math.max(0,(dp+5))*0.5/Math.max(1,s.dp+5);
  else{var hf=Math.min(1,(dp-s.dp)/Math.max(1,s.hdp_ceil-s.dp));hP=Math.pow(hf,s.hexp)*s.hmax;}
  hP=Math.min(s.hmax,hP);
  // Scale humidity penalty by temperature — humidity is irrelevant below cold threshold,
  // full strength at and above heat threshold, smooth curve between
  var mid2=(s.tlo+s.thi)/2;
  var hTempScale=Math.max(0,Math.min(1,(temp-s.tlo)/(s.thi-s.tlo)));
  hP=hP*hTempScale;
  // Heat stress: above the comfort ceiling, penalise by wet-bulb temperature, which rises
  // with BOTH heat and humidity — so humidity's cost grows as it gets hotter. Ramps from
  // s.wb0 to s.wb0+8. (Kept in iP so the breakdown and annotations need no changes.)
  var iP=0;
  if(temp>s.thi){
    var wbF=Math.max(0,Math.min(1,(wetBulb(temp,dp)-s.wb0)/8));
    iP=Math.pow(wbF,1.3)*s.wbmax;
  }
  var mid=(s.tlo+s.thi)/2,wBase=0;
  if(wind>=s.pwlo){if(wind<=s.pwhi)wBase=temp>=s.tlo?-2*(1-Math.min(1,Math.max(0,Math.abs(temp-mid)/5))):0;else if(wind<=s.swt)wBase=(wind-s.pwhi)/(s.swt-s.pwhi)*s.wmax*0.4;else wBase=s.wmax*0.4+(wind-s.swt)/Math.max(1,120-s.swt)*s.wmax*0.6;}
  var wChill=0;
  if(temp<s.wchill_thresh){var cf2=Math.min(1,(s.wchill_thresh-temp)/Math.max(1,s.wchill_thresh-s.coldfloor));wChill=cf2*Math.min(1,wind/50)*s.wmax*s.cws;}
  var evap=(temp>s.thi&&dp<s.dp)?Math.min(3,(temp-s.thi)/5*(s.dp-dp)/5):0;
  var wP=Math.max(-5,Math.min(s.wmax*2.5,wBase+wChill-evap));
  // Asleep indoors: no wind chill or gusts, only a breeze through an open window when it's warm
  if(sl)wP=temp>s.thi?-Math.min(4,(wind||0)*0.2):0;
  var rP=rainPenalty(temp,wind,rain,s);
  return{score:Math.min(100,Math.max(0,Math.round(100-tP-hP-iP-wP-rP))),tP:tP,hP:hP,iP:iP,wP:wP,rP:rP,sleep:sl};
}

// ── Display ────────────────────────────────────────────────────────────────
function bandForScore(s){var v=Math.min(100,Math.max(0,s));for(var i=0;i<SBANDS.length;i++)if(v<=SBANDS[i].max)return i;return SBANDS.length-1;}
// Wet-bulb temperature from air temperature and dew point (Stull 2011, valid −20–50°C, RH 5–99%)
function wetBulb(t,dp){
  var es=function(x){return 6.112*Math.exp(17.62*x/(243.12+x));};
  var rh=Math.max(5,Math.min(99,100*es(dp)/es(t)));
  return t*Math.atan(0.151977*Math.sqrt(rh+8.313659))+Math.atan(t+rh)-Math.atan(rh-1.676331)
    +0.00391838*Math.pow(rh,1.5)*Math.atan(0.023101*rh)-4.686035;
}
// Two-tier heat-stress pill: wet bulb ≥ 28°C dangerous, ≥ 31°C extremely dangerous
var WB_DANGER=28,WB_EXTREME=31;
// Hazard pills take an optional back target for their popup: "h" returns to the open hour
function hzBackArg(back){return back?",\""+back+"\"":"";}
function wetBulbPill(t,dp,back){
  if(t==null||dp==null||isNaN(t)||isNaN(dp))return"";
  var w=wetBulb(t,dp);
  if(w<WB_DANGER)return"";
  var ext=w>=WB_EXTREME;
  return"<span class='ann "+(ext?"ann-wbx":"ann-wb")+"' onclick='showWetBulbPop("+t+","+dp+hzBackArg(back)+")'>"
    +(ext?"\uD83D\uDEA8 Extremely dangerous heat":"\uD83E\uDD75 Dangerously hot")+"</span>";
}
