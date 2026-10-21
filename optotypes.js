import {targetSvg,eyeSummary} from './vision.js';
export const TEST_MODES=['e','c','numbers'];
export const C_DIRECTIONS=['right','down-right','down','down-left','left','up-left','up','up-right'];
const directionLabels={right:'오른쪽','down-right':'오른쪽 아래',down:'아래','down-left':'왼쪽 아래',left:'왼쪽','up-left':'왼쪽 위',up:'위','up-right':'오른쪽 위'};
const arrows={right:'→','down-right':'↘',down:'↓','down-left':'↙',left:'←','up-left':'↖',up:'↑','up-right':'↗'};
// Original vector numerals, consistent 5-unit height; not a certified numeric chart.
const digitPaths={
 '0':'M2.5 .5C-.1 .5-.1 4.5 2.5 4.5S5.1 .5 2.5 .5Z',
 '1':'M1.2 1.5L2.5 .5V4.5M1 4.5H4',
 '2':'M.5 1.5C.5 .1 4.5 .1 4.5 1.5C4.5 2.5.5 3.2.5 4.5H4.5',
 '3':'M.5 .5H4.5L2.5 2.3C5.4 2.3 5.1 4.5 2.5 4.5H.5',
 '4':'M3.5 4.5V.5L.5 3.2H4.5',
 '5':'M4.5 .5H.5V2.5H2.7C5.2 2.5 5.1 4.5 2.5 4.5H.5',
 '6':'M4.2 .5H2.5C.1 .5-.1 4.5 2.5 4.5C5.2 4.5 5.2 2.5 2.5 2.5H.6',
 '7':'M.5 .5H4.5L1.5 4.5',
 '8':'M2.5 .5C-.1 .5-.1 2.5 2.5 2.5S5.1 4.5 2.5 4.5S-.1 2.5 2.5 2.5S5.1 .5 2.5 .5Z',
 '9':'M.8 4.5H2.5C4.9 4.5 5.1 .5 2.5 .5C-.2 .5-.2 2.5 2.5 2.5H4.4'
};
export function modeName(mode){return {e:'E자 방향 확인',c:'C자 방향 확인',numbers:'숫자 읽기',pictures:'그림 구분 연습 · 이전 기록'}[mode]||'E자 방향 확인';}
export function modeDescription(mode){return mode==='numbers'?'보이는 숫자를 0~9 중에서 골라요. 자체 제작 숫자 기호의 크기 단계이며 확정 시력이 아니에요.':mode==='c'?'고리의 틈을 위·아래·좌우·대각선, 여덟 방향으로 대답해요.':'열린 방향을 위·아래·왼쪽·오른쪽으로 대답해요.';}
export function responseOptions(mode){if(mode==='numbers')return ['1','2','3','4','5','6','7','8','9','0'];if(mode==='c')return C_DIRECTIONS;return ['right','down','left','up'];}
export function randomTarget(mode){const options=responseOptions(mode);const a=new Uint32Array(1);crypto.getRandomValues(a);return options[a[0]%options.length];}
export function optotypeSvg(mode,value){
 if(mode==='e')return targetSvg(value);
 let shape;
 if(mode==='c'){
  const i=C_DIRECTIONS.indexOf(value);if(i<0)throw new Error('Unsupported C direction');
  // Outer diameter 5, inner diameter 3, gap and stroke 1. Rotate about center.
  const outer=Math.sqrt(6)+2.5,inner=Math.sqrt(2)+2.5;
  shape=`<path transform="rotate(${i*45} 2.5 2.5)" d="M${outer} 2A2.5 2.5 0 1 0 ${outer} 3H${inner}A1.5 1.5 0 1 1 ${inner} 2Z"/>`;
 }else if(mode==='numbers'){
  if(!Object.hasOwn(digitPaths,value))throw new Error('Unsupported digit');
  shape=`<path d="${digitPaths[value]}" fill="none" stroke="#000" stroke-width="1" stroke-linecap="butt" stroke-linejoin="round"/>`;
 }else throw new Error('Unsupported mode');
 return `<svg viewBox="-4 -4 13 13" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="#000">${shape}<path d="M-3.5 -1H-2.5V6H-3.5ZM7.5 -1H8.5V6H7.5ZM-1 -3.5H6V-2.5H-1ZM-1 7.5H6V8.5H-1Z"/></g></svg>`;
}
export function answerButtons(mode,attribute){
 const button=(value)=>`<button type="button" ${attribute}="${value}" aria-label="${directionLabels[value]||value}">${arrows[value]||value}</button>`;
 if(mode==='numbers')return `<div class="number-answers">${responseOptions(mode).map(button).join('')}</div>`;
 const order=mode==='c'?['up-left','up','up-right','left',null,'right','down-left','down','down-right']:[null,'up',null,'left','down','right'];
 return `<div class="direction-answers">${order.map(v=>v?button(v):'<span aria-hidden="true"></span>').join('')}</div>`;
}
export function summaryForRecord(eye,mode){
 if(mode!=='pictures')return eyeSummary(eye.levels);
 const passed=eye.levels.filter(l=>l.passed);if(!passed.length)return {value:null,label:'첫 그림 단계 미통과'};
 const value=passed.at(-1).step;return {value,label:`그림 ${value}단계까지`};
}
