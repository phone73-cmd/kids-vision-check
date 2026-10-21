// Exercise application state transitions without a browser or a real device.
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import vm from 'node:vm';
import {webcrypto} from 'node:crypto';
import * as vision from '../vision.js';
import * as optotypes from '../optotypes.js';
import {createAppNavigation} from '../navigation.js';
import {saveProgress,loadProgress} from '../progress.js';
import {skyState,celestialMarkup} from '../scene.js';
import {deleteStoredRecord} from '../records.js';
function application(confirmAnswer=true,shared={stored:null,progress:null,entries:[null],position:0}){
 const nodes=new Map(),pending=[],events=new Map(),entries=shared.entries;let failWrite=false;
 const browserHistory={get state(){return entries[shared.position]},replaceState(s){entries[shared.position]=s},pushState(s){entries.splice(shared.position+1);entries.push(s);shared.position++},go(delta){const next=shared.position+delta;if(next<0||next>=entries.length)return;shared.position=next;events.get('popstate')?.({state:entries[shared.position]})}};
 function element(){const listeners=new Map();return {clientWidth:366,innerHTML:'',textContent:'',style:{},classList:{toggle(){}},addEventListener(name,fn){listeners.set(name,fn)},querySelectorAll(){return []},open:false,close(){this.open=false;listeners.get('close')?.()},showModal(){this.open=true}};}
 const query=s=>{if(!nodes.has(s))nodes.set(s,element());return nodes.get(s)};
 const context={saveProgress,loadProgress,sessionStorage:{getItem:()=>shared.progress,setItem:(k,v)=>shared.progress=v},...vision,...optotypes,deleteStoredRecord,initOffline:()=>({paint(){}}),createAppNavigation,skyState,celestialMarkup,history:browserHistory,sceneMarkup:()=>'',bindGardenScene(){},stopGardenScene(){},document:{querySelector:query,body:element()},localStorage:{getItem:()=>shared.stored,setItem:(k,v)=>{if(failWrite)throw new Error('storage full');shared.stored=v}},innerWidth:402,screen:{width:402,height:874,orientation:{type:'portrait-primary'}},devicePixelRatio:3,visualViewport:{scale:1,addEventListener(){}},window:{history:browserHistory,scrollTo(){},addEventListener:(name,fn)=>events.set(name,fn),removeEventListener:name=>events.delete(name)},navigator:{},crypto:webcrypto,addEventListener(){},setTimeout:fn=>{pending.push(fn);return pending.length},clearTimeout(){},confirm:()=>confirmAnswer,console};
 vm.createContext(context);
 const source=fs.readFileSync(new URL('../app.js',import.meta.url),'utf8').replace(/^import .+;\n/gm,'');
 vm.runInContext(source+`\nglobalThis.flow={setup(mode){state.calibration={pxPerMm:6,signature:signature()};session={id:crypto.randomUUID(),mode,eye:0,level:0,answers:[],eyes:[],glasses:'without'};completed=null;busy=false;page='test';session.direction=nextTarget();render()},open(mode){state.calibration={pxPerMm:6,signature:signature()};save();selectedMode=mode;navigate('calibration');navigate('preparation');session={id:crypto.randomUUID(),mode,eye:0,level:0,answers:[],eyes:[],glasses:'without'};navigate('practice');navigate('eyeIntro');session.direction=nextTarget();navigate('test')},correct(){answer(session.direction)},unknown(){answer('unknown')},second(){session.direction=nextTarget();navigate('test')},requestDelete,confirmPendingDelete,requestExit,abort,navigate,seed(records){state.records=records;save();navigate('history')},snapshot(){return {page,session,completed,records:state.records,pendingDelete,html:app.innerHTML}}};`,context);
 return {flow:context.flow,flush(){while(pending.length)pending.shift()()},saved:()=>JSON.parse(shared.stored),back:()=>browserHistory.go(-1),forward:()=>browserHistory.go(1),failWrite(value){failWrite=value},node:query,reload:()=>application(true,shared),context,shared};
}
for(const mode of optotypes.TEST_MODES)test(`${mode}: both eyes finish, persist type and render results`,()=>{
 const a=application();a.flow.setup(mode);
 for(let i=0;i<50;i++){a.flow.correct();a.flush();}
 assert.equal(a.flow.snapshot().page,'eyeIntro');a.flow.second();
 for(let i=0;i<50;i++){a.flow.correct();a.flush();}
 const result=a.flow.snapshot();assert.equal(result.page,'result');assert.equal(result.completed.mode,mode);assert.equal(result.completed.eyes.length,2);
 assert.equal(result.completed.eyes[0].levels.length,10);assert.ok(result.html.includes(optotypes.modeName(mode)));assert.equal(a.saved().records[0].mode,mode);if(mode==='numbers')assert.equal(a.saved().records[0].numberStyle,optotypes.NUMBER_STYLE);
});
test('unknown response fails first stage without inventing a passed level',()=>{
 const a=application();a.flow.setup('numbers');for(let i=0;i<5;i++){a.flow.unknown();a.flush();}a.flow.second();for(let i=0;i<5;i++){a.flow.unknown();a.flush();}
 assert.equal(a.flow.snapshot().page,'result');assert.equal(a.saved().records[0].eyes[0].levels[0].passed,false);
});

