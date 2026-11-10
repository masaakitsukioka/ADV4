const fs=require('fs'),vm=require('vm'),assert=require('assert'),path=require('path');
const operations=[],sandbox={ASSETS:{characterResolution:{width:1040,height:1440}},setCharacterImage(){}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(path.join(__dirname,'../data/presentation.js'),'utf8'),sandbox);
const base={width:1040,height:1440},replacement={width:1040,height:1440,frame:true};
function draw(frame,image){operations.length=0;const ctx={clearRect(...a){operations.push(['clear',...a])},drawImage(...a){operations.push(['draw',...a])}};sandbox.drawTalkingPortrait(ctx,base,'haruki',frame,null,image);assert(ctx.imageSmoothingEnabled);assert.equal(operations.length,2,'exactly one full image, with no base underneath');return operations[1]}
assert.strictEqual(draw(1,replacement)[1],replacement);assert.strictEqual(draw(0,replacement)[1],base);assert.strictEqual(draw(1,null)[1],base);assert.strictEqual(draw(2,{width:104,height:144})[1],base);assert.deepEqual(draw(2,replacement).slice(2),[0,0,1040,1440]);
console.log('PASS: aligned full-portrait replacement, closed base, missing/invalid fallback, no stacked image');
