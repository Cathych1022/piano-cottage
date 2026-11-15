'use strict';
/* Piano Cottage v9: illustrated three-screen UI. Existing timer, P7 IDs and data
 remain untouched. Tabs move existing nodes, preserving all event handlers. */
(function(){
const $=id=>document.getElementById(id);
const root=document.querySelector('.app');
if(!root||!window.P7||!window.PianoSession)return;
document.documentElement.classList.add('storybook-v9');
const header=root.querySelector('.header');
const title=root.querySelector('.title');
title.textContent='⌂ 钢琴小屋';
const profile=root.querySelector('.v7-profile');
const hero=root.querySelector('.scene');
const paper=root.querySelector('.paper');
const actions=root.querySelector('.actions');
const message=$('message');
const summary=root.querySelector('.summary');
const board=root.querySelector('.v7-board');
const privacy=root.querySelector('.privacy');
const footer=root.querySelector('.footerkeys');
const create=(tag,cls,html)=>{const e=document.createElement(tag);if(cls)e.className=cls;if(html!==undefined)e.innerHTML=html;return e;};
header.before(create('div','sb-floating-leaves','<span>✿</span><span>❀</span><span>✧</span><span>🌿</span>'));
header.after(create('p','sb-tagline','聆听 · 记录 · 陪伴每一次练琴时光'));
const screens=create('div','sb-screens');
const practice=create('section','sb-screen sb-practice');practice.id='sb-practice';practice.setAttribute('aria-label','练琴');
const weekly=create('section','sb-screen sb-weekly');weekly.id='sb-weekly';weekly.setAttribute('aria-label','本周统计');
const mine=create('section','sb-screen sb-mine');mine.id='sb-mine';mine.setAttribute('aria-label','我的小屋');
screens.append(practice,weekly,mine);
profile.after(screens);
const screenHeading=(glyph,text)=>create('h2','sb-screen-heading','<span>'+glyph+'</span> '+text+' <i>❀</i>');
const practiceBanner=create('div','sb-hero-caption','<span class="sb-leaf">❀</span><span>阳光洒进钢琴小屋</span><span class="sb-leaf">✿</span>');
const sceneWrap=create('div','sb-hero');
sceneWrap.append(hero,practiceBanner);
const cat=create('div','sb-cat-peek','<span class="sb-peek-ear left"></span><span class="sb-peek-ear right"></span><span class="sb-peek-face"><i class="sb-eye"></i><i class="sb-nose">ᴗ</i><i class="sb-eye"></i></span><span class="sb-paw p1"></span><span class="sb-paw p2"></span>');
practice.append(sceneWrap,paper,actions,message,cat,privacy);
practice.append(create('div','sb-music-bar','<span>♫</span><span>♩</span><span>♪</span><span>♬</span>'));
weekly.append(screenHeading('▥','本周练琴'));
const weeklyCat=create('div','sb-chart-cat','<div class="sb-cat-head"><i></i><i></i><span>ᴗ</span></div><div class="sb-cat-paws">● ●</div>');
weekly.append(weeklyCat);
const goal=board.querySelector('.v7-goal-card'),achievements=board.querySelector('.v7-achievements'),reward=board.querySelector('.v7-reward-note');
const parts=Array.from(board.children);
const titles=parts.filter(x=>x.classList.contains('v7-section-title'));
const afterTitle=t=>{
 const elements=[];let next=t.nextElementSibling;
 while(next&&!next.classList.contains('v7-section-title')){elements.push(next);next=next.nextElementSibling}
 return elements;
};
const weekTitle=titles.find(x=>x.textContent.includes('Weekly'));
const calTitle=titles.find(x=>x.textContent.includes('日历'));
const backupTitle=titles.find(x=>x.textContent.includes('备份'));
const weekElements=afterTitle(weekTitle);
const calElements=afterTitle(calTitle);
const backupElements=afterTitle(backupTitle);
const goalSection=create('div','sb-goals');goalSection.append(goal);
weekly.append(goalSection,weekTitle,...weekElements);
const achievementsWrap=create('div','sb-rewards');achievementsWrap.append(achievements,reward);
weekly.append(achievementsWrap);
weekly.append(create('div','sb-sleepy-cat','<span>🐈</span><p>每天认真练琴，小猫会陪你收集星星 ✨</p>'));
mine.append(screenHeading('♙','我的小屋'));
const profileCard=create('div','sb-profile-card','<div class="sb-profile-large" id="sb-profile-large">🐱</div><div class="sb-profile-info"><div id="sb-current-name"></div><small>♫ 每个音符都是成长</small></div><button id="sb-edit-profile" type="button">切换 / 编辑 ›</button>');
mine.append(profileCard);
const profileList=create('div','sb-profile-list');
profileList.innerHTML='<div class="sb-section-label">家庭练琴成员</div><div class="sb-member-row" id="sb-member-row"></div><button id="sb-create-profile" class="sb-add-member" type="button">＋ 新增用户</button>';
mine.append(profileList,calTitle,...calElements,backupTitle,...backupElements);
const nav=create('nav','sb-tab-bar','<button type="button" data-page="practice" aria-label="练琴"><span class="sb-tab-icon">🎹</span><span>练琴</span></button><button type="button" data-page="weekly" aria-label="每周统计"><span class="sb-tab-icon">📊</span><span>本周</span></button><button type="button" data-page="mine" aria-label="我的小屋"><span class="sb-tab-icon">🐱</span><span>我的</span></button>');
screens.after(nav);
const stageKeys=create('div','sb-piano-keys');
root.append(stageKeys);
for(let i=0;i<15;i++){const k=create('i','sb-white-key');if([0,1,3,4,5].includes(i%7))k.classList.add('with-black');stageKeys.append(k)}
// Existing summary remains available on Weekly, with unchanged data bindings.
weekly.append(summary);
board.remove(); // All existing v7 sections are now in their respective tabs.
if(footer)footer.remove();
const refreshMembers=()=>{
 const p=window.P7.current();
 $('sb-profile-large').textContent=p.avatar;
 $('sb-current-name').textContent=p.name;
 const list=$('sb-member-row');list.replaceChildren();
 // Read only locally stored v7 user structure; never send data.
 let profiles=[];
 try{profiles=JSON.parse(localStorage.getItem('piano-cottage-v7-data')||'{}').profiles||[]}catch(e){}
 profiles.forEach(u=>{
  const b=create('button','sb-member');
  if(u.id===p.id)b.classList.add('selected');
  b.type='button';b.setAttribute('aria-label','切换到'+u.name);
  const av=create('span','sb-member-avatar');av.textContent=u.avatar;
  const n=create('small','');n.textContent=u.name;
  b.append(av,n);
  b.onclick=async()=>{if(u.id!==window.P7.current().id)await window.PianoSession.switchTo(u.id);refreshMembers()};
  list.append(b);
 });
};
const edit=()=>document.getElementById('v7profileButton')?.click();
$('sb-edit-profile').onclick=edit;
$('sb-create-profile').onclick=edit;
let page='practice';
const show=next=>{
 page=next;
 for(const [key,section] of [['practice',practice],['weekly',weekly],['mine',mine]]){section.hidden=(key!==page)}
 Array.from(nav.querySelectorAll('button')).forEach(b=>{
  const on=b.dataset.page===page;
  b.classList.toggle('selected',on);b.setAttribute('aria-current',on?'page':'false');
 });
 root.dataset.page=page;
 window.scrollTo({top:0,behavior:'instant'});
 refreshMembers();
};
nav.addEventListener('click',e=>{const b=e.target.closest('button[data-page]');if(b)show(b.dataset.page)});
const originalRefresh=window.P7.refresh;
window.P7.refresh=function(){originalRefresh();refreshMembers();};
window.addEventListener('storage',refreshMembers);
show('practice');
})();