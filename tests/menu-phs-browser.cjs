const {chromium}=require('playwright');
const assert=require('assert'),fs=require('fs');
const path=require('path');const output=process.env.OUT||path.resolve(__dirname,'../design/menu-phs-relations');fs.mkdirSync(output,{recursive:true});
(async()=>{const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true});const context=await browser.newContext({viewport:{width:1280,height:720},reducedMotion:'reduce',hasTouch:true});const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto(process.env.ADV_URL||'http://127.0.0.1:8777');await page.evaluate(()=>{textSettings.index=3;startNewGame();advanceOpening();advanceOpening();advanceOpening();for(let i=0;i<100&&state.mode==='dialogue';i++)advance()});
// Flags are committed at the start of dialogue; toast must wait until exploration.
await page.evaluate(()=>runEvent({set:{sketchFound:true},lines:[['ハルキ','テスト','通常']]}));assert(await page.locator('#mailToast').isHidden());assert.equal(await page.evaluate(()=>Notebook.unread(state).length),1);
await page.keyboard.press('Enter');assert(await page.locator('#mailToast').isVisible());await page.waitForTimeout(2600);assert(await page.locator('#mailToast').isHidden());
await page.locator('#menu').click();assert(await page.locator('#notebook').isVisible());await page.keyboard.press('ArrowDown');assert.equal(await page.evaluate(()=>notebookSection),'relations');await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>notebookSpecial),'relations');await page.keyboard.press('Escape');assert.equal(await page.evaluate(()=>notebookSpecial),null);await page.keyboard.press('Escape');assert(await page.locator('#notebook').isHidden());
await page.evaluate(()=>{state.flags.layoutChecked=true;state.flags.dutyChecked=true;render();menu()});
await page.evaluate(()=>{selectNotebook('mail');enterNotebookSection()});await page.locator('.enlarged .nb-mail-row').first().click();assert.equal(await page.evaluate(()=>state.mode),'dialogue');assert.equal(await page.evaluate(()=>$('dialogue').parentElement.id),'game');assert.equal(await page.evaluate(()=>Notebook.unread(state).length),1);await page.keyboard.press('Enter');assert.equal(await page.evaluate(()=>state.mode),'menu');assert.equal(await page.evaluate(()=>mailCurrent),'mail-nakako-01');
// Save and restore through actual notebook slot controls.
await page.evaluate(()=>selectNotebook('save'));await page.getByRole('button',{name:/記録1：/}).click();assert((await page.locator('#panelBody').innerText()).includes('保存しました'));
const before=await page.evaluate(()=>JSON.stringify(state.notebook));await page.evaluate(()=>{closeNotebook();showTitle()});await page.getByRole('button',{name:'途中から',exact:true}).click();await page.getByRole('button',{name:/記録1：/}).click();await page.getByRole('button',{name:'再開する',exact:true}).click();assert.equal(await page.evaluate(()=>JSON.stringify(state.notebook)),before);assert(await page.locator('#notebook').isHidden());
await page.evaluate(()=>{const old=Saves.snapshot(state,textSettings);delete old.progress.notebook;restoreSave(old)});assert.equal(await page.evaluate(()=>state.notebook.nodes.length),5);
// Small screen uses touch as well as keyboard; chart canvas can pan instead of clipping labels.
for(const [width,height] of [[1280,720],[844,390],[375,667]]){
 await page.setViewportSize({width,height});await page.evaluate(()=>{if(notebookOpen)closeNotebook();state.inventory=['ナカコのスケッチブック','オカボーのスケッチブック'];state.flags.sketchFound=true;state.flags.layoutChecked=true;state.flags.dutyChecked=true;state.flags.okaboChecked=false;render();menu();selectNotebook('memo')});await page.evaluate(()=>document.fonts.ready);await page.screenshot({path:`${output}/result-notebook-${width}x${height}.png`});
 await page.evaluate(()=>{selectNotebook('relations');enterNotebookSection()});await page.screenshot({path:`${output}/result-relations-${width}x${height}.png`});
 assert.equal(await page.locator('.nb-node').count(),5);assert.equal(await page.locator('.nb-edge-label').count(),5);
 const chartMetrics=await page.locator('.nb-chart').evaluate(e=>({scroll:e.scrollWidth,width:e.clientWidth}));if(width===375){assert(chartMetrics.scroll>chartMetrics.width);await page.locator('.nb-chart').focus();await page.keyboard.press('ArrowRight');assert((await page.locator('.nb-chart').evaluate(e=>e.scrollLeft))>0);await page.locator('.nb-chart').evaluate(e=>e.scrollLeft=0)}
 await page.evaluate(()=>{selectNotebook('mail');showNotebookMail('mail-nakako-01')});await page.screenshot({path:`${output}/result-phs-${width}x${height}.png`});
 assert.equal(await page.locator('.nb-lcd.enlarged .nb-mail-body').innerText(),'ﾉｰﾄ ﾐﾂｶｯﾀ? ｱｽ ﾌﾞｼﾂ');
 const overlap=await page.evaluate(()=>{const a=$('nbClose').getBoundingClientRect(),b=document.querySelector('.enlarged').getBoundingClientRect();return a.top<b.bottom&&a.bottom>b.top&&a.left<b.right&&a.right>b.left});assert(!overlap);
}
assert(await page.evaluate(()=>getComputedStyle($('notebook')).animationName==='none'));
// All interactive elements reachable at mobile size, no viewport overflow.
await page.locator('#nbClose').tap();assert(await page.locator('#notebook').isHidden());await page.locator('#menu').tap();await page.evaluate(()=>selectNotebook('load'));for(const button of await page.locator('#panelBody button').all())assert(await button.isVisible());
await page.locator('#nbNav button').first().focus();await page.keyboard.press('Shift+Tab');assert.equal(await page.evaluate(()=>document.activeElement.id),'nbClose');await page.keyboard.press('Tab');assert.equal(await page.evaluate(()=>document.activeElement.dataset.section),'items');
await page.evaluate(()=>{selectNotebook('memo');enterNotebookSection()});await page.keyboard.press('ArrowDown');assert((await page.locator('#panel').evaluate(e=>e.scrollTop))>0);
await page.evaluate(()=>{closeNotebook();deductionActive=true;state.mode='deduction';menu()});assert(await page.locator('#notebook').isHidden());assert.equal(await page.evaluate(()=>state.mode),'deduction');
await page.emulateMedia({reducedMotion:'no-preference'});
await page.evaluate(()=>{deductionActive=false;state.mode='exploration';render();menu()});assert(await page.locator('#notebook').isVisible());
await page.evaluate(()=>{closeNotebook();menu()});await page.waitForTimeout(300);assert(await page.locator('#notebook').isVisible());
await page.locator('#nbClose').click();await page.waitForTimeout(280);assert(await page.locator('#notebook').isHidden());
assert.deepEqual(errors,[]);console.log('PASS: actual Chrome, deferred 2.5s notification, arrow/Enter/Esc navigation, mail reaction and read state, notebook save/load, title load, old save, relation update, three viewports, reduced-motion, deduction lock, no JS errors.');
await browser.close();})();
