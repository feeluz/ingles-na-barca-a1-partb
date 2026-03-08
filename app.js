
const STORAGE_KEY='inglesNaBarcaFullRepoV1';
function initialState(){return{completed:{},xp:0,streak:0,lastCompletedDate:null};}
function getState(){try{return {...initialState(),...(JSON.parse(localStorage.getItem(STORAGE_KEY))||{})};}catch{return initialState();}}
function saveState(state){localStorage.setItem(STORAGE_KEY,JSON.stringify(state));}
function getAllLessons(){return window.COURSE.units.flatMap(unit=>unit.lessons.map(lesson=>({...lesson,unitId:unit.id,unitTitle:unit.title})));}
function isUnlocked(lessonId,state=getState()){const lessons=getAllLessons();const idx=lessons.findIndex(l=>l.id===lessonId);if(idx<=0)return true;return !!state.completed[lessons[idx-1].id];}
function markCompleted(lessonId,xpGain=10){const state=getState();const wasDone=!!state.completed[lessonId];state.completed[lessonId]=true;if(!wasDone){state.xp+=xpGain;const today=new Date().toISOString().slice(0,10);if(!state.lastCompletedDate)state.streak=1;else{const prev=new Date(state.lastCompletedDate+'T00:00:00');const curr=new Date(today+'T00:00:00');const diff=Math.round((curr-prev)/86400000);if(diff===0)state.streak=state.streak||1;else if(diff===1)state.streak+=1;else state.streak=1;}state.lastCompletedDate=today;}saveState(state);return state;}
function resetAllProgress(){localStorage.removeItem(STORAGE_KEY);location.reload();}
function playTone(freq=700,duration=120){try{const ctx=new(window.AudioContext||window.webkitAudioContext)();const osc=ctx.createOscillator();const gain=ctx.createGain();osc.type='sine';osc.frequency.value=freq;gain.gain.value=.035;osc.connect(gain);gain.connect(ctx.destination);osc.start();setTimeout(()=>{osc.stop();ctx.close();},duration);}catch(e){}}
function speak(text){window.speechSynthesis.cancel();const utter=new SpeechSynthesisUtterance(text);utter.lang='en-US';window.speechSynthesis.speak(utter);}
function normalize(str){return String(str).trim().replace(/\s+/g,' ').toLowerCase();}

function renderMap(){
  const container=document.getElementById('unitContainer'); if(!container) return;
  const routePath=document.getElementById('routePath'); const boat=document.getElementById('boat');
  const state=getState(); const path=[{x:24,y:8},{x:52,y:14},{x:78,y:8},{x:70,y:20},{x:42,y:26},{x:16,y:20},{x:24,y:34},{x:52,y:40},{x:78,y:34},{x:70,y:48},{x:42,y:54},{x:16,y:48},{x:24,y:62},{x:52,y:68},{x:78,y:62},{x:70,y:76},{x:42,y:82},{x:16,y:76},{x:24,y:90},{x:52,y:96}];
  routePath.setAttribute('d', path.map((p,i)=>`${i===0?'M':'L'} ${p.x} ${p.y}`).join(' '));
  document.getElementById('xpStat').textContent=state.xp; document.getElementById('streakStat').textContent=state.streak;
  const units=window.COURSE.units.map((unit,i)=>{const unitDone=unit.lessons.filter(l=>state.completed[l.id]).length;return {...unit,completed:unitDone===unit.lessons.length,current:unitDone<unit.lessons.length && isUnlocked(unit.lessons[0].id,state),locked:!isUnlocked(unit.lessons[0].id,state),stars:unitDone===unit.lessons.length?3:unitDone>0?1:0};});
  const currentIdx=units.findIndex(u=>u.current); const boatPos=path[currentIdx>=0?currentIdx:0]; boat.style.left=boatPos.x+'%'; boat.style.top=boatPos.y+'%';
  const all=getAllLessons(); const doneCount=all.filter(l=>state.completed[l.id]).length; const percent=Math.round(doneCount/all.length*100);
  document.getElementById('progressBig').textContent=percent+'%'; document.getElementById('progressFill').style.width=percent+'%'; document.getElementById('progressText').textContent=`${doneCount} de ${all.length} lições concluídas`;
  units.forEach((unit,i)=>{const pos=path[i]; const wrap=document.createElement('div'); wrap.className='unit'; wrap.style.left=pos.x+'%'; wrap.style.top=pos.y+'%';
    const btn=document.createElement('button'); btn.className='unit-btn '+(unit.completed?'done':unit.locked?'locked':unit.current?'current':''); btn.textContent=i+1;
    if(unit.completed){const ring=document.createElement('div'); ring.className='ring'; btn.appendChild(ring);}
    if(!unit.locked) btn.addEventListener('click',()=>location.href=`unit.html?unit=${unit.id}`);
    const label=document.createElement('div'); label.className='unit-label'; label.textContent='Unidade '+(i+1);
    const sub=document.createElement('div'); sub.className='unit-sub'; sub.textContent=unit.lessons.length+' lições';
    const stars=document.createElement('div'); stars.className='stars'; stars.textContent='★'.repeat(unit.stars)+'☆'.repeat(3-unit.stars);
    wrap.appendChild(btn); wrap.appendChild(label); wrap.appendChild(sub); wrap.appendChild(stars); container.appendChild(wrap);
  });
  const resetBtn=document.getElementById('resetBtn'); if(resetBtn) resetBtn.addEventListener('click',resetAllProgress);
}

