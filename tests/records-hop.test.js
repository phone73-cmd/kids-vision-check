import test from 'node:test';import assert from 'node:assert/strict';
import {deleteStoredRecord} from '../records.js';import {hopDelay,hopPlan} from '../scene.js';
test('delete reads latest storage so another tab’s new records are retained',()=>{
 const current={calibration:{pxPerMm:6},records:[{id:'a'}]},latest={...current,records:[{id:'a'},{id:'new'}]};let raw=JSON.stringify(latest);
 const result=deleteStoredRecord(current,'a',{getItem:()=>raw,setItem:(key,v)=>raw=v},'test');
 assert.equal(result.ok,true);assert.deepEqual(result.state.records,[{id:'new'}]);assert.equal(current.records.length,1);
});
test('invalid storage is preserved and deletion reports failure',()=>{
 let writes=0;const state={records:[{id:'a'}]};const result=deleteStoredRecord(state,'a',{getItem:()=>'{bad',setItem:()=>writes++},'test');
 assert.equal(result.ok,false);assert.equal(result.state,state);assert.equal(writes,0);
});
test('grasshopper rests 7–15 seconds, jumps briefly, lands within horizontal margins',()=>{
 assert.equal(hopDelay(()=>0),7000);assert.equal(hopDelay(()=>.999999),15000);
 for(const width of [60,284,366,500])for(const start of [0,width/2,width])for(const seed of [.01,.49,.51,.99]){
  const jump=hopPlan(width,start,()=>seed);assert.ok(jump.duration>=520&&jump.duration<=700);assert.ok(jump.height>=10&&jump.height<=20);
  assert.equal(Math.abs(jump.frames[0].y),0);assert.equal(Math.abs(jump.frames.at(-1).y),0);assert.ok(Math.abs(jump.frames.at(-1).x-jump.end)<1e-9);
  for(const p of jump.frames){assert.ok(p.x>=8&&p.x<=width-42);assert.ok(p.y>=-20&&p.y<=0);}
  if(width>=284)assert.ok(Math.abs(jump.end-jump.from)>=15&&Math.abs(jump.end-jump.from)<=35);
 }
});
