'use strict';
// Logical 1920×1080 stage; notebook and the existing deduction panels keep their viewport layout.
const mangaStage=$('mangaStage');
mangaStage.appendChild($('commandWindows'));
$('scene').appendChild($('targets')); // Hotspots inherit both cover mapping and the panel rotation.
$('messageBody').appendChild($('nextMark'));
$('menuGraphic').src='assets/ui/manga/menu-note.png';
for(const layer of ['back','front']){const paper=document.createElement('div');paper.className='manga-sheet '+layer;mangaStage.insertBefore(paper,$('dialogue'))}
const arrow=document.createElementNS('http://www.w3.org/2000/svg','svg');arrow.id='mangaArrow';arrow.setAttribute('viewBox','0 0 1920 1080');arrow.innerHTML='<path d="" fill="none" stroke="#5087c4" stroke-width="2.5"/><path d="" fill="none" stroke="#5087c4" stroke-width="2.5"/>';mangaStage.appendChild(arrow);
// Grey placeholders only. Never generate or alter artwork when an asset is missing.
document.addEventListener('error',e=>{if(e.target.tagName==='IMG')e.target.classList.add('manga-missing')},true);
// Measure safe-area insets without drawing a visible element. Keep the landscape stage
// centred in the visual viewport and use symmetric margins for an asymmetric notch.
const mangaSafeArea=document.createElement('div');mangaSafeArea.id='mangaSafeArea';mangaSafeArea.setAttribute('aria-hidden','true');mangaSafeArea.style.cssText='position:fixed;left:0;top:0;width:0;height:0;visibility:hidden;pointer-events:none;padding:env(safe-area-inset-top, 0px) env(safe-area-inset-right, 0px) env(safe-area-inset-bottom, 0px) env(safe-area-inset-left, 0px)';document.body.appendChild(mangaSafeArea);
// One responsive manuscript, including the physical safe-area margins.
const paperGrid=document.createElementNS('http://www.w3.org/2000/svg','svg');paperGrid.id='paperGrid';paperGrid.setAttribute('aria-hidden','true');mangaStage.prepend(paperGrid);
function drawPaperGrid(width,height,left,top,scale){
 const W=width/scale,H=height/scale,L=-left/scale,T=-top/scale,R=L+W,B=T+H,cx=(L+R)/2,cy=(T+B)/2;
 paperGrid.style.cssText=`position:absolute;left:${L}px;top:${T}px;width:${W}px;height:${H}px;pointer-events:none;z-index:0`;paperGrid.setAttribute('viewBox',`${L} ${T} ${W} ${H}`);
 const a=[`<rect x="${L}" y="${T}" width="${W}" height="${H}" fill="#f7f5ee"/>`,`<rect x="${L+52}" y="${T+88}" width="${W-104}" height="${H-128}" fill="none" stroke="#96b9de" stroke-width="1"/>`,`<rect x="${L+52}" y="${T+8}" width="${W-104}" height="36" fill="none" stroke="#82aad6" stroke-width="1"/>`,`<path d="M${L+40} ${T+80}H${R-40} M${L+40} ${T+80}V${B-40} M${R-40} ${T+80}V${B-40} M${L+40} ${B-40}H${R-40}" stroke="#5087c4" fill="none"/>`];
 for(let n=Math.ceil((L+44-cx)/6);cx+n*6<R-44;n++){const px=cx+n*6,len=n%10===0?12:n%5===0?8:5;a.push(`<path d="M${px} ${T+80}v-${len}" stroke="#5087c4"/>`);if(n%10===0)a.push(`<text x="${px}" y="${T+63}" text-anchor="middle" font-size="15" fill="#5087c4">${Math.abs(n/10)}</text>`)}
 for(let n=Math.ceil((T+82-cy)/6);cy+n*6<B-40;n++){const py=cy+n*6,len=n%10===0?14:n%5===0?9:5;a.push(`<path d="M${L+40} ${py}h-${len} M${R-40} ${py}h${len}" stroke="#5087c4"/>`);if(n%10===0)a.push(`<text x="${L+13}" y="${py+5}" font-size="15" fill="#5087c4">${Math.abs(n/10)}</text><text x="${R-20}" y="${py+5}" font-size="15" fill="#5087c4">${Math.abs(n/10)}</text>`)}
 const usable=width/scale-2*left/scale;
 for(const xx of [usable/2-240,usable/2+50,usable-620,usable-260])a.push(`<path d="M${xx} ${T+8}v36" stroke="#82aad6" fill="none"/>`);
 for(const [label,px] of [['タイトル',62],['日付',width/(2*scale)-left/scale-230],['場所',width/(2*scale)-left/scale+60],['時間',width/scale-2*left/scale-610]])a.push(`<text x="${px}" y="${T+26}" font-size="13" fill="#5087c4">${label}</text>`);
 for(const [label,dx] of [['朝',-522],['昼',-450],['放課後',-378],['夜',-306]])a.push(`<text x="${width/scale-2*left/scale+dx}" y="${T+34}" font-size="19" fill="#8caacd">${label}</text>`);
 paperGrid.innerHTML=a.join('');
}
function fitManga(){
 const vv=window.visualViewport,w=vv?.width||innerWidth,h=vv?.height||innerHeight,x=vv?.offsetLeft||0,y=vv?.offsetTop||0,style=getComputedStyle(mangaSafeArea);
 const inset=side=>parseFloat(style.getPropertyValue('padding-'+side))||0;
 const horizontal=Math.max(0,inset('left')-x,inset('right')-(innerWidth-x-w));
 const top=Math.max(0,inset('top')-y),bottom=Math.max(0,inset('bottom')-(innerHeight-y-h));
 const safeWidth=Math.max(1,w-2*horizontal),safeHeight=Math.max(1,h-top-bottom),scale=Math.min(safeWidth/1920,safeHeight/1080),W=safeWidth/scale,H=safeHeight/scale,ex=Math.max(0,W-1920),ey=Math.max(0,H-1080);
 const width=1398+Math.min(ex,2.15*718-1398),height=718+Math.min(ey,Math.max(0,width/1.7-718)),sceneTop=73+(ey-(height-718))/2;
 for(const [name,value] of Object.entries({'--manga-scale':scale,'--layout-width':W+'px','--layout-height':H+'px','--extra-x':ex+'px','--extra-y':ey+'px','--half-extra-x':(ex/2)+'px','--half-grow':(Math.min(ex,180)/2)+'px','--scene-width':width+'px','--scene-height':height+'px','--scene-top':sceneTop+'px','--message-grow':Math.min(ex,180)+'px'}))mangaStage.style.setProperty(name,value);
 $('game').style.setProperty('--toast-x',(x+w/2)+'px');$('game').style.setProperty('--toast-bottom',(Math.max(0,innerHeight-y-h)+bottom+8)+'px');mangaStage.style.width=W+'px';mangaStage.style.height=H+'px';mangaStage.style.left=(x+horizontal+safeWidth/2)+'px';mangaStage.style.top=(y+top+safeHeight/2)+'px';arrow.setAttribute('viewBox',`0 0 ${W} ${H}`);drawPaperGrid(w,h,horizontal,top,scale);
 renderManga();fitCrowdedCommands();if(typeof positionDeductionPanel==='function')positionDeductionPanel();if(typeof scheduleDeduceMarks==='function')scheduleDeduceMarks();
}