function renderUnit(){
  const list=document.getElementById('lessonList'); if(!list) return;
  const params=new URLSearchParams(location.search); const unitId=params.get('unit'); const unit=window.COURSE.units.find(u=>u.id===unitId); if(!unit) return;
  const state=getState(); document.getElementById('unitTitle').textContent=unit.title; document.getElementById('unitDescription').textContent=unit.description;
  const unitDone=unit.lessons.filter(l=>state.completed[l.id]).length; const percent=Math.round(unitDone/unit.lessons.length*100);
  document.getElementById('unitProgressFill').style.width=percent+'%'; document.getElementById('unitProgressText').textContent=`${unitDone} de ${unit.lessons.length} lições concluídas`;
  unit.lessons.forEach((lesson,idx)=>{const unlocked=isUnlocked(lesson.id,state); const done=!!state.completed[lesson.id]; const row=document.createElement('div'); row.className='lesson-row';
    row.innerHTML=`<div class="lesson-left"><div class="lesson-num ${done?'done':unlocked?'current':'locked'}">${idx+1}</div><div><div style="font-weight:800">${lesson.title}</div><div class="mini">${done?'Concluída':unlocked?'Disponível':'Bloqueada'}</div></div></div><div>${done?`<a class="action-btn alt" href="lesson.html?lesson=${encodeURIComponent(lesson.file)}&id=${lesson.id}&unit=${unit.id}">Revisar</a>`:unlocked?`<a class="action-btn" href="lesson.html?lesson=${encodeURIComponent(lesson.file)}&id=${lesson.id}&unit=${unit.id}">Começar</a>`:`<button class="action-btn alt" disabled>Bloqueada</button>`}</div>`;
    list.appendChild(row);
  });
}

