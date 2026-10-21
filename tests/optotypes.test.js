import test from 'node:test';
import assert from 'node:assert/strict';
import {TEST_MODES,C_DIRECTIONS,responseOptions,randomTarget,optotypeSvg,answerButtons,summaryForRecord,modeName} from '../optotypes.js';
import {flightRoute,grasshopperLayout} from '../scene.js';
test('three selectable types provide matching response controls and valid targets',()=>{
 assert.deepEqual(TEST_MODES,['e','c','numbers']);
 assert.equal(responseOptions('e').length,4);assert.equal(responseOptions('c').length,8);assert.equal(responseOptions('numbers').length,10);
 for(const mode of TEST_MODES){for(const option of responseOptions(mode)){assert.ok(answerButtons(mode,'data-answer').includes(`data-answer="${option}"`));assert.ok(optotypeSvg(mode,option).includes('viewBox="-4 -4 13 13"'));}for(let i=0;i<100;i++)assert.ok(responseOptions(mode).includes(randomTarget(mode)));}
 C_DIRECTIONS.forEach((direction,i)=>assert.ok(optotypeSvg('c',direction).includes(`rotate(${i*45} 2.5 2.5)`)));
 assert.throws(()=>optotypeSvg('numbers','10'));assert.throws(()=>optotypeSvg('c','invalid'));
});
test('historical picture and untyped E records remain readable without mutation',()=>{
 const legacy={levels:[{step:1,heightMm:20,passed:true},{step:2,heightMm:16,passed:false}]};const original=JSON.stringify(legacy);
 assert.deepEqual(summaryForRecord(legacy,'pictures'),{value:1,label:'그림 1단계까지'});assert.equal(JSON.stringify(legacy),original);assert.ok(modeName('pictures').includes('이전 기록'));
 const eye={levels:[{acuity:.4,passed:true},{acuity:.5,passed:false}]};for(const mode of [undefined,...TEST_MODES])assert.equal(summaryForRecord(eye,mode).value,.4);
});
test('flight stays in sky even at narrow widths and chooses both depth layers',()=>{
 for(const width of [45,100,284,366,500])for(const height of [45,205,230])for(const seed of [.01,.49,.51,.99]){
 const route=flightRoute(width,height,{x:999,y:999},()=>seed);
 for(const p of route.frames){assert.ok(p.x>=0&&p.x<=width-45);assert.ok(p.y>=0&&p.y<=height-45);}
 assert.equal(route.front,seed<.5);assert.ok(route.duration>=8500&&route.duration<=15000);
 }
 assert.equal(grasshopperLayout(()=>.01).length,1);assert.equal(grasshopperLayout(()=>.99).length,2);
 for(const p of grasshopperLayout(()=>.99)){assert.ok(p.left>=10&&p.left<=80);assert.ok(p.bottom>=5&&p.bottom<=12);}
});
