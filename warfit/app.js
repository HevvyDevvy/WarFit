// =========================================================
// WARFIT — app logic (rough skeleton, all screens wired)
// Local-only persistence via localStorage. No backend.
// =========================================================

const STORAGE_KEY = 'warfit_state_v1';

const defaultState = {
  startPoint: null,
  endGoal: null,
  baseline: {},
  ordersDone: [false, false, false],
  streak: 0,
  sessions: 0,
  pbs: [],       // { id, category, name, value, date }
  meals: [],     // { id, name, cal }
  enlistedOn: null,
  currentTierIndex: 0
};

function loadState(){
  try{
    const raw = localStorage.getItem(STORAGE_KEY);
    if(!raw) return structuredClone(defaultState);
    return { ...structuredClone(defaultState), ...JSON.parse(raw) };
  }catch(e){ return structuredClone(defaultState); }
}
function saveState(){ localStorage.setItem(STORAGE_KEY, JSON.stringify(state)); }

let state = loadState();
if(!state.enlistedOn){ state.enlistedOn = new Date().toISOString(); saveState(); }

// ===== TIER LADDER — years-long progression, entry -> beyond military/fight-sport =====
const TIERS = [
  {
    name: 'Tier 0 — Couch to Combat',
    req: 'Walk/jog intervals building to a continuous <strong>1.5 mile</strong>. 3x10 press-up negatives. Bodyweight squats. Learn to eat on a schedule.'
  },
  {
    name: 'Tier 1 — Entry Standard',
    req: '<strong>1.5 mile in 10:00</strong> · 44 press-ups &amp; 44 sit-ups in 2 min · 10 pull-ups in 1 min · 20kg pack, 8 miles in 2:00.'
  },
  {
    name: 'Tier 2 — First Contact',
    req: 'Add structured calisthenics circuits, 2x weekly conditioning cardio, first taste of pad work / no-contact striking drills.'
  },
  {
    name: 'Tier 3 — Fight-Sport Introduction',
    req: '1 full round (any discipline) light-contact sparring. Sub-9:00 mile &amp; a half. 15 pull-ups. Begin structured lifting (squat/bench/deadlift base).'
  },
  {
    name: 'Tier 4 — Combat Conditioning',
    req: '<strong>3 rounds full-contact</strong> sparring or bag work, any discipline. 60 press-ups / 100 sit-ups in 2 min. 20kg pack, 8 miles under 1:45.'
  },
  {
    name: 'Tier 5 — CrossFit &amp; Max Strength Block',
    req: 'CrossFit-style WODs 2–3x weekly. Begin tracked max lifts — squat, bench, deadlift, leg press. Sub-8:00 mile &amp; a half.'
  },
  {
    name: 'Tier 6 — Hardened',
    req: '80+ press-ups / 150+ sit-ups in 2 min · 18 pull-ups · 6 rounds full-contact sparring or bag work · 20kg pack, 8 miles under 1:25.'
  },
  {
    name: 'Tier 7 — Approaching the Standard',
    req: '<strong>Sub-6:30 mile &amp; a half</strong> · 100 press-ups / 180 sit-ups (2 min) · 18–20 pull-ups · 8 rounds full-contact · 300 club attempts underway.'
  },
  {
    name: 'Tier 8 — THE STANDARD',
    req: '<strong>1.5 mile in 5:45</strong> · 106 press-ups &amp; 200 sit-ups in 2 min · 20 pull-ups in 1 min · 10x5min rounds full-contact sparring · 10x5min rounds bag work · 20kg pack 8 miles in 1:12:36 · 20kg pack 15 miles in 2:15 · 300 Club (3x bodyweight, any lift).'
  },
  {
    name: 'Tier 9 — Beyond',
    req: 'Summit ascents with a 25kg pack — 7 Sisters, Ben Nevis, Mount Mallory. Maintain the Standard while chasing new numbers. There is no ceiling here, only the next mountain.'
  }
];