async function renderLesson(){
  const lessonTitle=document.getElementById('lessonTitle'); if(!lessonTitle) return;
  const params=new URLSearchParams(location.search); const lessonPath=params.get('lesson'); const lessonId=params.get('id'); const unitId=params.get('unit');
  const unit=window.COURSE.units.find(u=>u.id===unitId); document.getElementById('backToUnit').href=`unit.html?unit=${unitId}`; document.getElementById('lessonUnitLabel').textContent=unit?unit.title:'Unidade';
  const state=getState(); if(!isUnlocked(lessonId,state)){alert('Esta lição ainda está bloqueada.'); location.href=`unit.html?unit=${unitId}`; return;}
  const lesson=await (await fetch(lessonPath)).json(); lessonTitle.textContent=lesson.title;
  const playBtn=document.getElementById('playBtn'), checkBtn=document.getElementById('checkBtn'), nextBtn=document.getElementById('nextBtn'), box=document.getElementById('exerciseBox'), feedback=document.getElementById('feedbackBox'), progressFill=document.getElementById('lessonProgressFill'), heartsBox=document.getElementById('heartsBox'), lessonXp=document.getElementById('lessonXp');
  let current=0, correct=0, hearts=3, currentItem=null, selectedChoice=null, scrambleAnswer=[], matchSelections={}; const xpPerCorrect=5;
  function updateHUD(){progressFill.style.width=`${current/lesson.items.length*100}%`; heartsBox.textContent='❤️'.repeat(Math.max(0,hearts))+'🖤'.repeat(3-Math.max(0,hearts)); lessonXp.textContent=`+${correct*xpPerCorrect} XP`;}
  function setFeedback(type,msg){feedback.className=`feedback-box ${type}`; feedback.textContent=msg; feedback.classList.remove('hidden');}
  function renderCurrent(){updateHUD(); feedback.classList.add('hidden'); nextBtn.classList.add('hidden'); checkBtn.classList.remove('hidden'); currentItem=lesson.items[current]; selectedChoice=null; scrambleAnswer=[]; matchSelections={};
    if(currentItem.type==='dictation'){box.innerHTML='<p>Ouça e digite exatamente o que você escutou.</p><input id="answerInput" type="text" placeholder="Type what you hear" autocomplete="off">'; playBtn.style.display='inline-flex'; setTimeout(()=>document.getElementById('answerInput')?.focus(),30);}
    else if(currentItem.type==='multiple_choice'){playBtn.style.display='inline-flex'; box.innerHTML='<p>Ouça e escolha a opção correta.</p><div class="choice-list">'+currentItem.options.map((opt,idx)=>`<button type="button" class="choice-btn" data-choice="${idx}">${opt}</button>`).join('')+'</div>'; box.querySelectorAll('[data-choice]').forEach(btn=>btn.addEventListener('click',()=>{selectedChoice=Number(btn.dataset.choice); box.querySelectorAll('[data-choice]').forEach(b=>b.style.borderColor='rgba(7,21,95,.12)'); btn.style.borderColor='#1f56d8';}));}
    else if(currentItem.type==='scramble'){playBtn.style.display='inline-flex'; box.innerHTML='<p>'+currentItem.prompt+'</p><div id="selectedAnswer" class="selected-answer"></div><div class="token-bank">'+currentItem.tokens.map(t=>`<button type="button" class="token-btn" data-token="${String(t).replaceAll('"','&quot;')}">${t}</button>`).join('')+'</div>'; const selected=box.querySelector('#selectedAnswer'); box.querySelectorAll('.token-btn').forEach(btn=>btn.addEventListener('click',()=>{scrambleAnswer.push(btn.dataset.token); selected.textContent=scrambleAnswer.join(' ').replace(/ \./g,'.'); btn.disabled=true; btn.style.opacity='.45';}));}
    else if(currentItem.type==='match'){playBtn.style.display='none'; box.innerHTML='<p>'+currentItem.prompt+'</p><div class="match-grid">'+currentItem.left.map(left=>{const options=currentItem.right.map(r=>`<option value="${r.id}">${r.text}</option>`).join(''); return `<div class="match-item">${left.text}</div><select class="match-select" data-left="${left.id}"><option value="">Select</option>${options}</select>`;}).join('')+'</div>'; box.querySelectorAll('.match-select').forEach(sel=>sel.addEventListener('change',()=>matchSelections[sel.dataset.left]=sel.value));}
  }
  playBtn.addEventListener('click',()=>{if(!currentItem)return; if(currentItem.type==='dictation')speak(currentItem.text); else if(currentItem.type==='multiple_choice')speak(currentItem.prompt); else if(currentItem.type==='scramble')speak(currentItem.answer);});
  checkBtn.addEventListener('click',()=>{let ok=false, correctAnswer='';
    if(currentItem.type==='dictation'){const val=document.getElementById('answerInput')?.value||''; ok=normalize(val)===normalize(currentItem.text); correctAnswer=currentItem.text;}
    else if(currentItem.type==='multiple_choice'){ok=selectedChoice===currentItem.answer; correctAnswer=currentItem.options[currentItem.answer];}
    else if(currentItem.type==='scramble'){const built=scrambleAnswer.join(' ').replace(/ \./g,'.'); ok=normalize(built)===normalize(currentItem.answer); correctAnswer=currentItem.answer;}
    else if(currentItem.type==='match'){ok=currentItem.left.every(l=>matchSelections[l.id]===l.id); correctAnswer='Match all items correctly.';}
    if(ok){correct+=1; playTone(820,90); setFeedback('ok','✅ Correct.');} else {hearts=Math.max(0,hearts-1); playTone(220,130); setFeedback('bad',`❌ Not yet. Correct answer: ${correctAnswer}`);}
    updateHUD(); checkBtn.classList.add('hidden'); nextBtn.classList.remove('hidden');
  });
  nextBtn.addEventListener('click',()=>{current+=1; if(current>=lesson.items.length || hearts===0){const xpGain=correct*xpPerCorrect; const newState=markCompleted(lessonId,xpGain); progressFill.style.width='100%'; document.getElementById('lessonCard').classList.add('hidden'); document.getElementById('finishCard').classList.remove('hidden'); document.getElementById('finishSummary').textContent=hearts===0?`Você ficou sem corações. Acertou ${correct} de ${lesson.items.length}.`:`Você acertou ${correct} de ${lesson.items.length} exercícios.`; document.getElementById('finishXp').textContent=xpGain; document.getElementById('finishStreak').textContent=newState.streak; document.getElementById('retryLink').href=location.href; const lessons=getAllLessons(); const idx=lessons.findIndex(l=>l.id===lessonId); const nextLesson=lessons[idx+1]; document.getElementById('continueLink').href=nextLesson?`lesson.html?lesson=${encodeURIComponent(nextLesson.file)}&id=${nextLesson.id}&unit=${nextLesson.unitId}`:'index.html'; return;} renderCurrent();});
  renderCurrent();
}
document.addEventListener('DOMContentLoaded',()=>{renderMap(); renderUnit(); renderLesson();});
