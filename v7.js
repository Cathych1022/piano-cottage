'use strict';
/* Piano Cottage v7: local-first multi-profile data, goals, charts, and backup.
   Never uploads recordings or practice data. Legacy v6 storage is read-only. */
(function(){
const KEY='piano-cottage-v7-data';
const LEGACY='storybook-piano-practice-v1';
const AVATARS=['🐱','👧','👦','🐻','🐰','🦊','🦄','🎹','🌸','⭐','🐼','🐶'];
const $=id=>document.getElementById(id);
const dateKey=d=>[d.getFullYear(),String(d.getMonth()+1).padStart(2,'0'),String(d.getDate()).padStart(2,'0')].join('-');
const dateFromKey=s=>{const a=s.split('-').map(Number);return new Date(a[0],a[1]-1,a[2],12)};
const shift=(d,days)=>{const x=new Date(d);x.setDate(x.getDate()+days);return x};
const monday=d=>{const x=new Date(d.getFullYear(),d.getMonth(),d.getDate(),12);return shift(x,-(x.getDay()+6)%7)};
const daysMs=n=>n*86400000;
const minutes=ms=>Math.floor(ms/60000);
const displayTime=ms=>minutes(ms)>=60?Math.floor(minutes(ms)/60)+'小时'+minutes(ms)%60+'分':minutes(ms)+'分钟';
const id=()=>('p'+Date.now().toString(36)+Math.random().toString(36).slice(2,9));
const safeName=s=>String(s||'').trim().replace(/[\u0000-\u001f]/g,'').slice(0,24);
const safeGoal=(v,fallback,max=360)=>Number.isFinite(Number(v))?Math.min(max,Math.max(1,Math.round(Number(v)))):fallback;
const number=n=>Number.isFinite(Number(n))?Math.min(Number(n),86400000):0;
const emptyProfile=(name,avatar)=>({id:id(),name:safeName(name)||'我的练琴',avatar:AVATARS.includes(avatar)?avatar:'🐱',dailyGoal:20,weeklyGoal:120,history:{}});
function validHistory(h){
 const out={};if(!h||typeof h!=='object'||Array.isArray(h))return out;
 Object.entries(h).slice(0,5000).forEach(([day,ms])=>{
  if(/^\d{4}-\d{2}-\d{2}$/.test(day)&&dateKey(dateFromKey(day))===day&&Number.isFinite(Number(ms))&&Number(ms)>=0)out[day]=number(ms);
 });return out;
}
function validated(raw){
 if(!raw||raw.version!==7||!Array.isArray(raw.profiles)||raw.profiles.length<1||raw.profiles.length>30)throw Error('不是有效的 v7 备份（用户数量不正确）');
 const used=new Set();
 const profiles=raw.profiles.map(p=>{
  if(!p||typeof p!=='object'||!safeName(p.name))throw Error('备份中存在无效用户');
  const pid=String(p.id||'');
  if(!/^p[a-zA-Z0-9_-]{5,45}$/.test(pid)||used.has(pid))throw Error('备份存在重复或无效用户 ID');
  used.add(pid);
  return {id:pid,name:safeName(p.name),avatar:AVATARS.includes(p.avatar)?p.avatar:'🐱',dailyGoal:safeGoal(p.dailyGoal,20),weeklyGoal:safeGoal(p.weeklyGoal,120,3000),history:validHistory(p.history)};
 });
 return {version:7,profiles,activeId:used.has(raw.activeId)?raw.activeId:profiles[0].id};
}
function initial(){
 let old={};try{old=JSON.parse(localStorage.getItem(LEGACY)||'{}')}catch(e){}
 const p=emptyProfile('我的练琴','🐱');p.history=validHistory(old);
 return {version:7,profiles:[p],activeId:p.id};
}
let state;
try{const saved=localStorage.getItem(KEY);state=saved?validated(JSON.parse(saved)):initial();}
catch(e){state=initial();}
function persist(){try{localStorage.setItem(KEY,JSON.stringify(state));return true}catch(e){notify('存储空间不可用，请先导出备份');return false}}
function current(){return state.profiles.find(p=>p.id===state.activeId)||state.profiles[0]}
function refresh(){render();const s=$('profileName');if(s)s.textContent=current().name;const a=$('profileAvatar');if(a)a.textContent=current().avatar}
function notify(message){const n=$('v7notice');if(n){n.textContent=message;n.hidden=false;}}
function changeActive(target){if(!state.profiles.some(p=>p.id===target))return;state.activeId=target;selectedDay='';weekOffset=0;monthOffset=0;persist();refresh()}
function addProfile(name,avatar){
 if(state.profiles.length>=30)throw Error('最多支持 30 个用户');
 const p=emptyProfile(name,avatar);if(!safeName(name))throw Error('请输入姓名');
 p.name=safeName(name);state.profiles.push(p);state.activeId=p.id;persist();refresh();return p;
}
function updateProfile(profileId,fields){
 const p=state.profiles.find(x=>x.id===profileId);if(!p)return;
 if(fields.name!==undefined){if(!safeName(fields.name))throw Error('姓名不能为空');p.name=safeName(fields.name)}
 if(fields.avatar!==undefined&&AVATARS.includes(fields.avatar))p.avatar=fields.avatar;
 if(fields.dailyGoal!==undefined)p.dailyGoal=safeGoal(fields.dailyGoal,20);
 if(fields.weeklyGoal!==undefined)p.weeklyGoal=safeGoal(fields.weeklyGoal,120,3000);
 persist();refresh();
}
function removeProfile(profileId){
 if(state.profiles.length===1)throw Error('至少保留一个用户');
 state.profiles=state.profiles.filter(p=>p.id!==profileId);
 if(state.activeId===profileId)state.activeId=state.profiles[0].id;
 selectedDay='';weekOffset=0;monthOffset=0;persist();refresh();
}
function restore(json){const next=validated(json);state=next;persist();weekOffset=0;monthOffset=0;refresh();}
function startOfWeek(offset){return shift(monday(new Date()),offset*7)}
function weekTotal(p,start){let total=0;for(let i=0;i<7;i++)total+=p.history[dateKey(shift(start,i))]||0;return total}
function practiced(p,key){return (p.history[key]||0)>0}
function achieved(p,key){return (p.history[key]||0)>=p.dailyGoal*60000}
function streak(p){
 const now=new Date();let d=dateKey(now);if(!practiced(p,d))d=dateKey(shift(now,-1));
 let count=0;for(let i=0;i<10000;i++){if(!practiced(p,d))break;count++;d=dateKey(shift(dateFromKey(d),-1))}return count;
}
function stars(p){return Object.keys(p.history).filter(k=>achieved(p,k)).length}
function progress(actual,goal){return Math.min(100,Math.round(actual/Math.max(1,goal)*100))}
let weekOffset=0,monthOffset=0,selectedDay='';
function el(tag,cls,textContent){const e=document.createElement(tag);if(cls)e.className=cls;if(textContent!==undefined)e.textContent=textContent;return e}
function clear(e){e.replaceChildren()}
function render(){
 if(!$('v7weekly'))return;
 const p=current(), today=dateKey(new Date()), w=startOfWeek(weekOffset);
 const todayMinutes=(p.history[today]||0)/60000, currentWeek=startOfWeek(0), thisWeek=weekTotal(p,currentWeek)/60000;
 $('profileName').textContent=p.name;$('profileAvatar').textContent=p.avatar;
 $('v7todayGoal').textContent=minutes(p.history[today]||0)+' / '+p.dailyGoal+' 分钟';
 $('v7weekGoal').textContent=minutes(weekTotal(p,currentWeek))+' / '+p.weeklyGoal+' 分钟';
 $('v7dailyProgress').style.width=progress(todayMinutes,p.dailyGoal)+'%';
 $('v7weeklyProgress').style.width=progress(thisWeek,p.weeklyGoal)+'%';
 $('v7stars').textContent=stars(p)+' ⭐';
 $('v7streak').textContent=streak(p)+' 天';
 const total=weekTotal(p,w),prev=weekTotal(p,shift(w,-7));
 $('v7weekTitle').textContent=(w.getMonth()+1)+'月'+w.getDate()+'日 — '+(shift(w,6).getMonth()+1)+'月'+shift(w,6).getDate()+'日';
 $('v7weekTotal').textContent=displayTime(total);
 $('v7weekCompare').textContent=prev===0?(total>0?'首次记录':'暂无变化'):(total>=prev?'+':'')+Math.round((total-prev)/prev*100)+'%';
 $('v7weekBack').disabled=weekOffset<=-104;
 $('v7weekForward').disabled=weekOffset>=0;
 const chart=$('v7weekly');clear(chart);
 const vals=Array.from({length:7},(_,i)=>minutes(p.history[dateKey(shift(w,i))]||0));
 const max=Math.max(p.dailyGoal,...vals,1);
 ['一','二','三','四','五','六','日'].forEach((day,i)=>{
  const k=dateKey(shift(w,i)),v=vals[i],col=el('div','v7-bar-col');
  const bar=el('div','v7-bar');bar.style.height=(Math.max(v?8:2,v/max*100))+'%';
  if(v>=p.dailyGoal)bar.classList.add('met');
  const value=el('span','v7-bar-value',v+'分');
  const barHolder=el('div','v7-bar-holder');barHolder.append(bar);
  col.append(value,barHolder,el('span','v7-day-label',day));
  col.title=k+'：'+v+'分钟';chart.append(col);
 });
 const selected=new Date();selected.setMonth(selected.getMonth()+monthOffset,1);selected.setHours(12,0,0,0);
 $('v7monthTitle').textContent=selected.getFullYear()+'年'+(selected.getMonth()+1)+'月';
 $('v7monthForward').disabled=monthOffset>=0;
 const cal=$('v7calendar');clear(cal);
 ['一','二','三','四','五','六','日'].forEach(x=>cal.append(el('span','v7-weekday',x)));
 const first=monday(new Date(selected.getFullYear(),selected.getMonth(),1,12));
 const offset=(new Date(selected.getFullYear(),selected.getMonth(),1,12).getDay()+6)%7;
 const count=Math.ceil((offset+new Date(selected.getFullYear(),selected.getMonth()+1,0).getDate())/7)*7;
 for(let i=0;i<count;i++){
  const d=shift(first,i),k=dateKey(d),amount=p.history[k]||0;
  const b=el('button','v7-date',String(d.getDate()));b.type='button';b.title=k+'：'+displayTime(amount);
  if(d.getMonth()!==selected.getMonth())b.classList.add('outside');
  if(k===today)b.classList.add('today');
  if(amount>0)b.classList.add('has-practice');
  if(achieved(p,k))b.classList.add('starred');
  if(k===selectedDay)b.classList.add('selected');
  if(k>today)b.disabled=true;
  const mark=el('small','v7-date-mark',achieved(p,k)?'⭐':amount>0?'●':'');
  b.append(mark);b.addEventListener('click',()=>{selectedDay=k;$('v7dayDetail').textContent=k+' · '+displayTime(amount)+(achieved(p,k)?' · 达成目标 ⭐':'');render()});
  cal.append(b);
 }
 if(!selectedDay)$('v7dayDetail').textContent='点击日历日期，查看当日练琴时间';
 $('v7rewardText').textContent=achieved(p,today)?'今天已完成目标，获得一颗小星星！':'每天达到目标就能收集一颗星星 ✨';
}
function initUI(){
 const header=document.querySelector('.header'),summary=document.querySelector('.summary');
 if(!header||!summary)return;
 const profile=document.createElement('div');profile.className='v7-profile';
 profile.innerHTML='<button id="v7profileButton" class="v7-profile-button" type="button"><span id="profileAvatar">🐱</span><span><small>当前练琴者</small><strong id="profileName">我的练琴</strong></span><span>⌄</span></button><span class="v7-version">Piano Cottage · v10</span>';
 header.insertAdjacentElement('afterend',profile);
 const panel=document.createElement('section');panel.className='v7-board';
 panel.innerHTML='<div class="v7-board-heading">🌿 练琴成长日记</div>'+
 '<div class="v7-goal-card"><div class="v7-row"><strong>🎹 今日目标</strong><span id="v7todayGoal"></span></div><div class="v7-progress"><i id="v7dailyProgress"></i></div><div class="v7-row"><strong>🌟 本周目标</strong><span id="v7weekGoal"></span></div><div class="v7-progress"><i id="v7weeklyProgress"></i></div><button class="v7-text-button" id="v7goalButton" type="button">✎ 设置每日 / 每周目标</button></div>'+
 '<div class="v7-achievements"><div>⭐ 星星奖励 <strong id="v7stars">0 ⭐</strong></div><div>🔥 连续练琴 <strong id="v7streak">0 天</strong></div></div><p class="v7-reward-note" id="v7rewardText"></p>'+
 '<div class="v7-section-title">📊 Weekly 每周练琴统计</div><div class="v7-row v7-week-nav"><button id="v7weekBack" type="button">‹ 上一周</button><strong id="v7weekTitle"></strong><button id="v7weekForward" type="button">下一周 ›</button></div>'+
 '<div class="v7-week-summary"><strong id="v7weekTotal"></strong><span id="v7weekCompare"></span></div><div class="v7-chart" id="v7weekly" aria-label="一周练习时间柱状图"></div>'+
 '<div class="v7-section-title">🗓️ 练琴日历</div><div class="v7-row v7-week-nav"><button id="v7monthBack" type="button">‹ 上一月</button><strong id="v7monthTitle"></strong><button id="v7monthForward" type="button">下一月 ›</button></div>'+
 '<div class="v7-calendar" id="v7calendar"></div><div class="v7-day-detail" id="v7dayDetail">点击日历日期，查看当日练琴时间</div>'+
 '<div class="v7-section-title">💾 资料与备份</div><p class="v7-help">每个用户的练琴历史独立保存在这台设备中。导出备份可在换手机前保存记录。</p>'+
 '<div class="v7-backup"><button id="v7export" type="button">⬇ 导出 JSON 备份</button><button id="v7importButton" type="button">⬆ 恢复备份</button><input type="file" id="v7importFile" accept=".json,application/json" hidden></div>'+
 '<div id="v7notice" class="v7-notice" hidden></div>';
 summary.insertAdjacentElement('afterend',panel);
 const dialog=document.createElement('dialog');dialog.className='v7-dialog';dialog.id='v7dialog';
 dialog.innerHTML='<h3>🐱 练琴者管理</h3><div id="v7profiles"></div><label for="v7name">姓名</label><input id="v7name" maxlength="24" placeholder="例如：Elly"><div class="v7-avatars" id="v7avatars"></div><div class="v7-dialog-actions"><button id="v7saveProfile" type="button">保存当前用户</button><button id="v7addProfile" type="button">＋ 新建用户</button></div><button id="v7deleteProfile" class="v7-danger" type="button">删除当前用户及其记录</button><button id="v7closeProfile" type="button">完成</button>';
 document.body.append(dialog);
 const goals=document.createElement('dialog');goals.className='v7-dialog';goals.id='v7goalsDialog';
 goals.innerHTML='<h3>🎯 设置练琴目标</h3><label for="v7dailyInput">每日目标（分钟）</label><input type="number" id="v7dailyInput" min="1" max="360" step="1"><label for="v7weeklyInput">每周目标（分钟）</label><input type="number" id="v7weeklyInput" min="1" max="3000" step="1"><p class="v7-help">每天达到每日目标获得 ⭐。连续练琴天数按有钢琴练习记录的自然日计算。</p><div class="v7-dialog-actions"><button id="v7saveGoal" type="button">保存目标</button><button id="v7closeGoal" type="button">取消</button></div>';
 document.body.append(goals);
 let selectedAvatar=current().avatar;
 function paintProfiles(){
  const p=current();selectedAvatar=p.avatar;$('v7name').value=p.name;
  const list=$('v7profiles');clear(list);
  state.profiles.forEach(x=>{
   const b=el('button','v7-user-choice');b.type='button';
   const avatar=el('span','profile-choice-avatar',x.avatar);avatar.dataset.avatar=x.avatar;avatar.setAttribute('aria-hidden','true');
   const name=el('span','profile-choice-name',x.name);name.dataset.userContent='';b.append(avatar,name);
   if(x.id===p.id)b.append(el('span','profile-choice-check','✓'));
   if(x.id===p.id)b.classList.add('selected');
   b.addEventListener('click',async()=>{if(x.id!==current().id)await window.PianoSession.switchTo(x.id);paintProfiles()});
   list.append(b);
  });
  const av=$('v7avatars');clear(av);
  const choices=['👦','👧','🐱','🐶','🦄'],names={'👦':'男孩','👧':'女孩','🐱':'小猫','🐶':'小狗','🦄':'独角兽'};
  if(!choices.includes(selectedAvatar))choices.push(selectedAvatar);
  choices.forEach(a=>{const b=el('button','v7-avatar');b.type='button';b.dataset.choice=a;b.setAttribute('aria-label',(names[a]||a)+'头像');
    const portrait=el('span','portrait',a);portrait.dataset.avatar=a;portrait.setAttribute('aria-hidden','true');
    b.append(portrait,el('span','avatar-name',names[a]||a));
    b.classList.toggle('selected',a===selectedAvatar);b.setAttribute('aria-pressed',String(a===selectedAvatar));
    b.addEventListener('click',()=>{selectedAvatar=a;paintAvatarSelection()});av.append(b);
  });
 }
 function paintAvatarSelection(){Array.from($('v7avatars').children).forEach(b=>{const selected=b.dataset.choice===selectedAvatar;b.classList.toggle('selected',selected);b.setAttribute('aria-pressed',String(selected));})}
 $('v7profileButton').onclick=()=>{paintProfiles();dialog.showModal()};
 $('v7closeProfile').onclick=()=>dialog.close();
 $('v7saveProfile').onclick=()=>{try{updateProfile(current().id,{name:$('v7name').value,avatar:selectedAvatar});paintProfiles();notify('用户资料已保存')}catch(e){notify(e.message)}};
 $('v7addProfile').onclick=async()=>{try{const name=safeName($('v7name').value);if(!name)throw Error('请输入新用户名');await window.PianoSession.stopListening();const x=addProfile(name,selectedAvatar);await window.PianoSession.refreshProfile();paintProfiles();notify('已创建用户：'+x.name)}catch(e){notify(e.message)}};
 $('v7deleteProfile').onclick=async()=>{if(state.profiles.length===1){notify('至少保留一个用户');return}const p=current();if(!window.I18n.confirm('永久删除「'+p.name+'」及其全部练琴记录？建议先导出备份。'))return;await window.PianoSession.stopListening();removeProfile(p.id);await window.PianoSession.refreshProfile();paintProfiles();notify('用户已删除')};
 $('v7goalButton').onclick=()=>{$('v7dailyInput').value=current().dailyGoal;$('v7weeklyInput').value=current().weeklyGoal;goals.showModal()};
 $('v7closeGoal').onclick=()=>goals.close();
 $('v7saveGoal').onclick=()=>{const daily=Number($('v7dailyInput').value),weekly=Number($('v7weeklyInput').value);if(!Number.isInteger(daily)||daily<1||daily>360||!Number.isInteger(weekly)||weekly<1||weekly>3000){notify('每日目标需为 1–360 分钟，每周目标需为 1–3000 分钟');return}updateProfile(current().id,{dailyGoal:daily,weeklyGoal:weekly});goals.close();notify('目标已保存')};
 $('v7weekBack').onclick=()=>{weekOffset=Math.max(-104,weekOffset-1);render()};
 $('v7weekForward').onclick=()=>{weekOffset=Math.min(0,weekOffset+1);render()};
 $('v7monthBack').onclick=()=>{monthOffset=Math.max(-120,monthOffset-1);selectedDay='';render()};
 $('v7monthForward').onclick=()=>{monthOffset=Math.min(0,monthOffset+1);selectedDay='';render()};
 $('v7export').onclick=()=>{
  try{persist();const data=JSON.stringify({...state,exportedAt:new Date().toISOString()},null,2);
   const blob=new Blob([data],{type:'application/json'}),url=URL.createObjectURL(blob),a=document.createElement('a');a.href=url;a.download='piano-cottage-backup-'+dateKey(new Date())+'.json';document.body.append(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),30000);notify('备份已生成，请将 JSON 文件保存到 iPhone 文件 App 或云盘。');
  }catch(e){notify('备份失败：'+e.message)}
 };
 $('v7importButton').onclick=()=>$('v7importFile').click();
 $('v7importFile').onchange=async e=>{
  const file=e.target.files?.[0];if(!file)return;
  try{
   if(file.size>2*1024*1024)throw Error('备份文件超过 2MB');
   const contents=await file.text(),parsed=JSON.parse(contents);validated(parsed);
   if(!window.I18n.confirm('恢复备份会覆盖本机 v7 的全部用户和练琴记录。确定继续吗？'))return;
   await window.PianoSession.stopListening();restore(parsed);await window.PianoSession.refreshProfile();notify('备份恢复成功！');
  }catch(err){notify('恢复失败：'+err.message)}finally{e.target.value=''}
 };
 refresh();
}
const api={current,save:persist,refresh,restore,changeActive,addProfile,updateProfile,removeProfile,initUI,
 dateKey,minutes,weekTotal,notify};
window.P7=api;
initUI();
persist();
})();
