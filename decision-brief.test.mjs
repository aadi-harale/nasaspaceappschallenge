import test from "node:test";
import assert from "node:assert/strict";
import {initial} from "./engine.mjs";
import {createDecisionBrief} from "./decision-brief.mjs";
const baseline={rainfall:{kharif:520,rabi:140},irrigation:180,soil:"medium",stress:1};
test("advisor brief includes exact baseline, source status, and no invented NASA link",()=>{
 const t=createDecisionBrief({plan:initial,settings:baseline,generatedAt:"2026-11-15"});
 assert.match(t,/Original modeled aggregate deficit: 390 mm/);
 assert.match(t,/Smallest modeled headroom: 5 mm/);
 assert.match(t,/Manual \/ illustrative rainfall inputs/);
 assert.match(t,/No scenario-specific NASA API URL/);
 assert.match(t,/NOT advice/);
 assert.match(t,/2026-11-15/);
});
test("advisor brief documents locked farmer priorities and hypothetical scenario recovery",()=>{
 const t=createDecisionBrief({plan:initial,settings:baseline,lockedSlots:[false,true,false,true]});
 assert.match(t,/\[FARMER LOCKED\]/);
 assert.match(t,/No passing alternative in the encoded catalog/);
 assert.match(t,/mathematical threshold/);
 assert.match(t,/195 mm/);
});
test("advisor brief acknowledges no repair and avoids fictitious resilience results",()=>{
 const t=createDecisionBrief({plan:initial,settings:{...baseline,rainfall:{kharif:0,rabi:0},irrigation:0}});
 assert.match(t,/No passing alternative/);
 assert.match(t,/Headroom|headroom/);
 assert.doesNotMatch(t,/guaranteed yield/i);
});
