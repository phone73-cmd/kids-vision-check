// State/protocol integration with an in-memory DOM and service-worker transport.
import test from 'node:test';import assert from 'node:assert/strict';import fs from 'node:fs';import vm from 'node:vm';import {MessageChannel} from 'node:worker_threads';import {VERSION} from '../vision.js';
function client(){
 const html=fs.readFileSync(new URL('../index.html',import.meta.url),'utf8'),elements=new Map(),events=new Map();let activeComplete=true,allowed=true,activations=0,reloads=0;
 for(const [,id] of html.matchAll(/id="([^"]+)"/g)){const listeners=new Map();elements.set(id,{hidden:true,disabled:false,textContent:'',attributes:{},open:false,setAttribute(k,v){this.attributes[k]=v},addEventListener(k,v){listeners.set(k,v)},showModal(){this.open=true},close(){this.open=false;listeners.get('close')?.()},focus(){}});}
 const makeWorker=(version,complete)=>({state:'installed',addEventListener(){},postMessage(message,ports){if(message==='ACTIVATE'){activations++;registration.active=this;registration.waiting=null;sw.controller=this;events.get('controllerchange')?.();return;}ports[0].postMessage({type:'EYE_STATUS',version,complete:typeof complete==='function'?complete():complete});}});
 const active=makeWorker(VERSION,()=>activeComplete);active.state='activated';
 const candidate=makeWorker('99.0.0',true),registration={active,waiting:null,addEventListener(){},update:async()=>{}};
 const sw={controller:active,register:async()=>registration,getRegistration:async()=>registration,ready:Promise.resolve(registration),addEventListener:(k,v)=>events.set(k,v)};
 const context={VERSION,MessageChannel,navigator:{serviceWorker:sw,onLine:true},window:{isSecureContext:true},document:{hidden:false,getElementById:id=>{assert.ok(elements.has(id),`missing element ${id}`);return elements.get(id)},addEventListener:(k,v)=>events.set(k,v)},addEventListener:(k,v)=>events.set(k,v),setTimeout:(fn,ms)=>{const t=setTimeout(fn,ms);t.unref();return t},clearTimeout,location:{reload:()=>reloads++},console};
 vm.createContext(context);vm.runInContext(fs.readFileSync(new URL('../offline.js',import.meta.url),'utf8').replace(/^import .+;\n/gm,'').replace('export function','function')+'\nglobalThis.start=initOffline;',context);
 const ui=context.start({canUpdate:()=>allowed,storageIssue:()=>''});
 return {ui,el:id=>elements.get(id),setComplete:v=>activeComplete=v,setAllowed:v=>allowed=v,addUpdate(){registration.waiting=candidate},offline(){context.navigator.onLine=false;events.get('offline')?.()},activations:()=>activations,reloads:()=>reloads};
}
async function until(predicate){for(let i=0;i<100;i++){if(predicate())return;await new Promise(resolve=>setTimeout(resolve,5));}assert.fail('state transition timed out');}
test('status icons reflect network separately from verified cached readiness',async()=>{
 const c=client();await until(()=>c.el('badge-ready').hidden===false);c.offline();assert.equal(c.el('network-slash').hidden,false);assert.equal(c.el('badge-ready').hidden,false);
 c.setComplete(false);await c.ui.refresh();await until(()=>c.el('badge-ready').hidden===true);assert.equal(c.el('badge-ready').hidden,true);assert.equal(c.el('badge-unavailable').hidden,false);assert.equal(c.el('offline-retry').hidden,false);
});
test('waiting update shows a dot, blocks during work, and reloads after takeover',async()=>{
 const c=client();await until(()=>c.el('badge-ready').hidden===false);c.addUpdate();await c.ui.refresh();await until(()=>c.el('offline-update').hidden===false&&!c.el('offline-update').disabled);
 assert.equal(c.el('offline-attention').hidden,false);assert.equal(c.el('offline-update').hidden,false);assert.equal(c.el('offline-update').disabled,false);
 c.setAllowed(false);await c.el('offline-update').onclick();assert.equal(c.activations(),0);assert.ok(c.el('offline-notice').textContent.includes('홈'));
 c.setAllowed(true);await c.el('offline-update').onclick();await until(()=>c.reloads()===1);assert.equal(c.activations(),1);
});
