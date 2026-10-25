(function () {
  'use strict';
  const C = window.DeliveryCore;
  const $ = (id) => document.getElementById(id);
  const screens = [...document.querySelectorAll('.screen')];
  const state = { mask: 0, level: null, generated: null, delivered: [], selected: null, mistakes: 0, sound: true, toastTimer: null, audio: null, generation:0, pending:false, finishTimer:null };

  function readHash() {
    const params = new URLSearchParams(location.hash.slice(1));
    const session=C.decodeSession(params.get('save'));if(session){state.mask=session.mask;params.session=session;}
    const decoded = C.decodeProgress(params.get('save'));
    if (decoded !== null) state.mask = decoded;
    return params;
  }

  function writeHash(levelId) {
    const params = new URLSearchParams();
    params.set('save',levelId?playCode():C.encodeProgress(state.mask));
    if (levelId) params.set('level', String(levelId));
    history.replaceState(null, '', `${location.pathname}${location.search}#${params}`);
  }

  function showScreen(name) {
    if(name!=='play'){state.generation++;state.pending=false;clearTimeout(state.finishTimer);window.speechSynthesis?.cancel();}
    screens.forEach((screen) => screen.classList.toggle('active', screen.id === `${name}Screen`));
    $('main').focus({ preventScroll: true });
    window.scrollTo({ top: 0, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'auto' : 'smooth' });
  }

  function announce(text) { $('toast').textContent = text; $('toast').classList.add('show'); clearTimeout(state.toastTimer); state.toastTimer = setTimeout(() => $('toast').classList.remove('show'), 1800); }
  function audio() { if (!state.audio) state.audio = new (window.AudioContext || window.webkitAudioContext)(); return state.audio; }
  function tone(notes) {
    if (!state.sound) return;
    try {
      const ctx = audio(); const start = ctx.currentTime;
      notes.forEach(([frequency, offset, duration]) => { const oscillator = ctx.createOscillator(); const gain = ctx.createGain(); oscillator.type = 'sine'; oscillator.frequency.value = frequency; gain.gain.setValueAtTime(.0001, start + offset); gain.gain.exponentialRampToValueAtTime(.11, start + offset + .015); gain.gain.exponentialRampToValueAtTime(.0001, start + offset + duration); oscillator.connect(gain).connect(ctx.destination); oscillator.start(start + offset); oscillator.stop(start + offset + duration + .03); });
    } catch (_) { /* Sound is optional. */ }
  }
  function goodSound() { tone([[523, 0, .15], [659, .1, .16], [784, .2, .22]]); }
  function softSound() { tone([[330, 0, .11], [294, .1, .13]]); }
  function finishSound() { tone([[523, 0, .2], [659, .14, .2], [784, .28, .22], [1047, .44, .35]]); }

  function renderRoutes() {
    $('routeProgress').textContent = `${C.completedCount(state.mask)} of ${C.LEVELS.length} complete`;
    $('routeGrid').replaceChildren(...C.LEVELS.map((level) => {
      const complete = C.isComplete(state.mask, level.id); const unlocked = C.isUnlocked(state.mask, level.id);
      const card = document.createElement('button'); card.type = 'button'; card.className = `route-card${complete ? ' complete' : ''}${!unlocked ? ' locked' : ''}`; card.disabled = !unlocked;
      card.style.setProperty('--route-color', level.color);
      card.innerHTML = `<span class="route-number">Route ${level.id}</span><span class="route-status" aria-hidden="true">${complete ? '✓' : unlocked ? '→' : '🔒'}</span><span class="route-icon" aria-hidden="true">${level.icon}</span><strong>${level.title}</strong><small>${unlocked ? `${level.deliveries.length} deliveries${level.ordered ? ' · Follow the list' : ''}` : 'Complete the route before this one'}</small>`;
      if (unlocked) card.addEventListener('click', () => startLevel(level.id));
      return card;
    }));
  }

  function openRoutes() { state.generated=null;renderRoutes(); showScreen('routes'); writeHash(); }
  function openHome() { state.generated=null;showScreen('home'); writeHash(); }

  function startLevel(levelId,restored) {
    state.generation++;state.pending=false;clearTimeout(state.finishTimer);
    const level = restored?.generated?C.generate(restored.generated.number,restored.generated.difficulty):C.LEVELS[levelId - 1]; if (!level || !restored?.generated&&!C.isUnlocked(state.mask, levelId)) return;
    state.generated=restored?.generated||null;
    state.level = level; state.delivered = restored?.ids||[]; state.selected = null; state.mistakes = restored?.mistakes||0;
    $('levelNumber').textContent = state.generated?`Generated route ${state.generated.number}`:`Route ${level.id} of ${C.LEVELS.length}`; $('levelTitle').textContent = level.title;
    renderLevel(); showScreen('play'); writeHash(level.id);if(state.delivered.length===level.deliveries.length)finishLevel();
  }

  function renderLevel() {
    const level = state.level; const next = level.deliveries.find((item) => !state.delivered.includes(item.id));
    $('deliveryProgress').textContent = `${state.delivered.length} of ${level.deliveries.length} delivered`;
    if (state.delivered.length === 0) {
      $('instructionIcon').textContent = level.icon; $('instructionTitle').textContent = level.story;
      $('instructionText').textContent = level.ordered ? 'The numbered parcels must be delivered from first to last.' : 'Choose any parcel, then find its picture sign.';
    } else if (next) {
      $('instructionIcon').textContent = next.icon; $('instructionTitle').textContent = level.ordered ? `Next: ${next.item}` : 'Lovely delivery!';
      $('instructionText').textContent = level.ordered ? `Take it to the ${next.destination}.` : 'Choose another parcel from the wagon.';
    }

    $('neighborhood').replaceChildren(...level.deliveries.map((item) => {
      const delivered = state.delivered.includes(item.id); const button = document.createElement('button'); button.type = 'button'; button.className = `destination${delivered ? ' delivered' : ''}`; button.dataset.id = item.id; button.disabled = delivered; button.style.setProperty('--building-color', item.color); button.setAttribute('aria-label', `${item.destination}, sign shows ${item.buildingIcon}${delivered ? ', delivered' : ''}`);
      button.innerHTML = `<span class="building-sign" aria-hidden="true">${item.buildingIcon}</span><span class="building-window window-left"></span><span class="building-window window-right"></span><span class="building-door"></span><span class="destination-label">${item.destination}</span>`;
      button.addEventListener('click', () => attemptDelivery(item.id, button)); button.addEventListener('dragover', (event) => { event.preventDefault(); button.classList.add('targeted'); }); button.addEventListener('dragleave', () => button.classList.remove('targeted')); button.addEventListener('drop', (event) => { event.preventDefault(); button.classList.remove('targeted'); state.selected = event.dataTransfer.getData('text/plain'); attemptDelivery(item.id, button); });
      return button;
    }));

    $('parcelList').replaceChildren(...level.deliveries.map((item, index) => {
      const delivered = state.delivered.includes(item.id); const button = document.createElement('button'); button.type = 'button'; button.className = `parcel${delivered ? ' delivered' : ''}${state.selected === item.id ? ' selected' : ''}${level.ordered && next && next.id === item.id ? ' next-up' : ''}`; button.dataset.id = item.id; button.dataset.order = level.ordered ? String(index + 1) : ''; button.disabled = delivered; button.draggable = !delivered; button.setAttribute('aria-pressed', state.selected === item.id ? 'true' : 'false'); button.setAttribute('aria-label', `${level.ordered ? `Delivery ${index + 1}: ` : ''}${item.item}${state.selected === item.id ? ', selected' : ''}`);
      button.innerHTML = `<span class="parcel-icon" aria-hidden="true">${item.icon}</span><span class="parcel-name">${item.item}</span>`;
      button.addEventListener('click', () => selectParcel(item.id)); button.addEventListener('dragstart', (event) => { state.selected = item.id; event.dataTransfer.setData('text/plain', item.id); event.dataTransfer.effectAllowed = 'move'; updateSelection(); });
      return button;
    }));
    updateSelection();syncGenerated();
  }

  function selectParcel(id) {
    if(state.pending)return;
    const next = state.level.deliveries.find((item) => !state.delivered.includes(item.id));
    if (state.level.ordered && next.id !== id) { state.mistakes += 1; softSound(); announce(`First choose parcel ${state.level.deliveries.indexOf(next) + 1}: ${next.item}.`); return; }
    state.selected = state.selected === id ? null : id; updateSelection();
    const item = state.level.deliveries.find((delivery) => delivery.id === id);
    if (state.selected) { tone([[440, 0, .09]]); $('instructionIcon').textContent = item.icon; $('instructionTitle').textContent = `Where does the ${item.item.toLowerCase()} go?`; $('instructionText').textContent = `Look for the matching sign at the ${item.destination}.`; }
  }

  function updateSelection() {
    document.querySelectorAll('.parcel').forEach((button) => { const selected = button.dataset.id === state.selected; button.classList.toggle('selected', selected); button.setAttribute('aria-pressed', selected ? 'true' : 'false'); });
    document.querySelectorAll('.destination').forEach((button) => button.classList.toggle('selected-match', state.level.id===1 && Boolean(state.selected) && button.dataset.id === state.selected));
  }

  function attemptDelivery(destinationId, destinationButton) {
    if(state.pending)return;
    if (!state.selected) { softSound(); announce('Choose a parcel from the wagon first.'); $('wagonTitle').textContent = 'Tap a parcel first'; return; }
    const result = C.canDeliver(state.level, state.selected, destinationId, state.delivered);
    if (!result.ok) {
      state.mistakes += 1; softSound(); destinationButton.classList.remove('wrong'); void destinationButton.offsetWidth; destinationButton.classList.add('wrong');
      announce(result.reason === 'order' ? 'Follow the number on the next parcel.' : 'That sign needs a different parcel. Try another building!'); return;
    }
    const parcelId = state.selected; const parcel = state.level.deliveries.find((item) => item.id === parcelId); state.selected = null;
    const generation=state.generation;state.pending=true;
    animateDelivery(parcel, destinationButton, () => {
      if(generation!==state.generation)return;state.pending=false;
      state.delivered.push(parcelId);writeHash(state.level.id); goodSound(); destinationButton.classList.add('celebrate'); renderLevel();
      if (state.delivered.length === state.level.deliveries.length) state.finishTimer=setTimeout(()=>{if(generation===state.generation)finishLevel();},650);
    });
  }

  function animateDelivery(item, destinationButton, done) {
    const source = document.querySelector(`.parcel[data-id="${item.id}"]`); const a = source.getBoundingClientRect(); const b = destinationButton.getBoundingClientRect();
    const flyer = document.createElement('div'); flyer.className = 'delivery-flyer'; flyer.textContent = item.icon; flyer.style.left = `${a.left + a.width / 2 - 27}px`; flyer.style.top = `${a.top + a.height / 2 - 27}px`; document.body.append(flyer);
    requestAnimationFrame(() => { flyer.style.transform = `translate(${b.left + b.width / 2 - (a.left + a.width / 2)}px, ${b.top + b.height / 2 - (a.top + a.height / 2)}px) scale(.7)`; flyer.style.opacity = '.2'; });
    setTimeout(() => { flyer.remove(); done(); }, matchMedia('(prefers-reduced-motion: reduce)').matches ? 30 : 520);
  }

  function finishLevel() {
    if(!state.generated)state.mask = C.completeLevel(state.mask, state.level.id); writeHash(state.level.id); finishSound();
    const careful = state.mistakes === 0; $('resultSticker').hidden = !careful; $('resultMessage').textContent = !state.generated&&state.level.id === C.LEVELS.length ? 'You helped the whole neighborhood. The little red wagon is home!' : careful ? 'Every match was just right. What a careful courier!' : 'You kept trying and helped every neighbor. Wonderful work!';
    $('nextButton').textContent = state.generated?'Another level →':state.level.id === C.LEVELS.length ? 'Visit all routes' : 'Next route →';syncGenerated(); $('resultDialog').showModal();
  }

  function nextLevel() { if(state.generated){procedural.next({_generated:state.generated});return;}$('resultDialog').close();if (state.level.id < C.LEVELS.length) startLevel(state.level.id + 1); else openRoutes(); }
  function speakInstruction() { if (!('speechSynthesis' in window)) { announce('Read aloud is not available in this browser.'); return; } const voice=window.speechSynthesis.getVoices().find(v=>v.localService&&v.lang.startsWith('en'));if(!voice){announce('No local reading voice is available. The picture signs show the same clues.');return;}speechSynthesis.cancel(); const text = `${$('instructionTitle').textContent}. ${$('instructionText').textContent}`; const utterance = new SpeechSynthesisUtterance(text); utterance.rate = .85;utterance.voice=voice; speechSynthesis.speak(utterance); }

  async function copyText(value, message) { try { await navigator.clipboard.writeText(value); announce(message); } catch (_) { $('saveCode').select(); announce('Select the code and copy it.'); } }
  function playCode(){return state.generated?C.encodeGenerated(state.mask,state.generated,state.delivered,state.mistakes):C.encodeSession(state.mask,state.level.id,state.delivered,state.mistakes);}
  function currentCode(){return document.getElementById('playScreen').classList.contains('active')?playCode():C.encodeProgress(state.mask);}
  function syncGenerated(){procedural?.sync({level:state.level.id-1,_generated:state.generated,won:state.delivered.length===state.level.deliveries.length});}
  function openSave() { $('saveCode').value = currentCode(); $('codeStatus').textContent = ''; $('saveDialog').showModal(); }
  function loadCode() { const session=C.decodeSession($('saveCode').value);if(session){state.mask=session.mask;$('saveDialog').close();startLevel(session.level,session);return;}const decoded = C.decodeProgress($('saveCode').value); if (decoded === null) { $('codeStatus').textContent = 'That code does not look right. Check every letter and number.'; return; } state.mask=decoded;$('saveDialog').close();openRoutes();announce(`Loaded ${C.completedCount(state.mask)} completed routes.`); }

  $('homeButton').addEventListener('click', openHome); $('continueButton').addEventListener('click', () => startLevel(C.nextUnlockedLevel(state.mask))); $('routesButton').addEventListener('click', openRoutes); $('leaveButton').addEventListener('click', openRoutes);
  document.querySelectorAll('[data-screen="home"]').forEach((button) => button.addEventListener('click', openHome));
  $('helpButton').addEventListener('click', () => $('helpDialog').showModal()); $('saveButton').addEventListener('click', openSave); $('soundButton').addEventListener('click', () => { state.sound = !state.sound; $('soundButton').textContent = state.sound ? '♪' : '×'; $('soundButton').setAttribute('aria-label', state.sound ? 'Mute sound' : 'Turn on sound'); $('soundButton').setAttribute('aria-pressed', state.sound ? 'false' : 'true'); if (state.sound) tone([[523, 0, .12]]); });
  $('speakButton').addEventListener('click', speakInstruction); $('nextButton').addEventListener('click', nextLevel); $('resultRoutesButton').addEventListener('click', () => { $('resultDialog').close(); openRoutes(); });
  document.querySelectorAll('[data-close]').forEach((button) => button.addEventListener('click', () => $(button.dataset.close).close()));
  $('copyCodeButton').addEventListener('click', () => copyText(currentCode(), 'Save code copied.')); $('copyLinkButton').addEventListener('click', () => copyText(location.href, 'Game link copied.')); $('loadCodeButton').addEventListener('click', loadCode);
  window.addEventListener('hashchange', () => { const before = state.mask; readHash(); if (before !== state.mask) renderRoutes(); });

  const procedural=window.MiniProcedural?.mount(C.generatedAdapter,'little-delivery-wagon',s=>{$('resultDialog').close();startLevel(s.data.id,{generated:s._generated,ids:[],mistakes:0});});
  const initial = readHash(); renderRoutes(); const requested = Number(initial.get('level'));
  if(initial.session)startLevel(initial.session.level,initial.session);else if (requested && C.isUnlocked(state.mask, requested)) startLevel(requested); else { showScreen('home'); writeHash(); }
}());
