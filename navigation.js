// Keep route snapshots in tab storage; browser history contains only route keys.
const clone=value=>JSON.parse(JSON.stringify(value));
export function createAppNavigation({initial,apply,canLeave,restored,history:browserHistory=globalThis.history,eventTarget=globalThis.window}){
 const valid=restored&&restored.owner===browserHistory.state?.eyeGarden&&restored.current===browserHistory.state?.index&&Array.isArray(restored.snapshots)&&Array.isArray(restored.parents);
 const owner=valid?restored.owner:`eye-garden-${Date.now()}-${Math.random()}`;
 let current=valid?restored.current:0,next=valid?restored.next:1,restoring=false,queued=null,bypass=null;
 const snapshots=new Map(valid?restored.snapshots:[[0,clone(initial)]]);
 const parents=new Map(valid?restored.parents:[[0,null]]);
 snapshots.set(current,clone(initial));
 const state=index=>({eyeGarden:owner,index});
 browserHistory.replaceState(state(current),'');
 function push(snapshot,{replace=false}={}){
  if(replace){snapshots.set(current,clone(snapshot));browserHistory.replaceState(state(current),'');return;}
  const index=next++;snapshots.set(index,clone(snapshot));parents.set(index,current);current=index;browserHistory.pushState(state(index),'');
 }
 function depth(index){let n=0;const seen=new Set();while(parents.get(index)!=null&&!seen.has(index)){seen.add(index);index=parents.get(index);n++;}return n;}
 const distance=(from,to)=>depth(to)-depth(from);
 function proceed(target){if(restoring){queued=target;return;}bypass=target;browserHistory.go(distance(current,target));}
 function pop(event){
  const incoming=event.state;
  if(restoring){restoring=false;if(queued!==null){const target=queued;queued=null;proceed(target);}return;}
  if(incoming?.eyeGarden!==owner||!snapshots.has(incoming.index))return;
  const target=incoming.index;
  if(bypass!==target&&canLeave&&!canLeave({proceed:()=>proceed(target)})){
   restoring=true;browserHistory.go(-distance(current,target));return;
  }
  bypass=null;current=target;apply(clone(snapshots.get(target)));
 }
 eventTarget.addEventListener('popstate',pop);
 return {push,serialize:()=>({owner,current,next,snapshots:[...snapshots],parents:[...parents]}),stop:()=>eventTarget.removeEventListener('popstate',pop)};
}
