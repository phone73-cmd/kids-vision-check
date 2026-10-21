// One home-scene owner: no timers or observers survive leaving the home screen.
let cleanup=null;
export function stopGardenScene(){cleanup?.();cleanup=null;}
export function skyState(date=new Date()){
 const minutes=date.getHours()*60+date.getMinutes()+date.getSeconds()/60;
 const night=minutes<360||minutes>=1140;
 const period=night?'night':minutes>=960?'dusk':'day';
 const progress=night?((minutes<360?minutes+1440:minutes)-1140)/660:(minutes-360)/780;
 return {period,kind:night?'moon':'sun',progress,left:progress*100,top:14+32*(1-Math.sin(Math.PI*progress))};
}
export function celestialMarkup(date=new Date()){const sky=skyState(date);return `<img class="celestial" src="assets/scene/${sky.kind}.webp" style="left:calc(${sky.left}% + ${32-64*sky.progress}px);top:${sky.top}px" width="58" height="58" alt="" draggable="false">`;}
export function grasshopperLayout(random=Math.random){
 const count=1+Math.floor(random()*2);
 return Array.from({length:count},(_,i)=>({left:(i?62:10)+random()*18,bottom:5+random()*7,face:random()<.5?-1:1}));
}
export function sceneMarkup(random=Math.random){return `<span class="garden-flier"><img src="assets/scene/butterfly-flying.webp" width="45" height="45" alt="" draggable="false"></span>${grasshopperLayout(random).map(p=>`<img class="grasshopper" src="assets/scene/grasshopper.webp" width="34" height="30" style="left:${p.left}%;bottom:${p.bottom}px;transform:scaleX(${p.face})" alt="" draggable="false">`).join('')}`;}
export function flightRoute(width,height,start,random=Math.random){
 const maxX=Math.max(0,width-45),maxY=Math.max(0,height-45);
 const clamp=(x,max)=>Math.max(0,Math.min(max,x));
 const from=start?{x:clamp(start.x,maxX),y:clamp(start.y,maxY)}:{x:Math.min(12,maxX),y:Math.min(65,maxY)};
 const right=from.x<maxX/2;
 const end={x:right?Math.max(0,maxX-8-random()*14):8+random()*14,y:Math.min(maxY,32+random()*Math.max(0,maxY-52))};
 end.x=clamp(end.x,maxX);
 const a={x:from.x+(end.x-from.x)*.3,y:18+random()*Math.max(0,maxY-18)};
 const b={x:from.x+(end.x-from.x)*.7,y:18+random()*Math.max(0,maxY-18)};
 const frames=Array.from({length:31},(_,i)=>{const t=i/30,u=1-t;return {x:clamp(u*u*u*from.x+3*u*u*t*a.x+3*u*t*t*b.x+t*t*t*end.x,maxX),y:clamp(u*u*u*from.y+3*u*u*t*a.y+3*u*t*t*b.y+t*t*t*end.y,maxY)};});
 return {frames,end,face:right?1:-1,front:random()<.5,duration:8500+random()*6500};
}
export function hopDelay(random=Math.random){return 7000+Math.floor(random()*8001);}
export function hopPlan(width,start,face=1,random=Math.random){
 const min=Math.min(8,Math.max(0,(width-34)/2)),max=Math.max(min,width-34-min);
 const from=Math.max(min,Math.min(max,start));
 // The original sprite faces left: scaleX(1) moves toward decreasing x.
 const forward=-face,distance=15+random()*20;
 const turn=random()<.25||from+distance*forward<min||from+distance*forward>max;
 if(turn)return {action:'turn',from,end:from,height:0,frames:[{x:from,y:0}],face:-face,duration:0};
 const end=from+distance*forward,height=10+random()*10;
 const frames=Array.from({length:21},(_,i)=>{const t=i/20;return {x:from+(end-from)*t,y:-4*height*t*(1-t)};});
 return {action:'hop',from,end,height,frames,face,duration:520+random()*180};
}
function bindGrasshoppers(sky,reduced){
 let alive=true;
 const creatures=[...sky.querySelectorAll('.grasshopper')].map(el=>({el,timer:null,animation:null,start:0}));
 function clear(c){clearTimeout(c.timer);c.timer=null;}
 function ground(c){if(c.animation){c.el.style.left=`${c.start}px`;c.animation.cancel();c.animation=null;}c.el.style.transform=c.el.style.transform.includes('-1')?'scaleX(-1)':'scaleX(1)';}
 function schedule(c){clear(c);if(!alive||document.hidden||reduced.matches||!c.el.animate)return;c.timer=setTimeout(()=>jump(c),hopDelay());}
 function jump(c){
  c.timer=null;if(!alive||document.hidden||reduced.matches)return;
  const plan=hopPlan(sky.clientWidth,c.el.offsetLeft,c.el.style.transform.includes('-1')?-1:1);c.start=plan.from;c.el.style.left=`${plan.from}px`;
  c.el.style.transform=`scaleX(${plan.face})`;
  if(plan.action==='turn'){schedule(c);return;}
  c.animation=c.el.animate(plan.frames.map(p=>({transform:`translate3d(${p.x-plan.from}px,${p.y}px,0) scaleX(${plan.face})`})),{duration:plan.duration,easing:'linear',fill:'forwards'});
  c.animation.onfinish=()=>{if(!alive)return;c.el.style.left=`${plan.end}px`;c.el.style.transform=`scaleX(${plan.face})`;c.animation.cancel();c.animation=null;schedule(c);};
 }
 const changed=()=>{for(const c of creatures){clear(c);if(reduced.matches)ground(c);else if(document.hidden)c.animation?.pause();else if(c.animation)c.animation.play();else schedule(c);}};
 const resize=()=>{for(const c of creatures){ground(c);const max=Math.max(0,sky.clientWidth-42);c.el.style.left=`${Math.max(Math.min(8,max),Math.min(max,c.el.offsetLeft))}px`;schedule(c);}};
 const observer=new ResizeObserver(resize);observer.observe(sky);
 document.addEventListener('visibilitychange',changed);reduced.addEventListener('change',changed);creatures.forEach(schedule);
 return ()=>{alive=false;observer.disconnect();document.removeEventListener('visibilitychange',changed);reduced.removeEventListener('change',changed);for(const c of creatures){clear(c);c.animation?.cancel();}};
}
export function bindGardenScene(root){
 stopGardenScene();const sky=root.querySelector('.sky'),flier=sky?.querySelector('.garden-flier');if(!flier)return;
 let active=true,animation=null,point=null;
 let skyTimer=null;
 function updateSky(){if(!active)return;const now=new Date(),value=skyState(now);sky.dataset.period=value.period;const body=sky.querySelector('.celestial');if(body){const src=`assets/scene/${value.kind}.webp`;const changed=body.getAttribute('src')!==src;body.style.transition=changed?'none':'';if(changed)body.setAttribute('src',src);body.style.left=`calc(${value.left}% + ${32-64*value.progress}px)`;body.style.top=`${value.top}px`;}clearTimeout(skyTimer);skyTimer=setTimeout(updateSky,30000-(Date.now()%30000));}
 updateSky();
 const reduced=matchMedia('(prefers-reduced-motion: reduce)');
 const stopHoppers=bindGrasshoppers(sky,reduced);
 function run(){if(!active)return;animation?.cancel();const route=flightRoute(sky.clientWidth,sky.clientHeight,point);point=route.end;
  flier.style.zIndex=route.front?'4':'1';
  flier.firstElementChild.style.transform=`scaleX(${route.face})`;
  const first=route.frames[0];flier.style.transform=`translate3d(${first.x}px,${first.y}px,0)`;
  if(reduced.matches||!flier.animate)return;
  animation=flier.animate(route.frames.map(p=>({transform:`translate3d(${p.x}px,${p.y}px,0)`})),{duration:route.duration,easing:'linear',fill:'forwards'});
  animation.onfinish=run;if(document.hidden)animation.pause();
 }
 const visible=()=>{if(document.hidden)animation?.pause();else {updateSky();animation?.play();}};
 const resize=new ResizeObserver(()=>{point=null;run();});resize.observe(sky);
 const motion=()=>{point=null;run();};reduced.addEventListener('change',motion);document.addEventListener('visibilitychange',visible);run();
 cleanup=()=>{active=false;stopHoppers();clearTimeout(skyTimer);animation?.cancel();resize.disconnect();reduced.removeEventListener('change',motion);document.removeEventListener('visibilitychange',visible);};
}
