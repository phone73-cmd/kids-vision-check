// Browser history stores route keys only. Session snapshots stay in this tab's memory.
const clone=value=>JSON.parse(JSON.stringify(value));
export function createAppNavigation({initial,apply,canLeave,history:browserHistory=globalThis.history,eventTarget=globalThis.window}){
 const owner=`eye-garden-${Date.now()}-${Math.random()}`;
 let current=0,next=1,restoring=false;
 const snapshots=new Map([[0,clone(initial)]]);
 const state=index=>({eyeGarden:owner,index});
 browserHistory.replaceState(state(0),'');
 function push(snapshot,{replace=false}={}){
  if(replace){snapshots.set(current,clone(snapshot));browserHistory.replaceState(state(current),'');return;}
  const index=next++;snapshots.set(index,clone(snapshot));
  // Record the actual parent link; branch IDs need not be consecutive after Back.
  parents.set(index,current);current=index;browserHistory.pushState(state(index),'');
 }
 const parents=new Map([[0,null]]);
 const trail=index=>{const a=[];while(index!==null&&index!==undefined){a.push(index);index=parents.get(index);}return a.reverse();};
 function distance(from,to){const a=trail(from),b=trail(to);let i=0;while(i<a.length&&i<b.length&&a[i]===b[i])i++;return b.length-a.length;}
 function pop(event){
  const incoming=event.state;
  if(restoring){restoring=false;return;}
  if(incoming?.eyeGarden!==owner||!snapshots.has(incoming.index))return;
  const target=incoming.index;
  if(canLeave&&!canLeave()){
   const delta=-distance(current,target);
   // Back/Forward within this route chain always has a nonzero distance.
   restoring=true;browserHistory.go(delta);return;
  }
  current=target;apply(clone(snapshots.get(target)));
 }
 eventTarget.addEventListener('popstate',pop);
 return {push,stop:()=>eventTarget.removeEventListener('popstate',pop)};
}
