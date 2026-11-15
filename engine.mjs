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
export function repair(plan,s){
 const original=evaluate(plan,s),valid=[],all=[],ids=Object.keys(crops);
 const check=p=>{const e=evaluate(p,s),changes=p.filter((x,i)=>x!==plan[i]).length;all.push({plan:p,eval:e,changes});if(e.feasible&&e.families>=2)valid.push({plan:p,eval:e,changes})};
 check([...plan]);
 for(let i=0;i<4;i++)for(const x of ids)if(x!==plan[i]&&crops[x].season===seasons[i]){const p=[...plan];p[i]=x;check(p)}
 for(let i=0;i<4;i++)for(let j=i+1;j<4;j++)for(const x of ids)for(const y of ids)if(x!==plan[i]&&y!==plan[j]&&crops[x].season===seasons[i]&&crops[y].season===seasons[j]){const p=[...plan];p[i]=x;p[j]=y;check(p)}
 valid.sort((a,b)=>a.changes-b.changes||b.eval.families-a.eval.families||b.eval.coverDays-a.eval.coverDays||a.eval.totalDemand-b.eval.totalDemand);
 return {original,alternative:valid[0]??null,candidates:all.length,feasibleCount:valid.length};
}
export function parseNasa(json){
 const daily=json?.properties?.parameter?.PRECTOTCORR;if(!daily)throw Error("NASA response lacks precipitation");
 const groups={};
 for(const [date,mm] of Object.entries(daily)){if(!/^\d{8}$/.test(date)||!Number.isFinite(mm)||mm<0)continue;const y=+date.slice(0,4),m=+date.slice(4,6),k=m>=6&&m<=9?"kharif":m>=10||m<=3?"rabi":null;if(!k)continue;const year=k==="rabi"&&m<=3?y-1:y,key=year+"-"+k;const g=groups[key]??={year,season:k,total:0,days:0};g.total+=mm;g.days++;}
 const records=Object.values(groups).filter(g=>g.days>=(g.season==="kharif"?118:177));
 function median(k){const vals=records.filter(g=>g.season===k).map(g=>g.total).sort((a,b)=>a-b);if(!vals.length)throw Error("Insufficient complete NASA seasonal records");return Math.round(vals[Math.floor((vals.length-1)/2)])}
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