let lastPortraitDay=null;
function renderManga(){
 const deducing=typeof deductionActive!=='undefined'&&deductionActive;
 const mailDialogue=typeof notebookOpen!=='undefined'&&notebookOpen&&state.mode==='dialogue';
 mangaStage.classList.toggle('mail-dialogue',mailDialogue);
 const content=$('monoLayer')||mangaStage;for(const id of ['dialogue','characterStage'])if($(id).parentElement!==content)content.appendChild($(id))
 mangaStage.classList.toggle('deducing',deducing);
 if(deducing&&$('panel').parentElement!==content)content.appendChild($('panel'));
 else if(!deducing&&mangaStage.contains($('panel')))$('game').appendChild($('panel'));
 const c=typeof calendar==='function'?calendar():{label:'放課後'},label=c.label;
 if(lastPortraitDay!==null&&c.day!==lastPortraitDay)resetRightCharacter();lastPortraitDay=c.day;
 const key=({'朝':'asa','昼':'hiru','放課後':'houkago','夕':'houkago','夜':'yoru'})[label]||'hiru';
 $('timeCircle').src='assets/ui/manga/time-circle-'+key+'.png';$('timeCircle').alt=label;
 $('timeCircle').style.left=`calc(${({asa:1348,hiru:1420,houkago:1492,yoru:1564})[key]}px + var(--extra-x))`;
 $('placeStamp').src='assets/ui/manga/stamp-place-'+state.room+'.png';$('placeStamp').alt=room().name;
 mangaStage.classList.toggle('commands-disabled',state.mode!=='exploration');
 if(state.mode==='exploration'){$('characterStage').classList.remove('hidden');if(!document.querySelector('#characterStage .active'))$('harukiCard').classList.add('active');for(const id of visibleCharacterIds())if(!blinkTimers.has(id)&&!(id==='nakako'&&wetTimer))scheduleBlink(id)}
 mangaStage.classList.toggle('has-dialogue',!$('dialogue').classList.contains('hidden'));
 const unread=(state.notebook?.received||[]).filter(id=>!state.notebook.read.includes(id)).length;
 $('menu').classList.toggle('has-mail',unread>0);
}
const commandStyles=[['s1','s2'],['s4','s3'],['s4','s3','s1'],['s1','s2'],['s1','s2','s3'],['s3','s1']];
const transforms=['rotate(-5deg) scale(.78,1)','rotate(4deg) translateY(-6px)','rotate(3deg) scale(1.12,.74)','rotate(-6deg) translateY(4px)'];
function selectCommandVisual(button){
 if(state.mode!=='exploration')return;
 for(const b of $('commandRoots').children)b.classList.toggle('on',b===button||b.dataset.command===commandSelection);
 updateCommandArrow();
}
function updateCommandArrow(){
 const selected=$('commandChildren').querySelector('.paper-selected'),command=$('commandRoots').querySelector('.on');
 if(!commandSelection||commandSelection==='chat'||!selected||!command||$('commandDetail').classList.contains('hidden')){arrow.classList.add('hidden');return}
 const stage=mangaStage.getBoundingClientRect(),scale=parseFloat(mangaStage.style.getPropertyValue('--manga-scale'))||1,from=command.getBoundingClientRect(),to=selected.getBoundingClientRect();
 const x1=(from.right-stage.left)/scale+8,y1=(from.top+from.height/2-stage.top)/scale,x2=(to.left-stage.left)/scale-12,y2=(to.top+to.height/2-stage.top)/scale;
 arrow.children[0].setAttribute('d',`M${x1} ${y1} C${x1+15} ${y1} ${x2-20} ${y2+20} ${x2} ${y2}`);
 arrow.children[1].setAttribute('d',`M${x2-9} ${y2+10} l10 -12 l4 15`);arrow.classList.remove('hidden');
}
function selectPaper(button){
 for(const b of $('commandChildren').children){b.classList.toggle('paper-selected',b===button);b.setAttribute('aria-current',b===button?'true':'false')}
 updateCommandArrow();
}
function decorateMangaChoices(){
 const buttons=[...$('dialogueChoices').querySelectorAll('button')];
 function select(button){for(const b of buttons){b.classList.toggle('choice-selected',b===button);b.setAttribute('aria-current',b===button?'true':'false')}}
 for(const [i,b] of buttons.entries()){b.style.setProperty('--choice-turn',[-1.8,1.3,-.7][i%3]+'deg');b.onmouseenter=()=>select(b);b.onfocus=()=>select(b)}
 if(buttons.length){select(buttons[0]);const lineHeight=parseFloat(getComputedStyle($('messageBody')).lineHeight),scale=parseFloat(mangaStage.style.getPropertyValue('--manga-scale'))||1,range=document.createRange();range.selectNodeContents($('line'));$('dialogueChoices').style.top=($('messageBody').offsetTop+Math.max(lineHeight,range.getBoundingClientRect().height/scale)+16)+'px'}
}
// Compact only a list that would run below the stage; the heading and list anchor stay fixed.
function fitCrowdedCommands(){
 const box=$('commandChildren'),detail=$('commandDetail');if(!box||!detail)return;
 box.classList.remove('fit-crowded','fit-compact');box.style.removeProperty('--many-row-max');
 for(const b of box.children){b.classList.remove('fit-wide','fit-wider');b.style.removeProperty('translate')}
 const fitRight=()=>{const edge=mangaStage.getBoundingClientRect().right,scale=parseFloat(mangaStage.style.getPropertyValue('--manga-scale'))||1;for(const b of box.children){const excess=b.getBoundingClientRect().right-edge;if(excess>0)b.style.translate=(-(excess+1)/scale)+'px 0'}updateCommandArrow()};
 if(!matchMedia('(orientation: landscape)').matches||detail.classList.contains('hidden'))return;
 if(!box.classList.contains('many-targets')){fitRight();return}
 const bottom=()=>detail.offsetTop+box.offsetTop+box.offsetHeight-(box.classList.contains('fit-crowded')?8:0);
 if(bottom()<=1078+parseFloat(mangaStage.style.getPropertyValue('--extra-y'))){fitRight();return}
 box.classList.add('fit-crowded');for(const b of box.children){if(b.classList.contains('command-back'))continue;const length=Array.from(b.dataset.itemLabel||b.textContent).length;if(length>=11)b.classList.add('fit-wider');else if(length>=8)b.classList.add('fit-wide')}
 if(bottom()>1078+parseFloat(mangaStage.style.getPropertyValue('--extra-y'))){box.classList.add('fit-compact');for(let height=140;height>=45;height-=2){box.style.setProperty('--many-row-max',height+'px');if(bottom()<=1078+parseFloat(mangaStage.style.getPropertyValue('--extra-y')))break}}
 fitRight();
}
function decorateMangaCommands(enter=false){
 $('commandTitle').textContent='捜査';$('commandHeading').textContent=commandSelection==='investigate'?'調べる先':({move:'移動先',listen:'聞く相手',search:'探す人',show:'見せるもの',showRecipient:'見せる相手'})[commandSelection]||'';
 for(const [i,b] of [...$('commandRoots').children].entries()){
  if(!b.dataset.collage){const text=b.textContent;b.setAttribute('aria-label',text);b.replaceChildren();[...text].forEach((char,j)=>{const cut=document.createElement('b');cut.className=commandStyles[i][j]||'s3';cut.textContent=char;cut.style.transform=transforms[(i+j)%transforms.length];b.appendChild(cut)});b.dataset.collage='true'}
  b.classList.toggle('on',b.classList.contains('active'));b.onmouseenter=()=>selectCommandVisual(b);b.onmouseleave=()=>{for(const root of $('commandRoots').children)root.classList.toggle('on',root.dataset.command===commandSelection)};b.onfocus=()=>selectCommandVisual(b);b.onblur=()=>{for(const root of $('commandRoots').children)root.classList.toggle('on',root.dataset.command===commandSelection)};
 }
 arrow.classList.add('hidden');
 for(const [i,b] of [...$('commandChildren').children].entries()){
  b.style.setProperty('--entry-delay',((i+1)*80)+'ms');
  b.style.setProperty('--paper-turn',[-3,2,4,-4,2,-2,3,0][i%8]+'deg');
  b.style.setProperty('--paper-shift',[15,25,0,22,7,18,0,12][i%8]+'px');
  if(b.tagName!=='BUTTON')continue;
  const done=!!((b.dataset.target&&hasSeenInvestigation(b.dataset.target,b.dataset.itemLabel))||(b.dataset.listenKey&&state.listened?.[b.dataset.listenKey]?.includes(Number(b.dataset.listenIndex))));
  const existing=b.querySelector('.examined-check');
  if(!done&&existing){existing.remove();delete b.dataset.examined}
  if(done&&!existing){const mark=document.createElement('img');mark.src='assets/ui/manga/check-'+(i%2?'a':'b')+'.png';mark.alt='調べた';mark.className='examined-check';b.appendChild(mark);b.dataset.examined='true'}
  b.onmouseenter=()=>selectPaper(b);b.onfocus=()=>selectPaper(b);
 }
 const selected=$('commandChildren').querySelector('.paper-selected');if(selected&&commandSelection)selectPaper(selected);
 if(enter&&state.mode==='exploration'){const detail=$('commandDetail');detail.classList.remove('list-enter');detail.getBoundingClientRect();detail.classList.add('list-enter');detail.dataset.listGeneration=String(Number(detail.dataset.listGeneration||0)+1)}
 fitCrowdedCommands();$('commandChildren').onscroll=updateCommandArrow;
}
function commandKeyNavigation(e){
 if(state.mode!=='exploration'||!['ArrowDown','ArrowUp','ArrowLeft','ArrowRight'].includes(e.key))return;
 const details=e.target.closest?.('#commandChildren'),box=details?$('commandChildren'):$('commandRoots'),buttons=[...box.querySelectorAll('button')];
 if(!buttons.length)return;e.preventDefault();let i=buttons.indexOf(document.activeElement);i=(i+(e.key==='ArrowUp'||e.key==='ArrowLeft'?-1:1)+buttons.length)%buttons.length;buttons[i].focus();
}
let commandPointer=null;

document.addEventListener('keydown',commandKeyNavigation);window.addEventListener('resize',fitManga);window.addEventListener('orientationchange',fitManga);window.visualViewport?.addEventListener('resize',fitManga);window.visualViewport?.addEventListener('scroll',fitManga);
fitManga();render();
