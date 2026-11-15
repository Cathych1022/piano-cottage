'use strict';
/* Piano Cottage v11: compact first-screen layout, accessible AI detail control.
   Does not alter sound classification, timing, user data or event handlers. */
(function(){
 const root=document.querySelector('.storybook-v9 .app');
 if(!root) return;
 const $=id=>document.getElementById(id);
 const title=root.querySelector('.title');
 if(title){
   title.textContent='⌂ 钢琴小屋';
   const version=document.createElement('small');
   version.className='sb-mini-version';
   version.textContent='v11';
   title.append(version);
 }
 root.querySelector('.sb-version-chip')?.remove();
 const footVersion=root.querySelector('.v7-version');
 if(footVersion)footVersion.textContent='水彩童话版';
 const hero=root.querySelector('.scene');
 if(hero){
  hero.setAttribute('aria-label','窗边阳光、钢琴、乐谱和睡觉的橘猫');
 }
 const caption=root.querySelector('.sb-hero-caption');
 if(caption)caption.innerHTML='🌸 猫咪陪你练钢琴 🎹';
 const paper=root.querySelector('.paper');
 const meter=$('micDiagnostic');
 const countdown=$('countdown');
 if(paper&&meter&&countdown&&!$('sb-ai-details')){
   const details=document.createElement('details');
   details.className='sb-ai-details';
   details.id='sb-ai-details';
   const summary=document.createElement('summary');
   summary.innerHTML='<span class="sb-diagnostic-title">🎙 AI 钢琴识别</span><span id="sb-ai-state">等待监听</span><span class="sb-ai-chevron" aria-hidden="true">⌄</span>';
   details.append(summary,meter);
   countdown.after(details);
   // Keep the existing live diagnostics; only change their presentation.
   const status=$('detectValue');
   const compact=$('sb-ai-state');
   const update=()=>{
     if(!status||!compact)return;
     const value=status.textContent||'';
     compact.textContent=/钢琴已确认|连续演奏/.test(value)?'🎹 检测到钢琴':
       /人声/.test(value)?'人声不计时':
       /正在|加载/.test(value)?'AI 加载中':
       /已启动|等待钢琴/.test(value)?'等待钢琴':
       /关闭/.test(value)?'未开启':'可展开查看详情';
   };
   update();
   if(status&&typeof MutationObserver!=='undefined')new MutationObserver(update).observe(status,{childList:true,subtree:true,characterData:true});
 }
 const decorative=root.querySelector('.sb-cat-peek');
 if(decorative)decorative.setAttribute('aria-hidden','true');
 const nav=root.querySelector('.sb-tab-bar');
 if(nav)nav.setAttribute('aria-label','钢琴小屋主导航');
})();
