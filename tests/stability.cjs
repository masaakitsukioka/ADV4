require('./browser-harness.cjs')(async(page,assert)=>{
 await page.evaluate(()=>{textSettings.index=1;say([['ハルキ','入力と自動送りの確認です。','通常'],['サイジ','次の行。','通常']])});
 await page.waitForTimeout(120);assert.equal(await page.evaluate(()=>typingDone),false);await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>typingDone),true);assert.equal(await page.evaluate(()=>state.lineIndex),0);
 await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',isComposing:true,bubbles:true})));assert.equal(await page.evaluate(()=>state.lineIndex),0);
 await page.evaluate(()=>document.dispatchEvent(new KeyboardEvent('keydown',{key:'Enter',repeat:true,bubbles:true})));assert.equal(await page.evaluate(()=>state.lineIndex),0);
 await page.evaluate(()=>{textSettings.index=3;displayLine();textSettings.auto=true;scheduleAuto();showTopicChoices([{label:'選ぶ',lines:[['ハルキ','選択した。','通常']]}])});await page.waitForTimeout(1450);assert.equal(await page.evaluate(()=>choicesPending),true);
 await page.locator('#dialogueChoices button').focus();await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>choicesPending),false);
 await page.waitForFunction(()=>state.mode==='exploration');
 await page.evaluate(()=>{textSettings.auto=false;textSettings.index=1;say([['ハルキ','速さの切り替えを確認する。','通常']]);$('speedButton').click()});assert.equal(await page.evaluate(()=>textSettings.index),2);await page.waitForFunction(()=>typingDone);await page.evaluate(()=>$('autoButton').click());await page.waitForFunction(()=>state.mode==='exploration');
 await page.evaluate(()=>chooseCommand('investigate'));await page.setViewportSize({width:1024,height:768});assert.equal(await page.evaluate(()=>commandSelection),'investigate');assert(await page.locator('#commandChildren button').first().isVisible());
 await page.evaluate(()=>{textSettings.auto=false;showTitle()});await page.waitForTimeout(200);assert.equal(await page.evaluate(()=>$('dialogue').classList.contains('hidden')),true);
 console.log('PASS: reveal/advance, IME and repeated-key guards, native button activation, choice cancels automatic advance, stale dialogue stays closed');
},{motion:'no-preference'}).catch(e=>{console.error(e);process.exitCode=1});
