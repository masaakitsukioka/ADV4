require('./browser-harness.cjs')(async(page,assert)=>{
 await page.evaluate(()=>{textSettings.index=0;say([['ハルキ','口パクを確認するための長い台詞です。'.repeat(4),'通常']]);window.seenFrames=new Set();window.frameSample=setInterval(()=>{if($('harukiTalk').dataset.animation==='talk')seenFrames.add($('harukiTalk').dataset.frame)},15)});
 await page.waitForTimeout(650);const frames=await page.evaluate(()=>{clearInterval(frameSample);return [...seenFrames]});for(const f of ['0','1','2'])assert(frames.includes(f),'mouth frame '+f);
 await page.keyboard.press('Enter');await page.waitForTimeout(40);assert.equal(await page.evaluate(()=>$('harukiTalk').classList.contains('hidden')),true,'reveal closes the mouth immediately');
 // Random interval is deterministically chosen as 2 seconds; frame timing remains real.
 await page.evaluate(()=>{window.savedRandom=Math.random;Math.random=()=>0;finishTalking();window.blinks=new Set();window.blinkSample=setInterval(()=>{if($('saijiTalk').dataset.animation==='blink')blinks.add($('saijiTalk').dataset.frame)},10)});await page.waitForTimeout(2320);const blink=await page.evaluate(()=>{clearInterval(blinkSample);Math.random=savedRandom;return [...blinks]});assert(blink.includes('1')&&blink.includes('2')&&blink.includes('0'));
 await page.evaluate(()=>{textSettings.index=0;say([['サイジ','話している間は瞬きしないことを確認する台詞。'.repeat(5),'通常']])});await page.waitForTimeout(2200);assert.equal(await page.evaluate(()=>$('saijiTalk').dataset.animation),'talk');
 console.log('PASS: closed/half/open mouth cycle, immediate close after reveal, idle half/closed/open blink and no simultaneous speaking blink');
},{motion:'no-preference'}).catch(e=>{console.error(e);process.exitCode=1});
