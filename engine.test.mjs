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
