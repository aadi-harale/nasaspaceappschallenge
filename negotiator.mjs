// Experimental decision-support interpretation of the existing encoded model.
// This is numerical sensitivity analysis, NOT measured field feasibility or irrigation advice.
import {evaluate,repair,crops,seasons} from "./engine.mjs";

const validInputs=(v)=>Number.isFinite(v)&&v>=0;
export function analyzeNegotiation(plan,settings,lockedSlots=[false,false,false,false]){
  const result=repair(plan,settings,lockedSlots);
  const replacement=result.alternative;
  const original=result.original;
  const target=replacement?.plan??plan;
  const targetEvaluation=replacement?.eval??original;
  const slots=targetEvaluation.slots;
  const headrooms=slots.map((row,i)=>({slot:i+1,crop:crops[target[i]].name,season:seasons[i],availableMm:row.available,requiredMm:row.demand,headroomMm:row.available-row.demand}));
  const smallestHeadroomMm=Math.min(...headrooms.map(x=>x.headroomMm));
  // Reduce the input rainfall stress multiplier to test whether this SAME plan remains feasible.
  // This must not be called a probability, drought forecast, or safety guarantee.
  const stressTests=[1,.95,.9,.8].map(factor=>{
    const scenario={...settings,stress:settings.stress*factor};
    const evaluation=evaluate(target,scenario);
    return {factor,feasible:evaluation.feasible&&evaluation.families>=2,deficitMm:evaluation.totalDeficit,
      retainedPlan:target,description:Math.round(factor*100)+"% of selected rainfall factor"};
  });
  // Find the minimum additional integer irrigation budget (mm per season) that allows
  // ANY encoded candidate with current farmer locks. Bounded sensitivity, not advice.
  function minimumExtraIrrigation(maxExtraMm=600){
    if(!validInputs(settings.irrigation))throw Error("Invalid irrigation");
    // Feasibility is monotonic in nonnegative irrigation within this model.
    // Binary search avoids hundreds of expensive 256-plan enumerations per UI adjustment.
    const search=(extra)=>repair(plan,{...settings,irrigation:settings.irrigation+extra},lockedSlots).alternative;
    if(!search(maxExtraMm))return null;
    let low=0,high=maxExtraMm;
    while(low<high){
      const mid=Math.floor((low+high)/2);
      if(search(mid))high=mid;else low=mid+1;
    }
    const chosen=search(low);
    return {extraMm:low,totalMm:settings.irrigation+low,
      plan:chosen.plan,changes:chosen.changes,
      status:"illustrative mathematical threshold"};
  }
  const extra= !replacement?minimumExtraIrrigation():null;
  const unlockOptions=lockedSlots.flatMap((locked,i)=>{
    if(!locked)return [];
    const nextLocks=lockedSlots.map((l,j)=>i===j?false:l);
    const candidate=repair(plan,settings,nextLocks).alternative;
    return candidate?[{slot:i+1,crop:crops[plan[i]].name,plan:candidate.plan,changes:candidate.changes}]:[];
  });
  const warnings=[
    "Crop water requirements and soil factors are illustrative, not locally validated.",
    "Headroom is a modeled difference, not a drought-risk probability or guaranteed water saving.",
    "Irrigation thresholds are mathematical scenario inputs, not recommendations to withdraw additional water.",
    "All results apply only to the eight-crop catalog, four-season calendar, and encoded diversity rule."
  ];
  return {hasRepair:Boolean(replacement),blockedByFarmerLocks:result.blockedByFarmerLocks,
    originalDeficitMm:original.totalDeficit,feasibleCount:result.feasibleCount,
    plan:target,changes:replacement?.changes??null,headrooms,smallestHeadroomMm,
    stressTests,minimumAdditionalIrrigation:extra,unlockOptions,warnings};
}
