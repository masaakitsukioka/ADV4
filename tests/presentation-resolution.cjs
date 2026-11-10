// Exercise real mouth compositing with both placeholder and replacement artwork.
const fs=require('fs'),vm=require('vm'),assert=require('assert');
const operations=[];
function context(){return{clearRect(...args){operations.push(['clear',...args])},drawImage(...args){operations.push(['image',...args])},fillRect(...args){operations.push(['fill',...args])}}}
const sandbox={ASSETS:{characterResolution:{width:1040,height:1440}},setCharacterImage(){},document:{createElement(){return{getContext:()=>context()}}}};
vm.createContext(sandbox);vm.runInContext(fs.readFileSync(require('path').join(__dirname,'../data/presentation.js'),'utf8'),sandbox);
function draw(base,frame=1,strip=null,overlay=null,id='haruki'){
 operations.length=0;const ctx=context();sandbox.drawTalkingPortrait(ctx,base,id,frame,strip,overlay);assert.equal(ctx.imageSmoothingEnabled,true);assert.deepEqual(operations[0],['clear',0,0,1040,1440]);return operations;
}
const hd={width:1040,height:1440},old={width:104,height:144},overlay={...hd,overlay:true};
assert.equal(draw(hd).length,2,'new portrait without mouth images stays static');
assert.equal(draw(hd,1,null,overlay).at(-1)[1],overlay);
assert.equal(draw(hd,0,null,overlay).length,2,'closed mouth uses base');
assert.equal(draw(hd,1,null,old).length,2,'wrong-sized overlay cannot misalign mouth');
assert(draw(old).some(op=>op[0]==='fill'),'legacy Haruki mouth still animates');
assert.deepEqual(draw(old).at(-1).slice(2),[0,0,1040,1440]);
const strip={width:312,height:144};assert(draw(old,1,strip,null,'saiji').some(op=>op[1]===strip),'legacy Saiji strip still used');
const hdStrip={width:3120,height:1440};assert.deepEqual(draw(hd,2,hdStrip,null,'saiji').at(-1).slice(2),[2080,0,1040,1440,0,0,1040,1440]);
console.log('PASS: HD overlays, HD strip, static missing/invalid overlays, legacy mouths, smooth full-size compositing');
