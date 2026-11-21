'use strict';
// Keep the remaining delay of each game timer when the player rotates the screen.
(() => {
 const nativeSet=window.setTimeout.bind(window), nativeClear=window.clearTimeout.bind(window);
 const nativeRAF=window.requestAnimationFrame.bind(window), nativeCancelRAF=window.cancelAnimationFrame.bind(window);
 const timers=new Map(), frames=new Map(); let sequence=1, paused=innerHeight>innerWidth;
 function arm(id,entry){entry.started=performance.now();entry.native=nativeSet(()=>{entry.native=null;if(!entry.interval)timers.delete(id);entry.callback(...entry.args);if(entry.interval&&timers.has(id)){entry.remaining=entry.delay;if(!paused)arm(id,entry)}},entry.remaining)}
 function schedule(callback,delay,args,interval){const id=sequence++, n=Math.max(0,Number(delay)||0), entry={callback:typeof callback==='function'?callback:()=>{},args,delay:n,remaining:n,interval,native:null};timers.set(id,entry);if(!paused)arm(id,entry);return id}
 window.setTimeout=(fn,delay,...args)=>schedule(fn,delay,args,false);
 window.setInterval=(fn,delay,...args)=>schedule(fn,delay,args,true);
 window.clearTimeout=window.clearInterval=id=>{const entry=timers.get(id);if(entry?.native!==null&&entry?.native!==undefined)nativeClear(entry.native);timers.delete(id)};
 function armFrame(id,entry){entry.native=nativeRAF(t=>{frames.delete(id);entry.callback(t)})}
 window.requestAnimationFrame=callback=>{const id=sequence++,entry={callback,native:null};frames.set(id,entry);if(!paused)armFrame(id,entry);return id};
 window.cancelAnimationFrame=id=>{const entry=frames.get(id);if(entry?.native!==null&&entry?.native!==undefined)nativeCancelRAF(entry.native);frames.delete(id)};
 const game=document.getElementById('game');
 function update(){const next=innerHeight>innerWidth;game.inert=next;if(next===paused)return;paused=next;
  if(paused){for(const entry of timers.values())if(entry.native!==null){nativeClear(entry.native);entry.native=null;entry.remaining=Math.max(0,entry.remaining-(performance.now()-entry.started))}for(const entry of frames.values())if(entry.native!==null){nativeCancelRAF(entry.native);entry.native=null}}
  else{for(const [id,entry] of timers)if(entry.native===null)arm(id,entry);for(const [id,entry] of frames)if(entry.native===null)armFrame(id,entry)}
 }
 game.inert=paused;window.addEventListener('resize',update);window.addEventListener('orientationchange',update);
 for(const type of ['keydown','keyup','keypress','pointerdown','pointerup','click','touchstart','touchend'])document.addEventListener(type,e=>{if(paused||!document.getElementById('loadingNotice').hidden){e.preventDefault();e.stopImmediatePropagation()}},true);
 // Fullscreen and orientation lock are optional; iOS Safari continues without them.
 let attempted=false;document.addEventListener('click',e=>{const button=e.target.closest('#openingActions button');if(attempted||!button||!['最初から','途中から'].includes(button.textContent.trim())||!navigator.maxTouchPoints||!screen.orientation?.lock)return;attempted=true;try{const request=document.documentElement.requestFullscreen?.();Promise.resolve(request).then(()=>screen.orientation.lock('landscape')).catch(()=>{})}catch(_){}},true);
})();
