import {repair} from "./engine.mjs";
export const observedYears = [
 {label:"2022–23", year:2022, rainfall:{kharif:1988.83,rabi:227.23}},
 {label:"2023–24", year:2023, rainfall:{kharif:1817.85,rabi:75.95}}
];
export const incompleteYear={label:"2024–25",year:2024,kharifRainfallMm:2417.46,reason:"2024–25 Rabi is incomplete because the verified dataset ends in December 2024"};
export const nasaEvidence={
 source:"NASA POWER PRECTOTCORR daily precipitation, 2022–2024, 18.52 N 73.85 E",
 provenance:"https://github.com/aadi-harale/nasaspaceappschallenge/actions/runs/43730283559",
 parameter:"PRECTOTCORR",unit:"mm/day",rawSha256:"66fd31820934bbf590b5a44321020d1bb5d12b369a4d38eeadcb8e6cf5a7060c"
};
export function replayObservedYears(plan,{soil="medium",irrigation=180,stress=1}={}){
 return observedYears.map(year=>{
  const scenario={rainfall:year.rainfall,soil,irrigation,stress};
  const result=repair(plan,scenario);
  return {label:year.label,year:year.year,rainfall:year.rainfall,originalDeficitMm:result.original.totalDeficit,
    originalFeasible:result.original.feasible,
    alternative:result.alternative?.plan??null,
    substitutions:result.alternative?.changes??null,
    alternativeDeficitMm:result.alternative?.eval.totalDeficit??null,
    feasibleCount:result.feasibleCount,
    explanatoryNote:result.alternative?
      "Passes only simplified encoded water and crop-family constraints":
      "No candidate in the encoded catalog passed under these assumptions"};
 });
}
