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

test('manual time requires the password on every addition and stays with the selected player',()=>{
 const a=app(),original=a.saved(),history=a.p.current().history;
 for(const password of ['', '1234', 1022])assert.throws(()=>a.p.addManualTime('2026-11-14',10,password),/密码不正确/);
 assert.deepEqual(a.saved(),original);
 assert.equal(a.p.addManualTime('2026-11-14',10,'1022'),1920000);
 assert.equal(a.p.current().history,history,'the live timer keeps its history reference');
 assert.equal(a.p.weekTotal(a.p.current(),new Date(2026,10,9,12)),1920000);
 assert.throws(()=>a.p.addManualTime('2026-11-14',10,''),/密码不正确/);
 a.p.changeActive('psecond1');
 assert.throws(()=>a.p.addManualTime('2026-11-14',5,'1022','pfirst01'),/练琴者已切换/);
 a.p.addManualTime('2026-11-14',5,'1022');
 const saved=a.saved();assert.equal(saved.profiles[0].history['2026-11-14'],1920000);assert.equal(saved.profiles[1].history['2026-11-14'],300000);
 const restored=app();restored.p.restore(saved);assert.deepEqual(restored.saved(),saved);
 assert.deepEqual(app(saved).saved(),saved,'additions survive reload using the existing schema');
});

test('manual time rejects invalid dates, future dates, fractions and excessive daily totals',()=>{
 const a=app(),original=a.saved();
 for(const day of ['2026-02-30','2026-13-01','2025-02-29','1899-12-31','2999-01-01','__proto__','2026-1-01'])assert.throws(()=>a.p.addManualTime(day,10,'1022'),/有效日期/);
 for(const amount of [0,-1,1.5,NaN,Infinity,'10',1441])assert.throws(()=>a.p.addManualTime('2026-11-14',amount,'1022'),/整数分钟/);
 assert.throws(()=>a.p.addManualTime('2026-11-14',1440,'1022'),/24 小时/);
 assert.deepEqual(a.saved(),original);
 a.p.addManualTime('2024-02-29',1440,'1022');
 assert.equal(a.p.current().history['2024-02-29'],86400000);
 assert.throws(()=>a.p.addManualTime('2024-02-29',1,'1022'),/24 小时/);
});

test('failed manual saves roll back both existing and new dates without detaching the timer',()=>{
 const a=app(),history=a.p.current().history;a.full();
 for(const day of ['2026-11-14','2026-11-13'])assert.throws(()=>a.p.addManualTime(day,10,'1022'),/存储空间不足/);
 assert.equal(a.p.current().history,history);
 assert.equal(history['2026-11-14'],1320000);assert.equal(Object.hasOwn(history,'2026-11-13'),false);
 assert.deepEqual(a.saved(),seed());
});
