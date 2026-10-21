// Original practice drawings; these are not LEA Symbols or clinically calibrated optotypes.
export const PICTURES = [
  {id:'fish',name:'물고기',shape:'<path d="M.15 2.5C1.05.5 3.15.5 4 1.75L4.95.8V4.2L4 3.25C3.15 4.5 1.05 4.5.15 2.5Z"/><circle cx="1.3" cy="2.1" r=".18" fill="white"/>'},
  {id:'car',name:'자동차',shape:'<path d="M.15 2.15H.8L1.45.9H3.5L4.15 2.15H4.85V3.75H.15Z"/><path d="M1.2 2.15H3.7L3.3 1.35H1.65Z" fill="white"/><circle cx="1.15" cy="3.8" r=".55"/><circle cx="3.85" cy="3.8" r=".55"/>'},
  {id:'flower',name:'꽃',shape:'<circle cx="2.5" cy="1.1" r=".95"/><circle cx="3.83" cy="2.07" r=".95"/><circle cx="3.32" cy="3.64" r=".95"/><circle cx="1.68" cy="3.64" r=".95"/><circle cx="1.17" cy="2.07" r=".95"/><circle cx="2.5" cy="2.5" r=".9"/><circle cx="2.5" cy="2.5" r=".38" fill="white"/>'},
  {id:'cup',name:'컵',shape:'<path d="M.45.6H3.65V3.4Q3.65 4.4 2.6 4.4H1.5Q.45 4.4.45 3.4Z"/><path d="M3.45 1H4Q4.75 1 4.75 2.1Q4.75 3.2 4 3.2H3.45" fill="none" stroke="black" stroke-width=".5"/>'}
];
export const PICTURE_HEIGHTS_MM = [20,16,12,9,6,4];
export function randomPicture(){const a=new Uint32Array(1);crypto.getRandomValues(a);return PICTURES[a[0]%PICTURES.length].id;}
export function pictureSvg(id){const p=PICTURES.find(p=>p.id===id);if(!p)throw new Error('Unknown picture');return `<svg viewBox="-4 -4 13 13" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="black">${p.shape}<path d="M-3.5 -1H-2.5V6H-3.5ZM7.5 -1H8.5V6H7.5ZM-1 -3.5H6V-2.5H-1ZM-1 7.5H6V8.5H-1Z"/></g></svg>`;}
export function pictureSummary(levels){const passed=levels.filter(l=>l.passed);if(!passed.length)return {value:null,label:'첫 그림 단계 미통과'};const step=passed.at(-1).step;return {value:step,label:`그림 ${step}단계까지`};}
