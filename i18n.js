'use strict';
/* Localize the presentation of the existing app. Canonical Chinese source text
   stays available to legacy presentation readers; profile data is never edited. */
(() => {
  const KEY='piano-cottage-language';
  let language='zh';
  try { if(localStorage.getItem(KEY)==='en')language='en'; } catch {}
  const english={
    '钢琴小屋':'Piano Cottage','钢琴小屋 · 自动练琴计时':'Piano Cottage · Practice Timer',
    '小屋设置':'Cottage settings','聆听琴声':'Listen to the piano','界面语言':'Language',
    '选择中文':'Use Chinese','选择英语':'Use English','语言选择会保存在此设备。':'Your language is saved on this device.',
    '识别灵敏度：':'Sound sensitivity: ','非常严格':'Very strict','严格':'Strict','标准':'Standard','宽松':'Relaxed','很宽松':'Very relaxed',
    '小屋会分辨钢琴声与人声，仅累计确认的钢琴片段。连续 5 秒未识别到钢琴，会自动暂停；再次弹奏即可继续。':'Only recognized piano playing counts. After 5 seconds without piano, the timer pauses. Play again to resume.',
    '建议在安静的环境使用“标准”或“严格”模式。识别仍可能漏判或误判，请保持页面在前台。':'Use Standard or Strict in a quiet room. Recognition can make mistakes. Keep this page in the foreground.',
    '完成':'Done','取消':'Cancel','监听设置':'Cottage settings','练琴':'Practice','本周':'Week','我的':'Me','本周统计':'Weekly statistics',
    '本周练琴':'This week','我的小屋':'My cottage','钢琴小屋主导航':'Piano Cottage navigation',
    '等待钢琴声音':'Waiting for piano','连续演奏识别中':'Piano playing detected','已暂停':'Paused',
    '本次练琴时长':'Practice time this session','练琴计时':'Practice timer','开始监听':'Start listening','停止监听':'Stop listening','重置':'Reset','重置本次计时':'Reset this session',
    '点击开始监听，让琴声点亮小屋':'Tap Start to fill your cottage with music',
    '连续 5 秒未识别到钢琴后自动暂停':'Pauses after 5 seconds without piano',
    '轻触开始，聆听琴声':'Ready to listen','正在准备钢琴识别…':'Preparing piano recognition…',
    '听到人声，暂不计时':'Speech detected · timer paused','正在聆听 · 等待琴声':'Listening · waiting for piano',
    '每一个音符，都值得被珍藏':'Every note is worth keeping',
    '麦克风音频仅在本机分析，不上传录音。首次使用需联网加载识别模型；仅确认的钢琴片段计时。':'Audio is analyzed on this device and never uploaded. An internet connection is needed for the first model download. Only recognized piano playing counts.',
    '🎙 麦克风':'🎙 Microphone','AI 未加载':'AI not loaded','AI 检测 · 只统计确认的钢琴片段':'AI detection · only recognized piano counts',
    'AI 确认是钢琴声音，正在累计有效练习时间 ♪':'Piano recognized · practice time is counting ♪',
    '✅ 钢琴已确认':'✅ Piano confirmed','🎹 连续演奏识别中':'🎹 Piano playing detected','🗣️ 识别到人声，不计时':'🗣️ Speech detected · not counted','🎵 正在核验演奏片段':'🎵 Checking the music','⛔ 未确认钢琴':'⛔ Piano not confirmed',
    '等待音频分析':'Waiting for audio','未知声音':'Unknown sound','再次弹奏即可继续累计':'Play again to resume',
    '超过 5 秒未识别到钢琴，自动暂停':'No piano for 5 seconds · paused',
    '🎹 正在监听连续演奏（短暂识别波动会自动容错）':'🎹 Listening to your playing · brief gaps are OK',
    '正在下载钢琴识别 AI…':'Downloading piano recognition…','正在加载 Safari 兼容版钢琴 AI…':'Loading piano recognition for Safari…',
    '首次使用需联网下载 AI 模型（可能需要数秒）。音频只在手机上分析。':'First use needs an online model download. This may take a few seconds. Audio stays on your phone.',
    '请使用 HTTPS Safari 打开应用':'Open this app over HTTPS in Safari',
    'AI 已启动，等待钢琴':'AI ready · waiting for piano','钢琴 AI 检测 · Safari 兼容模式（仅 Piano 计时）':'Piano AI · Safari mode (only piano counts)',
    '请弹奏钢琴，AI 正在分辨钢琴声和人声':'Play your piano · listening for piano and speech',
    '监听已关闭，点击按钮重新开始':'Listening stopped · tap Start to listen again',
    '超过 5 秒未检测到钢琴后暂停；停顿不计时':'Pauses after 5 seconds without piano; silence is not counted',
    '监听已关闭':'Listening off','重置本次累计时间？今日练习记录不会清除。':'Reset this session timer? Today’s saved practice will be kept.',
    '锁屏/进入后台时 iPhone 可能停止音频分析，请保持 App 在前台':'Your iPhone may stop audio analysis when locked or in the background. Keep the app visible.',
    '今日目标':'Daily goal','本周目标':'Weekly goal','调整练琴目标':'Edit practice goals','本周练琴时长':'Practice this week',
    '上一周':'Previous week','下一周':'Next week','上一月':'Previous month','下一月':'Next month','一周练习时间柱状图':'Weekly practice time chart',
    '星星奖励':'Star rewards','连续练琴':'Day streak','本周总时长':'Weekly total','比上周':'vs. last week','首次记录':'First record','暂无变化':'No change',
    '今日目标完成比例':'Daily goal progress','本周目标完成比例':'Weekly goal progress',
    '一':'Mon','二':'Tue','三':'Wed','四':'Thu','五':'Fri','六':'Sat','日':'Sun',
    '今天已完成目标，获得一颗小星星！':'Today’s goal reached · a star for you!',
    '每天达到目标就能收集一颗星星 ✨':'Reach your daily goal to collect a star ✨',
    '点击日历日期，查看当日练琴时间':'Tap a date to see your practice time',
    '切换用户⌄':'Switch player⌄','添加用户':'Add player','导出备份':'Export backup','恢复备份':'Restore backup',
    '练琴记录保存在此设备，备份让回忆安心留存。':'Your practice stays on this device. Back it up to keep it safe.',
    '🐱 练琴者管理':'Your cottage friends','姓名':'Name','例如：Elly':'For example: Elly',
    '保存当前用户':'Save player','＋ 新建用户':'＋ Add player','删除当前用户及其记录':'Delete player and practice history',
    '男孩':'Boy','女孩':'Girl','小猫':'Kitten','小狗':'Puppy','独角兽':'Unicorn',
    '男孩头像':'Boy avatar','女孩头像':'Girl avatar','草帽女孩头像':'Girl avatar','小猫头像':'Kitten avatar','小狗头像':'Puppy avatar','独角兽头像':'Unicorn avatar',
    '🎯 设置练琴目标':'Set practice goals','每日目标（分钟）':'Daily goal (minutes)','每周目标（分钟）':'Weekly goal (minutes)',
    '每天达到每日目标获得 ⭐。连续练琴天数按有钢琴练习记录的自然日计算。':'Earn a ⭐ when you reach your daily goal. Your streak counts consecutive days with piano practice.',
    '保存目标':'Save goals','用户资料已保存':'Player saved','用户已删除':'Player deleted','目标已保存':'Goals saved',
    '每日目标需为 1–360 分钟，每周目标需为 1–3000 分钟':'Choose 1–360 minutes daily and 1–3000 minutes weekly.',
    '至少保留一个用户':'Keep at least one player','请输入新用户名':'Enter a name for the new player','请输入姓名':'Enter a name','姓名不能为空':'Name cannot be empty','最多支持 30 个用户':'You can have up to 30 players',
    '存储空间不可用，请先导出备份':'Storage is unavailable. Export a backup first.',
    '备份已生成，请将 JSON 文件保存到 iPhone 文件 App 或云盘。':'Backup created. Save the JSON file to Files or your cloud storage.',
    '备份文件超过 2MB':'Backup is larger than 2 MB',
    '恢复备份会覆盖本机 v7 的全部用户和练琴记录。确定继续吗？':'Restoring replaces all players and practice records on this device. Continue?',
    '备份恢复成功！':'Backup restored!',
    '不是有效的 v7 备份（用户数量不正确）':'Invalid v7 backup (incorrect number of players)',
    '备份中存在无效用户':'The backup contains an invalid player','备份存在重复或无效用户 ID':'The backup contains duplicate or invalid player IDs',
    '练习小记':'Practice notes','今日练习':'Today','近 7 天':'Last 7 days','当前练琴者':'Current player',
    '阳光洒进花藤环绕的小屋，窗边有钢琴、乐谱和熟睡的小猫':'A sunny cottage with flowers, a piano, sheet music and a sleeping kitten'
  };
  const months=['Jan','Feb','Mar','Apr','May','Jun','Jul','Aug','Sep','Oct','Nov','Dec'];
  const rules=[
    [/^已练琴 (\d+) 天$/,(_,n)=>`${n} practice ${n==='1'?'day':'days'}`],
    [/^已切换至 (.+)，点击开始监听$/,(_,name)=>`Switched to ${name} · tap Start to listen`],
    [/^切换到(.+)$/,(_,name)=>`Switch to ${name}`],
    [/^已创建用户：(.+)$/,(_,name)=>`Player created: ${name}`],
    [/^永久删除「(.+)」及其全部练琴记录？建议先导出备份。$/,(_,name)=>`Permanently delete “${name}” and all their practice? Export a backup first.`],
    [/^(\d+)月(\d+)日 — (\d+)月(\d+)日$/,(_,m,d,m2,d2)=>`${months[+m-1]} ${d} – ${months[+m2-1]} ${d2}`],
    [/^(\d+)年(\d+)月$/,(_,y,m)=>`${months[+m-1]} ${y}`],
    [/^(\d+)月(\d+)日 · (\d+) 分钟 · (达成目标 ⭐|今日练琴)$/,(_,m,d,n,s)=>`${months[+m-1]} ${d} · ${n} min · ${s==='今日练琴'?'Today’s practice':'Goal reached ⭐'}`],
    [/^(\d{4}-\d{2}-\d{2}) · (.+?)( · 达成目标 ⭐)?$/,(_,d,n,goal)=>`${d} · ${t(n)}${goal?' · Goal reached ⭐':''}`],
    [/^(\d{4}-\d{2}-\d{2})：(.+)$/,(_,d,n)=>`${d}: ${t(n)}`],
    [/^(\d+) \/ (\d+) 分钟$/,(_,n,goal)=>`${n} / ${goal} min`],
    [/^(\d+)\s*(?:分钟|分)$/,(_,n)=>`${n} min`],
    [/^(\d+)(?:小时|时)(\d+)分$/,(_,h,m)=>`${h}h ${m}m`],
    [/^(\d+) 天$/,(_,n)=>`${n} ${n==='1'?'day':'days'}`],
    [/^钢琴 (\d+)% · 人声 (\d+)%$/,(_,p,s)=>`Piano ${p}% · Voice ${s}%`],
    [/^AI 判断：(.+) · 钢琴 (\d+)% · 人声 (\d+)% · 音乐 (\d+)% · 连续识别 (是|否)$/,(_,label,p,s,m,yes)=>`AI: ${t(label)} · Piano ${p}% · Voice ${s}% · Music ${m}% · Continuous: ${yes==='是'?'yes':'no'}`],
    [/^尚未确认钢琴，([\d.]+) 秒后暂停（未确认片段不计时）$/,(_,s)=>`Waiting for piano · pausing in ${s}s (unconfirmed audio does not count)`],
    [/^(备份失败：|恢复失败：|AI 音频分类失败：)(.*)$/s,(_,prefix,reason)=>({'备份失败：':'Backup failed: ','恢复失败：':'Restore failed: ','AI 音频分类失败：':'Audio classification failed: '}[prefix])+t(reason)],
    [/^无法启动钢琴 AI：(.*)。请保持联网并在 Safari 重新打开。$/s,(_,reason)=>`Could not start piano recognition: ${t(reason)}. Check your connection and reopen in Safari.`],
    [/^AI 模块加载失败（两条线路均失败）。(.*)$/s,(_,reason)=>`Could not load recognition from either server. ${t(reason)}`],
    [/^(.+)头像$/,(_,name)=>`${name} avatar`]
  ];
  function t(source){
    if(language==='zh'||typeof source!=='string')return source;
    const match=source.match(/^(\s*)(.*?)(\s*)$/s),text=match[2];
    let result=english[text];
    if(result===undefined){for(const [pattern,format] of rules){const found=text.match(pattern);if(found){result=format(...found);break;}}}
    if(result===undefined&&text.includes('音频运行文件加载失败（检查 CDN 资源或浏览器兼容性）'))result=text.replaceAll('音频运行文件加载失败（检查 CDN 资源或浏览器兼容性）','Audio runtime failed to load (check the CDN or browser compatibility)');
    return result===undefined?source:match[1]+result+match[3];
  }
  const texts=new WeakMap(),attributes=new WeakMap();
  function sourceText(node){
    if(node.nodeType===3){const saved=texts.get(node);return saved&&node.data===saved.rendered?saved.source:node.data;}
    return Array.from(node.childNodes||[],sourceText).join('');
  }
  const api={t,sourceText,get language(){return language},confirm:source=>window.confirm(t(source))};
  window.I18n=api;
  if(typeof document==='undefined')return;
  const excluded='script,style,input,textarea,[data-no-i18n],[data-user-content],#profileName,#memberName';
  const attrNames=['aria-label','title','placeholder'];
  function translateText(node){
    if(node.parentElement?.closest(excluded))return;
    const old=texts.get(node),source=old&&node.data===old.rendered?old.source:node.data;
    const rendered=t(source);texts.set(node,{source,rendered});if(node.data!==rendered)node.data=rendered;
  }
  function translateAttributes(el){
    if(el.matches('script,style,[data-no-i18n]'))return;
    let saved=attributes.get(el);if(!saved){saved={};attributes.set(el,saved);}
    for(const name of attrNames){if(!el.hasAttribute(name))continue;const current=el.getAttribute(name),old=saved[name];
      const source=old&&current===old.rendered?old.source:current,rendered=t(source);saved[name]={source,rendered};
      if(current!==rendered)el.setAttribute(name,rendered);
    }
  }
  function translateTree(root){
    if(root.nodeType===3){translateText(root);return;}
    if(root.nodeType!==1)return;
    translateAttributes(root);
    const walker=document.createTreeWalker(root,NodeFilter.SHOW_ELEMENT|NodeFilter.SHOW_TEXT);
    while(walker.nextNode()){const node=walker.currentNode;if(node.nodeType===3)translateText(node);else translateAttributes(node);}
  }
  let observer;
  function apply(){
    // Drain pending application writes before changing locale; sourceText can
    // still recover raw labels used by the legacy audio/status decorators.
    translateTree(document.body);observer?.takeRecords();
    document.documentElement.lang=language==='en'?'en':'zh-CN';
    document.title=t('钢琴小屋 · 自动练琴计时');
    document.querySelectorAll('[data-language]').forEach(b=>b.setAttribute('aria-pressed',String(b.dataset.language===language)));
  }
  api.setLanguage=next=>{
    if(!['zh','en'].includes(next))return;
    language=next;try{localStorage.setItem(KEY,next)}catch{}
    apply();window.dispatchEvent(new CustomEvent('languagechange',{detail:{language}}));
  };
  function boot(){
    observer=new MutationObserver(records=>{
      const roots=new Set();for(const record of records){
        if(record.type==='childList')record.addedNodes.forEach(n=>roots.add(n));else roots.add(record.target);
      }
      for(const root of roots)if(root.isConnected)translateTree(root);
      observer.takeRecords();
    });
    apply();observer.observe(document.body,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:attrNames});
    document.getElementById('languageOptions').addEventListener('click',e=>{const b=e.target.closest('[data-language]');if(b)api.setLanguage(b.dataset.language);});
    window.addEventListener('storage',e=>{if(e.key===KEY&&['zh','en'].includes(e.newValue)){language=e.newValue;apply();}});
  }
  if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',boot,{once:true});else boot();
})();
