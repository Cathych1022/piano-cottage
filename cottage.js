'use strict';
/* Presentation layer only. All practice records and audio handlers stay in P7/PianoSession. */
(() => {
  const $ = id => document.getElementById(id);
  const root = document.querySelector('.app');
  if (!root || !window.P7 || !window.PianoSession) return;
  const icons = {
    home:'<path d="m3 11 9-8 9 8M5 10v11h5v-7h4v7h5V10"/>',
    chart:'<rect x="3" y="13" width="4" height="8" rx="1"/><rect x="10" y="8" width="4" height="13" rx="1"/><rect x="17" y="3" width="4" height="18" rx="1"/>',
    user:'<circle cx="12" cy="7" r="4"/><path d="M4 21v-3a8 8 0 0 1 16 0v3Z"/>',
    calendar:'<rect x="3" y="5" width="18" height="16" rx="3"/><path d="M7 3v5m10-5v5M3 11h18m-13 4h2m4 0h2m-8 3h2"/>',
    target:'<circle cx="11" cy="13" r="8"/><circle cx="11" cy="13" r="4"/><path d="m11 13 9-10m-1 1-1 4 4-1"/>',
    star:'<path d="m12 2 3.1 6.5 7.1 1-5.1 5 1.2 7.1-6.3-3.4-6.3 3.4 1.2-7.1-5.1-5 7.1-1Z"/>',
    clock:'<circle cx="12" cy="12" r="9"/><path d="M12 6v7h5"/>',
    trend:'<path d="m3 19 7-7 4 3 7-11m-7 0h7v7"/>',
    upload:'<path d="M12 16V3m-5 5 5-5 5 5M4 14v6h16v-6"/>',
    restore:'<path d="M4 10a8 8 0 1 1 0 5M4 4v6h6"/>',
    leaf:'<path d="M4 21c3-7 7-11 15-17M7 15C0 3 15 3 21 2c0 12-3 17-14 13Z"/>',
    settings:'<path d="m10 3-1 3-3 1-3-1-1 4 3 2v3l-2 2 3 3 3-1 3 1 1 3 4-1 1-3 3-2 3 1 1-4-3-2-1-3 2-3-3-2-3 1-3-1Z" transform="translate(1 0) scale(.85)"/><circle cx="12" cy="12" r="3"/>',
    edit:'<path d="m4 16-1 5 5-1L21 7l-4-4ZM14 6l4 4"/>',
    chevron:'<path d="m9 5 7 7-7 7"/>'
  };
  const icon = name => '<svg class="icon" viewBox="0 0 24 24" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round">'+(icons[name] || icons.leaf)+'</svg>';
  const el = (tag, cls, html) => { const n=document.createElement(tag); if(cls)n.className=cls; if(html!==undefined)n.innerHTML=html; return n; };
  const header = root.querySelector('.header');
  const profile = root.querySelector('.v7-profile');
  const controls = el('div','top-controls');
  header.after(controls);
  controls.append(profile,$('settings'));
  $('settings').innerHTML=icon('settings');
  const screens=el('div','screens');
  const pages={};
  for(const [key,label] of [['practice','练琴'],['weekly','本周统计'],['mine','我的小屋']]){
    const section=el('section','screen '+key);section.id='page-'+key;section.setAttribute('aria-label',label);pages[key]=section;screens.append(section);
  }
  controls.after(screens);
  const paper=root.querySelector('.paper');
  pages.practice.append(root.querySelector('.scene'),paper);
  paper.append(root.querySelector('.actions'),$('message'));
  $('reset').innerHTML=icon('restore')+'<span>重置</span>';
  $('reset').title='重置本次计时';
  const details=el('details','ai-details');
  details.innerHTML='<summary><span class="mic-dot" aria-hidden="true">♩</span><span id="compactAI">轻触开始，聆听琴声</span><span class="info-icon" aria-hidden="true">i</span></summary>';
  details.append($('micDiagnostic'),root.querySelector('.privacy'));
  $('countdown').after(details);
  const updateAI=()=>{
    const detail=$('aiDetail').textContent;
    const scores=detail.match(/钢琴 (\d+)% · 人声 (\d+)%/);
    const status=$('detectValue').textContent;
    $('compactAI').textContent=/未加载|关闭/.test(status)?'轻触开始，聆听琴声':
      /下载|正在加载/.test(status)?'正在准备钢琴识别…':
      scores?'钢琴 '+scores[1]+'% · 人声 '+scores[2]+'%':
      /人声/.test(status)?'听到人声，暂不计时':'正在聆听 · 等待琴声';
  };
  new MutationObserver(updateAI).observe($('micDiagnostic'),{subtree:true,childList:true,characterData:true});updateAI();
  Array.from($('wave').children).forEach((bar,i)=>bar.style.setProperty('--h',(9+(8-Math.abs(8-i))*2.4)+'px'));
  const keys=el('div','piano-keys');keys.setAttribute('aria-hidden','true');
  for(let i=0;i<15;i++){keys.append(el('i',[0,1,3,4,5].includes(i%7)?'black':'white'));}
  const keysCat=el('div','cat-sprite keys-cat');keysCat.setAttribute('aria-hidden','true');
  const practiceFooter=el('div','practice-footer');
  practiceFooter.setAttribute('aria-hidden','true');
  practiceFooter.append(el('p','quiet-caption','每一个音符，都值得被珍藏'),keysCat,keys);
  pages.practice.append(practiceFooter);

  const board=root.querySelector('.v7-board');
  const weekNav=$('v7weekBack').parentElement;
  const monthNav=$('v7monthBack').parentElement;
  const goals=el('div','parchment goals-card');
  for(const [name,type,prefix] of [['今日目标','target','daily'],['本周目标','calendar','weekly']]){
    const row=el('div','goal-row');
    const amount=$(prefix==='daily'?'v7todayGoal':'v7weekGoal');
    const progress=$(prefix==='daily'?'v7dailyProgress':'v7weeklyProgress').parentElement;
    const line=el('div','goal-line',icon(type)+'<strong>'+name+'</strong>');line.append(amount);
    const track=el('div','goal-track');const percent=el('span','goal-percent');percent.id=prefix+'Percent';track.append(progress,percent);
    row.append(line,track);goals.append(row);
  }
  $('v7goalButton').textContent='调整练琴目标';goals.append($('v7goalButton'));
  const chart=el('div','parchment chart-card','<h2>本周练琴时长</h2>');
  $('v7weekBack').textContent='‹';$('v7weekBack').setAttribute('aria-label','上一周');
  $('v7weekForward').textContent='›';$('v7weekForward').setAttribute('aria-label','下一周');
  const plot=el('div','chart-plot');const axis=el('div','chart-axis');axis.id='chartAxis';axis.setAttribute('aria-hidden','true');
  plot.append(axis,$('v7weekly'));chart.append(weekNav,plot);
  const rewards=board.querySelector('.v7-achievements');rewards.classList.add('reward-cards');
  rewards.children[0].firstChild.textContent='星星奖励';rewards.children[1].firstChild.textContent='连续练琴';
  rewards.children[0].prepend(el('span','reward-icon',icon('star')));rewards.children[1].prepend(el('span','reward-icon',icon('calendar')));
  const starRow=el('div','star-row');starRow.id='starRow';rewards.children[0].append(starRow);
  const totals=el('div','parchment week-totals');
  const total=el('div','',icon('clock')+'<span>本周总时长</span>');total.append($('v7weekTotal'));
  const compare=el('div','',icon('trend')+'<span>比上周</span>');compare.append($('v7weekCompare'));totals.append(total,compare);
  const goalsCat=el('div','cat-sprite goals-cat');goalsCat.setAttribute('aria-hidden','true');goals.prepend(goalsCat);
  pages.weekly.append(goals,chart,rewards,totals,$('v7rewardText'));
  const footer=()=>{const n=el('div','garden-footer');n.setAttribute('aria-hidden','true');return n;};
  const weeklyFooter=footer();weeklyFooter.classList.add('weekly-footer');weeklyFooter.append(el('div','cat-sprite star-cat'));pages.weekly.append(weeklyFooter);

  const family=el('div','parchment family-card','<div class="family-heading"><div id="memberAvatar" class="portrait large"></div><div class="family-info"><button type="button" id="editName"><strong id="memberName"></strong>'+icon('edit')+'</button><small id="practiceDays"></small></div><button type="button" id="switchMember" class="small-button">切换用户⌄</button></div><div class="member-row" id="members"></div>');
  const calendar=el('div','parchment calendar-card');
  $('v7monthBack').textContent='‹';$('v7monthBack').setAttribute('aria-label','上一月');
  $('v7monthForward').textContent='›';$('v7monthForward').setAttribute('aria-label','下一月');
  $('v7monthTitle').before(el('span','calendar-icon',icon('calendar')));
  calendar.append(monthNav,$('v7calendar'),$('v7dayDetail'));
  $('v7export').innerHTML=icon('upload')+'导出备份';$('v7importButton').innerHTML=icon('restore')+'恢复备份';
  const backup=board.querySelector('.v7-backup');
  const help=el('p','backup-note','练琴记录保存在此设备，备份让回忆安心留存。');
  pages.mine.append(family,calendar,backup,help,footer());
  root.append($('v7notice'));
  const originalSummary=root.querySelector('.summary');originalSummary.hidden=true;root.append(originalSummary);
  board.remove();root.querySelector('.footerkeys')?.remove();
  const nav=el('nav','tab-bar');nav.setAttribute('aria-label','钢琴小屋主导航');
  for(const [key,label,type] of [['practice','练琴','home'],['weekly','本周','chart'],['mine','我的','user']]){
    const b=el('button','',icon(type)+'<span>'+label+'</span>');b.type='button';b.dataset.page=key;b.setAttribute('aria-controls','page-'+key);nav.append(b);
  }
  root.append(nav);
  const titles={practice:['home','钢琴小屋'],weekly:['chart','本周练琴'],mine:['user','我的小屋']};
  function show(page){
    if(!pages[page])page='practice';
    Object.entries(pages).forEach(([key,n])=>{n.hidden=key!==page;});
    nav.querySelectorAll('button').forEach(b=>{b.classList.toggle('selected',b.dataset.page===page);if(b.dataset.page===page)b.setAttribute('aria-current','page');else b.removeAttribute('aria-current');});
    root.dataset.page=page;header.querySelector('.title').innerHTML=icon(titles[page][0])+'<span>'+titles[page][1]+'</span>';
    controls.hidden=page!=='practice';screens.scrollTop=0;window.scrollTo({top:0,behavior:'instant'});
  }
  nav.addEventListener('click',e=>{const b=e.target.closest('button[data-page]');if(b)show(b.dataset.page);});
  function editProfile(){ $('v7profileButton').click(); }
  $('editName').onclick=editProfile;$('switchMember').onclick=editProfile;
  let memberSignature='';
  function refreshDecorations(){
    const p=window.P7.current();
    $('memberName').textContent=p.name;$('memberAvatar').textContent=p.avatar;
    $('memberAvatar').dataset.avatar=p.avatar;$('profileAvatar').dataset.avatar=p.avatar;
    const days=Object.values(p.history).filter(ms=>ms>0).length;
    $('practiceDays').textContent='已练琴 '+days+' 天';
    const chartValues=Array.from($('v7weekly').querySelectorAll('.v7-bar-value'),n=>Number.parseInt(n.textContent,10)||0);
    const chartMax=Math.max(p.dailyGoal,...chartValues,1);
    $('chartAxis').replaceChildren(...Array.from({length:5},(_,i)=>{const n=el('span');n.textContent=Math.round(chartMax*(4-i)/4)+' 分';return n;}));
    const detail=$('v7dayDetail');
    if(detail.textContent.startsWith('点击日历') && $('v7monthTitle').textContent===new Date().getFullYear()+'年'+(new Date().getMonth()+1)+'月'){
      const now=new Date(),ms=p.history[window.P7.dateKey(now)]||0;
      detail.textContent=(now.getMonth()+1)+'月'+now.getDate()+'日 · '+Math.floor(ms/60000)+' 分钟'+(ms>=p.dailyGoal*60000?' · 达成目标 ⭐':' · 今日练琴');
    }
    for(const [prefix,id] of [['daily','v7dailyProgress'],['weekly','v7weeklyProgress']]){
      const progress=$(id);$(prefix+'Percent').textContent=progress.style.width||'0%';
      progress.parentElement.setAttribute('role','progressbar');progress.parentElement.setAttribute('aria-valuenow',parseFloat(progress.style.width)||0);
      progress.parentElement.setAttribute('aria-valuemin','0');progress.parentElement.setAttribute('aria-valuemax','100');progress.parentElement.setAttribute('aria-label',prefix==='daily'?'今日目标完成比例':'本周目标完成比例');
    }
    const starCount=Number.parseInt($('v7stars').textContent,10)||0;
    $('starRow').innerHTML=Array.from({length:5},(_,i)=>'<span class="'+(i<Math.min(5,starCount)?'earned':'')+'">'+icon('star')+'</span>').join('');
    $('starRow').setAttribute('aria-hidden','true');
    let profiles=[];try{profiles=JSON.parse(localStorage.getItem('piano-cottage-v7-data')||'{}').profiles||[];}catch{}
    const signature=JSON.stringify(profiles.map(x=>[x.id,x.name,x.avatar]))+p.id;
    if(signature!==memberSignature){
      memberSignature=signature;const members=$('members');members.replaceChildren();
      for(const person of profiles){
        const b=el('button','member'+(person.id===p.id?' selected':''));b.type='button';b.setAttribute('aria-label','切换到'+person.name);b.setAttribute('aria-pressed',String(person.id===p.id));
        const av=el('span','portrait');av.textContent=person.avatar;av.dataset.avatar=person.avatar;const name=el('span','member-name');name.textContent=person.name;b.append(av,name);
        b.onclick=async()=>{await window.PianoSession.switchTo(person.id);refreshDecorations();};members.append(b);
      }
      const add=el('button','member add-member','<span class="portrait">＋</span><span class="member-name">添加用户</span>');add.type='button';add.onclick=()=>{editProfile();$('v7name').value='';$('v7name').focus();};members.append(add);
    }
  }
  // P7 renders on profile edits, navigation and timer saves. Observe its bound UI,
  // not storage writes, so the current browser updates without changing records.
  const observer=new MutationObserver(refreshDecorations);
  for(const id of ['profileName','profileAvatar','v7stars','v7streak','v7todayGoal','v7weekGoal'])observer.observe($(id),{childList:true,subtree:true,characterData:true});
  window.addEventListener('storage',refreshDecorations);
  refreshDecorations();show('practice');
})();
