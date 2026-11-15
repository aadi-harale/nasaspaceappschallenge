import test from "node:test";
import assert from "node:assert/strict";
import {initial} from "./engine.mjs";
import {analyzeNegotiation} from "./negotiator.mjs";
const baseline={rainfall:{kharif:520,rabi:140},irrigation:180,soil:"medium",stress:1};
test("default illustrative repair reports 5 mm narrowest model margin",()=>{
 const a=analyzeNegotiation(initial,baseline);
 assert.equal(a.hasRepair,true);
 assert.equal(a.changes,2);
 assert.equal(a.smallestHeadroomMm,5);
 assert.equal(a.headrooms[1].crop,"Chickpea");
 assert.equal(a.headrooms[1].headroomMm,5);
});
test("scenario stress variation exposes fragile baseline",()=>{
 const a=analyzeNegotiation(initial,baseline);
 assert.equal(a.stressTests[0].feasible,true);
 assert.equal(a.stressTests[2].feasible,false);
 assert.ok(a.stressTests[2].deficitMm>0);
});
test("locked wheat blocks rescue but unlocking a slot yields possible repair in this model",()=>{
 const a=analyzeNegotiation(initial,baseline,[false,true,false,false]);
 assert.equal(a.hasRepair,false);
 assert.equal(a.blockedByFarmerLocks,true);
 assert.ok(a.unlockOptions.some(x=>x.slot===2));
 assert.ok(a.minimumAdditionalIrrigation);
 assert.equal(a.minimumAdditionalIrrigation.extraMm,195);
});
test("historical low Rabi simulation yields modeled extra irrigation threshold",()=>{
 const settings={...baseline,rainfall:{kharif:1817.85,rabi:75.95}};
 const a=analyzeNegotiation(initial,settings);
 assert.equal(a.hasRepair,false);
 assert.equal(a.blockedByFarmerLocks,false);
 assert.equal(a.minimumAdditionalIrrigation.extraMm,43);
});
test("a truly all-locked plan gets honest no-unlock-one-slot result",()=>{
 const a=analyzeNegotiation(initial,{...baseline,rainfall:{kharif:0,rabi:0},irrigation:0},[true,true,true,true]);
 assert.equal(a.hasRepair,false);
 assert.deepEqual(a.unlockOptions,[]);
 assert.equal(a.minimumAdditionalIrrigation.extraMm,520);
});
