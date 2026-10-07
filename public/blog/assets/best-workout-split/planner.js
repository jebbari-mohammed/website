/* IZEM calendar-fit planner. No network requests, storage, tracking or external dependencies.
   Scheduling comparisons only: never a workout dose, recovery score or medical recommendation. */
(function (root) {
  'use strict';
  const COPY = Object.freeze({
    days: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    shortDays: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'],
    full2: 'Full body · 2 visits', full3: 'Full body · 3 visits',
    upper2: 'Upper/lower · 2 visits', upper3: 'Rolling upper/lower · 3 visits',
    upper4: 'Upper/lower · 4 visits', hybrid5: 'Upper/lower + PPL · 5 visits',
    ppl6: 'Push/pull/legs · 6 visits',
    FA: 'Full body A', FB: 'Full body B', FC: 'Full body C',
    UA: 'Upper A', UB: 'Upper B', LA: 'Lower A', LB: 'Lower B',
    U: 'Upper', L: 'Lower', P: 'Push', Q: 'Pull', G: 'Legs',
    PA: 'Push A', PB: 'Push B', QA: 'Pull A', QB: 'Pull B',
    GA: 'Legs A', GB: 'Legs B',
    rest: 'No lifting scheduled',
    invalidDays: 'Choose between two and six different weekdays.',
    invalidTime: 'Choose one of the available session lengths.',
    invalidFragile: 'The uncertain day must be one of your selected weekdays.',
    lowerFrequency: 'This two-visit upper/lower option assigns only one session to each half per week. Compare it with the twice-weekly coverage guidance; do not treat it as equivalent to two full-body visits.',
    rotating: 'This is a two-week rotation: upper/lower/upper, then lower/upper/lower. Each half has three sessions over two weeks, not two every week.',
    fewer: 'This option uses fewer visits. An available day without a lifting label remains free; no extra session has been prescribed.',
    tight: 'A short time window still needs room for warm-up, working sets, rest and setup. This planner does not certify that the workout fits.',
    adjacent: 'At least one broad focus appears on consecutive calendar days, including the repeat-week boundary. Review the actual exercises, workload and recovery before using this arrangement.',
    boundary: 'Different labels do not prove full recovery or eliminate exercise overlap. The examples are not individualized prescriptions.',
    original: 'Week 1 sessions including each focus',
    after: 'Sessions remaining after the missed visit',
    countsNote: 'These are session labels, not set counts. They cannot compare training volume or predicted results.',
    pushLabel: 'Upper pushing', pullLabel: 'Upper pulling', legsLabel: 'Lower body',
    timeLabel: 'Workout time reserved per week',
    minutesLabel: 'minutes; travel and preparation outside the workout are not included.',
    missLabel: 'Missed weekday', unaffected: 'No lifting was scheduled on this day in this option.',
    affected: 'One scheduled visit is removed. Other visits stay where they were; this tool does not prescribe a catch-up workout.',
    week1: 'Week 1', week2: 'Week 2',
    compare: 'Compare my week', reset: 'Reset', print: 'Print this guide',
    copy: 'Copy this schedule', copied: 'Schedule copied.',
    copyManual: 'Clipboard access is unavailable. Select and copy the schedule below.',
    manualLabel: 'Schedule to copy manually',
    formDays: 'Which weekdays can you usually train?',
    formTime: 'Minutes available per visit',
    formFragile: 'Which day often falls through?', none: 'None selected',
    local: 'Runs in your browser. The planner does not save or send your selections.',
    nojs: 'The interactive comparison needs JavaScript. The complete examples, comparison tables and Friday stress test below work without it.',
    resultLabel: 'Two calendar options', ready: 'Two schedules are ready below.',
        navTools: 'Free workout planner', navBlog: 'Blog',
    eyebrow: 'Strength training · Planning guide',
    byline: 'By IZEM Editorial · October 7, 2026',
    footer: 'IZEM. Your AI Personal Trainer',
    sourceNav: 'Sources', editorialNav: 'Editorial policy', privacyNav: 'Privacy',
    jumpCompare: 'Compare splits', jumpTool: 'Check my calendar', jumpExamples: 'Weekly examples',
    jumpScience: 'Research and sources',
    toolTitle: 'Calendar-fit check',
    alternate: 'Alternative to compare', first: 'Starting comparison',
    outputLabel: 'Calendar comparison results',
    errorLabel: 'Check your selections'
  });
  const FOCUS = Object.freeze({F: ['push', 'pull', 'legs'], U: ['push', 'pull'], L: ['legs'], P: ['push'], Q: ['pull'], G: ['legs']});
  const ALLOWED_MINUTES = [20, 30, 45, 60, 75, 90];
  const TYPE = Object.freeze({full2:['FA','FB'],full3:['FA','FB','FC'],upper2:['UA','LA'],upper3:['U','L','U'],upper4:['UA','LA','UB','LB'],hybrid5:['U','L','P','Q','G'],ppl6:['PA','QA','GA','PB','QB','GB']});
  function combinations(items, count) {
    const out=[];
    function walk(start, acc) {
      if (acc.length===count) { out.push(acc.slice()); return; }
      for(let i=start;i<=items.length-(count-acc.length);i++){acc.push(items[i]);walk(i+1,acc);acc.pop();}
    }
    walk(0, []);return out;
  }
  function focus(code) { return code ? FOCUS[code.charAt(0)] : []; }
  function consecutiveOverlap(weeks) {
    const slots=weeks.flat();
    return slots.some((code,i)=>code && slots[(i+1)%slots.length] && focus(code).some(f=>focus(slots[(i+1)%slots.length]).includes(f)));
  }
  function makeWeeks(type, usedDays) {
    const make=(labels)=> {const week=Array(7).fill(null);usedDays.forEach((d,i)=>{week[d]=labels[i];});return week;};
    const first=make(TYPE[type]);
    if(type==='upper3')return[first,make(['L','U','L'])];
    return [first];
  }
  function selectDays(days,count,fragileDay,type) {
    let best=null,bestScore=null;
    for(const subset of combinations(days,count)){
      const gaps=subset.map((d,i)=>(subset[(i+1)%subset.length]-d+7)%7);
      const mean=7/subset.length;
      const score=[fragileDay!==null && subset.includes(fragileDay)?1:0,
        consecutiveOverlap(makeWeeks(type,subset))?1:0,
        gaps.reduce((a,g)=>a+(g-mean)**2,0)];
      if(bestScore===null || score.some((v,i)=>v<bestScore[i]&&score.slice(0,i).every((x,j)=>x===bestScore[j]))){best=subset;bestScore=score;}
    }
    return best;
  }
  function counts(week){
    const out={push:0,pull:0,legs:0};
    week.forEach(code=>focus(code).forEach(f=>out[f]++));
    return out;
  }
  function compare(input) {
    if(!input || !Array.isArray(input.days)||input.days.length<2||input.days.length>6||new Set(input.days).size!==input.days.length||input.days.some(d=>!Number.isInteger(d)||d<0||d>6))throw new Error(COPY.invalidDays);
    if(!ALLOWED_MINUTES.includes(input.minutes))throw new Error(COPY.invalidTime);
    const days=input.days.slice().sort((a,b)=>a-b), minutes=input.minutes, fragileDay=input.fragileDay ?? null;
    if(fragileDay!==null && (!Number.isInteger(fragileDay)||!days.includes(fragileDay)))throw new Error(COPY.invalidFragile);
    const pairs={2:['full2','upper2'],3:['full3','upper3'],4:['upper4','full3'],5:['hybrid5','upper4'],6:['ppl6','upper4']};
    return pairs[days.length].map(type=>{
      const count=TYPE[type].length;
      const usedDays=count===days.length?days:selectDays(days,count,fragileDay,type);
      const weeks=makeWeeks(type,usedDays),before=counts(weeks[0]),afterWeek=weeks[0].slice();
      const missed=fragileDay!==null && afterWeek[fragileDay]!==null;
      if(fragileDay!==null)afterWeek[fragileDay]=null;
      const notes=[COPY.boundary];
      if(type==='upper2')notes.push(COPY.lowerFrequency);
      if(type==='upper3')notes.push(COPY.rotating);
      if(count<days.length)notes.push(COPY.fewer);
      if(minutes<30)notes.push(COPY.tight);
      if(consecutiveOverlap(weeks))notes.push(COPY.adjacent);
      return {type,title:COPY[type],usedDays:usedDays.slice(),weeks,minutes,weeklyMinutes:count*minutes,fragileDay,missed,before,after:counts(afterWeek),notes};
    });
  }
  function scheduleText(plan) {
    const lines=[plan.title];
    plan.weeks.forEach((week,w)=>{
      lines.push(w===0?COPY.week1:COPY.week2);
      week.forEach((code,d)=>lines.push(COPY.days[d]+': '+(code?COPY[code]:COPY.rest)));
    });
    lines.push(COPY.timeLabel+': '+plan.weeklyMinutes+' '+COPY.minutesLabel);
    lines.push(COPY.original+': '+COPY.pushLabel+' '+plan.before.push+', '+COPY.pullLabel+' '+plan.before.pull+', '+COPY.legsLabel+' '+plan.before.legs+'.');
    if(plan.fragileDay!==null){
      lines.push(COPY.missLabel+': '+COPY.days[plan.fragileDay]);
      lines.push(plan.missed?COPY.affected:COPY.unaffected);
      lines.push(COPY.after+': '+COPY.pushLabel+' '+plan.after.push+', '+COPY.pullLabel+' '+plan.after.pull+', '+COPY.legsLabel+' '+plan.after.legs+'.');
    }
    lines.push(COPY.countsNote,...plan.notes);
    return lines.join('\n');
  }
  const api={COPY,ALLOWED_MINUTES,compare,counts,consecutiveOverlap,combinations,scheduleText};
  if(typeof module!=='undefined'&&module.exports)module.exports=api;
  root.IZEMSplitPlanner=api;
  function init(){
    const form=document.getElementById('calendar-form');if(!form)return;
    const results=document.getElementById('calendar-results');
    const status=document.getElementById('calendar-status');
    const uncertain=document.getElementById('uncertain-day');
    const length=document.getElementById('session-minutes');
    function node(tag,cls,text){const e=document.createElement(tag);if(cls)e.className=cls;if(text!==undefined)e.textContent=text;return e;}
    function values(){return Array.from(form.querySelectorAll('input[name="weekday"]:checked')).map(e=>Number(e.value));}
    function updateUncertain(){
      const old=uncertain.value;uncertain.replaceChildren(new Option(COPY.none,''));
      values().forEach(d=>uncertain.add(new Option(COPY.days[d],String(d))));
      uncertain.value=Array.from(uncertain.options).some(o=>o.value===old)?old:'';
    }
    function renderCounts(title,c){
      const wrap=node('div','slot-counts');wrap.append(node('p','small-label',title));
      const dl=node('dl');[['push',COPY.pushLabel],['pull',COPY.pullLabel],['legs',COPY.legsLabel]].forEach(([key,label])=>{const pair=node('div');pair.append(node('dt','',label),node('dd','',String(c[key])));dl.append(pair);});
      wrap.append(dl);return wrap;
    }
    function render(plan,index){
      const card=node('section','schedule-card');card.setAttribute('aria-label',plan.title);
      card.append(node('p','small-label',index===0?COPY.first:COPY.alternate),node('h3','',plan.title));
      plan.weeks.forEach((week,w)=>{
        if(plan.weeks.length>1)card.append(node('h4','',w===0?COPY.week1:COPY.week2));
        const ul=node('ul','week-grid');
        week.forEach((code,d)=>{
          const li=node('li',code?'training-slot':'rest-slot');
          if(d===plan.fragileDay&&w===0)li.classList.add('uncertain');
          li.append(node('span','day-name',COPY.shortDays[d]),node('span','session-name',code?COPY[code]:COPY.rest));
          if(d===plan.fragileDay&&w===0)li.append(node('span','uncertain-label',COPY.missLabel));
          ul.append(li);
        });card.append(ul);
      });
      card.append(node('p','time-total',COPY.timeLabel+': '+plan.weeklyMinutes+' '+COPY.minutesLabel),renderCounts(COPY.original,plan.before));
      if(plan.fragileDay!==null){const stress=node('div','stress');stress.append(node('p','',COPY.missLabel+': '+COPY.days[plan.fragileDay]),node('p','',plan.missed?COPY.affected:COPY.unaffected),renderCounts(COPY.after,plan.after));card.append(stress);}
      card.append(node('p','hint',COPY.countsNote));
      plan.notes.forEach(note=>card.append(node('p','schedule-note',note)));
      const copy=node('button','button secondary',COPY.copy);copy.type='button';
      const copyStatus=node('p','copy-status');copyStatus.setAttribute('role','status');
      const manualWrap=node('div','manual-copy');manualWrap.hidden=true;
      const label=node('label','',COPY.manualLabel),area=node('textarea');area.readOnly=true;area.rows=12;
      area.id='manual-schedule-'+index;label.htmlFor=area.id;manualWrap.append(label,area);
      copy.addEventListener('click',async()=>{
        const text=scheduleText(plan);
        try{if(!navigator.clipboard || typeof navigator.clipboard.writeText!=='function')throw new Error('clipboard');await navigator.clipboard.writeText(text);copyStatus.textContent=COPY.copied;manualWrap.hidden=true;}
        catch(_){area.value=text;manualWrap.hidden=false;area.focus();area.select();copyStatus.textContent=COPY.copyManual;}
      });
      card.append(copy,copyStatus,manualWrap);return card;
    }
    function run(){
      results.replaceChildren();status.textContent='';status.classList.remove('error');
      try{
        const plans=compare({days:values(),minutes:Number(length.value),fragileDay:uncertain.value===''?null:Number(uncertain.value)});
        plans.forEach((p,i)=>results.append(render(p,i)));status.textContent=COPY.ready;
      }catch(e){status.textContent=e.message;status.classList.add('error');}
    }
    form.addEventListener('submit',e=>{e.preventDefault();run();});
    form.addEventListener('change',()=>{updateUncertain();run();});
    document.getElementById('calendar-reset').addEventListener('click',()=>{
      form.querySelectorAll('input[name="weekday"]').forEach(e=>{e.checked=[0,2,5].includes(Number(e.value));});length.value='45';uncertain.value='';updateUncertain();run();
    });
    document.getElementById('guide-print').addEventListener('click',()=>window.print());
    updateUncertain();run();
  }
  if(typeof document!=='undefined'){
    if(document.readyState==='loading')document.addEventListener('DOMContentLoaded',init,{once:true});else init();
  }
})(typeof window!=='undefined'?window:globalThis);
