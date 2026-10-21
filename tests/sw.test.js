import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';
function worker(){
 const events=new Map(),data=new Map();let failRepair=false,takeover=0;
 const open=async name=>{if(!data.has(name))data.set(name,new Set());const entries=data.get(name);return {match:async path=>entries.has(path)?{}:undefined,addAll:async paths=>{if(failRepair)throw new Error('network offline');paths.forEach(p=>entries.add(p));}}};
 const context={caches:{open,keys:async()=>[...data.keys()],delete:async name=>data.delete(name)},self:{addEventListener:(name,fn)=>events.set(name,fn),skipWaiting:async()=>takeover++,clients:{claim:async()=>{}}},location:{origin:'https://example.test'},URL,fetch(){throw new Error('unexpected network')}};
 vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../sw.js',import.meta.url),'utf8'),context);
 return {data,setFail:()=>failRepair=true,takeover:()=>takeover,async event(name,extra={}){let task;events.get(name)({...extra,waitUntil:p=>task=p});await task;},async message(type){let response;await this.event('message',{data:type,ports:[{postMessage:value=>response=value}]});return response;}};
}
test('worker reports ready only when all required offline files exist',async()=>{
 const w=worker();await w.event('install');let status=await w.message({type:'EYE_STATUS'});assert.equal(status.complete,true);
 const cached=[...w.data.values()][0];cached.delete('./offline.js');status=await w.message({type:'EYE_STATUS'});assert.equal(status.complete,false);assert.ok(status.missing.includes('./offline.js'));
 await w.message('ACTIVATE');assert.equal(w.takeover(),0);
 status=await w.message({type:'EYE_REPAIR'});assert.equal(status.complete,true);await w.message('ACTIVATE');assert.equal(w.takeover(),1);
});
test('failed repair reports failure while preserving existing cached files',async()=>{
 const w=worker();await w.event('install');const cache=[...w.data.values()][0];cache.delete('./index.html');w.setFail();const status=await w.message({type:'EYE_REPAIR'});
 assert.equal(status.complete,false);assert.ok(cache.has('./vision.js'));
});
test('activation removes only older eye-garden caches',async()=>{
 const w=worker();await w.event('install');w.data.set('eye-garden-v1.3.0',new Set());w.data.set('other-app',new Set());await w.event('activate');
 assert.equal(w.data.has('eye-garden-v1.3.0'),false);assert.equal(w.data.has('other-app'),true);
});
