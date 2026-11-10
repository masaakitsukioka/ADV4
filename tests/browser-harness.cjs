const {chromium}=require('playwright'),assert=require('assert');
module.exports=async function(check,{motion='reduce',viewport={width:1280,height:720}}={}){
 const browser=await chromium.launch({executablePath:process.env.CHROME_PATH||'/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',headless:true});
 const page=await browser.newPage({viewport,reducedMotion:motion}),errors=[];page.on('pageerror',e=>{errors.push(e.message);console.error(e.stack)});
 try{await page.goto(process.env.ADV_URL||'http://127.0.0.1:8777/');await page.evaluate(()=>document.fonts.ready);await page.evaluate(()=>{textSettings.index=3;startNewGame();for(let i=0;i<3;i++)advanceOpening();for(let i=0;i<300&&state.mode==='dialogue';i++)advance()});await page.waitForFunction(()=>['dialogue','exploration','dialogue-out'].includes(state.mode));await page.evaluate(()=>{for(let i=0;i<300&&state.mode==='dialogue';i++)advance()});await page.waitForFunction(()=>state.mode==='exploration');await check(page,assert);assert.deepEqual(errors,[],'no browser runtime errors')}
 finally{await browser.close()}
};
