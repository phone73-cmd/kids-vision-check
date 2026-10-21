// Exercise application state transitions without a browser or a real device.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import * as vision from '../vision.js';
import * as optotypes from '../optotypes.js';
function application(){
 const nodes=new Map(),pending=[];let stored=null;
 function element(){return {clientWidth:366,innerHTML:'',textContent:'',style:{},classList:{toggle(){}},addEventListener(){},querySelectorAll(){return []}};}
 const query=s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s)};
 const context={...vision,...optotypes,sceneMarkup:()=>'',bindGardenScene(){},stopGardenScene(){},document:{querySelector:query,body:element()},localStorage:{getItem:()=>null,setItem:(k,v)=>stored=v},innerWidth:402,screen:{width:402,height:874,orientation:{type:'portrait-primary'}},devicePixelRatio:3,visualViewport:{scale:1,addEventListener(){}},window:{scrollTo(){}},navigator:{},crypto:webcrypto,addEventListener(){},setTimeout:fn=>{pending.push(fn);return pending.length},clearTimeout(){},confirm:()=>true,console};
 vm.createContext(context);
 const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .+;\n/gm,'');
 vm.runInContext(source+`\nglobalThis.flow={setup(mode){state.calibration={pxPerMm:6,signature:signature()};session={mode,eye:0,level:0,answers:[],eyes:[],glasses:'without'};completed=null;busy=false;page='test';session.direction=nextTarget();render()},correct(){answer(session.direction)},unknown(){answer('unknown')},second(){session.direction=nextTarget();navigate('test')},snapshot(){return {page,session,completed,html:app.innerHTML}}};`,context);
 return {flow:context.flow,flush(){while(pending.length)pending.shift()()},saved:()=>JSON.parse(stored)};
}
for(const mode of optotypes.TEST_MODES)test(`${mode}: both eyes finish, persist type and render results`,()=>{
 const a=application();a.flow.setup(mode);
 for(let i=0;i<50;i++){a.flow.correct();a.flush();}
 assert.equal(a.flow.snapshot().page,'eyeIntro');a.flow.second();
 for(let i=0;i<50;i++){a.flow.correct();a.flush();}
 const result=a.flow.snapshot();assert.equal(result.page,'result');assert.equal(result.completed.mode,mode);assert.equal(result.completed.eyes.length,2);
 assert.equal(result.completed.eyes[0].levels.length,10);assert.ok(result.html.includes(optotypes.modeName(mode)));assert.equal(a.saved().records[0].mode,mode);
});
test('unknown response fails first stage without inventing a passed level',()=>{
 const a=application();a.flow.setup('numbers');for(let i=0;i<5;i++){a.flow.unknown();a.flush();}a.flow.second();for(let i=0;i<5;i++){a.flow.unknown();a.flush();}
 assert.equal(a.flow.snapshot().page,'result');assert.equal(a.saved().records[0].eyes[0].levels[0].passed,false);
});
