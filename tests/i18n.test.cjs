const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const source=fs.readFileSync(require('node:path').join(__dirname,'../i18n.js'),'utf8');
function locale(language){
  const confirmations=[];
  const context={window:{confirm:message=>{confirmations.push(message);return true}},localStorage:{getItem:()=>language}};
  vm.runInNewContext(source,context);
  return {...context.window.I18n,confirmations};
}
test('saved language is respected and invalid preferences use Chinese',()=>{
  assert.equal(locale('en').t('开始监听'),'Start listening');
  for(const preference of ['zh','invalid',null])assert.equal(locale(preference).t('开始监听'),'开始监听');
});
test('practice quantities and calendar dates retain their values',()=>{
  const {t}=locale('en');
  assert.equal(t('18 / 20 分钟'),'18 / 20 min');
  assert.equal(t('1小时42分'),'1h 42m');
  assert.equal(t('2026年11月'),'Nov 2026');
  assert.equal(t('11月9日 — 11月15日'),'Nov 9 – Nov 15');
  assert.equal(t('2026-11-15 · 22分钟 · 达成目标 ⭐'),'2026-11-15 · 22 min · Goal reached ⭐');
});
test('audio scores and pause timing remain accurate when localized',()=>{
  const {t}=locale('en');
  assert.equal(t('钢琴 86% · 人声 4%'),'Piano 86% · Voice 4%');
  assert.equal(t('AI 判断：Piano · 钢琴 86% · 人声 4% · 音乐 10% · 连续识别 是'),'AI: Piano · Piano 86% · Voice 4% · Music 10% · Continuous: yes');
  assert.match(t('尚未确认钢琴，2.4 秒后暂停（未确认片段不计时）'),/2\.4s/);
});
test('profile names are preserved inside messages and confirmations',()=>{
  const {t,confirm,confirmations}=locale('en');
  assert.equal(t('已切换至 钢琴小屋，点击开始监听'),'Switched to 钢琴小屋 · tap Start to listen');
  assert.equal(t('切换到小猫'),'Switch to 小猫');
  confirm('永久删除「Elly 小猫」及其全部练琴记录？建议先导出备份。');
  assert.match(confirmations[0],/“Elly 小猫”/);
  assert.match(confirmations[0],/^Permanently delete/);
});
test('all five required avatar choices have distinct accessible names',()=>{
  const {t}=locale('en');
  assert.deepEqual(['男孩头像','女孩头像','小猫头像','小狗头像','独角兽头像'].map(t),['Boy avatar','Girl avatar','Kitten avatar','Puppy avatar','Unicorn avatar']);
});
test('backup and recognition errors remain understandable',()=>{
  const {t}=locale('en');
  assert.equal(t('恢复失败：备份文件超过 2MB'),'Restore failed: Backup is larger than 2 MB');
  assert.match(t('无法启动钢琴 AI：请使用 HTTPS Safari 打开应用。请保持联网并在 Safari 重新打开。'),/^Could not start piano recognition: Open this app over HTTPS in Safari/);
});
