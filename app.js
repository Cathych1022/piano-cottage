'use strict';
const el=id=>document.getElementById(id);
const FIVE_SECONDS=5000;
let ctx=null, analyser=null, stream=null, raf=0, listening=false, active=false;
let lastSound=0,lastTick=0,totalSession=0,sensitivity=3, consecutive=0;
let waveform=new Float32Array(2048), spectrum=new Float32Array(1024);
const dbKey='storybook-piano-practice-v1';
const dayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
let history={};try{history=JSON.parse(localStorage.getItem(dbKey)||'{}')||{}}catch{}
function save(){try{localStorage.setItem(dbKey,JSON.stringify(history))}catch{}}
function format(ms){const s=Math.floor(ms/1000);return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0')).join(':')}
function short(ms){const m=Math.floor(ms/60000);return m>=60?`${Math.floor(m/60)}时${m%60}分`:`${m} 分钟`}
function updateStats(){el('timer').textContent=format(totalSession);el('today').textContent=short(history[dayKey()]||0);let sum=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;sum+=history[k]||0}el('week').textContent=short(sum)}
function setState(kind,info){const st=el('status');st.className='status '+(kind==='active'?'active':kind==='paused'?'paused':'');st.textContent=kind==='active'?'♫ 正在练习':kind==='paused'?'Ⅱ 已暂停':'♪ 等待钢琴声音';el('hint').textContent=info;el('wave').classList.toggle('live',kind==='active')}
for(let i=0;i<17;i++){const b=document.createElement('i');b.style.setProperty('--h',`${9+Math.round(Math.abs(8-i)*1.6)}px`);b.style.setProperty('--delay',`${i*.05}s`);el('wave').append(b)}
// Visible troubleshooting information, so a phone user can tell if microphone audio arrives.
const meter=document.createElement('div');meter.id='micDiagnostic';meter.style.cssText='margin-top:12px;font-size:12px;line-height:1.7;color:#795640';meter.innerHTML='<div>🎙 麦克风音量 <span id="micValue">0%</span> · <span id="detectValue">未开启监听</span></div><div style="height:8px;border-radius:8px;background:#dec7a3;overflow:hidden;margin:4px auto;max-width:240px"><div id="micBar" style="height:100%;width:0%;background:#6f9b77;transition:width .12s"></div></div>';
el('countdown').insertAdjacentElement('afterend',meter);
function analyze(){
  analyser.getFloatTimeDomainData(waveform);
  let sum=0;for(let i=0;i<waveform.length;i++)sum+=waveform[i]*waveform[i];
  const rms=Math.sqrt(sum/waveform.length);
  // Browsers and microphones differ considerably in gain. This is intentionally
  // more forgiving than the original narrow-peak+harmonics gate.
  const minimum=[0.012,0.007,0.0035,0.0017,0.0008][sensitivity-1];
  const percent=Math.min(100,Math.round(rms*1600));
  el('micBar').style.width=percent+'%';el('micValue').textContent=percent+'%';
  if(rms<minimum)return {heard:false,reason:'音量偏低，可提高灵敏度'};
  analyser.getFloatFrequencyData(spectrum);
  const binHz=ctx.sampleRate/analyser.fftSize;
  const start=Math.max(2,Math.ceil(40/binHz));
  const end=Math.min(spectrum.length-2,Math.floor(2200/binHz));
  let max=-120,peak=-1;const levels=[];
  for(let i=start;i<=end;i++){
    const v=spectrum[i];
    if(Number.isFinite(v)){levels.push(v);if(v>max){max=v;peak=i}}
  }
  if(peak<0)return {heard:false,reason:'没有读取到有效频谱'};
  levels.sort((a,b)=>a-b);
  const noise=levels[Math.floor(levels.length*.45)]??-120;
  const contrast=max-noise;
  // Require only a reasonably tonal sound. Many real piano notes, especially
  // low notes, do not have a dominant single narrow FFT bin on iPhone.
  const tonal=contrast>=8;
  const loud=rms>=minimum*4;
  return {heard:tonal||loud,reason:tonal?'检测到音符':loud?'检测到清晰声音':'有声音，但不像清晰的音符'};
}
let lastDiagnostic=0,lastSave=0;
function tick(t){
  if(!listening)return;
  if(ctx?.state==='suspended'){el('detectValue').textContent='音频已中断，请停止后重新监听';raf=requestAnimationFrame(tick);return}
  const result=analyze();
  if(result.heard)consecutive++;else consecutive=0;
  const detected=result.heard&&consecutive>=2;
  if(detected){lastSound=t;if(!active){active=true;setState('active','听到琴声啦！正在自动累计时间 ♪')}}
  if(active){
    const dt=lastTick?Math.min(200,Math.max(0,t-lastTick)):0;
    if(t-lastSound>FIVE_SECONDS){active=false;setState('paused','连续 5 秒未检测到琴声，自动暂停');el('countdown').textContent='重新弹奏即可自动继续计时'}
    else{totalSession+=dt;const key=dayKey();history[key]=(history[key]||0)+dt;el('countdown').textContent=result.heard?'正在累计练习时间':`还有 ${Math.max(0,(FIVE_SECONDS-(t-lastSound))/1000).toFixed(1)} 秒暂停`}
  }
  if(t-lastDiagnostic>250){el('detectValue').textContent=result.reason;lastDiagnostic=t}
  lastTick=t;
  updateStats();
  if(t-lastSave>3000){save();lastSave=t}
  raf=requestAnimationFrame(tick)
}
async function start(){
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('请使用 HTTPS 地址在 Safari 中打开');
    // Create/resume AudioContext directly in the user-initiated start flow.
    ctx=new (window.AudioContext||window.webkitAudioContext)();
    await ctx.resume();
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false},video:false});
    const source=ctx.createMediaStreamSource(stream);
    analyser=ctx.createAnalyser();analyser.fftSize=2048;analyser.smoothingTimeConstant=.55;
    waveform=new Float32Array(analyser.fftSize);spectrum=new Float32Array(analyser.frequencyBinCount);
    source.connect(analyser);
    if(ctx.state!=='running')await ctx.resume();
    listening=true;active=false;consecutive=0;lastTick=0;lastSound=0;
    el('start').textContent='■ 停止监听';setState('idle','正在监听，请弹奏几个音符试试');
    el('message').textContent='';el('detectValue').textContent='麦克风已开启，等待琴声';
    raf=requestAnimationFrame(tick)
  }catch(e){const reason=e.message||String(e);await stop();el('message').textContent='启动失败：'+reason}
}
async function stop(){
  listening=false;active=false;cancelAnimationFrame(raf);
  stream?.getTracks().forEach(x=>x.stop());stream=null;
  if(ctx){await ctx.close().catch(()=>{});ctx=null}
  save();el('start').textContent='🎹 开始监听';setState('idle','监听已关闭，点击按钮重新开始');
  el('countdown').textContent='连续停顿超过 5 秒后自动暂停';
  el('detectValue').textContent='未开启监听';el('micBar').style.width='0%';el('micValue').textContent='0%'
}
el('start').onclick=()=>listening?stop():start();
el('reset').onclick=()=>{if(confirm('重置本次累计时间？今日练习记录不会清除。')){totalSession=0;updateStats()}};
el('settings').onclick=()=>el('settingsDialog').showModal();
el('closeSettings').onclick=()=>el('settingsDialog').close();
el('sensitivity').oninput=e=>{sensitivity=Number(e.target.value);el('sensitivityText').textContent=['最低','较低','中等','较高','最高'][sensitivity-1]};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&listening)el('message').textContent='切换后台或锁屏时 iPhone 可能中断监听，请保持 App 在前台';else if(!document.hidden&&listening&&ctx?.state==='suspended')ctx.resume().catch(()=>{})});
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
updateStats();
