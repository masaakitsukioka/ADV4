const fs=require('fs'),path=require('path'),{MEASURE}=require('./ui-audit.cjs');
const output=process.env.OUT||path.resolve(__dirname,'../design/manga-fix1-20261110');fs.mkdirSync(output,{recursive:true});
require('./browser-harness.cjs')(async(page,assert)=>{
 const metrics={commands:[],deduction:[]};
 // Measure after the 140ms scale transition. Fixed row spacing is covered by cmd-261120; verify cutout centres remain operable.
 for(const kind of ['move','listen','investigate','search','show','chat']){
  await page.locator(`[data-command="${kind}"]`).hover();await page.waitForTimeout(220);assert.equal(await page.evaluate(()=>commandSelection),null);
  const overlap=await page.evaluate(()=>{const rows=[...$('commandRoots').children].map(b=>{const rs=[...b.querySelectorAll('b')].map(c=>c.getBoundingClientRect());return{kind:b.dataset.command,top:Math.min(...rs.map(r=>r.top)),bottom:Math.max(...rs.map(r=>r.bottom))}});return rows.slice(1).map((r,i)=>({before:rows[i].kind,after:r.kind,gap:r.top-rows[i].bottom}))});
  const reachable=await page.evaluate(()=>[...$('commandRoots').children].every(b=>[...b.children].every(c=>{const r=c.getBoundingClientRect(),hit=document.elementFromPoint(r.x+r.width/2,r.y+r.height/2);return hit===b||b.contains(hit)})));assert(reachable,`${kind}: command letter centre is covered`);metrics.commands.push({selected:kind,gaps:overlap});
  await page.screenshot({path:path.join(output,'command-'+kind+'.png')});
 }
 await page.evaluate(()=>{chooseCommand('move');moveTo('corridor');for(let i=0;i<200&&state.mode==='dialogue';i++)advance()});
 await page.waitForFunction(()=>$('scene').dataset.lightingStatus==='ready');
 for(const id of ['notice','door'])assert(await page.locator(`[data-target="${id}"]`).isVisible());
 assert.equal(await page.evaluate(()=>commandSelection),'investigate');assert(await page.locator('#mangaArrow').isVisible());
 await page.screenshot({path:path.join(output,'corridor-on-arrival.png')});
 await page.evaluate(()=>{commandSelection=null;renderCommands()});assert(await page.locator('#mangaArrow').isHidden());assert.equal(await page.locator('#commandRoots .on').count(),0);
 await page.locator('[data-command="investigate"]').click();
 for(const id of ['notice','door'])assert(await page.locator(`[data-target="${id}"]`).isVisible());
 await page.screenshot({path:path.join(output,'corridor-investigate.png')});
 // Existing scenario choice data, with the same engine path as a normal conversation.
 await page.evaluate(()=>{const event=Object.values(SCENARIO.topics).find(v=>v.choices?.length);showTopicChoices(event?.choices||[{label:'会話を終える',lines:[['サイジ','そうしよう。','通常']]}])});
 await page.locator('#dialogueChoices button').last().focus();
 const choices=await page.locator('#dialogueChoices button').evaluateAll(bs=>bs.map(b=>({border:getComputedStyle(b).borderWidth,turn:getComputedStyle(b).transform,shadow:getComputedStyle(b).boxShadow,selected:b.classList.contains('choice-selected')})));
 assert(choices.every(c=>c.border==='0px'&&c.turn!=='none'&&c.shadow!=='none'));assert(choices.at(-1).selected);
 await page.screenshot({path:path.join(output,'conversation-choices.png')});
 await page.evaluate(()=>{choicesPending=false;closeDialogueLayer();state.mode='exploration';state.flags.okaboChecked=true;startDeduction()});
 for(let q=0;q<5;q++){
  await page.evaluate(q=>{state.deductionStep=q;buildDeduction()},q);
  const original=await page.evaluate(()=>questions[state.deductionStep].lead||questions[state.deductionStep].q),text=[];
  const count=await page.evaluate(()=>state.dialogue.length);
  for(let i=0;i<count;i++){
   const displayed=await page.evaluate(i=>{state.lineIndex=i;displayLine();return $('line').textContent},i);text.push(displayed);
   const audit=await page.evaluate(MEASURE);assert.deepEqual(audit.dialogue,[],`deduction ${q+1} page ${i+1}`);
   const r=await page.evaluate(()=>({width:$('messageBody').clientWidth,font:parseFloat(getComputedStyle($('line')).fontSize),parent:$('dialogue').parentElement.id}));assert.equal(r.parent,'monoLayer');assert(r.width/r.font>=12);metrics.deduction.push({question:q+1,page:i+1,...r});
  }
  assert.equal(text.join('').replace(/\n/g,''),original.replace(/\n/g,''),'all deduction text preserved and visible');
  await page.waitForFunction(()=>document.querySelector('#deduceRedMarks img')?.getAttribute('src')?.includes('topic-circle.png'));assert.equal(await page.locator('#redLayer').evaluate(e=>getComputedStyle(e).filter),'none');
  await page.screenshot({path:path.join(output,`deduction-q${q+1}.png`)});
 }
 // Prove the audit catches the exact two failure classes that escaped the old audit.
 await page.evaluate(()=>$('messageBody').style.width='100px');let bad=await page.evaluate(MEASURE);assert(bad.dialogue.some(x=>x.includes('細い列')),'narrow-column fault must fail');
 await page.evaluate(()=>{$('messageBody').style.width='';$('messageBody').style.height='10px';$('messageBody').style.overflow='hidden'});bad=await page.evaluate(MEASURE);assert(bad.dialogue.length,'clipped-text fault must fail');
 await page.evaluate(()=>{$('messageBody').style.height='';$('messageBody').style.overflow=''});
 await page.emulateMedia({reducedMotion:'no-preference'});await page.evaluate(()=>{textSettings.index=1;deductionMessage(questions[0].lead);$('dialogue').tabIndex=-1;$('dialogue').focus()});assert.equal(await page.evaluate(()=>typingDone),false);await page.keyboard.press('Enter');assert(await page.locator('#nextMark').evaluate(e=>e.classList.contains('ready')&&getComputedStyle(e).display==='inline-block'));assert.equal(await page.evaluate(()=>$('line').textContent.replace(/\n/g,'')),await page.evaluate(()=>questions[0].lead.replace(/\n/g,'')));
 fs.writeFileSync(path.join(output,'checks.json'),JSON.stringify(metrics,null,2));
 console.log('PASS: six enlarged command rows have operable letter centres; corridor targets on arrival/click; no orphan arrow; paper choices; all five deduction leads readable; audit rejects narrow/clipped text');
},{viewport:{width:1920,height:1080}}).catch(e=>{console.error(e);process.exitCode=1});
