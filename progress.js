const KEY='eye-garden-progress-v1';
const pages=['home','calibration','preparation','practice','eyeIntro','test','result','history'];
export function saveProgress(storage,snapshot,navigation){
 try{storage.setItem(KEY,JSON.stringify({schema:1,snapshot,navigation}));return true;}catch{return false;}
}
export function loadProgress(storage){
 try{
  const saved=JSON.parse(storage.getItem(KEY)||'null'),s=saved?.snapshot;
  if(saved?.schema!==1||!s||!pages.includes(s.page)||!['e','c','numbers'].includes(s.selectedMode)||!['with','without'].includes(s.selectedGlasses))return null;
  if(['practice','eyeIntro','test'].includes(s.page)){
   const x=s.session;
   if(!x||typeof x.id!=='string'||!['e','c','numbers'].includes(x.mode)||![0,1].includes(x.eye)||!Number.isInteger(x.level)||x.level<0||x.level>9||!Array.isArray(x.answers)||x.answers.length>4||!x.answers.every(a=>typeof a==='boolean')||!Array.isArray(x.eyes)||x.eyes.length>2||!x.eyes.every(e=>e&&Array.isArray(e.levels)))return null;
   const targets=x.mode==='numbers'?Array.from({length:10},(_,i)=>String(i)):x.mode==='c'?['up','down','left','right','up-right','up-left','down-right','down-left']:['up','down','left','right'];
   if(s.page==='test'&&!targets.includes(x.direction))return null;
  }
  const n=saved.navigation;
  // Invalid history never prevents restoring the current screen.
  if(!n||typeof n.owner!=='string'||!Number.isInteger(n.current)||!Number.isInteger(n.next)||!Array.isArray(n.snapshots)||!Array.isArray(n.parents)||n.snapshots.length>500||!n.snapshots.every(pair=>Array.isArray(pair)&&pair.length===2&&Number.isInteger(pair[0])&&pages.includes(pair[1]?.page))||!n.parents.every(pair=>Array.isArray(pair)&&pair.length===2&&Number.isInteger(pair[0])&&(pair[1]===null||Number.isInteger(pair[1]))))saved.navigation=null;
  return saved;
 }catch{return null;}
}
