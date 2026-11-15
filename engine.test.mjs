import test from "node:test";import assert from "node:assert/strict";import {evaluate,repair,initial,parseNasa} from "./engine.mjs";
const s={rainfall:{kharif:520,rabi:140},irrigation:180,soil:"medium",stress:1};
test("original rotation has named water failures",()=>{const x=evaluate(initial,s);assert.equal(x.feasible,false);assert.equal(x.errors.length,2)});
test("rescue makes two substitutions and passes all encoded constraints",()=>{const r=repair(initial,s);assert.ok(r.alternative);assert.equal(r.alternative.changes,2);assert.equal(r.alternative.eval.feasible,true)});
test("no-change solution has priority when valid",()=>{const r=repair(["millet","chickpea","millet","chickpea"],{...s,rainfall:{kharif:800,rabi:500},irrigation:0});assert.equal(r.alternative.changes,0)});
test("no solution must be represented honestly",()=>{const r=repair(initial,{...s,rainfall:{kharif:0,rabi:0},irrigation:0});assert.equal(r.alternative,null)});
test("invalid season and invalid negative irrigation are rejected",()=>{assert.throws(()=>evaluate(["wheat","wheat","maize","wheat"],s));assert.throws(()=>evaluate(initial,{...s,irrigation:-5}))});
test("NASA parser requires precipitation series",()=>assert.throws(()=>parseNasa({})));
test("NASA parser calculates complete season totals",()=>{const d={};for(let y=2022;y<=2024;y++)for(let m=1;m<=12;m++)for(let day=1;day<=new Date(Date.UTC(y,m,0)).getUTCDate();day++)d[String(y)+String(m).padStart(2,"0")+String(day).padStart(2,"0")]=1;const p=parseNasa({properties:{parameter:{PRECTOTCORR:d}}});assert.equal(p.rainfall.kharif,122);assert.equal(p.rainfall.rabi,183)});

test("repair search covers entire four-season catalog",()=>{const r=repair(initial,s);assert.equal(r.candidates,256)});
test("incomplete NASA seasons must be rejected",()=>{const d={};for(let m=6;m<=9;m++)for(let day=1;day<=new Date(Date.UTC(2022,m,0)).getUTCDate();day++)d["2022"+String(m).padStart(2,"0")+String(day).padStart(2,"0")]=1;assert.throws(()=>parseNasa({properties:{parameter:{PRECTOTCORR:d}}}),/Insufficient/)});

test("historical replay uses verified NASA seasonal totals and does not invent third Rabi",async()=>{
 const {replayObservedYears,incompleteYear}=await import("./historical-replay.mjs");
 const rows=replayObservedYears(initial,{soil:"medium",irrigation:180,stress:1});
 assert.equal(rows.length,2);
 assert.equal(rows[0].rainfall.rabi,227.23);
 assert.equal(rows[1].rainfall.rabi,75.95);
 assert.equal(rows[0].originalDeficitMm,260);
 assert.equal(rows[1].originalDeficitMm,486);
 assert.equal(rows[1].alternative,null);
 assert.equal(incompleteYear.year,2024);
});

test("counterfactual explanations agree with engine deficits",async()=>{
 const {explainRepair}=await import("./engine.mjs");
 const original=["soybean","wheat","maize","wheat"],revised=["soybean","chickpea","maize","chickpea"];
 const report=explainRepair(original,revised,s);
 assert.equal(report.originalDeficitMm,390);
 assert.equal(report.repairedDeficitMm,0);
 assert.equal(report.changes.length,2);
 for(const swap of report.changes){assert.equal(swap.oldDeficitMm,195);assert.equal(swap.newDeficitMm,0)}
});
test("counterfactual explanation does not claim water benefits for non-water swaps",async()=>{
 const {explainRepair}=await import("./engine.mjs");
 const x=explainRepair(["soybean","chickpea","maize","chickpea"],["millet","chickpea","maize","chickpea"],s);
 assert.equal(x.changes[0].oldDeficitMm,0);
 assert.match(x.changes[0].note,/diversity or tie-breaker/);
});

test("farmer locks a slot and optimizer preserves that exact crop",()=>{
 const locked=repair(initial,s,[true,false,false,false]);
 assert.ok(locked.alternative);
 assert.equal(locked.alternative.plan[0],initial[0]);
 assert.equal(locked.alternative.changes,2);
 assert.equal(locked.feasibleCount>0,true);
});
test("locking failing Wheat slots returns no passing rotation",()=>{
 const locked=repair(initial,s,[false,true,false,true]);
 assert.equal(locked.alternative,null);
 assert.equal(locked.feasibleCount,0);
 assert.equal(locked.candidates,256);
});
test("invalid lock shape rejected",()=>{
 assert.throws(()=>repair(initial,s,[true,false]),/Locked slots/);
 assert.throws(()=>repair(initial,s,[true,"false",false,false]),/Locked slots/);
});
test("unlocked repair remains backward compatible",()=>{
 const defaultResult=repair(initial,s);
 const explicitResult=repair(initial,s,[false,false,false,false]);
 assert.deepEqual(defaultResult,explicitResult);
});

test("NASA historical sensitivity scenarios respect farmer crop locks",async()=>{
 const {replayObservedYears}=await import("./historical-replay.mjs");
 const rows=replayObservedYears(initial,{soil:"medium",irrigation:180,stress:1,lockedSlots:[false,true,false,false]});
 assert.equal(rows.length,2);
 for(const row of rows){
   assert.deepEqual(row.lockedSlots,[false,true,false,false]);
   assert.equal(row.alternative,null); // locked Wheat is above the encoded Rabi water allowance
 }
});

test("when locks eliminate passing candidates, explain priority conflict",()=>{
 const s={rainfall:{kharif:520,rabi:140},irrigation:180,soil:"medium",stress:1};
 const result=repair(initial,s,[false,true,false,true]);
 assert.equal(result.alternative,null);
 assert.equal(result.blockedByFarmerLocks,true);
 assert.ok(result.feasibleIgnoringLocks>0);
});
test("when water constraints fail for every candidate, do not blame farmer locks",()=>{
 const s={rainfall:{kharif:0,rabi:0},irrigation:0,soil:"medium",stress:1};
 const result=repair(initial,s,[true,true,true,true]);
 assert.equal(result.alternative,null);
 assert.equal(result.blockedByFarmerLocks,false);
 assert.equal(result.feasibleIgnoringLocks,0);
});
test("an original water-feasible rotation can still violate the diversity rule",()=>{
 const s={rainfall:{kharif:1000,rabi:1000},irrigation:0,soil:"medium",stress:1};
 const sameFamily=["millet","wheat","millet","wheat"];
 const checked=evaluate(sameFamily,s);
 assert.equal(checked.feasible,true);
 assert.equal(checked.families,1);
 const r=repair(sameFamily,s);
 assert.ok(r.alternative);
 assert.ok(r.alternative.changes>=1);
 assert.ok(r.alternative.eval.families>=2);
});
