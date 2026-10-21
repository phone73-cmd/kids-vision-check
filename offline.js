import {VERSION} from './vision.js';
export function initOffline({canUpdate,storageIssue}){
 const el=id=>document.getElementById(id),sw=navigator.serviceWorker;
 let registration=null,ready=false,unsupported=!sw||!window.isSecureContext,problem='',progress='',activeVersion='',candidateReady=false,applying=false,reloading=false,checking=false,rerun=false,rerunForce=false,repairing=false,lastCheck=0,applyTimer=null,openFocus=null;
 const watched=new WeakSet();
 const waiting=()=>registration?.waiting?.state==='installed'?registration.waiting:null;
 const newer=(a,b)=>a&&a.split('.').map(Number).reduce((n,v)=>n*1000+v,0)>b.split('.').map(Number).reduce((n,v)=>n*1000+v,0);
 function paint(){
  const online=navigator.onLine!==false,update=!!waiting()||newer(activeVersion,VERSION);
  const availability=ready?'오프라인 사용가능':unsupported?'오프라인 사용불가':progress||'오프라인 준비 미완료';
  const summary=(online?'온라인':'오프라인')+' · '+availability;
  el('app').inert=applying;
  el('network-slash').hidden=online;
  el('network-state').setAttribute('aria-label',(online?'온라인':'오프라인')+' · 상태 안내 열기');
  el('availability-state').setAttribute('aria-label',availability+' · 상태 안내 열기');
  el('availability-state').setAttribute('data-preparing',String(checking&&!ready));
  el('badge-ready').hidden=!ready;el('badge-unavailable').hidden=ready;
  el('offline-status').textContent=summary;el('offline-live').textContent=summary;
  el('offline-progress').textContent=applying?'새 버전 적용 중…':progress;
  el('offline-notice').textContent=problem;
  el('storage-notice').textContent=storageIssue();
  el('offline-attention').hidden=!update&&!problem&&!storageIssue();
  el('offline-help').setAttribute('aria-label',update?'사용 안내 · 새 버전 준비됨':'사용 안내');
  el('offline-update').hidden=!update;
  el('offline-update').disabled=applying||(!newer(activeVersion,VERSION)&&!candidateReady);
  el('offline-update').textContent=applying?'적용 중…':newer(activeVersion,VERSION)?'새 버전으로 열기':'새 버전 적용';
  el('offline-retry').hidden=ready&&!problem;el('offline-retry').disabled=applying||unsupported||checking||repairing;
 }
 function open(button){openFocus=button||el('offline-help');if(!el('guide').open)el('guide').showModal();el('offline-help').setAttribute('aria-expanded','true');refresh();}
 function close(){el('guide').close();}
 el('guide').addEventListener('close',()=>{el('offline-help').setAttribute('aria-expanded','false');openFocus?.focus();});
 for(const id of ['network-state','availability-state','offline-help'])el(id).onclick=()=>open(el(id));
 el('guide-close').onclick=close;
 function query(worker,type='EYE_STATUS'){
  if(!worker||worker.state==='redundant')return Promise.resolve(null);
  return new Promise(resolve=>{const channel=new MessageChannel();let settled=false;
   const timer=setTimeout(()=>finish(null),type==='EYE_REPAIR'?30000:2500);
   function finish(data){if(settled)return;settled=true;clearTimeout(timer);channel.port1.close();channel.port2.close();resolve(data);}
   channel.port1.onmessage=e=>finish(e.data);
   try{worker.postMessage({type},[channel.port2]);}catch{finish(null);}
  });
 }
 function watch(worker){if(!worker||watched.has(worker))return;watched.add(worker);worker.addEventListener('statechange',()=>{if(worker.state==='installed'||worker.state==='activated')refresh();else if(worker.state==='redundant'){problem='새 파일 준비를 마치지 못했어요. 다시 받아 주세요.';paint();}});}
 async function refresh(force=false){
  if(unsupported)return;if(checking){rerun=true;rerunForce=rerunForce||force;return;}checking=true;paint();
  try{
   const fresh=await sw.getRegistration?.();if(fresh)registration=fresh;
   if(!registration)return;
   if(force&&navigator.onLine!==false&&Date.now()-lastCheck>5000){lastCheck=Date.now();try{await registration.update();}catch{problem='새 버전을 확인하지 못했어요. 인터넷 연결을 확인해 주세요.';}}
   watch(registration.installing);watch(registration.active);watch(waiting());
   const active=await query(sw.controller||registration.active);
   if(active?.type==='EYE_STATUS'){ready=active.complete;activeVersion=active.version;progress=ready?'':'필수 파일이 일부 없어요.';}
   else if(!ready)progress='오프라인 상태를 확인하지 못했어요.';
   const candidate=waiting();candidateReady=false;
   if(candidate){const status=await query(candidate);candidateReady=!!status?.complete;if(candidateReady)progress='새 버전 준비 완료';}
   if(applying&&newer(activeVersion,VERSION)){reload();return;}
  }catch{if(!ready)problem='오프라인 준비 상태를 확인하지 못했어요.';}
  finally{checking=false;paint();if(rerun){const forceAgain=rerunForce;rerun=false;rerunForce=false;refresh(forceAgain);}}
 }
 function reload(){
  if(reloading)return;reloading=true;clearTimeout(applyTimer);applying=false;paint();
  setTimeout(()=>{reloading=false;problem='화면이 바뀌지 않으면 앱을 완전히 닫았다 다시 열어 주세요.';paint();},5000);
  try{location.reload();}catch{reloading=false;problem='새 버전을 열지 못했어요. 앱을 닫았다 다시 열어 주세요.';paint();}
 }
 el('offline-update').onclick=async()=>{
  if(applying)return;
  if(!canUpdate()){problem='확인을 마치고 눈빛정원 홈에서 새 버전을 적용해 주세요.';paint();return;}
  problem='';await refresh();
  if(!canUpdate()){problem='눈빛정원 홈에서 적용해 주세요.';paint();return;}
  if(newer(activeVersion,VERSION)){reload();return;}
  const target=waiting();
  if(!target||!candidateReady){problem='업데이트 파일을 다시 확인해 주세요.';paint();return;}
  applying=true;paint();applyTimer=setTimeout(()=>{if(applying){applying=false;problem='적용 응답이 늦어요. 다른 앱 창을 닫고 다시 시도해 주세요.';paint();}},15000);
  try{target.postMessage('ACTIVATE');}catch{clearTimeout(applyTimer);applying=false;problem='업데이트 요청을 보내지 못했어요.';paint();}
 };
 el('offline-retry').onclick=async()=>{
  if(checking||repairing||unsupported)return;repairing=true;problem='';progress='파일 다시 받는 중…';paint();
  const worker=sw.controller||registration?.active;
  const result=await query(worker,'EYE_REPAIR');
  if(!result?.complete)problem='파일을 모두 받지 못했어요. 인터넷 연결 후 다시 시도해 주세요.';
  repairing=false;await refresh(true);
 };
 if(unsupported){problem='이 환경은 오프라인 재실행을 지원하지 않아요. HTTPS 브라우저에서 사용해 주세요.';paint();}
 else{
  paint();
  sw.register('./sw.js',{updateViaCache:'none'}).then(reg=>{registration=reg;reg.addEventListener('updatefound',()=>{watch(reg.installing);progress='새 파일 준비 중…';paint();});watch(reg.installing);watch(reg.waiting);watch(reg.active);refresh();return sw.ready;}).then(()=>refresh()).catch(()=>{problem='오프라인 준비를 시작하지 못했어요. 연결 후 다시 받아 주세요.';paint();});
  sw.addEventListener('controllerchange',()=>refresh());
 }
 addEventListener('online',()=>{paint();refresh(true);});addEventListener('offline',paint);
 addEventListener('pageshow',()=>refresh(true));document.addEventListener('visibilitychange',()=>{if(!document.hidden)refresh(true);});
 return {paint,open,refresh,get applying(){return applying;}};
}
