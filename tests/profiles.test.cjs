const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../v7.js'),'utf8');
const key='piano-cottage-v7-data';
const photo='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+a0v8AAAAASUVORK5CYII=';
const seed=()=>({version:7,activeId:'pfirst01',profiles:[{id:'pfirst01',name:'Elly',avatar:'👧',dailyGoal:20,weeklyGoal:120,history:{'2026-11-14':1320000}},{id:'psecond1',name:'Mom',avatar:'🐱',dailyGoal:15,weeklyGoal:90,history:{}}]});
function app(saved=seed()){
 const storage=new Map([[key,JSON.stringify(saved)]]);let full=false;
 const context={window:{},document:{getElementById:()=>null,querySelector:()=>null},localStorage:{getItem:k=>storage.get(k)||null,setItem:(k,v)=>{if(full)throw Error('QuotaExceeded');storage.set(k,v)}},setTimeout,clearTimeout};
 vm.runInNewContext(source,context);
 return {p:context.window.P7,saved:()=>JSON.parse(storage.get(key)),full:()=>{full=true}};
}
test('old backups keep their profiles, practice records and cartoon avatars',()=>{
 const a=app();assert.deepEqual(a.saved(),seed());
});
test('a photo survives saving, reload and backup restoration without changing practice',()=>{
 const a=app();a.p.updateProfile('pfirst01',{avatarPhoto:photo});
 assert.equal(a.p.current().avatarPhoto,photo);
 assert.equal(a.p.current().history['2026-11-14'],1320000);
 const b=app(a.saved());assert.equal(b.p.current().avatarPhoto,photo);
 b.p.changeActive('psecond1');assert.equal(b.p.current().avatarPhoto,undefined);
 b.p.restore(a.saved());assert.equal(b.p.current().avatarPhoto,photo);
});
test('selecting a cartoon removes the photo only for that player',()=>{
 const a=app();a.p.updateProfile('pfirst01',{avatarPhoto:photo});a.p.updateProfile('psecond1',{avatarPhoto:photo});
 a.p.updateProfile('pfirst01',{avatar:'🦄',avatarPhoto:''});
 assert.equal(a.p.current().avatar,'🦄');assert.equal(a.p.current().avatarPhoto,undefined);
 a.p.changeActive('psecond1');assert.equal(a.p.current().avatarPhoto,photo);
});
test('unsafe or oversized photo sources cannot enter restored profiles',()=>{
 for(const bad of ['https://example.com/picture.png','data:image/svg+xml;base64,PHN2Zz4=','data:image/png;base64,'+'A'.repeat(60001)]){
  const data=seed();data.profiles[0].avatarPhoto=bad;
  const a=app(data);assert.equal(a.p.current().avatarPhoto,undefined);
  assert.equal(a.p.current().history['2026-11-14'],1320000);
 }
});
test('storage exhaustion preserves the previous profile, active player and records',()=>{
 const a=app();a.full();
 assert.throws(()=>a.p.updateProfile('pfirst01',{name:'Changed',avatarPhoto:photo}),/存储空间不足/);
 assert.equal(a.p.current().name,'Elly');assert.equal(a.p.current().avatarPhoto,undefined);
 assert.throws(()=>a.p.addProfile('New','👦',photo),/存储空间不足/);
 assert.equal(a.p.current().id,'pfirst01');
 const changed=seed();changed.profiles[0].history={};
 assert.throws(()=>a.p.restore(changed),/存储空间不足/);
 assert.equal(a.p.current().history['2026-11-14'],1320000);
 assert.deepEqual(a.saved(),seed());
});
