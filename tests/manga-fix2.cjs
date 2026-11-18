const fs=require('fs'),path=require('path');
const output=process.env.OUT||path.resolve(__dirname,'../design/manga-fix2-20261110');fs.mkdirSync(output,{recursive:true});
require('./browser-harness.cjs')(async(page,assert)=>{
 const metrics={};
 const resting=()=>page.evaluate(()=>({paper:[...document.querySelectorAll('.manga-sheet')].map(e=>({display:getComputedStyle(e).display,rect:e.getBoundingClientRect().toJSON()})),actors:['haruki','saiji'].map(id=>({rect:$(id+'Card').getBoundingClientRect().toJSON(),animation:getComputedStyle($(id+'Card')).animationName,emotion:$(id+'Emotion').textContent})),text:$('line').textContent,speaker:$('speaker').textContent}));
 const initial=await resting();assert(initial.paper.every(p=>p.display!=='none'));assert(initial.actors.every(a=>a.animation==='none'));assert.equal(initial.text,'');
 await page.evaluate(()=>{textSettings.index=3;say([['サイジ','表情を保つ確認。','思案'],['ハルキ','次の話者。','納得']])});
 assert.equal(await page.evaluate(()=>$('saijiEmotion').textContent),'思案');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>$('saijiEmotion').textContent),'思案');assert.equal(await page.evaluate(()=>$('harukiEmotion').textContent),'納得');
 await page.keyboard.press('Space');assert.equal(await page.evaluate(()=>state.mode),'exploration');const after=await resting();assert.equal(after.text,'');assert.equal(after.speaker,'');assert.deepEqual(after.paper,initial.paper);assert.deepEqual(after.actors.map(x=>x.rect),initial.actors.map(x=>x.rect));assert.deepEqual(after.actors.map(x=>x.emotion),['納得','思案']);
 metrics.permanentPaperAndActors=true;
 // A command button that retains focus must never consume dialogue Enter/Space.
 await page.locator('[data-command="chat"]').click();assert.equal(await page.evaluate(()=>document.activeElement.id),'dialogue');
 await page.evaluate(()=>{textSettings.index=1;$('commandRoots').querySelector('button').focus();displayLine()});await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>typingDone),true);
 await page.evaluate(()=>$('commandRoots').querySelector('button').focus());const before=await page.evaluate(()=>state.lineIndex);await page.keyboard.press('Space');assert(await page.evaluate(n=>state.lineIndex>n||state.mode==='exploration',before));
 await page.evaluate(()=>{textSettings.index=3;for(let i=0;i<200&&state.mode==='dialogue';i++)advance()});
 // Measure the normal typewriter with real time and no reduced-motion shortcut.
 assert.deepEqual(await page.evaluate(()=>textSettings.speeds),[60,26,13,0]);
 const start=Date.now();await page.evaluate(()=>{textSettings.index=1;say([['サイジ','よう。最終日だけは遅刻しないんだな。','思案']])});await page.waitForFunction(()=>typingDone);metrics.typingMs=Date.now()-start;assert(metrics.typingMs>=300&&metrics.typingMs<1200,`normal typing ${metrics.typingMs} ms`);await page.keyboard.press('Enter');
 await page.mouse.move(1300,100);await page.evaluate(()=>{commandSelection=null;renderCommands()});await page.locator('[data-command="investigate"]').click();assert.equal(await page.locator('#commandChildren .paper-selected').count(),0,'mouse opens papers before any item is selected');
 // Header at t=0, paper rows every 80 ms. No full-window entrance animation.
 await page.evaluate(()=>{commandSelection=null;renderCommands();chooseCommand('investigate');window.entryRows=[...$('commandChildren').children]});
 const sample=()=>page.evaluate(()=>({header:getComputedStyle($('commandHeading')).opacity,rows:[...$('commandChildren').children].map(b=>({opacity:+getComputedStyle(b).opacity,delay:parseFloat(getComputedStyle(b).animationDelay),name:getComputedStyle(b).animationName})),generation:$('commandDetail').dataset.listGeneration}));
 const entry=await sample();metrics.delays=entry.rows.map(r=>r.delay);assert(entry.rows.every((r,i)=>Math.abs(r.delay-(i+1)*.08)<.002));assert(entry.rows.every(r=>r.opacity<.1));await page.waitForTimeout(120);const mid=await sample();assert(mid.rows[0].opacity>mid.rows[1].opacity);await page.waitForTimeout(600);
 const generation=(await sample()).generation;
 await page.locator('[data-target="window"]').hover();await page.locator('[data-target="window"]').click();assert.equal(await page.evaluate(()=>state.mode),'dialogue');
 await page.evaluate(()=>{textSettings.index=3;for(let i=0;i<200&&state.mode==='dialogue';i++)advance()});
 assert.equal(await page.evaluate(()=>state.mode),'exploration');assert.equal(await page.evaluate(()=>$('commandDetail').dataset.listGeneration),generation);assert(await page.evaluate(()=>entryRows.every((e,i)=>e===$('commandChildren').children[i])));assert.equal(await page.locator('[data-target="window"]').getAttribute('data-examined'),'true');assert(await page.locator('[data-target="window"]').evaluate(e=>e.classList.contains('paper-selected')));
 assert((await page.locator('[data-target="window"]').evaluate(e=>getComputedStyle(e,'::after').backgroundImage)).includes('topic-circle.png'));assert.equal(await page.evaluate(()=>$('commandDetail').classList.contains('list-enter')),false);
 const shelfGeneration=await page.evaluate(()=>$('commandDetail').dataset.listGeneration);await page.locator('[data-target="shelf"]').click();await page.evaluate(()=>{for(let i=0;i<200&&state.mode==='dialogue';i++)advance()});assert.equal(await page.evaluate(()=>$('commandDetail').dataset.listGeneration),shelfGeneration);assert(await page.locator('[data-target="shelf"]').first().evaluate(e=>e.classList.contains('paper-selected')));
 // The shipped prototype has no occupants: use an isolated runtime fixture for listener completion.
 await page.evaluate(()=>{room().occupants=[{id:'fix2-test',name:'部員',lines:[['サイジ','聞き取り確認。','思案'],['ハルキ','聞き終えた。','納得']]}];chooseCommand('listen')});await page.waitForTimeout(350);await page.locator('[data-listen-key]').click();assert.deepEqual(await page.evaluate(()=>state.listened),{});await page.evaluate(()=>{for(let i=0;i<200&&state.mode==='dialogue';i++)advance()});assert.equal(await page.locator('[data-listen-key]').getAttribute('data-examined'),'true');
 const saved=await page.evaluate(()=>{const saved=Saves.snapshot(state,textSettings);Saves.write(1,saved);state.listened={};restoreSave(Saves.read(1));chooseCommand('listen');return saved});assert.deepEqual(saved.progress.listened['classroom:fix2-test'],[0]);assert.equal(await page.locator('[data-listen-key]').getAttribute('data-examined'),'true');
 const legacy=await page.evaluate(()=>{const old=Saves.snapshot(state,textSettings);delete old.progress.listened;return Saves.validate(old).progress.listened});assert.deepEqual(legacy,{});
 const bad=await page.evaluate(()=>{let rejected=0;const original=Saves.snapshot(state,textSettings);for(const listened of [[],{'classroom:unknown':true},{'missing:fix2-test':true},{'classroom:fix2-test':false}]){const data=structuredClone(original);data.progress.listened=listened;try{Saves.validate(data)}catch(e){rejected++}}return rejected});assert.equal(bad,4);
 await page.evaluate(()=>{moveTo('corridor');for(let i=0;i<200&&state.mode==='dialogue';i++)advance()});assert.deepEqual(await page.evaluate(()=>[$('harukiEmotion').textContent,$('saijiEmotion').textContent]),['通常','通常']);
 await page.evaluate(()=>{startNewGame()});assert.deepEqual(await page.evaluate(()=>state.listened),{});
 fs.writeFileSync(path.join(output,'motion-checks.json'),JSON.stringify(metrics,null,2));
 console.log('PASS: permanent paper/actors; retained expressions; normal 26ms typing; stale command focus Enter/Space; 80ms stagger; same list and selection after dialogue; listener completion/save/legacy/validation; room/new-game reset');
},{motion:'no-preference',viewport:{width:1920,height:1080}}).catch(e=>{console.error(e);process.exitCode=1});
