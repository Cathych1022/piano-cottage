'use strict';
const el=id=>document.getElementById(id), FIVE_SECONDS=5000;
let ctx=null,analyser=null,stream=null,raf=null,listen=false,active=false,lastSound=0,lastTick=0,totalSession=0,sensitivity=3;
let waveform=new Float32Array(4096),spectrum=new Float32Array(2048),lastNoteTime=0,previousPitch=-1,previousLevel=0;
const dbKey='storybook-piano-practice-v1',dayKey=()=>new Date().toLocaleDateString('en-CA');
const save=()=>{try{localStorage.setItem(dbKey,JSON.stringify(history))}catch{}};
let history={};try{history=JSON.parse(localStorage.getItem(dbKey)||'{}')||{}}catch{}
function format(ms){let s=Math.floor(ms/1000);return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0')).join(':')}
function short(ms){let m=Math.floor(ms/60000);return m>=60?`${Math.floor(m/60)}时${m%60}分`:`${m} 分钟`}
function updateStats(){el('timer').textContent=format(totalSession);el('today').textContent=short(history[dayKey()]||0);let sum=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);sum+=history[d.toLocaleDateString('en-CA')]||0;}el('week').textContent=short(sum)}
function setState(kind,info){const st=el('status');st.className='status '+(kind==='active'?'active':kind==='paused'?'paused':'');st.textContent=kind==='active'?'♫ 正在练习':kind==='paused'?'Ⅱ 已暂停':'♪ 等待钢琴声音';el('hint').textContent=info;el('wave').classList.toggle('live',kind==='active')}
for(let i=0;i<17;i++){let b=document.createElement('i');b.style.setProperty('--h',`${9+Math.round(Math.abs(8-i)*1.6)}px`);b.style.setProperty('--delay',`${i*.05}s`);el('wave').append(b)}
function evaluatePiano(){analyser.getFloatTimeDomainData(waveform);analyser.getFloatFrequencyData(spectrum);let energy=0;for(let i=0;i<waveform.length;i++)energy+=waveform[i]*waveform[i];const rms=Math.sqrt(energy/waveform.length);const threshold=[.012,.008,.005,.003,.0018][sensitivity-1];if(rms<threshold)return false;
// Piano-note candidate: a local narrow spectral peak between A0 and C8, accompanied by harmonics.
const hzPerBin=ctx.sampleRate/analyser.fftSize,minBin=Math.ceil(27.5/hzPerBin),maxBin=Math.min(spectrum.length-2,Math.floor(4186/hzPerBin));let best=-Infinity,peak=-1;
for(let i=minBin;i<=maxBin;i++){const val=spectrum[i];if(val>best&&val>spectrum[i-1]+1&&val>spectrum[i+1]+1){best=val;peak=i}}
if(peak<0||best<[-42,-49,-56,-63,-69][sensitivity-1])return false;
const pitch=peak*hzPerBin;let harmonic=0;for(let h=2;h<=5;h++){const idx=Math.round(peak*h);if(idx>=spectrum.length)break;const max=Math.max(...Array.from(spectrum.slice(Math.max(0,idx-2),Math.min(spectrum.length,idx+3))));if(max>best-30)harmonic++}
let nearby=0;for(let i=Math.max(minBin,peak-8);i<=Math.min(maxBin,peak+8);i++)if(spectrum[i]>best-12)nearby++;
const tonal=nearby<15, noteChange=previousPitch>0&&Math.abs(Math.log2(pitch/previousPitch))*12>.55;
const attack=rms>previousLevel*1.45;
previousPitch=pitch;previousLevel=rms;
return tonal&&(harmonic>=1||noteChange||attack)&&(pitch<3000);
}
function tick(t){if(!listen)return;const detected=evaluatePiano();if(detected){lastSound=t;if(!active){active=true;setState('active','听到琴声啦！今天也要开心练琴 ♪')}}
if(active){let dt=Math.min(200,Math.max(0,t-lastTick));if(!lastTick)dt=0;if(t-lastSound>FIVE_SECONDS){active=false;setState('paused','连续 5 秒没有检测到钢琴声，自动暂停');el('countdown').textContent='重新弹奏即可自动继续计时'}else{totalSession+=dt;const key=dayKey();history[key]=(history[key]||0)+dt;el('countdown').textContent=detected?'正在累计练习时间':`还剩 ${Math.max(0,(FIVE_SECONDS-(t-lastSound))/1000).toFixed(1)} 秒暂停`}}
lastTick=t;updateStats();if(Math.floor(t/1000)!==Math.floor((t-17)/1000))save();raf=requestAnimationFrame(tick)}
async function start(){try{if(!navigator.mediaDevices?.getUserMedia)throw new Error('需要 HTTPS 安全页面才能访问麦克风');stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});ctx=new (window.AudioContext||window.webkitAudioContext)();await ctx.resume();analyser=ctx.createAnalyser();analyser.fftSize=4096;analyser.smoothingTimeConstant=.35;ctx.createMediaStreamSource(stream).connect(analyser);listen=true;active=false;lastTick=0;lastSound=0;previousPitch=-1;previousLevel=0;el('start').textContent='■ 停止监听';setState('idle','正在监听，弹奏钢琴后自动开始');el('message').textContent='';raf=requestAnimationFrame(tick)}catch(e){el('message').textContent=`无法启动：${e.message||e}`;await stop()}}
async function stop(){listen=false;active=false;cancelAnimationFrame(raf);stream?.getTracks().forEach(x=>x.stop());stream=null;if(ctx){await ctx.close().catch(()=>{});ctx=null}save();el('start').textContent='🎹 开始监听';setState('idle','监听已关闭，点击按钮重新开始');el('countdown').textContent='连续停顿超过 5 秒后自动暂停'}
el('start').onclick=()=>listen?stop():start();el('reset').onclick=()=>{if(confirm('重置本次累计时间？今日练习记录不会清除。')){totalSession=0;updateStats()}};
el('settings').onclick=()=>el('settingsDialog').showModal();el('closeSettings').onclick=()=>el('settingsDialog').close();el('sensitivity').oninput=e=>{sensitivity=Number(e.target.value);el('sensitivityText').textContent=['最低','较低','中等','较高','最高'][sensitivity-1]};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&listen){el('message').textContent='iPhone 切换后台或锁屏时可能中断监听，请保持页面前台显示';}});
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
updateStats();
