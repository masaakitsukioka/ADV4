'use strict';
// All expensive image work runs off the UI thread, once per place/time/cache key.
function smooth(a,b,x){const t=Math.max(0,Math.min(1,(x-a)/(b-a)));return t*t*(3-2*t)}
function color(hex){return [1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)/255)}
function canvas(w,h){return new OffscreenCanvas(w,h)}
function blurred(source,r){const out=canvas(source.width,source.height),ctx=out.getContext('2d');ctx.filter=`blur(${r}px)`;ctx.drawImage(source,0,0);return out}
function field(source){const d=source.getContext('2d').getImageData(0,0,source.width,source.height).data;return Float32Array.from({length:d.length/4},(_,i)=>d[i*4]/255)}
async function calculateLighting(base,mask,t,p){
 const W=base.width,H=base.height,out=canvas(W,H),ctx=out.getContext('2d',{willReadFrequently:true});ctx.drawImage(base,0,0);
 const original=ctx.getImageData(0,0,W,H),pixels=original.data,Y=new Float32Array(W*H),winCanvas=canvas(W,H),wc=winCanvas.getContext('2d',{willReadFrequently:true});
 if(mask)wc.drawImage(mask,0,0,W,H);const winPixels=wc.getImageData(0,0,W,H),win=winPixels.data;
 for(let i=0;i<Y.length;i++){const j=i*4;Y[i]=(.299*pixels[j]+.587*pixels[j+1]+.114*pixels[j+2])/255;const value=i/W>p.ymax*H?0:mask?win[j]/255:smooth(.78,.95,Y[i]);win[j]=win[j+1]=win[j+2]=value*255;win[j+3]=255}wc.putImageData(winPixels,0,0);
 const rayCanvas=canvas(W,H),rc=rayCanvas.getContext('2d');rc.fillStyle='#000';rc.fillRect(0,0,W,H);rc.globalCompositeOperation='lighter';let sum=0;for(let i=0;i<48;i++)sum+=.97**i;
 for(let i=0;i<48;i++){const s=1-t.length*i/48;rc.globalAlpha=(.97**i)/sum;rc.drawImage(winCanvas,p.src[0]*(1-1/s),p.src[1]*(1-1/s),W/s,H/s)}
 // Clamp ×3 before the small blur, as specified.
 let rd=rc.getImageData(0,0,W,H);for(let i=0;i<rd.data.length;i+=4)rd.data[i]=rd.data[i+1]=rd.data[i+2]=Math.min(255,rd.data[i]*3);rc.putImageData(rd,0,0);
 const R=field(blurred(rayCanvas,3*W/1920)),G=field(blurred(winCanvas,W/40)),C=color(t.color),TC=color(t.tc),WC=color(t.wc);
 for(let i=0;i<Y.length;i++){const x=i%W,y=Math.floor(i/W),d=Math.hypot(x-p.src[0],y-p.src[1])/W;
  const P=(y>p.ymax*H?smooth(.50,.85,Y[i]):0)*Math.exp(-((d/.9)**2));
  const Wa=Math.exp(-((d/(t.washR*p.reach))**2))*smooth(.15,.70,Y[i]);
  const L=Math.max(0,Math.min(1,R[i]*t.ray*p.rayk+G[i]*t.glow+P*t.patch+Wa*t.wash));
  for(let c=0;c<3;c++){const j=i*4+c,raw=pixels[j]/255;let v=raw*t.dark;
   if(t.dark<1){const weight=win[i*4]/255;v=v*(1-weight)+raw*t.win*WC[c]*weight}
   if(t.tint)v=v*(1-L*t.tint)+v*TC[c]*L*t.tint;
   pixels[j]=(1-(1-v)*(1-L*C[c]))*255;
  }
 }ctx.putImageData(original,0,0);return out.transferToImageBitmap();
}
self.onmessage=async({data})=>{try{const result=await calculateLighting(data.base,data.mask,data.time,data.place);self.postMessage({key:data.key,result},[result])}catch(e){self.postMessage({key:data.key,error:String(e)})}finally{data.base?.close();data.mask?.close()}};
