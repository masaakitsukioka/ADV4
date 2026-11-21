const {chromium}=require('playwright'),assert=require('assert'),fs=require('fs'),path=require('path');
const output=process.env.OUT||path.resolve(__dirname,'../design/manga-fix2-20261110');fs.mkdirSync(output,{recursive:true});
const reference=process.env.ADV_DEMO_VIDEO||'/Volumes/Extreme SSD/サイカチADV資料/UI/ochanomizu-demo_261110.mp4';
(async()=>{
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const context=await browser.newContext({viewport:{width:1920,height:1080},reducedMotion:'no-preference',recordVideo:{dir:path.join(output,'recording'),size:{width:1920,height:1080}}});
 const start=Date.now(),events=[],errors=[],page=await context.newPage(),video=page.video();page.on('pageerror',e=>errors.push(e.message));
 const mark=event=>events.push({event,seconds:(Date.now()-start)/1000});
 const shot=async name=>{await page.screenshot({path:path.join(output,name+'.png')});mark(name)};
 const finishConversation=async()=>{let guard=0;while(await page.evaluate(()=>state.mode==='dialogue'&&!choicesPending)){
  if(++guard>100)throw Error('dialogue did not finish');await page.waitForFunction(()=>typingDone,null,{timeout:20000});await page.waitForTimeout(280);await page.keyboard.press('Enter');
 }};
 await page.goto(process.env.ADV_URL||'http://127.0.0.1:8777/');await page.evaluate(()=>document.fonts.ready);
 await page.evaluate(()=>{textSettings.index=3;startNewGame();for(let i=0;i<3;i++)advanceOpening();textSettings.index=1});await page.waitForFunction(()=>state.mode==='dialogue');mark('intro-start');
 await page.waitForTimeout(650);await shot('game-typing');await finishConversation();assert.equal(await page.evaluate(()=>state.mode),'exploration');await page.waitForTimeout(550);await shot('game-blank-paper');
 // Same listen semantics: the prototype has no occupant, so it reports that fact.
 await page.locator('[data-command="listen"]').click();await finishConversation();await page.locator('[data-command="listen"]').hover();await page.waitForTimeout(350);await shot('game-listen-empty');
 await page.mouse.move(1300,150);await page.evaluate(()=>{commandSelection=null;renderCommands()});
 await page.locator('[data-command="investigate"]').click();mark('list-open');await page.waitForTimeout(110);await shot('game-list-appear');await page.waitForTimeout(650);
 await page.locator('[data-target="window"]').click();mark('window-dialogue');await finishConversation();await page.waitForTimeout(450);await shot('game-window-checked');
 await page.locator('[data-target="shelf"]').click();mark('shelf-dialogue');await finishConversation();await page.waitForTimeout(600);await page.waitForFunction(()=>!$('mailToast').classList.contains('hidden'));await shot('game-shelf-checked');
 // The shelf offers a new line after the first visit, so only the already-seen window is checked.
 assert.equal(await page.evaluate(()=>commandSelection),'investigate');assert.equal(await page.locator('[data-target="window"]').first().getAttribute('data-examined'),'true');assert.equal(await page.locator('[data-target="shelf"]').first().getAttribute('data-examined'),null);mark('finished');
 await context.close();await video.saveAs(path.join(output,'prototype-demo.webm'));await fs.promises.rm(path.join(output,'recording'),{recursive:true,force:true});assert.deepEqual(errors,[]);
 // Read frames from the actual MP4, without copying it or modifying any game artwork.
 require('child_process').execFileSync('swift',['-module-cache-path',process.env.ADV_SWIFT_CACHE||'/private/tmp/adv4-swift-cache',path.join(__dirname,'extract-demo-frames.swift'),reference,output],{stdio:['ignore','pipe','pipe']});
 const metadata=JSON.parse(fs.readFileSync(path.join(output,'reference-metadata.json'),'utf8'));assert.equal(metadata.width,1920);assert.equal(metadata.height,1080);
 const pairs=[['文字送り','reference-typing.png','game-typing.png'],['会話の後：紙と表情を残す','reference-blank-paper.png','game-blank-paper.png'],['見出しから順に一覧を表示','reference-list-appear.png','game-list-appear.png'],['済んだ紙片にレ点、一覧を保持','reference-checked.png','game-shelf-checked.png']];
 const html='<!doctype html><meta charset="utf-8"><title>FIX2 デモとの比較</title><style>@font-face{font-family:ADV;src:url("../../assets/fonts/NotoSansJP-Regular.subset.woff")}*{box-sizing:border-box}body{margin:0;color:#141414;background:#f7f5ee;font:20px ADV,sans-serif}h1{font-size:26px;padding:12px 24px;margin:0}section{display:grid;grid-template-columns:1fr 1fr;gap:8px;padding:8px}h2{grid-column:1/-1;font-size:22px;margin:4px 8px}figure{margin:0}figcaption{padding:5px 12px}img{display:block;width:100%;height:auto}</style><h1>作者デモ（左）と消えたスケッチ（右）：場所と台詞は既存のまま</h1>'+pairs.map(([label,a,b])=>`<section><h2>${label}</h2><figure><figcaption>作者デモ</figcaption><img src="${a}"></figure><figure><figcaption>試作 FIX2</figcaption><img src="${b}"></figure></section>`).join('');
 fs.writeFileSync(path.join(output,'comparison.html'),html);const comparison=await browser.newPage({viewport:{width:1920,height:1080}});await comparison.goto('file://'+path.join(output,'comparison.html'));await comparison.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(image=>image.decode()))});await comparison.screenshot({path:path.join(output,'comparison.png'),fullPage:true});await comparison.close();
 fs.writeFileSync(path.join(output,'recording-events.json'),JSON.stringify({events,reference:metadata,errors},null,2));await browser.close();console.log('PASS: real scenario recorded with normal typing, listen/investigate lists and completed checks; actual author MP4 frames compared');
})().catch(e=>{console.error(e);process.exitCode=1});
