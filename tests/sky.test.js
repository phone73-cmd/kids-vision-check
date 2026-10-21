import test from 'node:test';
import assert from 'node:assert/strict';
import {skyState,celestialMarkup} from '../scene.js';
import {randomTarget,optotypeSvg,NUMBER_STYLE} from '../optotypes.js';
const clock=(h,m=0)=>new Date(2026,9,21,h,m,0);
test('local clock drives day, dusk, night and a bounded moving sun or moon',()=>{
 assert.equal(skyState(clock(5,59)).kind,'moon');assert.equal(skyState(clock(6)).kind,'sun');
 assert.equal(skyState(clock(15,59)).period,'day');assert.equal(skyState(clock(16)).period,'dusk');
 assert.equal(skyState(clock(19)).kind,'moon');assert.equal(skyState(clock(19)).period,'night');
 assert.ok(skyState(clock(12)).left>skyState(clock(8)).left);assert.ok(skyState(clock(23)).left>skyState(clock(20)).left);
 for(let minute=0;minute<1440;minute++){const s=skyState(clock(0,minute));assert.ok(s.left>=0&&s.left<=100);assert.ok(s.top>=14&&s.top<=46);}
 assert.ok(celestialMarkup(clock(20)).includes('assets/scene/moon.webp'));
});
test('numeric font stays fixed while random trials avoid consecutive repetition',()=>{
 assert.equal(NUMBER_STYLE,'dejavu-sans-regular-v1');
 for(const n of '0123456789'){const glyph=optotypeSvg('numbers',n);assert.equal(glyph,optotypeSvg('numbers',n));for(let i=0;i<50;i++)assert.notEqual(randomTarget('numbers',n),n);}
});
