// AgroShift experimental crop-rotation constraint engine. Parameters are illustrative screening proxies.
export const crops={
soybean:{name:"Soybean",season:"kharif",family:"legume",water:450,cover:100},
millet:{name:"Pearl millet",season:"kharif",family:"grass",water:320,cover:90},
pigeonpea:{name:"Pigeon pea",season:"kharif",family:"legume",water:500,cover:125},
maize:{name:"Maize",season:"kharif",family:"grass",water:520,cover:105},
chickpea:{name:"Chickpea",season:"rabi",family:"legume",water:280,cover:100},
wheat:{name:"Wheat",season:"rabi",family:"grass",water:480,cover:115},
safflower:{name:"Safflower",season:"rabi",family:"aster",water:300,cover:105},
sorghum:{name:"Sorghum",season:"rabi",family:"grass",water:350,cover:100}};
export const seasons=["kharif","rabi","kharif","rabi"];
export const initial=["soybean","wheat","maize","wheat"];
export function evaluate(plan,s){
 if(plan.length!==4||plan.some((x,i)=>!crops[x]||crops[x].season!==seasons[i]))throw Error("Invalid four-season rotation");
 const {rainfall,irrigation,soil,stress}=s;
 if(!rainfall||!["kharif","rabi"].every(k=>Number.isFinite(rainfall[k])&&rainfall[k]>=0)||![irrigation,stress].every(Number.isFinite)||irrigation<0||stress<0||stress>2)throw Error("Invalid rainfall or water scenario");
 const fraction={light:.65,medium:.75,heavy:.8}[soil];if(!fraction)throw Error("Invalid soil assumption");
 const slots=plan.map((key,i)=>{const c=crops[key],available=Math.round(rainfall[c.season]*fraction*stress+irrigation),deficit=Math.max(0,c.water-available);return {key,name:c.name,available,demand:c.water,deficit,feasible:deficit===0}});
 const errors=slots.flatMap((x,i)=>x.deficit>0?[`Season ${i+1}: ${x.name} requires ${x.deficit} mm beyond modeled availability`]:[]);
 return {feasible:errors.length===0,errors,slots,totalDeficit:slots.reduce((a,x)=>a+x.deficit,0),totalDemand:slots.reduce((a,x)=>a+x.demand,0),families:new Set(plan.map(x=>crops[x].family)).size,legumeSlots:plan.filter(x=>crops[x].family==="legume").length,coverDays:plan.reduce((a,x)=>a+crops[x].cover,0)};
}
export function repair(plan,s,lockedSlots=[false,false,false,false]){
 if(!Array.isArray(lockedSlots)||lockedSlots.length!==4||lockedSlots.some(x=>typeof x!=="boolean"))throw Error("Locked slots must be four booleans");
 const original=evaluate(plan,s),valid=[],all=[],feasibleIgnoringLocks=[];
 // Exhaustively enumerate all 4-season plans: 4 x 4 x 4 x 4 = 256 candidates.
 // This proves minimum substitutions within the encoded crop catalog.
 const options=seasons.map(season=>Object.keys(crops).filter(key=>crops[key].season===season));
 for(const x0 of options[0])for(const x1 of options[1])for(const x2 of options[2])for(const x3 of options[3]){
  const p=[x0,x1,x2,x3],e=evaluate(p,s),changes=p.filter((x,i)=>x!==plan[i]).length;
  all.push({plan:p,eval:e,changes});
  if(e.feasible&&e.families>=2){
   feasibleIgnoringLocks.push({plan:p,eval:e,changes});
   if(p.every((crop,i)=>!lockedSlots[i]||crop===plan[i]))valid.push({plan:p,eval:e,changes});
  }
 }
 valid.sort((a,b)=>a.changes-b.changes||b.eval.families-a.eval.families||b.eval.coverDays-a.eval.coverDays||a.eval.totalDemand-b.eval.totalDemand);
 return {original,alternative:valid[0]??null,candidates:all.length,feasibleCount:valid.length,lockedSlots:[...lockedSlots],blockedByFarmerLocks:valid.length===0&&feasibleIgnoringLocks.length>0,feasibleIgnoringLocks:feasibleIgnoringLocks.length};
}
export function parseNasa(json){
 const daily=json?.properties?.parameter?.PRECTOTCORR;
 if(!daily||typeof daily!=="object")throw Error("NASA response lacks precipitation");
 const groups=new Map();
 for(const [date,mm] of Object.entries(daily)){
  if(!/^\d{8}$/.test(date)||!Number.isFinite(mm)||mm<0)continue;
  const y=+date.slice(0,4),m=+date.slice(4,6),day=+date.slice(6,8);
  if(m<1||m>12||day<1||day>new Date(Date.UTC(y,m,0)).getUTCDate())continue;
  const season=m>=6&&m<=9?"kharif":m>=10||m<=3?"rabi":null;
  if(!season)continue;
  const year=season==="rabi"&&m<=3?y-1:y,key=year+"-"+season;
  const g=groups.get(key)??{year,season,total:0,days:0};
  g.total+=mm;g.days++;groups.set(key,g);
 }
 const records=[...groups.values()].filter(g=>{
  const expected=g.season==="kharif"?122:182+(new Date(Date.UTC(g.year+1,1,29)).getUTCMonth()===1?1:0);
  return g.days===expected;
 });
 function median(k){
  const vals=records.filter(g=>g.season===k).map(g=>g.total).sort((a,b)=>a-b);
  if(!vals.length)throw Error("Insufficient complete NASA seasonal records");
  const mid=Math.floor(vals.length/2);
  return Math.round(vals.length%2?vals[mid]:(vals[mid-1]+vals[mid])/2);
 }
 return {rainfall:{kharif:median("kharif"),rabi:median("rabi")},records};
}
export async function fetchNasa(lat,lon){
 if(!Number.isFinite(lat)||!Number.isFinite(lon)||Math.abs(lat)>90||Math.abs(lon)>180)throw Error("Invalid coordinates");
 const end=new Date().getUTCFullYear()-1,start=end-6;
 const url=new URL("https://power.larc.nasa.gov/api/temporal/daily/point");
 for(const [k,v] of Object.entries({parameters:"PRECTOTCORR",community:"AG",latitude:lat,longitude:lon,start:start+"0101",end:end+"1231",format:"JSON"}))url.searchParams.set(k,v);
 const response=await fetch(url,{signal:AbortSignal.timeout(18000)});if(!response.ok)throw Error("NASA POWER HTTP "+response.status);
 return {...parseNasa(await response.json()),url:url.href,period:start+"–"+end};
}
/** Explain substitutions using the same evaluated slots used for decision making. */
export function explainRepair(originalPlan,repairedPlan,settings){
 const before=evaluate(originalPlan,settings);
 const after=evaluate(repairedPlan,settings);
 const changes=originalPlan.flatMap((key,i)=>key===repairedPlan[i]?[]:[{
   slot:i+1,from:crops[key].name,to:crops[repairedPlan[i]].name,
   oldDeficitMm:before.slots[i].deficit,newDeficitMm:after.slots[i].deficit,
   deficitReductionMm:before.slots[i].deficit-after.slots[i].deficit,
   note:before.slots[i].deficit===0?"Substitution may reflect diversity or tie-breaker constraints, not a direct water deficit.":"Water deficit changed under the encoded model."
 }]);
 return {changes,originalDeficitMm:before.totalDeficit,repairedDeficitMm:after.totalDeficit,
    waterConstraintsPass:after.feasible,oldFamilies:before.families,newFamilies:after.families,
    disclaimer:"Not field-validated; crop water and soil coefficients are provisional."};
}
