const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const vm=require('node:vm');
const createScreenWakeLock=require('../screen-awake.js');

class Lock extends EventTarget {
  released=false;
  async release(){if(!this.released){this.released=true;this.dispatchEvent(new Event('release'));}}
}
function deferred(){let resolve,reject;const promise=new Promise((yes,no)=>{resolve=yes;reject=no;});return {promise,resolve,reject};}
function harness(request){
  let visible=true;const states=[],locks=[];
  const controller=createScreenWakeLock({
    request:request===undefined?async()=>{const lock=new Lock();locks.push(lock);return lock;}:request,
    isVisible:()=>visible,onChange:s=>states.push(s)
  });
  return {controller,states,locks,hide(){visible=false;return controller.suspend();},show(){visible=true;return controller.resume();}};
}

test('only an active listening session holds a screen lock',async()=>{
  const h=harness();await h.controller.resume();assert.equal(h.locks.length,0);
  await h.controller.start();await h.controller.resume();
  assert.equal(h.locks.length,1);assert.equal(h.controller.status,'active');
  await h.controller.stop();assert.equal(h.locks[0].released,true);
  await h.show();assert.equal(h.locks.length,1);
});
test('returning to a visible page reacquires the released lock',async()=>{
  const h=harness();await h.controller.start();await h.hide();
  assert.equal(h.locks[0].released,true);assert.equal(h.controller.status,'hidden');
  await h.show();assert.equal(h.locks.length,2);assert.equal(h.controller.status,'active');
});
test('a permission result arriving after Stop is released immediately',async()=>{
  const gate=deferred(),h=harness(()=>gate.promise),lock=new Lock();
  const start=h.controller.start();await h.controller.stop();gate.resolve(lock);await start;
  assert.equal(lock.released,true);assert.equal(h.controller.status,'idle');
});
test('stale requests cannot replace a newer session lock',async()=>{
  const gate=deferred(),oldLock=new Lock(),newLock=new Lock();let calls=0;
  const h=harness(()=>++calls===1?gate.promise:Promise.resolve(newLock));
  const oldStart=h.controller.start();await h.controller.stop();await h.controller.start();
  gate.resolve(oldLock);await oldStart;
  assert.equal(oldLock.released,true);assert.equal(newLock.released,false);assert.equal(h.controller.status,'active');
  await h.controller.stop();assert.equal(newLock.released,true);
});
test('hiding during a pending request cannot leak a screen lock',async()=>{
  const gate=deferred(),lock=new Lock(),h=harness(()=>gate.promise);
  const start=h.controller.start();await h.hide();gate.resolve(lock);await start;
  assert.equal(lock.released,true);assert.equal(h.controller.status,'hidden');
});
test('duplicate resume events share one pending request',async()=>{
  const gate=deferred();let calls=0;const h=harness(()=>{calls++;return gate.promise;});
  const start=h.controller.start(),resume=h.controller.resume();
  assert.equal(calls,1);gate.resolve(new Lock());await Promise.all([start,resume]);
  assert.equal(h.controller.status,'active');
});
test('denial is recoverable and unsupported browsers do not throw',async()=>{
  let allowed=false;const h=harness(async()=>{if(!allowed)throw Error('NotAllowedError');return new Lock();});
  await h.controller.start();assert.equal(h.controller.status,'blocked');
  allowed=true;await h.controller.resume();assert.equal(h.controller.status,'active');
  const unsupported=harness(null);await unsupported.controller.start();assert.equal(unsupported.controller.status,'unsupported');
});
test('system revocation reports failure without an endless request loop',async()=>{
  const h=harness();await h.controller.start();await h.locks[0].release();
  assert.equal(h.controller.status,'released');assert.equal(h.locks.length,1);
  await h.controller.resume();assert.equal(h.locks.length,2);assert.equal(h.controller.status,'active');
});

// Exercise the real app's Start/Stop/profile handlers with simulated microphone
// and model inputs. These tests never access a real microphone or count real practice.
function appHarness({modelFails=false,requestFails=false}={}){
  const elements=new Map(),locks=[],requests=[];
  const element=id=>{
    if(!elements.has(id))elements.set(id,{textContent:'',hidden:false,disabled:false,className:'',style:{setProperty(){}},
      classList:{toggle(){}},setAttribute(){},append(){},insertAdjacentElement(){},querySelector(){return null;},showModal(){},close(){}});
    return elements.get(id);
  };
  const documentEvents=new Map(),windowEvents=new Map();let profile={name:'Elly',history:{}};
  const document={hidden:false,getElementById:element,createElement:()=>element(Symbol()),addEventListener:(name,fn)=>documentEvents.set(name,fn)};
  const node=()=>({connect(){},disconnect(){},gain:{value:0}});
  class AudioContext {
    sampleRate=16000;state='running';destination={};
    async resume(){this.state='running';}async close(){this.state='closed';}
    createMediaStreamSource(){return node();}createScriptProcessor(){return node();}createGain(){return node();}
  }
  const window={AudioContext,createScreenWakeLock,addEventListener:(name,fn)=>windowEvents.set(name,fn),
    P7:{current:()=>profile,save(){},refresh(){},notify(){},changeActive(){profile={name:'Mom',history:{}};}}};
  const navigator={mediaDevices:{getUserMedia:async()=>({getTracks:()=>[{stop(){}}]})},
    wakeLock:{request:async type=>{requests.push(type);if(requestFails)throw Error('NotAllowedError');const lock=new Lock();locks.push(lock);return lock;}}};
  const context=vm.createContext({window,document,navigator,performance:{now:()=>10000},requestAnimationFrame:()=>1,cancelAnimationFrame(){},console,URL});
  vm.runInContext(fs.readFileSync(path.join(__dirname,'../app.js'),'utf8'),context);
  vm.runInContext(modelFails?"loadClassifier=async()=>{throw Error('test model failure')}":"loadClassifier=async()=>{classifier={classify(){return []}}}",context);
  return {window,document,element,locks,requests,context,documentEvents};
}
test('Start keeps the screen awake through silent pauses and Stop releases it',async()=>{
  const app=appHarness();await app.element('start').onclick();
  assert.deepEqual(app.requests,['screen']);assert.equal(app.locks[0].released,false);
  vm.runInContext('active=true;lastPiano=1;uiLoop(10000)',app.context);
  assert.equal(app.element('status').textContent,'已暂停');assert.equal(app.locks[0].released,false);
  await app.element('start').onclick();assert.equal(app.locks[0].released,true);
});
test('model startup failure and switching profiles release screen awake',async()=>{
  const failed=appHarness({modelFails:true});await failed.element('start').onclick();
  assert.equal(failed.locks[0].released,true);
  const app=appHarness();await app.element('start').onclick();await app.window.PianoSession.switchTo('other');
  assert.equal(app.locks[0].released,true);
});
test('wake lock refusal never prevents piano listening or stopping',async()=>{
  const app=appHarness({requestFails:true});await app.element('start').onclick();
  assert.equal(app.element('start').textContent,'停止监听');
  assert.equal(app.element('wakeLockRetryWrap').hidden,false);
  await app.element('start').onclick();assert.equal(app.element('wakeLockRetryWrap').hidden,true);
});
