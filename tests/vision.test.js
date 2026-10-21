import test from 'node:test';
import assert from 'node:assert/strict';
import {heightMm,displaySize,LEVELS,evaluateLevel,eyeSummary,targetSvg,DIRECTIONS} from '../vision.js';
test('3m physical geometry and CSS calibration',()=>{assert.ok(Math.abs(heightMm(1)-4.363324)<.00001);assert.ok(Math.abs(heightMm(.2)-21.8167)<.001);assert.ok(Math.abs(displaySize(1,6)-26.17994)<.001);for(let i=1;i<LEVELS.length;i++)assert.ok(heightMm(LEVELS[i])<heightMm(LEVELS[i-1]));});
test('five trials need four correct responses',()=>{assert.equal(evaluateLevel([true,true,true,true,false]),true);assert.equal(evaluateLevel([true,true,true,false,false]),false);assert.throws(()=>evaluateLevel([true]));});
test('boundary results do not invent untested acuity',()=>{assert.equal(eyeSummary([{acuity:.2,passed:false}]).value,null);assert.equal(eyeSummary([{acuity:.2,passed:true},{acuity:.25,passed:false}]).value,.2);assert.equal(eyeSummary(LEVELS.map(acuity=>({acuity,passed:true}))).value,1.5);});
test('E geometry preserves all four directions',()=>{DIRECTIONS.forEach((d,i)=>assert.ok(targetSvg(d).includes(`rotate(${i*90} 2.5 2.5)`)));assert.ok(targetSvg('right').includes('viewBox="-4 -4 13 13"'));});
