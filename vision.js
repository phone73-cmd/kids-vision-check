// Geometry: decimal acuity 1.0 is a 5 arc-minute optotype at 3 m.
export const VERSION = '1.1.0';
export const DISTANCE_MM = 3000;
export const LEVELS = [0.2, 0.25, 0.32, 0.4, 0.5, 0.63, 0.8, 1, 1.25, 1.5];
export const DIRECTIONS = ['right', 'down', 'left', 'up'];
export const ROTATIONS = {right:0, down:90, left:180, up:270};
export function heightMm(acuity) { return 2 * DISTANCE_MM * Math.tan((5 / acuity) * Math.PI / (180 * 60) / 2); }
export function displaySize(acuity, pxPerMm) { return heightMm(acuity) * pxPerMm; }
export function evaluateLevel(answers) { if (answers.length !== 5) throw new Error('Five responses required'); return answers.filter(Boolean).length >= 4; }
export function eyeSummary(levels) {
  const passed = levels.filter(l => l.passed);
  const failed = levels.find(l => !l.passed);
  if (!passed.length) return {label:'0.2 단계 미통과',value:null};
  const value=passed.at(-1).acuity;
  return {label:failed ? `${value} 단계까지` : '1.5 단계까지',value};
}
export function randomDirection() { const a = new Uint32Array(1); crypto.getRandomValues(a); return DIRECTIONS[a[0] % 4]; }
export function targetSvg(direction) {
  // A five-unit E: three one-unit bars separated by one-unit spaces.
  // Four surrounding crowding bars; 0.5H gap between E and each bar.
  return `<svg viewBox="-4 -4 13 13" xmlns="http://www.w3.org/2000/svg" aria-hidden="true"><g fill="#000"><path transform="rotate(${ROTATIONS[direction]} 2.5 2.5)" d="M0 0H5V1H1V2H5V3H1V4H5V5H0Z"/><path d="M-3.5 -1H-2.5V6H-3.5ZM7.5 -1H8.5V6H7.5ZM-1 -3.5H6V-2.5H-1ZM-1 7.5H6V8.5H-1Z"/></g></svg>`;
}
