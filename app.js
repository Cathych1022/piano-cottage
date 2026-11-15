'use strict';
// Piano Cottage v8: YAMNet sound-event classification. No loudness-based fallback.
const $ = id => document.getElementById(id);
const FIVE_SECONDS = 5000;
let windowSamples = 15600; // adjust to actual iPhone AudioContext sample rate
const MODEL = 'https://storage.googleapis.com/mediapipe-models/audio_classifier/yamnet/float32/1/yamnet.tflite';
const LIBS = [
  { module: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@0.10.35/audio_bundle.mjs', wasm: 'https://cdn.jsdelivr.net/npm/@mediapipe/tasks-audio@0.10.35/wasm' },
  { module: 'https://unpkg.com/@mediapipe/tasks-audio@0.10.35/audio_bundle.mjs', wasm: 'https://unpkg.com/@mediapipe/tasks-audio@0.10.35/wasm' }
];
// v7 profiles are loaded before this file; existing v6 history migrates once.
let ctx=null, stream=null, source=null, node=null, silentGain=null, classifier=null;
let listening=false, active=false, initializing=false, generation=0, raf=0;
let lastPiano=0, lastStrongPiano=0, accumulated=0, lastSave=0, lastUI=0;
let smoothedPiano=0, recentPianoFrames=0, lastAudioEnergy=0;
let samples=[], sampleCount=0, acceptedWindows=0, inspectedWindows=0, sensitivity=3, lastLabel='等待音频分析';
let history=window.P7.current().history;
const dayKey=()=>{const d=new Date();return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`};
function save(){window.P7.save();window.P7.refresh();}
function format(ms){const s=Math.floor(ms/1000);return [Math.floor(s/3600),Math.floor(s%3600/60),s%60].map(n=>String(n).padStart(2,'0')).join(':')}
function short(ms){const m=Math.floor(ms/60000);return m>=60?`${Math.floor(m/60)}时${m%60}分`:`${m} 分钟`}
function updateStats(){ $('timer').textContent=format(accumulated);$('today').textContent=short(history[dayKey()]||0);let sum=0;for(let i=0;i<7;i++){const d=new Date();d.setDate(d.getDate()-i);const k=`${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`;sum+=history[k]||0}$('week').textContent=short(sum)}
function setState(kind,info){const st=$('status');st.className='status '+(kind==='active'?'active':kind==='paused'?'paused':'');st.textContent=kind==='active'?'连续演奏识别中':kind==='paused'?'已暂停':'等待钢琴声音';$('hint').textContent=info;$('wave').classList.toggle('live',kind==='active')}
function updateListenButton(running){const b=$('start');(b.querySelector('.listen-label')||b).textContent=running?'停止监听':'开始监听';b.setAttribute('aria-pressed',String(running))}
for(let i=0;i<17;i++){const b=document.createElement('i');b.style.setProperty('--h',`${9+Math.round(Math.abs(8-i)*1.6)}px`);b.style.setProperty('--delay',`${i*.05}s`);$('wave').append(b)}
const meter=document.createElement('div');meter.id='micDiagnostic';meter.style.cssText='margin-top:12px;font-size:12px;line-height:1.7;color:#795640';meter.innerHTML='<div>🎙 麦克风 <span id="micValue">0%</span> · <span id="detectValue">AI 未加载</span></div><div style="height:8px;border-radius:8px;background:#dec7a3;overflow:hidden;margin:4px auto;max-width:240px"><div id="micBar" style="height:100%;width:0%;background:#6f9b77;transition:width .12s"></div></div><div id="aiDetail" aria-live="polite">AI 检测 · 只统计确认的钢琴片段</div>';
$('countdown').insertAdjacentElement('afterend',meter);
function labelScore(categories, token){return Math.max(0,...categories.filter(c=>(c.categoryName||c.displayName||'').toLowerCase().includes(token)).map(c=>Number(c.score)||0))}
function inspectAudio(block){
  if(!listening||!classifier)return;
  let results;
  try{results=classifier.classify(block,ctx.sampleRate)}catch(e){fail('AI 音频分类失败：'+(e.message||e));return}
  const cats=(Array.isArray(results)?results:[results]).flatMap(r=>(r?.classifications||[]).flatMap(c=>c.categories||[]));
  const piano=labelScore(cats,'piano');
  const speech=Math.max(labelScore(cats,'speech'),labelScore(cats,'conversation'),labelScore(cats,'narration'));
  const genericMusic=labelScore(cats,'music');
  const best=[...cats].sort((a,b)=>(b.score||0)-(a.score||0))[0];
  lastLabel=(best?.categoryName||best?.displayName||'未知声音');
  const threshold=[.25,.18,.12,.085,.055][sensitivity-1];
  // Only specific Piano score qualifies; generic Music or loud speech NEVER qualifies.
  // A strong speech probability vetoes ambiguous piano, reducing false positives.
  // Dual-threshold hysteresis: strong evidence starts a session; weaker Piano
  // evidence may sustain an existing session, never start a new one.
  // Clear speech and silence veto the sustain decision to avoid counting talking.
  const now=performance.now(); inspectedWindows++;
  const duration=windowSamples/ctx.sampleRate*1000;
  smoothedPiano=inspectedWindows===1?piano:(smoothedPiano*.55+piano*.45);
  const speechDominant=speech>=.28 && speech>piano*1.4;
  const strongPiano=piano>=threshold && piano>=speech*.85 && !speechDominant;
  const inPianoRun=active && now-lastPiano<FIVE_SECONDS;
  const softPiano=inPianoRun && piano>=Math.max(.018,threshold*.35)
      && piano>=speech*.65 && !speechDominant && lastAudioEnergy>.003;
  const isPiano=strongPiano || softPiano;
  if(strongPiano){lastStrongPiano=now;recentPianoFrames=0;}
  else if(softPiano){recentPianoFrames++;}
  if(isPiano){
    acceptedWindows++;
    lastPiano=now;
    if(!active){active=true;setState('active','AI 确认是钢琴声音，正在累计有效练习时间 ♪')}
    accumulated+=duration;
    const key=dayKey();history[key]=(history[key]||0)+duration;
  }
  $('detectValue').textContent=strongPiano?'✅ 钢琴已确认':
      softPiano?'🎹 连续演奏识别中':
      speechDominant?'🗣️ 识别到人声，不计时':
      active?'🎵 正在核验演奏片段':'⛔ 未确认钢琴';
  $('aiDetail').textContent=`AI 判断：${lastLabel} · 钢琴 ${Math.round(piano*100)}% · 人声 ${Math.round(speech*100)}% · 音乐 ${Math.round(genericMusic*100)}% · 连续识别 ${softPiano?'是':'否'}`;
  updateStats();
}
function onAudio(event){
  if(!listening||!ctx)return;
  const input=event.inputBuffer.getChannelData(0);let power=0;for(let i=0;i<input.length;i++)power+=input[i]*input[i];
  const rms=Math.sqrt(power/input.length);lastAudioEnergy=rms;const percent=Math.min(100,Math.round(rms*1600));
  $('micValue').textContent=percent+'%';$('micBar').style.width=percent+'%';
  // Streaming PCM blocks are copied because the audio callback's buffer is reused.
  let at=0;
  while(at<input.length){const n=Math.min(input.length-at,windowSamples-sampleCount);samples.push(Float32Array.from(input.subarray(at,at+n)));sampleCount+=n;at+=n;
    if(sampleCount===windowSamples){const joined=new Float32Array(windowSamples);let offset=0;for(const b of samples){joined.set(b,offset);offset+=b.length}samples=[];sampleCount=0;inspectAudio(joined)}
  }
}
function uiLoop(t){if(!listening)return;if(active&&t-lastPiano>=FIVE_SECONDS){active=false;setState('paused','超过 5 秒未识别到钢琴，自动暂停');$('countdown').textContent='再次弹奏即可继续累计'}else if(active){
    const missing=t-lastPiano;
    // Do not show a scary 5-second countdown for a single uncertain YAMNet frame.
    $('countdown').textContent=missing<2500?'🎹 正在监听连续演奏（短暂识别波动会自动容错）':
      `尚未确认钢琴，${Math.max(0,(FIVE_SECONDS-missing)/1000).toFixed(1)} 秒后暂停（未确认片段不计时）`;
  }
  if(t-lastUI>300){updateStats();lastUI=t}if(t-lastSave>3000){save();lastSave=t}raf=requestAnimationFrame(uiLoop)}
async function loadClassifier(){
  if(classifier)return classifier;
  $('detectValue').textContent='正在下载钢琴识别 AI…';
  const errors=[];
  for(const lib of LIBS){
    try {
      $('detectValue').textContent='正在加载 Safari 兼容版钢琴 AI…';
      const mp=await import(lib.module);
      // Safari may support basic SIMD but reject relaxed-SIMD instructions in the
      // default MediaPipe WASM binary. Explicitly select the portable no-SIMD
      // build instead of relying on MediaPipe's basic-SIMD feature test.
      const fileset={
        wasmLoaderPath: lib.wasm + '/audio_wasm_nosimd_internal.js',
        wasmBinaryPath: lib.wasm + '/audio_wasm_nosimd_internal.wasm'
      };
      classifier=await mp.AudioClassifier.createFromOptions(fileset,{baseOptions:{modelAssetPath:MODEL},maxResults:-1,scoreThreshold:0});
      return classifier;
    } catch(e) {
      errors.push(new URL(lib.module).hostname+': '+(e instanceof Event ? '音频运行文件加载失败（检查 CDN 资源或浏览器兼容性）' : (e?.message||String(e))));
    }
  }
  throw new Error('AI 模块加载失败（两条线路均失败）。'+errors.join('；'));
}
async function start(){
  if(listening||initializing)return;
  initializing=true;const myGeneration=++generation;
  $('start').disabled=true;$('message').textContent='首次使用需联网下载 AI 模型（可能需要数秒）。音频只在手机上分析。';
  try{
    if(!navigator.mediaDevices?.getUserMedia)throw new Error('请使用 HTTPS Safari 打开应用');
    // Load ML before microphone so that unclassified audio is never mistakenly counted.
    await loadClassifier();if(myGeneration!==generation)return;
    ctx=new (window.AudioContext||window.webkitAudioContext)({sampleRate:16000});
    windowSamples=Math.round(ctx.sampleRate*.975);
    await ctx.resume();
    stream=await navigator.mediaDevices.getUserMedia({audio:{echoCancellation:false,noiseSuppression:false,autoGainControl:false,channelCount:1},video:false});
    source=ctx.createMediaStreamSource(stream);
    // ScriptProcessor is supported by Safari; a muted connection keeps callbacks running.
    node=ctx.createScriptProcessor(4096,1,1);silentGain=ctx.createGain();silentGain.gain.value=0;
    source.connect(node);node.connect(silentGain);silentGain.connect(ctx.destination);
    if(ctx.state!=='running')await ctx.resume();
    samples=[];sampleCount=0;lastPiano=0;lastStrongPiano=0;smoothedPiano=0;recentPianoFrames=0;lastAudioEnergy=0;inspectedWindows=0;listening=true;active=false;
    node.onaudioprocess=onAudio;
    updateListenButton(true);$('detectValue').textContent='AI 已启动，等待钢琴';
    $('aiDetail').textContent='钢琴 AI 检测 · Safari 兼容模式（仅 Piano 计时）';$('message').textContent='';
    setState('idle','请弹奏钢琴，AI 正在分辨钢琴声和人声');
    raf=requestAnimationFrame(uiLoop);
  }catch(e){await stop();$('message').textContent='无法启动钢琴 AI：'+(e.message||String(e))+'。请保持联网并在 Safari 重新打开。'}
  finally{initializing=false;$('start').disabled=false}
}
async function stop(){generation++;listening=false;active=false;cancelAnimationFrame(raf);
  if(node){node.onaudioprocess=null;try{node.disconnect()}catch{}node=null}if(source){try{source.disconnect()}catch{}source=null}if(silentGain){try{silentGain.disconnect()}catch{}silentGain=null}
  stream?.getTracks().forEach(t=>t.stop());stream=null;if(ctx){await ctx.close().catch(()=>{});ctx=null}
  samples=[];sampleCount=0;lastStrongPiano=0;smoothedPiano=0;recentPianoFrames=0;save();updateListenButton(false);setState('idle','监听已关闭，点击按钮重新开始');$('countdown').textContent='超过 5 秒未检测到钢琴后暂停；停顿不计时';$('detectValue').textContent='监听已关闭';$('micBar').style.width='0%';$('micValue').textContent='0%';
}
function fail(message){$('message').textContent=message;stop()}
$('start').onclick=()=>listening?stop():start();
$('reset').onclick=()=>{if(window.I18n.confirm('重置本次累计时间？今日练习记录不会清除。')){accumulated=0;updateStats()}};
$('settings').onclick=()=>$('settingsDialog').showModal();$('closeSettings').onclick=()=>$('settingsDialog').close();
$('sensitivity').oninput=e=>{sensitivity=Number(e.target.value);$('sensitivityText').textContent=['非常严格','严格','标准','宽松','很宽松'][sensitivity-1]};
document.addEventListener('visibilitychange',()=>{if(document.hidden&&listening)$('message').textContent='锁屏/进入后台时 iPhone 可能停止音频分析，请保持 App 在前台';else if(!document.hidden&&listening&&ctx?.state==='suspended')ctx.resume().catch(()=>{})});
// Prevent time leaking across family members: stop audio before switching or restoring.
window.PianoSession={
  async stopListening(){if(listening||initializing)await stop();else save()},
  async refreshProfile(){
    history=window.P7.current().history;
    accumulated=0;lastPiano=0;lastStrongPiano=0;smoothedPiano=0;recentPianoFrames=0;active=false;samples=[];sampleCount=0;
    updateStats();window.P7.refresh();
    setState('idle','已切换至 '+window.P7.current().name+'，点击开始监听');
  },
  async switchTo(id){
    if(id===window.P7.current().id)return;
    await this.stopListening();
    window.P7.changeActive(id);
    await this.refreshProfile();
  }
};
if('serviceWorker'in navigator)navigator.serviceWorker.register('./sw.js').catch(()=>{});
updateStats();
