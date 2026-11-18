'use strict';
let presentationGeneration=0,talkTimer=null,talkGeneration=0,itemGraphicGeneration=0;
const presentationReduced=()=>matchMedia('(prefers-reduced-motion: reduce)').matches;
function showWindow(id,visible){
 const node=$(id),target=visible?'shown':'hidden';if(node.dataset.visibilityTarget===target)return;node.dataset.visibilityTarget=target;
 if(['commandWindows','commandDetail'].includes(id)){node.classList.toggle('hidden',!visible);node.classList.remove('window-in');node.classList.remove('window-out');return}
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
 loadImage(path).then(image=>{if(generation!==itemGraphicGeneration||!image)return;const c=$('itemCanvas'),ctx=c.getContext('2d');if(!ctx?.drawImage)return;ctx.imageSmoothingEnabled=true;ctx.clearRect(0,0,96,96);ctx.drawImage(image,0,0,96,96)});
}
function itemGraphicFor(item){return SCENARIO.items[item]?.graphic?.[state.flags.okaboChecked?'examined':'closed']||SCENARIO.items[item]?.graphic?.closed}
const blinkTimers=new Map(),portraitTokens=new Map();
function hidePortraitFrame(id){$(id+'Talk').classList.add('hidden');$(id+'Talk').dataset.frame='0';$(id+'Card').classList.remove('animating')}
function clearBlink(id){clearTimeout(blinkTimers.get(id));blinkTimers.delete(id);portraitTokens.set(id,(portraitTokens.get(id)||0)+1)}
function stopTalking(){
 talkGeneration++;clearTimeout(talkTimer);talkTimer=null;
 for(const id of ['haruki','saiji']){clearBlink(id);hidePortraitFrame(id)}
}
// Each replacement is a complete aligned portrait. Draw exactly one image.
function drawTalkingPortrait(ctx,base,id,frame,strip,replacement){
 const {width,height}=ASSETS.characterResolution;ctx.imageSmoothingEnabled=true;ctx.clearRect(0,0,width,height);
 const image=frame&&replacement?.width===width&&replacement?.height===height?replacement:base;
 if(image)ctx.drawImage(image,0,0,width,height);
}
async function displayPortraitFrame(id,paths,frame,valid){
 const expression=characterExpression(id,$(id+'Emotion').textContent);
 const [base,replacement]=await Promise.all([loadImage(ASSETS.characters[id][expression]),loadImage(paths?.[frame])]);
 if(!valid()||!base)return;
 const canvas=$(id+'Talk'),{width,height}=ASSETS.characterResolution;
 canvas.width=width;canvas.height=height;const ctx=canvas.getContext('2d');if(!ctx?.drawImage)return;
 drawTalkingPortrait(ctx,base,id,frame,null,replacement);canvas.dataset.frame=String(frame);canvas.classList.remove('hidden');$(id+'Card').classList.add('animating');
}
function scheduleBlink(id){
 clearBlink(id);if(presentationReduced())return;const token=portraitTokens.get(id);
 const valid=()=>portraitTokens.get(id)===token;
 const start=()=>{if(!valid())return;if($('characterStage').classList.contains('hidden')){scheduleBlink(id);return}
  const key=characterExpression(id,$(id+'Emotion').textContent),frames=ASSETS.blinkFrames?.[id]?.[key];let i=0;
  function tick(){if(!valid())return;const frame=[1,2,1,0][i++];canvasState(frame);if(i<4)blinkTimers.set(id,setTimeout(tick,70));else{hidePortraitFrame(id);scheduleBlink(id)}}
  function canvasState(frame){$(id+'Talk').dataset.animation='blink';displayPortraitFrame(id,frames,frame,valid)}tick();
 };
 blinkTimers.set(id,setTimeout(start,2000+Math.random()*4000));
}
function finishTalking(){
 talkGeneration++;clearTimeout(talkTimer);talkTimer=null;
 for(const id of ['haruki','saiji']){hidePortraitFrame(id);scheduleBlink(id)}
}
function startTalking(name,emotion,text){
 stopTalking();const speaker=({'ハルキ':'haruki','サイジ':'saiji'})[name];
 for(const id of ['haruki','saiji'])if(id!==speaker)scheduleBlink(id);
 if(!speaker||typingDone||presentationReduced()){if(speaker)scheduleBlink(speaker);return}
 const key=characterExpression(speaker,emotion),frames=ASSETS.mouthFrames?.[speaker]?.[key],generation=talkGeneration;let step=0;
 function tick(){if(generation!==talkGeneration)return;if(typingDone){finishTalking();return}
  $(speaker+'Talk').dataset.animation='talk';displayPortraitFrame(speaker,frames,[0,1,2,1][step++%4],()=>generation===talkGeneration);
  talkTimer=setTimeout(tick,120);
 }tick();
}
function presentDialogueLine(line){
 const [speaker,text,emotion,visual]=line;
 if(visual?.item){state.itemPresentation=visual;showItemGraphic(visual.item,visual.label);if(visual.seAcquisition&&!visual.seAcquisition.played){visual.seAcquisition.played=true;if(textSettings.se)playSE('item')}}
 startTalking(speaker,emotion||'通常',text);
}
function resetPresentation(){
 if(typeof resetMangaDeduction==='function')resetMangaDeduction();
 presentationGeneration++;stopTalking();hideItemGraphic(true);state.itemPresentation=null;
 for(const id of ['questionAnnouncement','deductionResult'])$(id).classList.add('hidden');
 for(const id of ['commandWindows','commandDetail','panel']){delete $(id).dataset.visibilityTarget;$(id).dataset.visibilityToken=String(Number($(id).dataset.visibilityToken||0)+1);$(id).classList.remove('window-out');$(id).classList.remove('window-in')}
 $('characterStage').classList.remove('leaving');$('dialogue').classList.remove('leaving');
}
function moveOutDialogue(after){
 // The paper and portraits stay in place. Only the writing is dismissed.
 presentationGeneration++;stopTalking();hideItemGraphic();closeDialogueLayer();after();
}
function questionPresentation(after){
 const generation=++presentationGeneration;state.mode='question-transition';render();
 $('questionNumber').textContent='謎 '+(state.deductionStep+1);$('questionText').textContent=questions[state.deductionStep].q;
 $('questionAnnouncement').classList.remove('hidden');$('questionAnnouncement').classList.add('question-dissolve');
 const finish=()=>{if(generation!==presentationGeneration)return;$('questionAnnouncement').classList.add('hidden');$('questionAnnouncement').classList.remove('question-dissolve');after()};
 if(presentationReduced())finish();else setTimeout(finish,2480);
}
function flashDeduction(){
 if(presentationReduced())return;$('deductionFlash').classList.remove('flash');$('deductionFlash').getBoundingClientRect();$('deductionFlash').classList.add('flash');
}
function correctPresentation(solved,after){
 const generation=++presentationGeneration;state.mode='deduction-result';stopTalking();render();
 const result=$('deductionResult');$('resultText').replaceChildren();if(solved){for(const letter of ['解','明']){const span=document.createElement('span');span.textContent=letter;$('resultText').appendChild(span)}}else $('resultText').textContent='正解！';result.classList.toggle('solved',solved);result.classList.remove('result-out');result.classList.remove('hidden');result.classList.toggle('result-in',!solved);
 const finish=()=>{if(generation!==presentationGeneration)return;result.classList.add('hidden');result.classList.remove('result-out');result.classList.remove('result-in');after()};
 if(presentationReduced()){finish();return}
 if(solved){setTimeout(finish,2800);return}
 setTimeout(()=>{if(generation===presentationGeneration)flashDeduction()},180);
 setTimeout(()=>{if(generation!==presentationGeneration)return;result.classList.remove('result-in');result.classList.add('result-out')},1180);
 setTimeout(finish,1360);
}

for(const id of ['haruki','saiji'])setCharacterImage(id,'通常');