test('browser Back cancellation preserves ongoing trial and route',()=>{
 const a=application(false);a.flow.open('numbers');a.flow.correct();a.flush();a.back();
 assert.equal(a.node('#stop-dialog').open,true);a.node('#stop-cancel').onclick();assert.equal(a.flow.snapshot().page,'test');assert.equal(a.flow.snapshot().session.answers.length,1);
});
test('confirmed Back discards current eye responses and reaches previous preparation screens',()=>{
 const a=application(true);a.flow.open('c');a.flow.correct();a.flush();a.back();a.node('#stop-confirm').onclick();
 assert.equal(a.flow.snapshot().page,'eyeIntro');assert.equal(a.flow.snapshot().session.answers.length,0);
 a.back();assert.equal(a.flow.snapshot().page,'practice');a.back();assert.equal(a.flow.snapshot().page,'preparation');
 a.back();assert.equal(a.flow.snapshot().page,'calibration');
 a.forward();assert.equal(a.flow.snapshot().page,'preparation');
});

const record=(id)=>({id,date:'2026-10-21T03:00:00Z',mode:'e',eyes:[{levels:[{acuity:.4,passed:true}]},{levels:[{acuity:.5,passed:true}]}]});
test('delete dialog cancellation preserves records, confirmed deletion persists and refreshes',()=>{
 const a=application();a.flow.seed([record('a'),record('b')]);a.flow.requestDelete('a');
 assert.equal(a.node('#delete-dialog').open,true);a.node('#delete-cancel').onclick();
 assert.equal(a.flow.snapshot().records.length,2);assert.equal(a.flow.snapshot().pendingDelete,null);
 a.flow.requestDelete('a');a.flow.confirmPendingDelete();
 assert.equal(a.saved().records.length,1);assert.equal(a.saved().records[0].id,'b');assert.equal(a.flow.snapshot().records.length,1);assert.equal(a.node('#delete-dialog').open,false);
});
test('failed delete write retains record and allows retry',()=>{
 const a=application();a.flow.seed([record('a')]);a.flow.requestDelete('a');a.failWrite(true);a.flow.confirmPendingDelete();
 assert.equal(a.flow.snapshot().records.length,1);assert.equal(a.saved().records.length,1);assert.equal(a.node('#delete-dialog').open,true);assert.ok(a.node('#delete-error').textContent);
 a.failWrite(false);a.flow.confirmPendingDelete();assert.equal(a.saved().records.length,0);assert.equal(a.node('#delete-dialog').open,false);
});

