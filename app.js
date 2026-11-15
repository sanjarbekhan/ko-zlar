/* Ko‘zlarini tiysinlar! — mustaqil reja ilovasi (v1). No third-party code or dependencies. */
(() => {
  'use strict';
  const KEY = 'kozlarini-ozimizning-reja-v1';
  const FIRED_KEY = KEY + '-fired';
  const DAYS = ['Du', 'Se', 'Ch', 'Pa', 'Ju', 'Sh', 'Ya'];
  const WEEKDAY_NAMES = ['Dushanba', 'Seshanba', 'Chorshanba', 'Payshanba', 'Juma', 'Shanba', 'Yakshanba'];
  const MONTHS = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avgust','sentabr','oktabr','noyabr','dekabr'];
  const QUOTES = [
    { ar:'﴿ قُل لِّلْمُؤْمِنِينَ يَغُضُّوا مِنْ أَبْصَارِهِمْ ﴾', uz:'Mo‘minlarga ayting: «Ko‘zlarini tiysinlar…»', src:'Nur surasi, 30-oyat (mazmunidan)' },
    { ar:'﴿ أَلَمْ يَعْلَم بِأَنَّ اللَّهَ يَرَىٰ ﴾', uz:'«Axir u Allohning ko‘rib turishini bilmasmidi?»', src:'Alaq surasi, 14-oyat' },
    { ar:'﴿ يَعْلَمُ خَائِنَةَ الْأَعْيُنِ وَمَا تُخْفِي الصُّدُورُ ﴾', uz:'«U ko‘zlarning xiyonatini ham, ko‘ngillar yashiradigan narsalarni ham biladi».', src:'G‘ofir surasi, 19-oyat (mazmunidan)' },
    { ar:'﴿ إِنَّ السَّمْعَ وَالْبَصَرَ وَالْفُؤَادَ كُلُّ أُولَٰئِكَ كَانَ عَنْهُ مَسْئُولًا ﴾', uz:'«Quloq, ko‘z va dil — bularning barchasi haqida so‘raladi».', src:'Isro surasi, 36-oyat (mazmunidan)' }
  ];
  const $ = id => document.getElementById(id);
  const pad = n => String(n).padStart(2,'0');
  const dateKey = d => [d.getFullYear(),pad(d.getMonth()+1),pad(d.getDate())].join('-');
  const dayDate = key => { const [y,m,d]=key.split('-').map(Number); return new Date(y,m-1,d); };
  const addDays = (d,n) => {const x=new Date(d);x.setHours(0,0,0,0);x.setDate(x.getDate()+n);return x;};
  const monDay = d => (d.getDay()+6)%7;
  const mondayOf = d => addDays(d,-monDay(d));
  const todayKey = () => dateKey(new Date());
  const safe = s => String(s ?? '').replace(/[&<>"']/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
  const validTime = s => /^([01]\d|2[0-3]):[0-5]\d$/.test(s || '');
  const timeDate = (date,time) => {const d=new Date(date);const [h,m]=time.split(':').map(Number);d.setHours(h,m,0,0);return d;};
  const fmtDay = k => {const d=dayDate(k);return d.getDate()+' '+MONTHS[d.getMonth()]+' · '+WEEKDAY_NAMES[monDay(d)];};
  const loadJson = (k,def) => {try{const obj=JSON.parse(localStorage.getItem(k));return obj&&typeof obj==='object'?obj:def;}catch{return def;}};
  const defaultState=()=>({version:1,tasks:[],done:{},settings:{privacy:false}});
  let data=loadJson(KEY, defaultState());
  if(!Array.isArray(data.tasks)||!data.done||typeof data.done!=='object')data=defaultState();
  data.settings={privacy:false,...(data.settings||{})};
  let fired=loadJson(FIRED_KEY,{}), selected=todayKey(),weekOffset=0,editId=null,lastToday=todayKey(),openActions=null,timeoutToast=null;
  let lastTickStamp=0;
  const persist = () => {try{localStorage.setItem(KEY,JSON.stringify(data));return true;}catch {toast('Ma’lumotni saqlab bo‘lmadi. Xotirada joy borligini tekshiring.');return false;}};
  const completionSet = k => new Set(data.done[k]||[]);
  const eventsForTask = t => [{part:1,start:t.start,end:t.end||''},...(t.twice?[{part:2,start:t.start2,end:t.end2||''}]:[])];
  function occurs(t,k){
    if(t.archived || k < t.activeFrom) return false;
    if(t.repeat==='once')return t.date===k;
    if(t.repeat==='weekly')return Array.isArray(t.days)&&t.days.includes(monDay(dayDate(k)));
    return t.repeat==='daily';
  }
  const forDay=k=>data.tasks.filter(t=>occurs(t,k)).sort((a,b)=>a.start.localeCompare(b.start)||a.createdAt-b.createdAt);
  const isDone=(k,id,part)=>completionSet(k).has(id+':'+part);
  function quote(){
    const q=QUOTES[Math.floor(dayDate(todayKey()).getTime()/86400000)%QUOTES.length];
    $('quote-ar').textContent=q.ar;$('quote-uz').textContent=q.uz;$('quote-src').textContent=q.src;
  }
  function setView(name){
    document.querySelectorAll('.view').forEach(el=>{let yes=el.id===name+'-view';el.hidden=!yes;el.classList.toggle('active',yes);});
    document.querySelectorAll('.nav-btn').forEach(btn=>{let yes=btn.dataset.view===name;btn.classList.toggle('active',yes);yes?btn.setAttribute('aria-current','page'):btn.removeAttribute('aria-current');});
    if(name==='stats')renderStats();if(name==='settings')updateNotificationStatus();
    if(name==='home')renderHome();
    window.scrollTo({top:0,behavior:'smooth'});
  }
  function renderWeek(){
    const base=addDays(mondayOf(dayDate(todayKey())),weekOffset*7);
    $('today-heading').textContent=selected===todayKey()?'Bugungi reja':fmtDay(selected);
    const box=$('week-strip');box.innerHTML='';
    for(let i=0;i<7;i++){
      const d=addDays(base,i),k=dateKey(d),has=forDay(k).length>0;
      const btn=document.createElement('button');btn.type='button';btn.className='day-btn'+(k===selected?' selected':'')+(k===todayKey()?' today':'')+(has?' has-tasks':'');
      btn.setAttribute('aria-label',fmtDay(k));btn.setAttribute('aria-pressed',String(k===selected));
      btn.innerHTML='<span class="weekday">'+DAYS[i]+'</span><strong>'+d.getDate()+'</strong><span class="day-mark"></span>';
      btn.addEventListener('click',()=>{selected=k;renderHome();});box.appendChild(btn);
    }
  }
  function renderTasks(){
    const tasks=forDay(selected),done=completionSet(selected),list=$('task-list');list.innerHTML='';
    if(!tasks.length){list.innerHTML='<div class="empty-state"><div class="empty-icon">✧</div><h3>Hali reja kiritilmagan</h3><p>Kuningiz uchun aniq vaqtli vazifa qo‘shing.</p><button type="button" id="empty-add">＋ Birinchi rejani qo‘shish</button></div>';$('empty-add').onclick=()=>openForm();}
    let total=0,checked=0;
    for(const t of tasks){
      const parts=eventsForTask(t);total+=parts.length;checked+=parts.filter(p=>done.has(t.id+':'+p.part)).length;
      const isComplete=parts.every(p=>done.has(t.id+':'+p.part));
      const card=document.createElement('article');card.className='task-card'+(isComplete?' done':'');
      const canCheck=selected<=todayKey();
      card.innerHTML='<div class="task-checks">'+parts.map(p=>'<button type="button" class="check-task'+(done.has(t.id+':'+p.part)?' checked':'')+'" data-check="'+safe(t.id)+'" data-part="'+p.part+'" '+(canCheck?'':'disabled')+' aria-label="'+p.part+'-marta bajarildi deb belgilash" aria-pressed="'+done.has(t.id+':'+p.part)+'">'+(done.has(t.id+':'+p.part)?'✓':p.part)+'</button>').join('')+'</div><div class="task-info"><div class="task-title">'+safe(t.title)+'</div><div class="task-meta"><span>◷ '+safe(t.start)+(t.twice?' · '+safe(t.start2):'')+'</span>'+(t.reminder>=0?'<span>♧ '+(t.reminder===0?'Vaqtida':t.reminder+' daq. oldin')+'</span>':'')+'</div>'+(t.note?'<div class="task-note">'+safe(t.note)+'</div>':'')+(openActions===t.id?'<div class="task-actions"><button type="button" data-edit="'+safe(t.id)+'">Tahrirlash</button><button type="button" class="danger" data-delete="'+safe(t.id)+'">O‘chirish</button></div>':'')+'</div><button type="button" class="task-menu" data-menu="'+safe(t.id)+'" aria-label="Vazifa amallari" aria-expanded="'+(openActions===t.id)+'">⋯</button>';
      list.appendChild(card);
    }
    $('progress-caption').textContent=checked+' / '+total+' bajarildi';const pct=total?Math.round(checked/total*100):0;
    $('progress-pct').textContent=pct+'%';$('day-progress-fill').style.width=pct+'%';
  }
  function renderHome(){renderWeek();renderTasks();renderTimeline();}
  function instancesBetween(start,days){
    const arr=[];
    for(let n=0;n<days;n++){
      const d=addDays(start,n),k=dateKey(d),complete=completionSet(k);
      for(const t of forDay(k))for(const p of eventsForTask(t)){
        if(!validTime(p.start))continue;
        arr.push({id:t.id,title:t.title,part:p.part,at:timeDate(d,p.start),date:k,reminder:t.reminder,done:complete.has(t.id+':'+p.part)});
      }
    }
    return arr.sort((a,b)=>a.at-b.at);
  }
  function fmtRemaining(ms){
    const sec=Math.max(0,Math.ceil(ms/1000));const h=Math.floor(sec/3600),m=Math.floor(sec%3600/60),s=sec%60;
    if(h>=24)return Math.floor(h/24)+' kun '+h%24+' soat';
    if(h)return pad(h)+':'+pad(m)+':'+pad(s);
    return pad(m)+':'+pad(s);
  }
  function setText(id,value){const el=$(id);if(el)el.textContent=value;}
  function renderTimeline(){
    const now=new Date(),whenStart=addDays(now,-1),items=instancesBetween(whenStart,10),past=items.filter(i=>i.at<=now),future=items.filter(i=>i.at>now),previous=past.at(-1),next=future[0];
    const todayMark=timeDate(new Date(),'00:00');
    const start=previous?previous.at:todayMark;
    const limit=next?next.at:now;
    const percent=next?Math.min(100,Math.max(0,(now-start)/(limit-start)*100)):100;
    setText('last-task',previous?previous.title:'Kun boshlandi');
    setText('last-time',previous?previous.at.toLocaleTimeString('uz-UZ',{hour:'2-digit',minute:'2-digit'}):'00:00');
    setText('last-symbol',previous?.done?'✓':'●');
    setText('next-task',next?next.title:'Rejalar tugadi');
    setText('next-time',next?(next.date===todayKey()?'Bugun ':next.date===dateKey(addDays(now,1))?'Ertaga ':next.date+' ')+pad(next.at.getHours())+':'+pad(next.at.getMinutes()):'—');
    setText('next-symbol',next?'◷':'✓');
    setText('now-clock',pad(now.getHours())+':'+pad(now.getMinutes()));
    $('timeline-fill').style.width=percent.toFixed(2)+'%';
    setText('track-caption',next?Math.round(percent)+'% o‘tdi':'Bugungi tartib');
    setText('countdown',next?fmtRemaining(next.at-now):'Barchasi tugadi');
    setText('pace',!next?'Kuningiz barakali o‘tsin':next.at-now<=600000?'Tayyorlanish vaqti!':'Har daqiqa qadrlidir');
    $('next-circle').classList.toggle('imminent',!!next&&next.at-now<=600000);
    const display = next && next.at-now<=600000 && next.date===todayKey();
    $('reminder-banner').hidden=!display;
    if(display)setText('reminder-message',next.title+' · '+Math.ceil((next.at-now)/60000)+' daqiqa qoldi');
  }
  function renderStats(){
    let tot=0,dn=0,streak=0,pct7=[];
    for(let i=29;i>=0;i--){const k=dateKey(addDays(new Date(),-i)),tasks=forDay(k),set=completionSet(k);let total=0,ok=0;
      for(const t of tasks)for(const p of eventsForTask(t)){total++;if(set.has(t.id+':'+p.part))ok++;}
      tot+=total;dn+=ok;if(i<=6)pct7.push({day:DAYS[monDay(dayDate(k))],pct:total?Math.round(ok/total*100):0,total});
    }
    for(let i=0;i<365;i++){const k=dateKey(addDays(new Date(),-i)),tasks=forDay(k),set=completionSet(k);const all=tasks.flatMap(t=>eventsForTask(t).map(p=>t.id+':'+p.part));
      if(i===0&&all.some(x=>!set.has(x)))continue;
      if(!all.length || all.some(x=>!set.has(x)))break;streak++;
    }
    const rate=tot?Math.round(dn/tot*100):0;
    $('stats-metrics').innerHTML='<div class="metric"><strong>'+rate+'%</strong><span>30 KUNLIK NATIJA</span></div><div class="metric"><strong>'+streak+'</strong><span>KETMA-KET TO‘LIQ KUN</span></div><div class="metric"><strong>'+dn+'</strong><span>BAJARILGAN VAZIFALAR</span></div><div class="metric"><strong>'+data.tasks.length+'</strong><span>JAMI REJALAR</span></div>';
    $('stats-bars').innerHTML=pct7.map(x=>'<div class="bar-col"><strong>'+x.pct+'%</strong><div class="bar-rail"><div class="bar-level" style="height:'+x.pct+'%"></div></div><span>'+x.day+'</span></div>').join('');
    const next=instancesBetween(new Date(),8).filter(x=>x.at>=new Date()).slice(0,6);
    $('upcoming-list').innerHTML=next.length?next.map(x=>'<div class="upcoming-line"><span>'+safe(x.title)+'</span><small>'+safe(x.date.slice(5))+' · '+pad(x.at.getHours())+':'+pad(x.at.getMinutes())+'</small></div>').join(''):'<p class="settings-hint">Yaqin orada reja yo‘q.</p>';
  }
  function openForm(id=null){
    editId=id;const t=id?data.tasks.find(x=>x.id===id):null;
    $('task-modal-title').textContent=t?'Rejani tahrirlash':'Yangi reja';
    $('task-form').reset();
    $('task-title').value=t?.title||'';
    $('task-start').value=t?.start||'09:00';$('task-end').value=t?.end||'';
    $('task-twice').checked=!!t?.twice;$('task-start2').value=t?.start2||'17:00';$('task-end2').value=t?.end2||'';
    $('task-repeat').value=t?.repeat||'daily';$('task-date').value=t?.date||selected;
    $('task-reminder').value=String(t?.reminder??10);$('task-note').value=t?.note||'';
    const all=t?.days||[0,1,2,3,4,5,6];
    document.querySelectorAll('#weekday-picker input').forEach(ch=>ch.checked=all.includes(Number(ch.value)));
    $('form-error').textContent='';syncRepeat();syncSecond();
    $('task-modal').hidden=false;document.body.style.overflow='hidden';
    requestAnimationFrame(()=>$('task-title').focus());
  }
  function closeForm(){ $('task-modal').hidden=true;document.body.style.overflow='';editId=null; }
  function syncSecond(){$('second-time').hidden=!$('task-twice').checked;}
  function syncRepeat(){let rep=$('task-repeat').value;$('weekday-picker').hidden=rep!=='weekly';$('once-field').hidden=rep!=='once';}
  const uid = () => 'r'+Date.now().toString(36)+'-'+Math.random().toString(36).slice(2,9);
  function saveForm(ev){
    ev.preventDefault();const title=$('task-title').value.trim(),start=$('task-start').value,end=$('task-end').value,twice=$('task-twice').checked;
    const start2=twice?$('task-start2').value:'',end2=twice?$('task-end2').value:'',repeat=$('task-repeat').value,date=$('task-date').value;
    const days=[...document.querySelectorAll('#weekday-picker input:checked')].map(e=>Number(e.value));let err='';
    if(!title)err='Reja nomini kiriting.';
    else if(!validTime(start))err='Boshlanish vaqtini belgilang.';
    else if(end&&(!validTime(end)||end<=start))err='Tugash vaqti boshlanishdan keyin bo‘lsin.';
    else if(twice&&(!validTime(start2)||start2<=start))err='Ikkinchi vaqt birinchi vaqtdan keyin bo‘lsin.';
    else if(twice&&end&&start2<end)err='Ikkinchi reja birinchisi tugagach boshlansin.';
    else if(twice&&end2&&(!validTime(end2)||end2<=start2))err='Ikkinchi tugash vaqti noto‘g‘ri.';
    else if(repeat==='weekly'&&!days.length)err='Kamida bitta hafta kunini tanlang.';
    else if(repeat==='once'&&!/^\d{4}-\d{2}-\d{2}$/.test(date))err='Sanani belgilang.';
    if(err){$('form-error').textContent=err;return;}
    const prev=editId?data.tasks.find(x=>x.id===editId):null;
    const t={id:prev?.id||uid(),title,start,end,twice,start2,end2,repeat,days,date:repeat==='once'?date:'',activeFrom:prev?.activeFrom||(repeat==='once'?date:selected),reminder:Number($('task-reminder').value),note:$('task-note').value.trim(),createdAt:prev?.createdAt||Date.now()};
    if(prev){const idx=data.tasks.findIndex(x=>x.id===editId);data.tasks[idx]=t;}else data.tasks.push(t);
    if(persist()){closeForm();openActions=null;renderHome();renderStats();toast(prev?'Reja yangilandi.':'Yangi reja saqlandi.');}
  }
  function onTaskListClick(e){
    const b=e.target.closest('button');if(!b)return;
    const id=b.dataset.check||b.dataset.menu||b.dataset.edit||b.dataset.delete;
    if(!id)return;
    if(b.dataset.check){if(selected>todayKey())return;const part=Number(b.dataset.part),token=id+':'+part,done=completionSet(selected);done.has(token)?done.delete(token):done.add(token);data.done[selected]=[...done];if(persist()){renderHome();renderStats();}return;}
    if(b.dataset.menu){openActions=openActions===id?null:id;renderTasks();return;}
    if(b.dataset.edit){openForm(id);return;}
    if(b.dataset.delete&&window.confirm('Ushbu rejani butunlay o‘chirasizmi?')){
      data.tasks=data.tasks.filter(t=>t.id!==id);
      for(const k of Object.keys(data.done))data.done[k]=data.done[k].filter(x=>!x.startsWith(id+':'));
      if(persist()){openActions=null;renderHome();renderStats();toast('Reja o‘chirildi.');}
    }
  }
  function toast(message,withButton=null){
    const region=$('toast-region'),item=document.createElement('div');item.className='toast';
    const p=document.createElement('span');p.textContent=message;item.appendChild(p);
    if(withButton){const b=document.createElement('button');b.type='button';b.textContent=withButton.label;b.onclick=()=>{withButton.action();item.remove();};item.appendChild(b);}
    region.appendChild(item);while(region.childElementCount>3)region.firstChild.remove();
    setTimeout(()=>item.remove(),8000);
  }
  async function enableNotifications(){
    if(!('Notification' in window)){toast('Bu brauzer bildirishnomalarni qo‘llamaydi.');return;}
    if(!window.isSecureContext){toast('Bildirishnoma uchun HTTPS yoki localhost kerak.');return;}
    try{const permission=await Notification.requestPermission();updateNotificationStatus();toast(permission==='granted'?'Bildirishnomalar yoqildi.':'Bildirishnomaga ruxsat berilmadi.');}
    catch{toast('Bildirishnomaga ruxsat so‘rash imkoni bo‘lmadi.');}
  }
  function updateNotificationStatus(){
    const supported='Notification' in window;
    const txt=!supported?'Bu brauzer bildirishnomalarni qo‘llamaydi.':!window.isSecureContext?'HTTPS kerak.':Notification.permission==='granted'?'Faol: sayt ochiq va ishlayotganida bildirishnomalar chiqadi.':Notification.permission==='denied'?'Ruxsat bloklangan. Brauzer sozlamalaridan yoqing.':'Hali ruxsat berilmagan. “Yoqish”ni bosing.';
    setText('notification-status',txt);
    $('enable-notifications').textContent=supported&&Notification.permission==='granted'?'✓ Faol':'Yoqish';
    $('enable-notifications').disabled=!supported||!window.isSecureContext||Notification.permission==='denied'||Notification.permission==='granted';
    $('privacy-toggle').checked=!!data.settings.privacy;
  }
  async function issueNotification(title,body,tag){
    if(!('Notification' in window)||Notification.permission!=='granted')return;
    const opts={body,tag,icon:'./icon-192.png',badge:'./icon-192.png',renotify:false};
    try{
      if('serviceWorker' in navigator){const reg=await navigator.serviceWorker.ready;await reg.showNotification(title,opts);}
      else new Notification(title,opts);
    }catch{try{new Notification(title,opts);}catch{}}
  }
  function reminderCheck(){
    const now=Date.now();const events=instancesBetween(addDays(new Date(),-1),3);
    for(const ev of events){
      if(ev.reminder<0||ev.done)continue;
      const alarm=ev.at.getTime()-ev.reminder*60000;
      if(now<alarm||now-alarm>120000)continue;
      const token=ev.date+':'+ev.id+':'+ev.part+':'+ev.reminder;
      if(fired[token])continue;
      fired[token]=now;
      const text=ev.title+(ev.part===2?' (2-marta)':'');
      toast('⏰ '+text+' — '+(ev.reminder===0?'vaqti keldi':ev.reminder+' daqiqa qoldi'));
      issueNotification(data.settings.privacy?'Reja eslatmasi':'Vazifa yaqinlashdi',data.settings.privacy?'Rejangizni tekshiring.':text,token);
    }
    for(const [k,v] of Object.entries(fired))if(now-Number(v)>8*86400000)delete fired[k];
    try{localStorage.setItem(FIRED_KEY,JSON.stringify(fired));}catch{}
  }
  function exportData(){
    const bytes=new Blob([JSON.stringify({...data,exportedAt:new Date().toISOString()},null,2)],{type:'application/json'}),url=URL.createObjectURL(bytes);
    const a=document.createElement('a');a.href=url;a.download='kozlarini-reja-'+todayKey()+'.json';document.body.appendChild(a);a.click();a.remove();setTimeout(()=>URL.revokeObjectURL(url),2000);
    toast('Zaxira nusxa tayyor.');
  }
  function adaptLegacy(obj){
    // Optional migration of a user-owned JSON backup from the older tracker.
    if(!Array.isArray(obj.habits))return null;
    const migrated=[];
    for(const h of obj.habits){
      const v=Array.isArray(h.v)?h.v.at(-1):h;
      if(!v||typeof v.name!=='string')continue;
      const schedule=v.sch||{t:'daily'};
      let repeat='daily';if(schedule.t==='once')repeat='once';else if(schedule.t==='days')repeat='weekly';else if(schedule.t==='off')continue;
      const time=obj.times?.[h.id]||{};
      migrated.push({id:uid(),title:v.name.slice(0,80),start:validTime(time.start)?time.start:'09:00',end:validTime(time.end)?time.end:'',twice:v.rep===2,start2:validTime(time.start2)?time.start2:'17:00',end2:validTime(time.end2)?time.end2:'',repeat,days:schedule.days||[0,1,2,3,4,5,6],date:schedule.date||h.from||todayKey(),activeFrom:h.from||todayKey(),reminder:-1,note:'',createdAt:Date.now()});
    }
    return {version:1,tasks:migrated,done:{},settings:{privacy:false}};
  }
  async function importData(e){
    const file=e.target.files?.[0];e.target.value='';if(!file)return;
    if(file.size>3*1024*1024){toast('Fayl juda katta.');return;}
    try{
      let obj=JSON.parse(await file.text());
      let legacy=false;
      if(!Array.isArray(obj.tasks)&&Array.isArray(obj.habits)){obj=adaptLegacy(obj);legacy=true;}
      if(!obj||!Array.isArray(obj.tasks)||!obj.done||obj.tasks.length>10000)throw Error('Noto‘g‘ri format');
      for(const x of obj.tasks)if(typeof x.id!=='string'||typeof x.title!=='string'||!validTime(x.start)||!['daily','once','weekly'].includes(x.repeat)||typeof x.activeFrom!=='string')throw Error('Noto‘g‘ri reja');
      if(!window.confirm('Import qilish joriy ma’lumotlarni almashtiradi. Davom etilsinmi?'))return;
      data={version:1,tasks:obj.tasks,done:obj.done,settings:{privacy:false,...(obj.settings||{})}};
      if(persist()){selected=todayKey();weekOffset=0;renderHome();renderStats();updateNotificationStatus();toast(legacy?'Eski rejalar olindi. Eski belgilashlar import qilinmadi.':'Ma’lumotlar tiklandi.');}
    }catch{toast('Faylni o‘qib bo‘lmadi. Reja JSON faylini tanlang.');}
  }
  function bind(){
    const btns=document.querySelectorAll('.nav-btn');btns.forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));
    $('open-settings').onclick=()=>setView('settings');
    $('add-task').onclick=()=>openForm();
    $('go-today').onclick=()=>{selected=todayKey();weekOffset=0;renderHome();};
    $('task-list').addEventListener('click',onTaskListClick);
    $('close-task-modal').onclick=closeForm;$('cancel-task').onclick=closeForm;
    $('task-modal').addEventListener('click',e=>{if(e.target.dataset.close)closeForm();});
    document.addEventListener('keydown',e=>{if(e.key==='Escape'&&!$('task-modal').hidden)closeForm();});
    $('task-form').addEventListener('submit',saveForm);
    $('task-twice').addEventListener('change',syncSecond);
    $('task-repeat').addEventListener('change',syncRepeat);
    $('enable-notifications').onclick=enableNotifications;
    $('privacy-toggle').addEventListener('change',e=>{data.settings.privacy=e.target.checked;persist();});
    $('export-data').onclick=exportData;
    $('import-data').addEventListener('change',importData);
    const weekNav=document.createElement('div');weekNav.className='week-nav';
    weekNav.innerHTML='<button type="button" id="week-prev" aria-label="Oldingi hafta">‹</button><span id="week-label">Hafta</span><button type="button" id="week-next" aria-label="Keyingi hafta">›</button>';
    $('week-strip').before(weekNav);
    $('week-prev').onclick=()=>{weekOffset=Math.max(-52,weekOffset-1);selected=dateKey(addDays(mondayOf(new Date()),weekOffset*7));renderHome();};
    $('week-next').onclick=()=>{weekOffset=Math.min(52,weekOffset+1);selected=dateKey(addDays(mondayOf(new Date()),weekOffset*7));renderHome();};
    const picker=$('weekday-picker');
    DAYS.forEach((w,i)=>{const label=document.createElement('label');label.innerHTML='<input type="checkbox" value="'+i+'" checked><span>'+w+'</span>';picker.appendChild(label);});
    document.addEventListener('visibilitychange',()=>{if(!document.hidden){tick();updateNotificationStatus();}});
  }
  function tick(){
    const current=todayKey();
    if(current!==lastToday){lastToday=current;quote();if(selected===dateKey(addDays(new Date(),-1))){selected=current;weekOffset=0;}renderHome();renderStats();}
    renderTimeline();
    if(Date.now()-lastTickStamp>=15000){lastTickStamp=Date.now();reminderCheck();}
    const first=addDays(new Date(),-2).getTime();
    if(Object.keys(data.done).length>400){ /* historical completions remain intact; no silent deletion */ }
  }
  bind();quote();renderHome();renderStats();updateNotificationStatus();tick();setInterval(tick,1000);
  if('serviceWorker' in navigator && (location.protocol==='https:'||location.hostname==='localhost')){
    window.addEventListener('load',()=>navigator.serviceWorker.register('./sw.js').catch(()=>{}));
  }
})();