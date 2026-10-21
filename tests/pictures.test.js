import test from 'node:test';
import assert from 'node:assert/strict';
import {PICTURES,PICTURE_HEIGHTS_MM,pictureSvg,randomPicture,pictureSummary} from '../pictures.js';
import {eyeSummary} from '../vision.js';
test('picture results retain practice steps without acuity conversion',()=>{
 const original=JSON.stringify([{step:1,heightMm:20,correct:5,passed:true},{step:2,heightMm:16,correct:2,passed:false}]);
 const levels=JSON.parse(original);
 assert.deepEqual(pictureSummary(levels),{value:1,label:'그림 1단계까지'});
 assert.equal(JSON.stringify(levels),original);
 assert.equal(pictureSummary([{step:1,passed:false}]).value,null);
 assert.deepEqual(pictureSummary(PICTURE_HEIGHTS_MM.map((heightMm,i)=>({step:i+1,heightMm,passed:true}))),{value:6,label:'그림 6단계까지'});
 assert.equal(eyeSummary([{acuity:.4,passed:true},{acuity:.5,passed:false}]).value,.4);
});
test('every randomized picture has a supported response and a vector target',()=>{
 const ids=new Set(PICTURES.map(p=>p.id));assert.equal(ids.size,4);
 for(let i=0;i<100;i++)assert.ok(ids.has(randomPicture()));
 for(const id of ids){assert.ok(pictureSvg(id).includes('viewBox="-4 -4 13 13"'));assert.ok(pictureSvg(id).includes('xmlns="http://www.w3.org/2000/svg"'));}
 assert.throws(()=>pictureSvg('unknown'));
});
