const {chromium}=require('playwright'),assert=require('assert');
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 for(const reducedMotion of ['no-preference','reduce']){
  const page=await browser.newPage({viewport:{width:1280,height:720},reducedMotion});const errors=[];page.on('pageerror',e=>errors.push(e.message));
  await page.goto(process.env.ADV_URL||'http://127.0.0.1:8799/');await page.evaluate(()=>{textSettings.index=3;startNewGame();for(let i=0;i<3;i++)advanceOpening();for(let i=0;i<300&&state.mode==='dialogue';i++)advance()});await page.waitForFunction(()=>['dialogue','exploration','dialogue-out'].includes(state.mode));await page.evaluate(()=>{for(let i=0;i<300&&state.mode==='dialogue';i++)advance()});await page.waitForFunction(()=>state.mode==='exploration');
  await page.evaluate(()=>say([['ナカコ','仮の台詞','通常']]));await page.waitForTimeout(400);
  assert.equal(await page.evaluate(()=>rightActor),'nakako');assert.equal(await page.evaluate(()=>getComputedStyle($('nakakoCard')).display!=='none'),true);assert.equal(await page.evaluate(()=>getComputedStyle($('saijiCard')).display),'none');
  await page.evaluate(()=>say([['ハルキ','仮の台詞','通常']]));assert.equal(await page.evaluate(()=>rightActor),'nakako');
  await page.evaluate(()=>say([['','地の文','通常']]));assert.equal(await page.evaluate(()=>rightActor),'nakako');
  const moods={'通常':'normal','驚き':'surprised','思案':'thinking','困惑':'thinking','確信':'confident','納得':'confident','自信':'confident','笑顔':'smile','怒り':'angry','落ち込み':'down','悲しみ':'down','呆れ':'annoyed','激怒':'rage','泣きそう':'teary','涙':'teary','未知':'normal'};
  for(const [tag,key] of Object.entries(moods)){
   await page.evaluate(tag=>say([['ナカコ','仮の台詞',tag]]),tag);
   assert.equal(await page.evaluate(tag=>characterExpression('nakako',tag),tag),key);
   await page.waitForFunction(key=>$('nakakoArt').dataset.shown?.endsWith('nakako_'+key+'.png'),key);
   const frames=await page.evaluate(async key=>{const seen=[],original=CanvasRenderingContext2D.prototype.drawImage;CanvasRenderingContext2D.prototype.drawImage=function(image,...args){seen.push(image.src.split('/').pop());return original.call(this,image,...args)};try{for(const type of ['blinkFrames','mouthFrames'])for(const frame of [0,1,2])await displayPortraitFrame('nakako',ASSETS[type].nakako[key],frame,()=>true)}finally{CanvasRenderingContext2D.prototype.drawImage=original}return seen},key);
   assert.deepEqual(frames,[`nakako_${key}.png`,`nakako-${key}-eyes-1.png`,`nakako-${key}-eyes-2.png`,`nakako_${key}.png`,`nakako-${key}-mouth-1.png`,`nakako-${key}-mouth-2.png`]);
  }
  await page.evaluate(()=>say([['ナカコ','仮の台詞','涙']]));
  await page.waitForTimeout(1100);
  if(reducedMotion==='reduce')assert.equal(await page.evaluate(()=>wetTimer),null);else{
   const frames=await page.evaluate(async()=>{const seen=new Set();for(let i=0;i<12;i++){await new Promise(r=>setTimeout(r,100));if($('nakakoTalk').dataset.animation==='wet')seen.add($('nakakoTalk').dataset.frame)}return [...seen]});assert(frames.includes('1')&&frames.includes('2'),JSON.stringify(frames));
  }
  await page.evaluate(()=>{textSettings.index=0;say([['ナカコ','口パク優先の長い仮の台詞です。'.repeat(10),'涙']])});await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>$('nakakoTalk').dataset.animation),'talk');await page.evaluate(()=>{advance();textSettings.index=3});if(reducedMotion==='no-preference'){await page.waitForTimeout(500);assert.equal(await page.evaluate(()=>$('nakakoTalk').dataset.animation),'wet')}
  await page.evaluate(()=>say([['サイジ','仮の台詞','通常']]));assert.equal(await page.evaluate(()=>rightActor),'saiji');
  await page.evaluate(()=>{say([['ナカコ','仮の台詞','通常']]);advance()});assert.equal(await page.evaluate(()=>rightActor),'saiji');
  await page.evaluate(()=>{say([['ナカコ','仮の台詞','通常']]);lastPortraitDay=-1;renderManga()});assert.equal(await page.evaluate(()=>rightActor),'saiji');
  await page.evaluate(()=>{state.mode='exploration';const saved=Saves.snapshot(state,textSettings);say([['ナカコ','仮の台詞','通常']]);restoreSave(saved)});assert.equal(await page.evaluate(()=>rightActor),'saiji');
  await page.evaluate(()=>{say([['ナカコ','仮の台詞','通常']]);moveTo(state.room==='classroom'?'corridor':'classroom')});assert.equal(await page.evaluate(()=>rightActor),'saiji');
  assert.deepEqual(errors,[]);await page.close();
 }
 await browser.close();console.log('PASS: right actor, expressions, wet animation, reduced motion, conversation and room resets');
})().catch(e=>{console.error(e);process.exitCode=1});