// ===== WORKOUT LIBRARY =====
const WORKOUTS = [
  { cat:'calisthenics', name:'Press-up Pyramid', desc:'1-2-3...10-9-8...1 ladder, no rest at the top. Scale reps to your tier.' },
  { cat:'calisthenics', name:'Pull-up EMOM', desc:'Every minute on the minute, max quality reps for 15–20 minutes.' },
  { cat:'calisthenics', name:'Sit-up / Core Burnout', desc:'4 sets max effort in 2-min windows, matched against your 200-rep target.' },
  { cat:'calisthenics', name:'Dip &amp; Push Complex', desc:'Parallel bar dips supersetted with press-ups, 5 rounds.' },
  { cat:'cardio', name:'Mile &amp; a Half Time Trial', desc:'Flat out. Log it as a PB. This is the benchmark that never stops mattering.' },
  { cat:'cardio', name:'Interval Sprints', desc:'400m repeats, building volume week on week toward sub-6:00 pace.' },
  { cat:'cardio', name:'Long Steady State', desc:'45–90 min easy pace, base-building for the pack marches.' },
  { cat:'ruck', name:'20kg Pack — 8 Mile', desc:'Standard ruck test. Entry target 2:00, Standard target 1:12:36.' },
  { cat:'ruck', name:'20kg Pack — 15 Mile', desc:'Endurance ruck. Standard target 2:15:00.' },
  { cat:'ruck', name:'25kg Pack — Hill Repeats', desc:'Summit-prep loading, steep gradient, short reps.' },
  { cat:'lifts', name:'Deadlift — Max Effort', desc:'Work to a true 1RM. 300 Club target: 3x bodyweight.' },
  { cat:'lifts', name:'Squat — Max Effort', desc:'Back squat 1RM day, full depth, spotter or safety bars.' },
  { cat:'lifts', name:'Leg Press — Max Effort', desc:'High-load single rep testing. Standard reference: 350kg.' },
  { cat:'lifts', name:'Bench / Press Strength Block', desc:'5x5 progressive overload cycle feeding into a max test.' },
  { cat:'combat', name:'MMA Sparring Round', desc:'Full-contact, 5-min rounds. Build from 1 round toward 10.' },
  { cat:'combat', name:'Jiu-Jitsu Rolling', desc:'Live positional rolling, submission-focused, gi or no-gi.' },
  { cat:'combat', name:'Muay Thai Pad Rounds', desc:'5-min rounds, clinch and knees included as tier allows.' },
  { cat:'combat', name:'Bag Work — 5min Rounds', desc:'Full power, full contact intensity, matched to sparring round count.' },
  { cat:'crossfit', name:'WOD — Metcon', desc:'Mixed barbell/gymnastic/monostructural conditioning piece, as prescribed or scaled.' },
  { cat:'crossfit', name:'WOD — Strength + Skill', desc:'Olympic lift technique work followed by a short conditioning finisher.' }
];

// ===== DIET PHASES =====
const DIET_PHASES = [
  { name:'Base Building', desc:'Slight surplus, high protein, consistent carbs around training. Eat well, and lots of it.' },
  { name:'Strength Block', desc:'Calories up, protein 2g/kg+, prioritise recovery meals post-lift.' },
  { name:'Fight-Sport Camp', desc:'Fuel for volume — carbs matched to round count, hydration and electrolytes non-negotiable.' },
  { name:'Ruck / Summit Prep', desc:'Endurance fuelling, practice eating on the move, salt and carb strategy for multi-hour efforts.' }
];

// =========================================================
// NAVIGATION
// =========================================================
function showScreen(name){
  document.querySelectorAll('.screen').forEach(el => {
    el.classList.toggle('is-hidden', el.dataset.screen !== name);
  });
  document.querySelectorAll('.tac-nav__item').forEach(btn => {
    btn.classList.toggle('is-active', btn.dataset.nav === name);
  });
  window.scrollTo(0,0);
}

document.querySelectorAll('[data-nav]').forEach(el => {
  el.addEventListener('click', () => showScreen(el.dataset.nav));
});

// =========================================================
// DASHBOARD
// =========================================================
function rankForTier(i){
  const ranks = ['RECRUIT','PRIVATE','LANCE CORPORAL','CORPORAL','SERGEANT','STAFF SERGEANT','WARRANT OFFICER','LIEUTENANT','CAPTAIN','THE STANDARD'];
  return ranks[i] || 'THE STANDARD';
}

