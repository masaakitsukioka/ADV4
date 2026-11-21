'use strict';
// Keep the actual exploration DOM inside one monochrome layer; red editorial marks live beside it.
const deduceStage=$('mangaStage'),monoLayer=document.createElement('div');monoLayer.id='monoLayer';
while(deduceStage.firstChild)monoLayer.appendChild(deduceStage.firstChild);deduceStage.appendChild(monoLayer);
const redLayer=document.createElement('div');redLayer.id='redLayer';redLayer.innerHTML='<div id="deduceImpact"></div><div id="deduceBeta"></div><div id="deduceFlashLines"></div><div id="deduceBurstLines"></div><div id="deduceStartStamp"><img src="assets/ui/manga/deduce/burst.svg" alt=""><span>推理開始！</span></div><div id="deduceRedMarks"></div><div id="deduceWhite"></div>';deduceStage.appendChild(redLayer);redLayer.appendChild($('deductionResult'));
const scene=$('scene');const tone=document.createElement('img');tone.id='deduceTone';tone.alt='';tone.setAttribute('aria-hidden','true');scene.appendChild(tone);
for(const id of ['deduceWhiteCenter','deduceLines','deduceLinesMore']){const n=document.createElement('div');n.id=id;scene.appendChild(n)}
const side=document.createElement('aside');side.id='deduceSide';side.setAttribute('aria-label','推理の進み具合');monoLayer.appendChild(side);
let deduceVisualGeneration=0,deduceVisualFinished=false,redFrame=0;
const solvedTiming={reveal:1800,hold:1000,fade:500};
// Stable pseudo-random cutouts: redraws keep the same lettering and positions.
const questionCutouts=Array.from({length:5},(_,i)=>Array.from({length:2},(_,j)=>{
 const seed=(i*37+j*19+11)%97;return{size:40+seed%17,turn:(seed%13)-6,lift:(seed%9)-4,font:(i+j)%2?'var(--font-body)':'var(--font-head)',ink:(i+j)%3===0};
}));
function splitDeductionQuestion(text){
 const chars=Array.from(text),lines=[];while(chars.length>12){let cut=12;for(let i=11;i>=5;i--)if('はをの、'.includes(chars[i])){cut=i+1;break}lines.push(chars.splice(0,cut).join(''))}if(chars.length)lines.push(chars.join(''));return lines;
}
function refreshDeduceSide(){
 const digits=['一','二','三','四','五'];side.replaceChildren();const title=document.createElement('div');title.className='deduce-side-title';title.textContent=deduceVisualFinished?'解明済み':'推理';side.appendChild(title);
 digits.forEach((digit,i)=>{const row=document.createElement('div');row.className='deduce-side-row'+(!deduceVisualFinished&&i===state.deductionStep?' now':'');row.dataset.question=String(i);row.setAttribute('aria-label','問'+digit);row.style.setProperty('--row-left',[24,36,18,34,26][i]+'px');
  ['問',digit].forEach((letter,j)=>{const cut=document.createElement('span'),style=questionCutouts[i][j];cut.textContent=letter;cut.className='question-cutout'+(style.ink?' ink':'');cut.style.setProperty('--cut-size',style.size+'px');cut.style.setProperty('--cut-turn',style.turn+'deg');cut.style.setProperty('--cut-lift',style.lift+'px');cut.style.setProperty('--cut-font',style.font);row.appendChild(cut)});
  row.style.setProperty('--row-delay',(2.25+i*.08)+'s');side.appendChild(row)});
 const note=document.createElement('div');note.className='deduce-note';note.textContent=deduceVisualFinished?'五つの問いを解明':'推理中は捜査に戻れない';side.appendChild(note);
 $('deduceLinesMore').classList.toggle('visible',state.deductionStep>=2);
}
function renderDeductionLayout(){
 if(!deduceStage.classList.contains('deduce-intro')||!side.children.length)refreshDeduceSide();const q=questions[state.deductionStep],title=$('panelTitle');title.replaceChildren();
 for(const [i,chunk] of splitDeductionQuestion(q.q).entries()){const strip=document.createElement('span');strip.className='deduce-question-strip';strip.textContent=chunk;strip.style.setProperty('--strip-index',i);title.appendChild(strip)}
 $('panel').classList.toggle('deduce-compose',q.type==='compose');
 [...$('panelBody').querySelectorAll('.deduction-choice,.answer-option')].forEach((node,i)=>{node.style.setProperty('--choice-index',i);if(!node.dataset.number)node.dataset.number=String(i+1)});
 positionDeductionPanel();scheduleDeduceMarks();
}
function positionDeductionPanel(){
 const panel=$('panel');if(!deduceStage.classList.contains('deduce-active')||deduceVisualFinished)return;
 const portrait=innerWidth<=700&&innerHeight>innerWidth,scene=$('scene');
 const cx=scene.offsetLeft+scene.offsetWidth/2,cy=scene.offsetTop+scene.offsetHeight/2;
 panel.style.removeProperty('width');
 if(panel.classList.contains('deduce-compose')&&innerHeight<=460&&!portrait){
  const scale=parseFloat(deduceStage.style.getPropertyValue('--manga-scale'))||1,stage=deduceStage.getBoundingClientRect(),actor=$('harukiCard').getBoundingClientRect();
  const left=Math.max(scene.offsetLeft+30,(actor.right-stage.left+4)/scale),right=scene.offsetLeft+scene.offsetWidth-30;
  panel.style.left=left+'px';panel.style.width=Math.max(0,right-left)+'px';panel.style.top=(scene.offsetTop+12)+'px';
  panel.style.removeProperty('--pool-inset');panel.style.removeProperty('--confirm-indent');panel.classList.remove('avoid-dialogue','avoid-actor-only');return;
 }
 panel.style.left=(cx-panel.offsetWidth/2)+'px';
 const minTop=portrait?210:scene.offsetTop+28;
 const maxBottom=portrait?scene.offsetTop+scene.offsetHeight-20:Math.min(scene.offsetTop+scene.offsetHeight-28,$('harukiCard').offsetTop+16);
 panel.style.removeProperty('--pool-inset');panel.style.top=Math.max(minTop,Math.min(cy-panel.offsetHeight/2,maxBottom-panel.offsetHeight))+'px';
 const pool=panel.querySelector('.answer-pool');if(pool){const a=pool.getBoundingClientRect(),actor=$('harukiCard').getBoundingClientRect(),scale=parseFloat(deduceStage.style.getPropertyValue('--manga-scale'))||1;if(a.left<actor.right&&a.right>actor.left&&a.top<actor.bottom&&a.bottom>actor.top){const wanted=(actor.right-a.left+1)/scale,limit=Math.max(0,(panel.offsetWidth-4*37/scale-12)/2);panel.style.setProperty('--pool-inset',Math.min(wanted,limit)+'px');panel.style.top=Math.max(minTop,Math.min(cy-panel.offsetHeight/2,maxBottom-panel.offsetHeight))+'px'}}
 // When the enlarged touch targets meet the dialogue, keep both interactive.
 panel.classList.remove('avoid-dialogue','avoid-actor-only');panel.style.removeProperty('--confirm-indent');const confirm=panel.querySelector('.answer-confirm');if(confirm){const a=confirm.getBoundingClientRect(),body=$('messageBody').getBoundingClientRect(),actor=$('harukiCard').getBoundingClientRect(),overlap=(x,y)=>x.left<y.right&&x.right>y.left&&x.top<y.bottom&&x.bottom>y.top,bodyHit=overlap(a,body),actorHit=overlap(a,actor);if(bodyHit||actorHit){panel.classList.add('avoid-dialogue');if(bodyHit){const scale=parseFloat(deduceStage.style.getPropertyValue('--manga-scale'))||1;panel.style.setProperty('--confirm-indent',Math.max(0,(actor.right-panel.getBoundingClientRect().left+1)/scale)+'px')}else panel.classList.add('avoid-actor-only')}}
}
function presentMangaEnding(){
 deduceStage.classList.add('manga-ending','deduce-resolved');monoLayer.appendChild($('panel'));$('panel').classList.add('ending-card');
 const panel=$('panel'),scene=$('scene');panel.style.removeProperty('width');panel.style.left=(scene.offsetLeft+(scene.offsetWidth-panel.offsetWidth)/2)+'px';panel.style.top=(scene.offsetTop+(scene.offsetHeight-panel.offsetHeight)/2)+'px';scheduleDeduceMarks();
}
function scheduleDeduceMarks(){if(!redFrame)redFrame=requestAnimationFrame(updateDeduceMarks)}
function updateDeduceMarks(){
 redFrame=0;const marks=$('deduceRedMarks');marks.replaceChildren();if(!deduceStage.classList.contains('deduce-active')&&!deduceStage.classList.contains('deduce-resolved'))return;
 const bounds=deduceStage.getBoundingClientRect(),scale=parseFloat(deduceStage.style.getPropertyValue('--manga-scale'))||1;
 const place=(el,src,padX,padY)=>{if(!el||!el.getClientRects().length)return;const r=el.getBoundingClientRect(),image=document.createElement('img');image.src=src;image.style.left=((r.left-bounds.left)/scale-padX)+'px';image.style.top=((r.top-bounds.top)/scale-padY)+'px';image.style.width=(r.width/scale+padX*2)+'px';image.style.height=(r.height/scale+padY*2)+'px';marks.appendChild(image)};
 if(state.mode==='deduction'&&!deduceVisualFinished)place(document.querySelector('#panel .deduction-choice.paper-selected, #panel .answer-slot.active'),'assets/ui/manga/topic-circle.png',12,8);
 side.querySelectorAll('.deduce-side-row').forEach((el,i)=>{if(!deduceVisualFinished&&i>=state.deductionStep)return;const r=el.getBoundingClientRect(),image=document.createElement('img');image.src='assets/ui/manga/check-'+(i%2?'a':'b')+'.png';image.style.left=((r.right-bounds.left)/scale-10)+'px';image.style.top=((r.top-bounds.top)/scale-12)+'px';image.style.width='64px';image.style.height='56px';marks.appendChild(image)});
}
const markObserver=new MutationObserver(()=>scheduleDeduceMarks());markObserver.observe($('panel'),{attributes:true,subtree:true,childList:true,attributeFilter:['class','style']});window.addEventListener('resize',()=>{if(deduceStage.classList.contains('manga-ending'))presentMangaEnding();else positionDeductionPanel();scheduleDeduceMarks()});
function setDeduceTone(){const roomId=state.room,generation=deduceVisualGeneration;tone.dataset.room=roomId;tone.dataset.status='loading';tone.onload=()=>{if(tone.dataset.room!==roomId||generation!==deduceVisualGeneration)return;tone.dataset.status='ready';if(deduceStage.classList.contains('deduce-active'))setSceneBackground(roomId)};tone.onerror=()=>{const path=ASSETS.scenes[roomId]?.background;loadImage(path).then(image=>{if(tone.dataset.room!==roomId||generation!==deduceVisualGeneration)return;if(image)$('scene').style.backgroundImage=`url("${sceneAssetURL(path)}")`;tone.dataset.status='fallback'})};tone.src='assets/backgrounds/'+roomId+'-tone.png';$('scene').dataset.lighting='deduction-off'}
function resetMangaDeduction(){deduceVisualGeneration++;deduceVisualFinished=false;deduceStage.classList.remove('deduce-intro','deduce-active','deduce-correct','deduce-finish','deduce-question-out','deduce-question-in','deduce-new-intensity','deduce-resolved','manga-ending');$('deduceRedMarks').replaceChildren();side.replaceChildren();$('panel').classList.remove('ending-card','avoid-dialogue','avoid-actor-only');$('panel').style.removeProperty('--pool-inset');$('panel').style.removeProperty('--confirm-indent');$('panel').style.removeProperty('left');$('panel').style.removeProperty('top');$('panel').style.removeProperty('width');$('deductionResult').classList.add('hidden');tone.removeAttribute('src');tone.dataset.status='idle'}
function beginMangaDeduction(){
 const token=++deduceVisualGeneration;deduceVisualFinished=false;setDeduceTone();refreshDeduceSide();deduceStage.classList.remove('deduce-correct','deduce-finish');
 const reduced=presentationReduced();deduceStage.classList.add('deduce-intro');
 const activate=()=>{if(token!==deduceVisualGeneration)return;deduceStage.classList.add('deduce-active');if(tone.dataset.status==='ready')setSceneBackground(state.room);scheduleDeduceMarks()};
 const build=()=>{if(token!==deduceVisualGeneration)return;buildDeduction();state.mode='deduction-transition';for(const b of $('panelBody').querySelectorAll('button'))b.disabled=true};
 const ready=()=>{if(token!==deduceVisualGeneration)return;state.mode='deduction';for(const b of $('panelBody').querySelectorAll('button'))b.disabled=false;deduceStage.classList.remove('deduce-intro');clearDeductionTransition();scheduleDeduceMarks()};
 if(reduced){activate();build();ready();return}setTimeout(activate,550);setTimeout(build,2850);setTimeout(ready,4000);
}
function nextMangaQuestion(after){
 if(presentationReduced()){after();return}const token=deduceVisualGeneration;state.mode='deduction-transition';deduceStage.classList.add('deduce-question-out');deduceStage.classList.toggle('deduce-new-intensity',state.deductionStep===2);refreshDeduceSide();scheduleDeduceMarks();
 setTimeout(()=>{if(token!==deduceVisualGeneration)return;deduceStage.classList.remove('deduce-question-out');deduceStage.classList.add('deduce-question-in');after();state.mode='deduction-transition';for(const b of $('panelBody').querySelectorAll('button'))b.disabled=true},450);
 setTimeout(()=>{if(token!==deduceVisualGeneration)return;deduceStage.classList.remove('deduce-question-in','deduce-new-intensity');state.mode='deduction';for(const b of $('panelBody').querySelectorAll('button'))b.disabled=false;scheduleDeduceMarks()},1000);
}
correctPresentation=function(solved,after){
 const token=++presentationGeneration;state.mode='deduction-result';stopTalking();render();const result=$('deductionResult');$('resultText').replaceChildren();
 for(const letter of (solved?['解','明','!']:['正','解','!'])){const span=document.createElement('span');span.textContent=letter;$('resultText').appendChild(span)}
 result.setAttribute('aria-label',solved?'解明！':'正解！');
 result.classList.toggle('solved',solved);result.classList.remove('hidden','result-out');result.classList.add('result-in');deduceStage.classList.add(solved?'deduce-finish':'deduce-correct');
 const finish=()=>{if(token!==presentationGeneration)return;result.classList.add('hidden');result.classList.remove('result-in');deduceStage.classList.remove('deduce-correct');if(solved){deduceVisualFinished=true;deduceStage.classList.remove('deduce-active','deduce-intro','deduce-finish');deduceStage.classList.add('deduce-resolved');tone.removeAttribute('src');tone.dataset.status='idle';refreshDeduceSide();scheduleDeduceMarks();$('panel').classList.add('hidden');$('panel').dataset.visibilityTarget='hidden'}after()};
 if(presentationReduced()){setTimeout(finish,solved?solvedTiming.hold:180);return}
 if(solved){setTimeout(()=>{if(token===presentationGeneration)result.classList.add('result-out')},solvedTiming.reveal+solvedTiming.hold);setTimeout(finish,solvedTiming.reveal+solvedTiming.hold+solvedTiming.fade)}else setTimeout(finish,1550);
};
