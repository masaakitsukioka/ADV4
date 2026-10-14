'use strict';
let presentationGeneration=0,talkTimer=null,talkGeneration=0,itemGraphicGeneration=0;
const mouthGeometry={haruki:{source:{x:46,y:61,w:19,h:12},target:{x:47,y:71,w:13,h:9}},saiji:{source:{x:35,y:65,w:20,h:12},target:{x:35,y:74,w:14,h:9}}};
const presentationReduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function showWindow(id,visible){
 const node=$(id),target=visible?'shown':'hidden';if(node.dataset.visibilityTarget===target)return;node.dataset.visibilityTarget=target;
 const token=String(Number(node.dataset.visibilityToken||0)+1);node.dataset.visibilityToken=token;
 if(visible){node.classList.remove('window-out');if(node.classList.contains('hidden')){node.classList.remove('hidden');node.classList.add('window-in')}return}
 if(node.classList.contains('hidden'))return;
 node.classList.remove('window-in');node.classList.add('window-out');
 const finish=()=>{if(node.dataset.visibilityToken!==token)return;node.classList.add('hidden');node.classList.remove('window-out')};
 if(presentationReduced())finish();else setTimeout(finish,240);
}
function hideItemGraphic(immediate=false){
 itemGraphicGeneration++;if(immediate){delete $('itemGraphic').dataset.visibilityTarget;$('itemGraphic').dataset.visibilityToken=String(Number($('itemGraphic').dataset.visibilityToken||0)+1);$('itemGraphic').classList.add('hidden');$('itemGraphic').classList.remove('window-out');return}showWindow('itemGraphic',false);
}
function showItemGraphic(key,label){
 const generation=++itemGraphicGeneration;const path='assets/items/'+key+'.png';
 $('itemGraphic').dataset.item=key;$('itemGraphic').setAttribute('aria-label',label||'手がかり');$('itemCaption').textContent=label||'';showWindow('itemGraphic',true);
 loadImage(path).then(image=>{if(generation!==itemGraphicGeneration||!image)return;const c=$('itemCanvas'),ctx=c.getContext('2d');if(!ctx?.drawImage)return;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,96,96);ctx.drawImage(image,0,0,96,96)});
}
function itemGraphicFor(item){return SCENARIO.items[item]?.graphic?.[state.flags.okaboChecked?'examined':'closed']||SCENARIO.items[item]?.graphic?.closed}
function stopTalking(){
 talkGeneration++;clearTimeout(talkTimer);talkTimer=null;
 for(const id of ['haruki','saiji']){$(id+'Talk').classList.add('hidden');$(id+'Talk').dataset.frame='0'}
}
function startTalking(name,emotion,text){
 stopTalking();if(!['ハルキ','サイジ'].includes(name))return;
 const id=name==='ハルキ'?'haruki':'saiji',key=ASSETS.emotionMap[emotion]||'normal',generation=talkGeneration;
 const canvas=$(id+'Talk');canvas.dataset.expression=key;
 const basePath=ASSETS.characters[id][key],stripPath='assets/characters/talk/'+id+'-'+key+'-mouths.png';
 const duration=Math.min(4500,Math.max(500,Array.from(text).length*(textSettings.index===3?35:textSettings.speeds[textSettings.index])));
 const until=Date.now()+duration;const sequence=[0,1,2,1];let step=0;
 const images=Promise.all([loadImage(basePath),loadImage(stripPath)]);
 async function draw(frame){
  const [base,strip]=await images;if(generation!==talkGeneration||!base||!strip)return;
  const ctx=canvas.getContext('2d');if(!ctx?.drawImage)return;
  const geom=mouthGeometry[id],cell=strip.width/3;ctx.imageSmoothingEnabled=false;ctx.clearRect(0,0,104,144);ctx.drawImage(base,0,0,104,144);
  if(frame){const temp=document.createElement('canvas');temp.width=104;temp.height=144;const tc=temp.getContext('2d');tc.imageSmoothingEnabled=false;tc.drawImage(strip,frame*cell,0,cell,strip.height,0,0,104,144);
   const {source:a,target:b}=geom;ctx.drawImage(temp,a.x,a.y,a.w,a.h,b.x,b.y,b.w,b.h)}
  canvas.classList.remove('hidden');canvas.dataset.frame=String(frame);
 }
 function tick(){if(generation!==talkGeneration)return;const frame=sequence[step++%sequence.length];canvas.dataset.frame=String(frame);draw(frame);if(!typingDone||Date.now()<until)talkTimer=setTimeout(tick,120);else{draw(0);talkTimer=setTimeout(stopTalking,120)}}
 if(!presentationReduced())tick();
}
function presentDialogueLine(line){
 const [speaker,text,emotion,visual]=line;
 if(visual?.item){state.itemPresentation=visual;showItemGraphic(visual.item,visual.label)}
 startTalking(speaker,emotion||'通常',text);
}
function resetPresentation(){
 presentationGeneration++;stopTalking();hideItemGraphic(true);state.itemPresentation=null;
 for(const id of ['questionAnnouncement','deductionResult'])$(id).classList.add('hidden');
 for(const id of ['commandWindows','commandDetail','panel']){delete $(id).dataset.visibilityTarget;$(id).dataset.visibilityToken=String(Number($(id).dataset.visibilityToken||0)+1);$(id).classList.remove('window-out');$(id).classList.remove('window-in')}
 $('characterStage').classList.remove('leaving');$('dialogue').classList.remove('leaving');
}
function moveOutDialogue(after){
 stopTalking();hideItemGraphic();const generation=++presentationGeneration;
 $('dialogue').classList.add('leaving');$('characterStage').classList.add('leaving');
 const finish=()=>{if(generation!==presentationGeneration)return;$('dialogue').classList.remove('leaving');$('characterStage').classList.remove('leaving');closeDialogueLayer();after()};
 if(presentationReduced())finish();else setTimeout(finish,440);
}
function questionPresentation(after){
 const generation=++presentationGeneration;state.mode='question-transition';render();
 $('questionNumber').textContent='謎 '+(state.deductionStep+1);$('questionText').textContent=questions[state.deductionStep].q;
 $('questionAnnouncement').classList.remove('hidden');$('questionAnnouncement').classList.add('question-dissolve');
 const finish=()=>{if(generation!==presentationGeneration)return;$('questionAnnouncement').classList.add('hidden');$('questionAnnouncement').classList.remove('question-dissolve');after()};
 if(presentationReduced())finish();else setTimeout(finish,1480);
}
function flashDeduction(){
 if(presentationReduced())return;$('deductionFlash').classList.remove('flash');$('deductionFlash').getBoundingClientRect();$('deductionFlash').classList.add('flash');
}
function correctPresentation(solved,after){
 const generation=++presentationGeneration;state.mode='deduction-result';stopTalking();render();
 const result=$('deductionResult');$('resultText').textContent=solved?'解明！':'正解！';result.classList.toggle('solved',solved);result.classList.remove('result-out');result.classList.remove('hidden');result.classList.add('result-in');
 const finish=()=>{if(generation!==presentationGeneration)return;result.classList.add('hidden');result.classList.remove('result-out');result.classList.remove('result-in');after()};
 if(presentationReduced()){finish();return}
 setTimeout(()=>{if(generation===presentationGeneration)flashDeduction()},180);
 setTimeout(()=>{if(generation!==presentationGeneration)return;result.classList.remove('result-in');result.classList.add('result-out')},1180);
 setTimeout(finish,1360);
}

for(const id of ['haruki','saiji'])setCharacterImage(id,'通常');
