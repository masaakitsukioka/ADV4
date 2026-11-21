// The file import/export UI was retired. Check the current three local slots and failure handling instead.
require('./browser-harness.cjs')(async(page,assert)=>{
 const result=await page.evaluate(()=>{
  const store=new Map(),storage={getItem:k=>store.get(k)??null,setItem:(k,v)=>store.set(k,v)},api=window.SaikachiSaves.create(SCENARIO,()=>storage),snapshot=api.snapshot(state,textSettings);
  for(let slot=1;slot<=3;slot++)api.write(slot,snapshot);
  const same=[1,2,3].every(slot=>JSON.stringify(api.read(slot).progress)===JSON.stringify(snapshot.progress));
  let deniedRead=false,deniedWrite=false;try{window.SaikachiSaves.create(SCENARIO,()=>{throw Error('denied')}).read(1)}catch(e){deniedRead=/保存領域/.test(e.message)}
  try{window.SaikachiSaves.create(SCENARIO,()=>({setItem(){throw Error('quota')}})).write(1,snapshot)}catch(e){deniedWrite=/保存できません/.test(e.message)}
  return{same,deniedRead,deniedWrite,retired:[typeof transferMenu,typeof exportProgress,typeof readSaveFile,typeof importPicker]};
 });
 assert(result.same&&result.deniedRead&&result.deniedWrite);assert.deepEqual(result.retired,['undefined','undefined','undefined','undefined']);
 await page.locator('#menu').click();assert(await page.locator('#notebook').isVisible());assert.equal(await page.getByText('セーブの持ち運び',{exact:true}).count(),0);
 console.log('PASS: retired file-transfer UI absent; three current save slots and denied/quota storage handled');
}).catch(e=>{console.error(e);process.exitCode=1});
