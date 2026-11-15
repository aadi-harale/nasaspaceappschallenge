// Shareable, reviewable decision brief. Pure formatter, with no fabricated field observations.
import {crops, seasons, repair} from "./engine.mjs";
import {analyzeNegotiation} from "./negotiator.mjs";
import {nasaEvidence} from "./historical-replay.mjs";
const formatNumber=(n)=>Number(n).toFixed(2).replace(/\.00$/,"");
export function createDecisionBrief({plan,settings,lockedSlots=[false,false,false,false],dataSource="Manual / illustrative rainfall inputs",sourceUrl=null,generatedAt="Date not provided"}){
 const result=repair(plan,settings,lockedSlots);
 const negotiation=analyzeNegotiation(plan,settings,lockedSlots);
 const alternative=result.alternative;
 const describePlan=(arr)=>arr.map((key,i)=>"  "+(i+1)+". "+(seasons[i]==="kharif"?"Monsoon":"Winter")+": "+crops[key].name+(lockedSlots[i]?" [FARMER LOCKED]":"")).join("\n");
 const before=result.original.slots.map((slot,i)=>"  S"+(i+1)+": "+slot.name+" | modeled available "+slot.available+" mm | demand "+slot.demand+" mm | deficit "+slot.deficit+" mm").join("\n");
 const stress=negotiation.stressTests.map(x=>"  "+Math.round(x.factor*100)+"% of selected rainfall contribution: "+(x.feasible?"model pass":"model fail; "+x.deficitMm+" mm aggregate deficit")).join("\n");
 const changes=alternative?alternative.plan.flatMap((key,i)=>key!==plan[i]?["  S"+(i+1)+": "+crops[plan[i]].name+" -> "+crops[key].name+" | "+result.original.slots[i].deficit+" -> "+alternative.eval.slots[i].deficit+" mm modeled deficit"]:[]):[];
 const recovery=alternative?"Not needed for current encoded scenario.":
  (negotiation.blockedByFarmerLocks?"A water/diversity-passing plan exists without the current crop locks.\n":"No water/diversity-passing option exists under current model assumptions.\n")+
  "Single-slot lock relaxations:\n"+(negotiation.unlockOptions.length?negotiation.unlockOptions.map(x=>"  Unlock slot "+x.slot+" ("+x.crop+"): "+x.changes+" substitutions").join("\n"):"  None identified with just one unlocked slot")+
  "\nModeled extra per-season irrigation allowance: "+(negotiation.minimumAdditionalIrrigation?negotiation.minimumAdditionalIrrigation.extraMm+" mm (mathematical threshold, NOT advice)":"No option within the bounded 600 mm sensitivity search");
 return [
 "AGROSHIFT | CONSTRAINT NEGOTIATOR",
 "Decision-support prototype | Banger Duo | Experimental branch",
 "Generated: "+generatedAt,
 "",
 "PURPOSE",
 "Audit a rotation repair under encoded agricultural constraints, not to make a validated farming recommendation.",
 "",
 "INPUT PROVENANCE",
 "Rainfall mode: "+dataSource,
 sourceUrl?"NASA API URL: "+sourceUrl:"No scenario-specific NASA API URL: values may be typed assumptions.",
 "Kharif seasonal rainfall input: "+formatNumber(settings.rainfall.kharif)+" mm",
 "Rabi seasonal rainfall input: "+formatNumber(settings.rainfall.rabi)+" mm",
 "Irrigation allowance per season: "+formatNumber(settings.irrigation)+" mm (farmer assumption)",
 "Soil screening class: "+settings.soil+" (unvalidated utilization fraction)",
 "Scenario rainfall multiplier: "+formatNumber(settings.stress),
 "NASA evidence for independently verified Pune sample: "+nasaEvidence.provenance,
 "",
 "FARMER'S ORIGINAL ROTATION",
 describePlan(plan),
 "",
 "ORIGINAL CONSTRAINT DIAGNOSIS",
 before,
 "Original modeled aggregate deficit: "+result.original.totalDeficit+" mm",
 "Distinct crop families: "+result.original.families+"; encoded minimum: 2",
 "",
 "MINIMUM-CHANGE RESULT",
 alternative?describePlan(alternative.plan):"No passing alternative in the encoded catalog under farmer locks.",
 alternative?"Substitutions: "+alternative.changes:"Substitutions: n/a",
 alternative?"Passing encoded candidates: "+result.feasibleCount+" of 256":"Passing encoded candidates: 0 of 256",
 changes.length?"Changes:\n"+changes.join("\n"):"No crop substitutions identified.",
 "",
 "MODEL FRAGILITY",
 alternative?"Smallest modeled headroom: "+negotiation.smallestHeadroomMm+" mm":"No passing plan: fragility headroom is not applicable.",
 "Selected plan with changed rainfall contribution (not a drought forecast):",
 stress,
 "",
 "CONSTRAINT NEGOTIATION / MATHEMATICAL SENSITIVITY",
 recovery,
 "",
 "EXPERT REVIEW CHECKLIST",
 "[ ] Verify local soil, irrigation and cropping calendars",
 "[ ] Calibrate local crop water requirements and seasonal timings",
 "[ ] Review crop availability, labor, finances, pests and irrigation legality",
 "[ ] Check on-farm outcomes independently before adoption",
 "",
 "SCIENTIFIC LIMITS",
 ...negotiation.warnings.map(x=>"- "+x),
 "- NASA POWER observations describe regional historical weather, not the typed demo scenario or a farm forecast.",
 "- A modeled water deficit is not measured water loss or predicted yield.",
 "- One observed season pair is repeated in both years of a historical scenario sensitivity test.",
 "",
 "PUBLIC REFERENCES",
 "NASA POWER: https://power.larc.nasa.gov/docs/services/api/temporal/daily/",
 "Source: https://github.com/aadi-harale/nasaspaceappschallenge",
 "Review sheet: https://agroshift-resilience.vercel.app/review.html",
 "This report was generated locally from model assumptions; no personally identifying farmer data was collected."
 ].join("\n");
}