for(const destination of ['home','preparation'])test(`test exit to ${destination} requires modal confirmation`,()=>{
 const a=application();a.flow.open('e');a.flow.correct();a.flush();
 a.flow.requestExit(destination);assert.equal(a.node('#stop-dialog').open,true);
 a.node('#stop-cancel').onclick();assert.equal(a.flow.snapshot().page,'test');assert.equal(a.flow.snapshot().session.answers.length,1);
 a.flow.requestExit(destination);a.node('#stop-confirm').onclick();assert.equal(a.flow.snapshot().page,destination);assert.equal(a.flow.snapshot().session,null);
});
for(const mode of optotypes.TEST_MODES)test(`${mode}: refresh in blank interval restores next question and Back history`,()=>{
 const a=application();a.flow.open(mode);a.flow.correct();const before=a.flow.snapshot();
 const b=a.reload(),after=b.flow.snapshot();assert.equal(after.page,'test');assert.equal(after.session.id,before.session.id);assert.equal(after.session.direction,before.session.direction);assert.deepEqual(Array.from(after.session.answers),[true]);
 b.back();assert.equal(b.node('#stop-dialog').open,true);b.node('#stop-confirm').onclick();assert.equal(b.flow.snapshot().page,'eyeIntro');
});
test('left-eye refresh retains right-eye result and completes exactly one record',()=>{
 const a=application();a.flow.open('c');for(let i=0;i<5;i++){a.flow.unknown();a.flush();}a.flow.second();a.flow.correct();a.flush();
 const b=a.reload();assert.equal(b.flow.snapshot().session.eye,1);assert.equal(b.flow.snapshot().session.eyes[0].levels.length,1);
 for(let i=0;i<4;i++){b.flow.unknown();b.flush();}assert.equal(b.flow.snapshot().page,'result');assert.equal(b.saved().records.length,1);
 const c=b.reload();assert.equal(c.flow.snapshot().page,'result');assert.equal(c.saved().records.length,1);
});
test('changed device geometry on reload requires calibration',()=>{
 const a=application();a.flow.open('e');a.flow.correct();a.flush();
 const stored=JSON.parse(a.shared.stored||'null')||{records:[],calibration:{pxPerMm:6,signature:'old-device'}};
 stored.calibration={pxPerMm:6,signature:'old-device'};a.shared.stored=JSON.stringify(stored);
 const b=a.reload();assert.equal(b.flow.snapshot().page,'calibration');assert.equal(b.flow.snapshot().session,null);
});

test('refresh after completed record write recovers result instead of replaying old progress',()=>{
 const a=application();a.flow.open('numbers');for(let i=0;i<5;i++){a.flow.unknown();a.flush();}a.flow.second();
 for(let i=0;i<4;i++){a.flow.unknown();a.flush();}const oldProgress=a.shared.progress;
 a.flow.unknown();a.flush();assert.equal(a.saved().records.length,1);a.shared.progress=oldProgress;
 const b=a.reload();assert.equal(b.flow.snapshot().page,'result');assert.equal(b.flow.snapshot().session,null);assert.equal(b.saved().records.length,1);
});
test('refresh keeps preparation mode and glasses selections',()=>{
 const a=application();a.flow.open('e');a.flow.requestExit('preparation');a.node('#stop-confirm').onclick();
 a.node('#test-mode').onchange({target:{value:'numbers'}});a.node('#glasses').onchange({target:{value:'with'}});
 const b=a.reload();assert.equal(b.flow.snapshot().page,'preparation');assert.ok(b.flow.snapshot().html.includes('value="numbers" selected'));assert.ok(b.flow.snapshot().html.includes('value="with" selected'));
});
test('corrupt tab progress falls back safely to home',()=>{
 const a=application();a.shared.progress='{broken';const b=a.reload();assert.equal(b.flow.snapshot().page,'home');
});
