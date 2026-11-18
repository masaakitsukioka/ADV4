'use strict';
const lightingCache=new Map(),lightingPending=new Map();let lightingConfig=null,lightingWorker=null,lightingCalculations=0;
function lightingTime(label){return ({'朝':'asa','昼':'hiru','放課後':'yu','夕':'yu','夜':'yoru'})[label]||'hiru'}
async function lightingResult(roomId,image,label){
 const time=lightingTime(label),key=roomId+':'+time;
 if(time==='hiru')return null;
 if(lightingCache.has(key))return lightingCache.get(key);
 if(lightingPending.has(key))return lightingPending.get(key);
 const promise=(async()=>{
  lightingConfig??=await fetch('data/timeofday-params.json').then(r=>{if(!r.ok)throw Error('time-of-day configuration');return r.json()});
  if(!lightingConfig.place[roomId])return null;
  const mask=await loadImage('assets/backgrounds/masks/'+roomId+'-window.png');
  if(!lightingWorker){lightingWorker=new Worker('data/lighting-worker.js');lightingWorker.onmessage=({data})=>{const job=lightingJobs.get(data.key);if(!job)return;lightingJobs.delete(data.key);data.error?job.reject(Error(data.error)):job.resolve(data.result)};lightingWorker.onerror=()=>{for(const job of lightingJobs.values())job.reject(Error('lighting worker failed'));lightingJobs.clear();lightingWorker.terminate();lightingWorker=null}}
  const base=await createImageBitmap(image),windowMask=mask?await createImageBitmap(mask):null;
  const result=await new Promise((resolve,reject)=>{lightingJobs.set(key,{resolve,reject});lightingCalculations++;lightingWorker.postMessage({key,base,mask:windowMask,time:lightingConfig.time[time],place:lightingConfig.place[roomId]},[base,...(windowMask?[windowMask]:[])])});
  lightingCache.set(key,result);return result;
 })();lightingPending.set(key,promise);try{return await promise}finally{lightingPending.delete(key)}
}
const lightingJobs=new Map();
async function applyTimeOfDay(roomId,image){
 const scene=$('scene'),time=lightingTime(typeof calendar==='function'?calendar().label:'放課後'),key=roomId+':'+time;
 scene.dataset.lighting=key;scene.dataset.lightingStatus='base';
 try{const bitmap=await lightingResult(roomId,image,typeof calendar==='function'?calendar().label:'放課後');if(scene.dataset.lighting!==key||state.room!==roomId||(typeof deductionActive!=='undefined'&&deductionActive))return;
  if(bitmap){const c=$('pixelScene');c.width=bitmap.width;c.height=bitmap.height;c.getContext('2d').drawImage(bitmap,0,0);c.style.visibility='visible'}scene.dataset.lightingStatus='ready';
 }catch(e){scene.dataset.lightingStatus='fallback';console.warn('Background light: base image retained',e)}
}