function renderDashboard(){
  const idx = state.currentTierIndex;
  document.getElementById('dashCurrentTier').textContent = TIERS[idx].name.toUpperCase();
  document.getElementById('hudRank').textContent = rankForTier(idx);
  const pct = Math.round(((idx) / (TIERS.length - 1)) * 100);
  document.getElementById('dashProgressFill').style.width = pct + '%';
  document.getElementById('dashProgressLabel').textContent = pct + '% through the ladder';
  document.getElementById('dashStreak').textContent = state.streak;
  document.getElementById('dashPBCount').textContent = state.pbs.length;
  document.getElementById('dashSessions').textContent = state.sessions;

  document.querySelectorAll('#dashOrders .order-list__check').forEach((cb, i) => {
    cb.checked = !!state.ordersDone[i];
    cb.onchange = () => {
      state.ordersDone[i] = cb.checked;
      if(state.ordersDone.every(Boolean)){
        state.sessions += 1;
        state.streak += 1;
      }
      saveState();
      renderDashboard();
    };
  });
}

// =========================================================
// ASSESSMENT
// =========================================================
function renderAssessmentSelection(){
  document.querySelectorAll('#assessStartPoints .choice-card').forEach(btn => {
    btn.classList.toggle('is-selected', btn.dataset.start === state.startPoint);
    btn.onclick = () => { state.startPoint = btn.dataset.start; renderAssessmentSelection(); };
  });
  document.querySelectorAll('#assessEndGoals .choice-card').forEach(btn => {
    btn.classList.toggle('is-selected', btn.dataset.goal === state.endGoal);
    btn.onclick = () => { state.endGoal = btn.dataset.goal; renderAssessmentSelection(); };
  });
}

document.getElementById('assessConfirm').addEventListener('click', () => {
  saveState();
  renderProfile();
  showScreen('dashboard');
});

// =========================================================
// LEVELS / LADDER
// =========================================================
function renderTierList(){
  const list = document.getElementById('tierList');
  list.innerHTML = '';
  TIERS.forEach((tier, i) => {
    const li = document.createElement('li');
    li.className = 'tier-item' + (i === state.currentTierIndex ? ' is-current' : (i < state.currentTierIndex ? ' is-done' : ''));
    li.innerHTML = `
      <div class="tier-item__marker"></div>
      <div class="tier-item__card">
        <p class="tier-item__name">${tier.name}</p>
        <p class="tier-item__req">${tier.req}</p>
        ${i === state.currentTierIndex ? '<button class="link-arrow" data-advance="'+i+'">Mark tier complete →</button>' : ''}
      </div>
    `;
    list.appendChild(li);
  });
  list.querySelectorAll('[data-advance]').forEach(btn => {
    btn.addEventListener('click', () => {
      if(state.currentTierIndex < TIERS.length - 1) state.currentTierIndex += 1;
      saveState();
      renderTierList();
      renderDashboard();
    });
  });
}

// =========================================================
// WORKOUTS
// =========================================================
let activeFilter = 'all';
function renderWorkouts(){
  const grid = document.getElementById('workoutGrid');
  grid.innerHTML = '';
  const items = WORKOUTS.filter(w => activeFilter === 'all' || w.cat === activeFilter);
  items.forEach(w => {
    const card = document.createElement('div');
    card.className = 'workout-card';
    card.innerHTML = `
      <div class="workout-card__top">
        <p class="workout-card__name">${w.name}</p>
        <span class="workout-card__cat">${w.cat.toUpperCase()}</span>
      </div>
      <p class="workout-card__desc">${w.desc}</p>
    `;
    grid.appendChild(card);
  });
}
document.querySelectorAll('#workoutFilters .chip').forEach(chip => {
  chip.addEventListener('click', () => {
    activeFilter = chip.dataset.filter;
    document.querySelectorAll('#workoutFilters .chip').forEach(c => c.classList.toggle('is-active', c === chip));
    renderWorkouts();
  });
});

