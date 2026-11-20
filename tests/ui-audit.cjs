// サイカチADV UI検査：全画面 × 複数サイズで、はみ出し・重なり・文字サイズ・コントラスト・タップ領域・書体・エラーを記録
// 使い方：ADV4フォルダをHTTP配信（例 npx http-server -p 8777）してから
//   node tests/ui-audit.cjs            → design/ui-audit/ に画面と report.json / summary.txt
//   ADV_URL=… CHROME_PATH=… OUT=… で環境を指定
const {chromium}=require('playwright');
const fs=require('fs'),path=require('path');
const OUT=process.env.OUT||path.resolve(__dirname,'../design/ui-audit');fs.mkdirSync(OUT,{recursive:true});
const URL=process.env.ADV_URL||'http://127.0.0.1:8777/';
const VIEWPORTS=[[1920,1080,'PC-FHD'],[1280,720,'PC-HD'],[1024,768,'PC-4:3'],[768,1024,'Tab-縦'],[844,390,'Phone-横'],[667,375,'SE-横'],[390,844,'Phone-縦'],[375,667,'SE-縦'],[360,640,'Android小-縦']].filter(([w,h])=>!process.env.SIZES||process.env.SIZES.split(',').includes(w+'x'+h));

const MEASURE=()=>{
 const vw=innerWidth,vh=innerHeight,out={offscreen:[],clipped:[],small:[],tap:[],obscured:[],contrast:[],dialogue:[],approved:[],texts:0};
 const visible=e=>{const s=getComputedStyle(e);if(s.display==='none'||s.visibility==='hidden'||+s.opacity===0)return false;const r=e.getBoundingClientRect();if(r.width<1||r.height<1)return false;let p=e;while(p){const ps=getComputedStyle(p);if(+ps.opacity===0||ps.visibility==='hidden'||ps.display==='none')return false;p=p.parentElement}return true};
 const label=e=>{let s=e.tagName.toLowerCase();if(e.id)s+='#'+e.id;else if(e.className&&typeof e.className==='string')s+='.'+e.className.trim().split(/\s+/).slice(0,2).join('.');const t=(e.innerText||e.getAttribute('aria-label')||'').trim().replace(/\s+/g,' ').slice(0,24);return s+(t?' 「'+t+'」':'')};
 const parse=c=>{const m=c.match(/rgba?\(([^)]+)\)/);if(!m)return null;const v=m[1].split(/[ ,/]+/).filter(Boolean).map(Number);return {r:v[0],g:v[1],b:v[2],a:v.length>3?v[3]:1}};
 const lum=c=>{const f=x=>{x/=255;return x<=.03928?x/12.92:Math.pow((x+.055)/1.055,2.4)};return .2126*f(c.r)+.7152*f(c.g)+.0722*f(c.b)};
 const ratio=(a,b)=>{const x=lum(a),y=lum(b);return (Math.max(x,y)+.05)/(Math.min(x,y)+.05)};
 const bgOf=e=>{let layers=[];let p=e;while(p){if(p.id==='nbBook'){layers.push({r:251,g:250,b:243,a:1});break}if(p.id==='notebook'&&!e.closest('#nbBook'))return {image:true,layers};const s=getComputedStyle(p);const c=parse(s.backgroundColor);if(s.backgroundImage&&s.backgroundImage!=='none'&&!/gradient\(#8c785a21|linear-gradient\(rgba\(140, 120, 90/.test(s.backgroundImage)&&!(c&&c.a>=.98))return {image:true,layers};if(c&&c.a>0){layers.push(c);if(c.a>=.98)break}p=p.parentElement}
  let base={r:0,g:0,b:0};for(let i=layers.length-1;i>=0;i--){const l=layers[i];base={r:l.r*l.a+base.r*(1-l.a),g:l.g*l.a+base.g*(1-l.a),b:l.b*l.a+base.b*(1-l.a)}}return {color:base,partial:!layers.length||layers[layers.length-1].a<.98}};
 const deferred=e=>{const r=e.getBoundingClientRect();for(let p=e.parentElement;p&&p.id!=='game';p=p.parentElement){const s=getComputedStyle(p),b=p.getBoundingClientRect();if(/auto|scroll/.test(s.overflow+s.overflowX+s.overflowY)&&(r.bottom>b.bottom+1||r.top<b.top-1||r.left<b.left-1||r.right>b.right+1))return true}return false};
 const all=[...document.querySelectorAll('body *')].filter(visible);
 document.querySelectorAll('[data-audit-font]').forEach(e=>e.removeAttribute('data-audit-font'));

 for(const e of all){
  const r=e.getBoundingClientRect(),s=getComputedStyle(e);
  const ownText=[...e.childNodes].some(n=>n.nodeType===3&&n.textContent.trim());
  if(ownText)e.dataset.auditFont='1';
  if(ownText&&!(e.querySelector&&e.querySelector('img')&&parseFloat(s.fontSize)===0)){out.texts++;
   const stage=e.closest('#mangaStage,#notebookStage'),stageScale=stage?parseFloat(stage.style.getPropertyValue(stage.id==='notebookStage'?'--nb-scale':'--manga-scale'))||1:1;const fs=parseFloat(s.fontSize)*stageScale;if(fs<12){const item=label(e)+' '+fs.toFixed(1)+'px'+(e.closest('.nb-phone')?'（PHS本体・装飾）':'');if(e.closest('#nbBook .head,#nbBook .rn,#nbBook .legend,#nbBook .new,#nbBook .newmark'))out.approved.push('見本指定の副次情報 '+item);else out.small.push(item)}
   if(!deferred(e)&&(r.right>vw+1||r.left<-1||r.bottom>vh+1||r.top<-1)){if(!e.closest('[class*=nb-chart]'))out.offscreen.push(label(e)+` [${r.left|0},${r.top|0},${r.right|0},${r.bottom|0}]`)}
   const fg=parse(s.color);const bg=bgOf(e);
   if(fg&&bg.color&&!bg.image){const cr=ratio(fg,bg.color);const big=fs>=24||(fs>=18.66&&+s.fontWeight>=700);if(cr<(big?3:4.5)){const item=label(e)+' '+cr.toFixed(2)+(bg.partial?'（半透明背景）':'');if(e.closest('#nbBook .head,#nbBook svg.dirt,#nbBook .face .ph,#nbBook .slot.empty'))out.approved.push('見本指定の淡い装飾 '+item);else out.contrast.push(item)}}
   else if(bg.image) e.dataset.auditImgbg='1';
  }
  const ov=s.overflow+s.overflowX+s.overflowY;
  if(/hidden|clip/.test(ov)&&!/auto|scroll/.test(ov)&&(e.scrollWidth>e.clientWidth+2||e.scrollHeight>e.clientHeight+2)&&(e.innerText||'').trim()&&!['HTML','BODY'].includes(e.tagName)&&e.id!=='game'&&e.id!=='scene'&&e.id!=='mangaStage')out.clipped.push(label(e)+` 中身${e.scrollWidth}x${e.scrollHeight} > 枠${e.clientWidth}x${e.clientHeight}`);
  if(s.textOverflow==='ellipsis'&&s.overflowX!=='visible'&&e.scrollWidth>e.clientWidth+1)out.clipped.push(label(e)+' 省略記号で切れ');
  if(e.matches('button,[role=button],a[href]')&&!e.closest('.nb-phone')){
   if(r.height<36||r.width<36)out.tap.push(label(e)+` ${r.width|0}x${r.height|0}`);
   const cx=Math.min(vw-1,Math.max(0,r.left+r.width/2)),cy=Math.min(vh-1,Math.max(0,r.top+r.height/2));const top=document.elementFromPoint(cx,cy);
   if(!deferred(e)&&top&&top!==e&&!e.contains(top)&&!top.contains(e)&&getComputedStyle(e).pointerEvents!=='none')out.obscured.push(label(e)+' ← '+label(top));
  }
 }
 // Inline spans have no useful clientHeight. Inspect the rendered text fragments instead.
 const line=document.getElementById('line'),body=document.getElementById('messageBody');
 if(line&&body&&visible(line)&&line.textContent.trim()){
  const r=body.getBoundingClientRect(),style=getComputedStyle(line),font=parseFloat(style.fontSize),range=document.createRange();range.selectNodeContents(line);
  const fragments=[...range.getClientRects()].filter(v=>v.width>.5&&v.height>.5);
  if(body.clientWidth<font*12)out.dialogue.push('本文が極端に細い列: '+body.clientWidth+'px / '+font+'px');
  if(body.scrollHeight>body.clientHeight+2||body.scrollWidth>body.clientWidth+2)out.dialogue.push('本文領域を超える内容: '+body.scrollWidth+'x'+body.scrollHeight+' > '+body.clientWidth+'x'+body.clientHeight);
  for(const f of fragments){if(f.left<r.left-2||f.right>r.right+2||f.top<r.top-2||f.bottom>r.bottom+2){out.dialogue.push('本文の描画範囲が枠を超える');break}}
  for(let parent=body.parentElement;parent&&parent.id!=='game';parent=parent.parentElement){const ps=getComputedStyle(parent);if(/hidden|clip/.test(ps.overflow+ps.overflowX+ps.overflowY)){const pr=parent.getBoundingClientRect();if(fragments.some(f=>f.left<pr.left-2||f.right>pr.right+2||f.top<pr.top-2||f.bottom>pr.bottom+2)){out.dialogue.push('親要素で本文が切れる: '+parent.id);break}}}
 }
 out.graphics={resolution:ASSETS.resolution,portraits:['haruki','saiji'].map(id=>{const art=document.getElementById(id+'Art'),talk=document.getElementById(id+'Talk');return{id,visible:visible(art),heightRatio:art.getBoundingClientRect().height/vh,imageRendering:getComputedStyle(art).imageRendering,mouthCanvas:[talk.width,talk.height]}})};
 return out;
};

module.exports={MEASURE};
if(require.main===module)(async()=>{
 const browser=await chromium.launch({...(process.env.CHROME_PATH?{executablePath:process.env.CHROME_PATH}:{}),headless:true});
 const report={};
 for(const [w,h,name] of VIEWPORTS){
  const mobile=w<900||h<500;
  const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:mobile,isMobile:mobile&&w<h,reducedMotion:'reduce'});
  const page=await ctx.newPage();const errs=[],bad=[];
  page.on('pageerror',e=>errs.push(e.message));page.on('console',m=>{if(m.type()==='error')errs.push('console: '+m.text())});
  page.on('response',r=>{if(r.status()>=400)bad.push(r.status()+' '+r.url().replace(URL,''))});
  await page.goto(URL);await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(400);
  const cdp=await ctx.newCDPSession(page);await cdp.send('DOM.enable');await cdp.send('CSS.enable');
  const vp=`${w}x${h}`;report[vp]={name,states:{},errors:errs,http:bad};
  // 同一の文字・書体・太さの測定結果は、このロード済みページ内で再利用する。
  const fontCache=new Map();
  const fontsCheck=async()=>{
   const keys=await page.$$eval('[data-audit-font]',els=>els.map(e=>{const s=getComputedStyle(e);return [...e.childNodes].filter(n=>n.nodeType===3).map(n=>n.textContent).join('')+'|'+s.fontFamily+'|'+s.fontWeight}));
   const {root}=await cdp.send('DOM.getDocument',{depth:-1}),{nodeIds}=await cdp.send('DOM.querySelectorAll',{nodeId:root.nodeId,selector:'[data-audit-font]'}),sys=new Set();
   for(let i=0;i<nodeIds.length;i++){
    const key=keys[i];let families=fontCache.get(key);
    if(!families){try{const {fonts}=await cdp.send('CSS.getPlatformFontsForNode',{nodeId:nodeIds[i]});families=fonts.filter(f=>!f.isCustomFont&&f.glyphCount>0).map(f=>f.familyName);fontCache.set(key,families)}catch(e){families=[]}}
    for(const family of families)sys.add(family);
   }return [...sys];
  };
  const snap=async(id,title)=>{await page.waitForTimeout(250);const m=await page.evaluate(MEASURE);m.systemFonts=await fontsCheck();m.title=title;
   const file=`${vp}-${id}.png`;await page.screenshot({path:path.join(OUT,file)});m.file=file;report[vp].states[id]=m};
  const ev=(f,arg)=>page.evaluate(f,arg);
  const drain=()=>ev(()=>{for(let i=0;i<400&&state.mode==='dialogue'&&!choicesPending;i++)advance()});
  await ev(()=>{textSettings.index=3});
  await snap('01-title','タイトル');
  await ev(()=>openingLoad());await snap('02-load','途中から（タイトル）');
  await ev(()=>{showTitle();startNewGame()});await snap('03-opening','オープニング');
  await ev(()=>{for(let i=0;i<30&&state.mode==='opening';i++)advanceOpening()});await page.waitForTimeout(700);await snap('04-dialogue','会話（最初）');
  await drain();await snap('05-choices','会話の選択肢');
  // 選択肢を選び探索へ
  for(let k=0;k<8&&await ev(()=>state.mode!=='exploration');k++){await ev(()=>{const b=document.querySelector('#dialogueChoices button');if(b)b.click()});await drain();await page.waitForTimeout(150)}
  await snap('06-explore','探索：コマンド');
  const roots=await ev(()=>[...document.querySelectorAll('#commandRoots button')].map(b=>b.textContent.trim()));
  for(const [i,label] of roots.entries()){
   await ev(i=>{const b=document.querySelectorAll('#commandRoots button')[i];b&&b.click()},i);await snap('07-cmd-'+(i+1),'コマンド：'+label);
   await drain();await ev(()=>{commandSelection=null;state.mode='exploration';closeDialogueLayer();render()});
  }
  // 調べる → 作品棚（手がかり画像つきの会話）
  await ev(()=>{examine('shelf')});await page.waitForTimeout(300);await snap('08-examine','調べる：作品棚');
  for(let i=0;i<6;i++){const has=await ev(()=>!document.getElementById('itemGraphic').classList.contains('hidden'));if(has)break;await ev(()=>advance());await ev(()=>advance());}
  await snap('09-item','手がかり画像');
  await drain();
  // 最長の台詞
  await ev(()=>say([['ハルキ','ナカコから聞いたんだけど、その時オカボーが変なこと言ってたんだ。オカボーのスケッチブックの表紙に変な単語が殴り書きしてあってナカコが「それどういう意味？」って聞いたら「創造の後には破壊がセット」なんだぜって言ってたって。オカボーたまに意味わかんないこと言う奴だよな。','通常']]));await snap('10-longline','長い台詞（1ページ目）');
  await drain();
  // メール通知
  await ev(()=>{state.mode='exploration';render();runEvent({set:{sketchFound:true},lines:[['','テスト','通常']]})});await drain();await page.waitForTimeout(300);await snap('11-toast','メール通知');
  await page.waitForTimeout(2700);
  // 手帳
  await ev(()=>{if(typeof closeNotebook==='function'&&notebookOpen)closeNotebook();state.inventory=['ナカコのスケッチブック','オカボーのスケッチブック'];Object.assign(state.flags,{sketchFound:true,layoutChecked:true,dutyChecked:true});state.mode='exploration';render();menu()});
  for(const [k,sec] of [['12','items'],['13','memo'],['14','relations'],['16','mail'],['18','save'],['19','load'],['20','help']]){
   await page.evaluate(s=>{if(!notebookOpen){state.mode='exploration';closeDialogueLayer();render();menu()}notebookSpecial=null;selectNotebook(s)},sec);await snap(k+'-nb-'+sec,'手帳：'+sec);
   if(sec==='relations'){await ev(()=>enterNotebookSection());await snap('15-nb-relations-open','手帳：相関図（開く）');await ev(()=>{notebookSpecial=null;selectNotebook('relations')})}
   if(sec==='mail'){await ev(()=>showNotebookMail('mail-nakako-01'));await snap('17-nb-mail-open','手帳：メール本文');}
   if(sec==='save'){await ev(()=>{notebookSlot=1;selectSaveSlot('save',1)});await snap('18b-nb-saved','手帳：セーブ完了');await ev(()=>{selectNotebook('save');notebookSlot=1;selectSaveSlot('save',1)});await snap('18c-nb-overwrite','手帳：上書き確認');}
  }
  await ev(()=>closeNotebook());
  // 推理
  await ev(()=>{state.flags.okaboChecked=true;state.mode='exploration';render();startDeduction()});await page.waitForTimeout(400);await snap('21-q1','推理：問1');
  await ev(()=>{document.querySelectorAll('#panelBody .deduction-choice')[0]?.click()});await page.waitForTimeout(200);
  const correct=await ev(()=>questions[0].correct);
  if(correct===0)await ev(()=>{document.querySelectorAll('#panelBody .deduction-choice')[1]?.click()});
  await ev(()=>{const q=questions[state.deductionStep];const bs=document.querySelectorAll('#panelBody .deduction-choice');const wrong=[...bs].findIndex((b,i)=>i!==q.correct);bs[wrong]?.click()});
  await snap('22-wrong-hint','推理：2回まちがえてヒント');
  for(let step=0;step<4;step++){
   await ev(()=>{const q=questions[state.deductionStep];document.querySelectorAll('#panelBody .deduction-choice')[q.correct]?.click()});await page.waitForTimeout(200);
   await ev(()=>{for(let i=0;i<60&&state.mode==='dialogue';i++)advance()});await page.waitForTimeout(300);
   if(step<3)await snap('23-q'+(step+2),'推理：問'+(step+2));
  }
  await snap('24-q5','推理：問5（組み立て）');
  await ev(()=>{const q=questions[4];const slots=document.querySelectorAll('.answer-slot');for(let i=0;i<3;i++){slots[i].click();const want=q.groups[i].opts[q.groups[i].correct];[...document.querySelectorAll('.answer-option')].find(b=>b.textContent===want)?.click()}});
  await snap('25-q5-filled','推理：問5（3つ選んだ状態）');
  await ev(()=>document.querySelector('.answer-confirm')?.click());await page.waitForTimeout(300);
  await ev(()=>{for(let i=0;i<60&&state.mode==='dialogue';i++)advance()});await page.waitForTimeout(500);
  await snap('26-ending','終わり');
  await ctx.close();
  console.log(vp,'done',Object.keys(report[vp].states).length,'states; errors',errs.length,'http',bad.length);
 }
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,1));
 const cats={dialogue:'会話本文の細い列・描画範囲・切れ',offscreen:'画面外にはみ出す文字',clipped:'枠で切れる文字',small:'12px未満の文字',tap:'36px未満のボタン',obscured:'他の要素に隠れるボタン',contrast:'コントラスト不足',systemFonts:'同梱外の書体で描画',approved:'作者見本の副次情報・装飾（記録のみ）'};
 const lines=[];for(const [c,label] of Object.entries(cats)){const m=new Map();for(const [vp,d] of Object.entries(report))for(const [sid,st] of Object.entries(d.states))for(const it of st[c]){const k=it.split(' [')[0].split(' 中身')[0];if(!m.has(k))m.set(k,new Set());m.get(k).add(vp+':'+sid)}
  lines.push(`■ ${label}：${m.size}件`);for(const [k,v] of [...m].sort((a,b)=>b[1].size-a[1].size))lines.push(`  ${k}  …${[...new Set([...v].map(x=>x.split(':')[0]))].join(', ')}`)}
 for(const [vp,d] of Object.entries(report))if(d.errors.length||d.http.length)lines.push(`■ エラー ${vp}: ${[...d.errors,...d.http].join(' / ')}`);
 fs.writeFileSync(path.join(OUT,'summary.txt'),lines.join('\n')+'\n');console.log(lines.join('\n'));
 await browser.close();
 const violations=Object.values(report).some(v=>v.errors.length||v.http.length||Object.values(v.states).some(st=>['dialogue','offscreen','clipped','tap','obscured','contrast','systemFonts'].some(k=>st[k].length)||st.small.some(s=>!s.includes('PHS本体・装飾'))));
 if(violations)process.exitCode=1;
})().catch(e=>{console.error(e);process.exit(1)});
