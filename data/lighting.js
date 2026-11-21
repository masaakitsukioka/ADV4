'use strict';
const lightingCache=new Map(),lightingPending=new Map();let lightingConfig=null,lightingWorker=null,lightingCalculations=0,lightingGeneration=0,lightingLatestKey=null;
function releaseLighting(){lightingGeneration++;lightingLatestKey=null;for(const bitmap of lightingCache.values())bitmap?.close?.();lightingCache.clear();if(lightingWorker){lightingWorker.terminate();lightingWorker=null}for(const job of lightingJobs.values())job.reject(Error('lighting cancelled'));lightingJobs.clear();lightingPending.clear()}
function lightingTime(label){return ({'朝':'asa','昼':'hiru','放課後':'yu','夕':'yu','夜':'yoru'})[label]||'hiru'}
async function lightingResult(roomId,image,label){
 const time=lightingTime(label),key=roomId+':'+time;
 lightingLatestKey=key;for(const [old,bitmap] of lightingCache)if(old!==key){bitmap?.close?.();lightingCache.delete(old)}
 if(time==='hiru')return null;
 if(lightingCache.has(key))return lightingCache.get(key);
 if(lightingPending.has(key))return lightingPending.get(key);
 const generation=lightingGeneration,promise=(async()=>{
  lightingConfig??=await fetch('data/timeofday-params.json').then(r=>{if(!r.ok)throw Error('time-of-day configuration');return r.json()});
  if(!lightingConfig.place[roomId])return null;
  const mask=await loadImage('assets/backgrounds/masks/'+roomId+'-window.png');
  if(generation!==lightingGeneration)return null;
  const base=await createImageBitmap(image),windowMask=mask?await createImageBitmap(mask):null;
  if(generation!==lightingGeneration){base.close();windowMask?.close();return null}
  if(!lightingWorker){lightingWorker=new Worker('data/lighting-worker.js');lightingWorker.onmessage=({data})=>{const job=lightingJobs.get(data.key);if(!job){data.result?.close?.();return}lightingJobs.delete(data.key);data.error?job.reject(Error(data.error)):job.resolve(data.result);if(!lightingJobs.size&&lightingWorker){lightingWorker.terminate();lightingWorker=null}};lightingWorker.onerror=()=>{for(const job of lightingJobs.values())job.reject(Error('lighting worker failed'));lightingJobs.clear();lightingWorker?.terminate();lightingWorker=null}}
  const result=await new Promise((resolve,reject)=>{lightingJobs.set(key,{resolve,reject});lightingCalculations++;lightingWorker.postMessage({key,base,mask:windowMask,time:lightingConfig.time[time],place:lightingConfig.place[roomId]},[base,...(windowMask?[windowMask]:[])])});
  if(generation!==lightingGeneration||lightingLatestKey!==key){result?.close?.();return null}lightingCache.set(key,result);return result;
 })();lightingPending.set(key,promise);try{return await promise}finally{if(lightingPending.get(key)===promise)lightingPending.delete(key)}
}
const lightingJobs=new Map();
async function applyTimeOfDay(roomId,image){
 const scene=$('scene'),time=lightingTime(typeof calendar==='function'?calendar().label:'放課後'),key=roomId+':'+time;
 scene.dataset.lighting=key;scene.dataset.lightingStatus='base';
 try{const bitmap=await lightingResult(roomId,image,typeof calendar==='function'?calendar().label:'放課後');if(scene.dataset.lighting!==key||state.room!==roomId||(typeof deductionActive!=='undefined'&&deductionActive))return;
  if(bitmap){const c=$('pixelScene');c.width=bitmap.width;c.height=bitmap.height;c.getContext('2d').drawImage(bitmap,0,0);c.style.visibility='visible'}scene.dataset.lightingStatus='ready';
 }catch(e){if(e.message==='lighting cancelled')return;scene.dataset.lightingStatus='fallback';console.warn('Background light: base image retained',e)}
}