// =========================================================
// PERSONAL BESTS
// =========================================================
document.getElementById('pbAddBtn').addEventListener('click', () => {
  document.getElementById('pbAddForm').classList.toggle('is-hidden');
});
document.getElementById('pbSaveBtn').addEventListener('click', () => {
  const name = document.getElementById('pbName').value.trim();
  const value = document.getElementById('pbValue').value.trim();
  const date = document.getElementById('pbDate').value || new Date().toISOString().slice(0,10);
  if(!name || !value) return;
  state.pbs.push({ id: Date.now(), name, value, date });
  saveState();
  document.getElementById('pbName').value = '';
  document.getElementById('pbValue').value = '';
  document.getElementById('pbAddForm').classList.add('is-hidden');
  renderPBs();
  renderDashboard();
});

function renderPBs(){
  const wrap = document.getElementById('pbGroups');
  wrap.innerHTML = '';
  if(state.pbs.length === 0){
    wrap.innerHTML = '<p class="pb-empty">Nothing logged yet. Every number starts at zero.</p>';
    return;
  }
  const sorted = [...state.pbs].sort((a,b) => b.id - a.id);
  const title = document.createElement('p');
  title.className = 'pb-group__title';
  title.textContent = 'LOGGED';
  wrap.appendChild(title);
  sorted.forEach(pb => {
    const row = document.createElement('div');
    row.className = 'pb-row';
    row.innerHTML = `
      <span class="pb-row__name">${pb.name}</span>
      <span class="pb-row__meta"><span class="pb-row__value">${pb.value}</span><span class="pb-row__date">${pb.date}</span></span>
    `;
    wrap.appendChild(row);
  });
}

// =========================================================
// DIET
// =========================================================
function renderDiet(){
  const list = document.getElementById('dietMealList');
  list.innerHTML = '';
  if(state.meals.length === 0){
    list.innerHTML = '<p class="pb-empty">No meals logged today.</p>';
  }
  state.meals.forEach(m => {
    const row = document.createElement('div');
    row.className = 'meal-row';
    row.innerHTML = `<span>${m.name}</span><span class="meal-row__cal">${m.cal} kcal</span>`;
    list.appendChild(row);
  });

  const phaseWrap = document.getElementById('dietPhaseCards');
  phaseWrap.innerHTML = '';
  DIET_PHASES.forEach(p => {
    const card = document.createElement('div');
    card.className = 'phase-card';
    card.innerHTML = `<p class="phase-card__name">${p.name}</p><p class="phase-card__desc">${p.desc}</p>`;
    phaseWrap.appendChild(card);
  });
}
document.getElementById('dietAddMeal').addEventListener('click', () => {
  const name = prompt('Meal name:');
  if(!name) return;
  const cal = parseInt(prompt('Calories:') || '0', 10) || 0;
  state.meals.push({ id: Date.now(), name, cal });
  saveState();
  renderDiet();
});

// =========================================================
// PROFILE
// =========================================================
const START_LABELS = { couch:'Couch Potato', desk:'Desk Jockey', active:'Weekend Active', trained:'Already Training' };
const GOAL_LABELS = { entry:'Entry Standard', fightfit:'Fight-Sport Ready', ruck:'Rucking Endurance', thestandard:'THE STANDARD' };

function renderProfile(){
  document.getElementById('profileRank').textContent = rankForTier(state.currentTierIndex);
  const since = state.enlistedOn ? new Date(state.enlistedOn).toLocaleDateString() : 'today';
  document.getElementById('profileSince').textContent = 'Enlisted ' + since;
  document.getElementById('profileStart').textContent = START_LABELS[state.startPoint] || 'Not set';
  document.getElementById('profileGoal').textContent = GOAL_LABELS[state.endGoal] || 'Not set';
}
document.getElementById('profileReset').addEventListener('click', () => {
  if(!confirm('Wipe all progress? This cannot be undone.')) return;
  localStorage.removeItem(STORAGE_KEY);
  state = loadState();
  state.enlistedOn = new Date().toISOString();
  saveState();
  renderAll();
  showScreen('dashboard');
});

// =========================================================
// INIT
// =========================================================
function renderAll(){
  renderDashboard();
  renderAssessmentSelection();
  renderTierList();
  renderWorkouts();
  renderPBs();
  renderDiet();
  renderProfile();
}
renderAll();

// Register service worker for installability
if('serviceWorker' in navigator){
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('sw.js').catch(() => {});
  });
}
