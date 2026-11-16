const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const createScreenWakeLock=require('../screen-awake.js');
const key='piano-cottage-v7-data';
const day='2026-11-15';
const seed=()=>({version:7,activeId:'pfirst01',profiles:[
 {id:'pfirst01',name:'Elly',avatar:'👧',dailyGoal:20,weeklyGoal:120,history:{[day]:60000}},
 {id:'psecond1',name:'Mom',avatar:'🐱',dailyGoal:20,weeklyGoal:120,history:{}}
]});

// Exercise the real persistence, PCM processing and lifecycle handlers without
// a browser, microphone or animation frames. Storage is isolated in memory.
function app(saved=seed(),closeWait=Promise.resolve()){
 const storage=new Map([[key,JSON.stringify(saved)]]),elements=new Map(),events=new Map();
 let full=false,processor,saveCount=0;
 const element=id=>{
  if(String(id).startsWith('v7')||['profileName','profileAvatar'].includes(id))return null;
  if(!elements.has(id))elements.set(id,{textContent:'',style:{setProperty(){}},classList:{toggle(){}},
   setAttribute(){},append(){},insertAdjacentElement(){},querySelector(){return null;}});
  return elements.get(id);
 };
 const document={hidden:false,getElementById:element,querySelector:()=>null,createElement:()=>element(Symbol()),addEventListener:(name,fn)=>events.set(name,fn)};
 const node=()=>({connect(){},disconnect(){},gain:{value:0}});
 class AudioContext {
  sampleRate=16000;state='running';destination={};
  async resume(){this.state='running';}async close(){await closeWait;this.state='closed';}
  createMediaStreamSource(){return node();}createGain(){return node();}
  createScriptProcessor(){processor=node();return processor;}
 }
 class TestDate extends Date {constructor(...args){super(...(args.length?args:[2026,10,15,12]));}}
 const window={AudioContext,createScreenWakeLock,addEventListener:(name,fn)=>events.set(name,fn)};
 const navigator={mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})}};
 const context=vm.createContext({window,document,navigator,Date:TestDate,setTimeout,clearTimeout,URL,
  localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(full)throw Error('QuotaExceeded');storage.set(k,v);saveCount++;}},
  performance:{now:()=>10000},requestAnimationFrame:()=>1,cancelAnimationFrame(){},categories:[]});
 for(const file of ['v7.js','app.js'])vm.runInContext(fs.readFileSync(path.join(__dirname,'..',file),'utf8'),context);
 vm.runInContext('loadClassifier=async()=>{classifier={classify:()=>[{classifications:[{categories}]}]}}',context);
 return {window,document,events,context,element,saved:()=>JSON.parse(storage.get(key)),saveCount:()=>saveCount,
  full:value=>{full=value;},
  feed(piano=.9,speech=0){context.categories=[{categoryName:'Piano',score:piano},{categoryName:'Speech',score:speech}];processor.onaudioprocess({inputBuffer:{getChannelData:()=>new Float32Array(15600).fill(.04)}});}
 };
}

test('each recognized window is stored immediately and survives reload without Stop or an animation frame',async()=>{
 const a=app();await a.element('start').onclick();
 a.feed();assert.equal(a.saved().profiles[0].history[day],60975);
 a.feed();assert.equal(a.saved().profiles[0].history[day],61950);
 const writes=a.saveCount();a.feed(0,.95);a.feed(0,0);
 assert.equal(a.saveCount(),writes,'speech and silence do not create practice records');
 assert.equal(app(a.saved()).window.P7.current().history[day],61950);
});

test('Stop persists before waiting for audio shutdown',async()=>{
 let finishClose;const closing=new Promise(resolve=>{finishClose=resolve;});
 const a=app(seed(),closing);await a.element('start').onclick();a.feed();
 const writes=a.saveCount(),stop=a.element('start').onclick();
 assert.equal(a.saveCount(),writes+1);
 assert.equal(a.saved().profiles[0].history[day],60975);
 finishClose();await stop;
});

test('hiding and leaving the page flush local records',async()=>{
 const a=app();await a.element('start').onclick();a.feed();
 let writes=a.saveCount();a.document.hidden=true;a.events.get('visibilitychange')();
 assert.equal(a.saveCount(),writes+1);
 writes=a.saveCount();a.events.get('pagehide')();assert.equal(a.saveCount(),writes+1);
 assert.equal(a.saved().profiles[0].history[day],60975);
});

test('a failed write retains counted time in memory and a later retry saves it once',async()=>{
 const a=app();await a.element('start').onclick();a.full(true);a.feed();a.feed();
 assert.equal(a.saved().profiles[0].history[day],60000);
 assert.equal(a.window.P7.current().history[day],61950);
 a.full(false);vm.runInContext('uiLoop(5000)',a.context);
 assert.equal(a.saved().profiles[0].history[day],61950);
 a.feed();assert.equal(a.saved().profiles[0].history[day],62925);
});

test('switching players saves each player independently, including manual additions',async()=>{
 const a=app();await a.element('start').onclick();a.feed();
 await a.window.PianoSession.switchTo('psecond1');
 a.window.P7.addManualTime(day,5,'1022');
 await a.element('start').onclick();a.feed();
 const saved=a.saved();assert.equal(saved.profiles[0].history[day],60975);
 assert.equal(saved.profiles[1].history[day],300975);
 assert.deepEqual(app(saved).saved(),saved);
});
