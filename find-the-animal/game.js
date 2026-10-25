/* Find the Animal: Wild Trails — entirely local, client-side game. */
(function (root, factory) {
  const api = factory();
  if (typeof module === 'object' && module.exports) module.exports = api;
  if (root && root.document) {
    root.WildTrails = api;
    root.addEventListener('DOMContentLoaded', () => api.init(root.document));
  }
})(typeof window !== 'undefined' ? window : null, function () {
  'use strict';

  const VERSION = 2;
  const STORAGE_KEY = 'findTheAnimal.wildTrails.v2';
  const ROUNDS_PER_HABITAT = 8;
  const UNLOCK_AFTER = 6;

  const ANIMALS = {
    bear: { clue: 'Look for round ears and a broad brown face.', homes: ['woodland'] },
    buffalo: { clue: 'Look for strong horns and a wide, sturdy head.', homes: ['savanna'] },
    chick: { clue: 'Look for a tiny yellow face and a little orange beak.', homes: ['farm'] },
    chicken: { clue: 'Look for a red comb and a curious farmyard face.', homes: ['farm'] },
    cow: { clue: 'Look for soft ears and a friendly spotted face.', homes: ['farm'] },
    crocodile: { clue: 'Look for green scales and a long, toothy snout.', homes: ['rainforest'] },
    dog: { clue: 'Look for floppy ears and a loyal, friendly face.', homes: ['farm', 'woodland'] },
    duck: { clue: 'Look for a flat beak and bright water-loving feathers.', homes: ['farm', 'coast'] },
    elephant: { clue: 'Look for enormous ears, tusks, and a long trunk.', homes: ['savanna'] },
    frog: { clue: 'Look for wide eyes and a small green face.', homes: ['rainforest', 'bamboo', 'woodland'] },
    giraffe: { clue: 'Look for golden patches and two little horns.', homes: ['savanna'] },
    goat: { clue: 'Look for small horns and a neat little beard.', homes: ['farm'] },
    gorilla: { clue: 'Look for a dark face with a powerful brow.', homes: ['rainforest'] },
    hippo: { clue: 'Look for tiny ears on a big blue-grey face.', homes: ['savanna'] },
    horse: { clue: 'Look for tall ears and a long, gentle face.', homes: ['farm'] },
    monkey: { clue: 'Look for round ears and a playful smile.', homes: ['rainforest', 'bamboo'] },
    moose: { clue: 'Look for the grandest antlers in the woodland.', homes: ['woodland'] },
    narwhal: { clue: 'Look for the whale with one magical-looking tusk.', homes: ['coast'] },
    owl: { clue: 'Look closely at its big, watchful eyes.', homes: ['woodland', 'bamboo'] },
    panda: { clue: 'Look for black eye patches and round black ears.', homes: ['bamboo'] },
    parrot: { clue: 'Look for a curved beak and brilliant feathers.', homes: ['rainforest'] },
    penguin: { clue: 'Look for a black-and-white face and orange beak.', homes: ['coast'] },
    pig: { clue: 'Look for a pink snout and two perky ears.', homes: ['farm'] },
    rabbit: { clue: 'Look for two very long ears and a small nose.', homes: ['farm', 'woodland'] },
    rhino: { clue: 'Look for thick grey skin and a horn on its nose.', homes: ['savanna'] },
    snake: { clue: 'Look for bright scales and no ears at all.', homes: ['rainforest', 'woodland'] },
    sloth: { clue: 'Look for a calm smile and dark patches by its eyes.', homes: ['rainforest'] },
    walrus: { clue: 'Look for whiskers and two long white tusks.', homes: ['coast'] },
    whale: { clue: 'Look for a huge blue ocean friend with a wide smile.', homes: ['coast'] },
    zebra: { clue: 'Look for bold black-and-white stripes.', homes: ['savanna'] }
  };

  const HABITATS = [
    { id: 'farm', name: 'Farm Meadow', icon: '🌾', color: '#d7e7a9', accent: '#557a3d', description: 'Barn doors, pond edges, and friendly faces in the grass.', pool: ['cow','pig','goat','horse','chicken','chick','dog','duck','rabbit'] },
    { id: 'woodland', name: 'Whispering Woodland', icon: '🌲', color: '#a9cfb0', accent: '#315f48', description: 'Follow the quiet path beneath the mossy trees.', pool: ['bear','moose','owl','rabbit','frog','snake','dog'] },
    { id: 'savanna', name: 'Golden Savanna', icon: '☀️', color: '#ecd182', accent: '#9b642f', description: 'Search the sunlit grass around a busy waterhole.', pool: ['elephant','giraffe','zebra','buffalo','rhino','hippo'] },
    { id: 'rainforest', name: 'Emerald Rainforest', icon: '🌿', color: '#83c9a3', accent: '#1e6848', description: 'Peer between giant leaves, vines, and river stones.', pool: ['monkey','gorilla','parrot','sloth','frog','snake','crocodile'] },
    { id: 'bamboo', name: 'Bamboo Grove', icon: '🎋', color: '#d8e7a0', accent: '#4f7842', description: 'A peaceful green maze with some surprising visitors.', pool: ['panda','monkey','frog','owl','rabbit','duck'] },
    { id: 'coast', name: 'Sparkling Coast', icon: '🌊', color: '#9fd9df', accent: '#286e7a', description: 'Scan the shore, blue water, and a chilly island cove.', pool: ['whale','narwhal','walrus','penguin','duck'] }
  ];

  const ROUND_RECIPES = [
    { title: 'First Footsteps', description: 'One friendly face', count: 6, targets: 1, rule: 'species' },
    { title: 'Across the Meadow', description: 'Two finds, one trail', count: 9, targets: 2, rule: 'species' },
    { title: 'Colour Neighbours', description: 'Look past similar colours', count: 11, targets: 3, rule: 'species' },
    { title: 'Shape Shifters', description: 'Match the exact portrait', count: 13, targets: 3, rule: 'exact' },
    { title: 'Close Cousins', description: 'Small details matter', count: 14, targets: 3, rule: 'exact' },
    { title: 'Ranger’s List', description: 'Find the list in any order', count: 16, targets: 3, rule: 'checklist' },
    { title: 'Hidden Corners', description: 'A busy expedition', count: 18, targets: 3, rule: 'exact' },
    { title: 'Habitat Star', description: 'The grand four-find trail', count: 20, targets: 4, rule: 'checklist' }
  ];

  function titleCase(value) { return value.replace(/\b\w/g, char => char.toUpperCase()); }
  function hashString(value) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) { hash ^= value.charCodeAt(i); hash = Math.imul(hash, 16777619); }
    return hash >>> 0;
  }
  function makeRandom(seed) {
    let value = typeof seed === 'number' ? seed >>> 0 : hashString(String(seed));
    return function () { value += 0x6d2b79f5; let n = value; n = Math.imul(n ^ n >>> 15, n | 1); n ^= n + Math.imul(n ^ n >>> 7, n | 61); return ((n ^ n >>> 14) >>> 0) / 4294967296; };
  }
  function shuffle(values, random) {
    const copy = values.slice();
    for (let i = copy.length - 1; i > 0; i -= 1) { const j = Math.floor(random() * (i + 1)); [copy[i], copy[j]] = [copy[j], copy[i]]; }
    return copy;
  }
  function sample(values, random) { return values[Math.floor(random() * values.length)]; }

  function buildPositions(count, random) {
    const cols = count <= 8 ? 4 : 5;
    const rows = Math.ceil(count / cols);
    const cells = [];
    for (let row = 0; row < rows; row += 1) {
      for (let col = 0; col < cols; col += 1) {
        const x = cols === 1 ? 50 : 9 + col * (82 / (cols - 1));
        const y = rows === 1 ? 50 : 13 + row * (74 / (rows - 1));
        cells.push({ x, y });
      }
    }
    return shuffle(cells, random).slice(0, count).map(cell => ({
      x: Math.max(7, Math.min(93, cell.x + (random() - .5) * 4)),
      y: Math.max(10, Math.min(90, cell.y + (random() - .5) * 5)),
      rotation: Math.round((random() - .5) * 18)
    }));
  }

  function generateRound(options) {
    const habitat = typeof options.habitat === 'string' ? HABITATS.find(item => item.id === options.habitat) : options.habitat;
    if (!habitat) throw new Error('Unknown habitat');
    const recipe = Object.assign({}, ROUND_RECIPES[options.roundIndex || 0], options.recipe || {});
    const random = makeRandom(options.seed || `${habitat.id}:${options.roundIndex || 0}`);
    const targetSpecies = shuffle(habitat.pool, random).slice(0, Math.min(recipe.targets, habitat.pool.length));
    const targetInstances = targetSpecies.map((animal, index) => ({
      id: `target-${index}-${animal}`,
      animal,
      style: recipe.rule === 'exact' ? sample(['round','square'], random) : 'round',
      isTarget: true
    }));
    const instances = targetInstances.slice();

    if (recipe.rule === 'exact') {
      targetInstances.forEach((target, index) => {
        if (instances.length < recipe.count) instances.push({ id: `lookalike-${index}-${target.animal}`, animal: target.animal, style: target.style === 'round' ? 'square' : 'round', isTarget: false });
      });
    }

    let counter = 0;
    while (instances.length < recipe.count) {
      let animal = sample(habitat.pool, random);
      if (recipe.rule !== 'exact' && targetSpecies.includes(animal)) {
        animal = sample(habitat.pool.filter(name => !targetSpecies.includes(name)), random);
      }
      let style = recipe.rule === 'exact' ? sample(['round','square'], random) : 'round';
      if (recipe.rule === 'exact') {
        const matchingTarget = targetInstances.find(target => target.animal === animal && target.style === style);
        if (matchingTarget) style = style === 'round' ? 'square' : 'round';
      }
      instances.push({ id: `decoy-${counter}-${animal}-${style}`, animal, style, isTarget: false });
      counter += 1;
    }

    const positions = buildPositions(instances.length, random);
    const placed = shuffle(instances, random).map((instance, index) => Object.assign({}, instance, positions[index]));
    return { habitatId: habitat.id, recipe, seed: options.seed, instances: placed, targetIds: targetInstances.map(item => item.id), targetSpecies };
  }

  function defaultSave() {
    return { version: VERSION, completed: {}, badges: {}, discovered: [], settings: { sound: true, motion: true, autoHint: true }, current: null, daily: {} };
  }
  function normalizeSave(value) {
    const base = defaultSave();
    if (!value || typeof value !== 'object' || value.version !== VERSION) return base;
    if (value.completed && typeof value.completed === 'object') {
      for (const [key, complete] of Object.entries(value.completed)) {
        const [habitatId, roundText] = key.split(':');
        if (complete === true && HABITATS.some(habitat => habitat.id === habitatId) && Number(roundText) >= 0 && Number(roundText) < ROUNDS_PER_HABITAT) base.completed[key] = true;
      }
    }
    base.badges = value.badges && typeof value.badges === 'object' ? value.badges : {};
    base.discovered = Array.isArray(value.discovered) ? [...new Set(value.discovered.filter(name => ANIMALS[name]))] : [];
    if (value.settings && typeof value.settings === 'object') {
      for (const key of ['sound','motion','autoHint']) if (typeof value.settings[key] === 'boolean') base.settings[key] = value.settings[key];
    }
    base.current = value.current && typeof value.current === 'object' ? value.current : null;
    base.daily = value.daily && typeof value.daily === 'object' ? value.daily : {};
    return base;
  }
  function completedCount(save, habitatId) { return Object.keys(save.completed).filter(key => key.startsWith(`${habitatId}:`) && save.completed[key]).length; }
  function habitatUnlocked(save, index) { return index === 0 || completedCount(save, HABITATS[index - 1].id) >= UNLOCK_AFTER; }
  function roundUnlocked(save, habitat, roundIndex) { return roundIndex === 0 || !!save.completed[`${habitat.id}:${roundIndex - 1}`]; }

  function createApp(doc) {
    const byId = id => doc.getElementById(id);
    const state = {
      save: defaultSave(), screen: 'home', selectedHabitat: 0, journalFilter: 'all', round: null,
      hintStage: 0, mistakes: 0, hints: 0, paused: false, timerId: null, autoHintId: null,
      startedAt: 0, pausedAt: 0, pausedDuration: 0, messageTimer: null, toastTimer: null, audio: null, storageAvailable: true, settingsPausedRound: false
    };

    function loadSave() {
      try { state.save = normalizeSave(JSON.parse((globalThis.UmmahProfile || localStorage).getItem(STORAGE_KEY) || 'null')); }
      catch (error) { state.save = defaultSave(); state.storageAvailable = false; }
    }
    function persist() {
      try { (globalThis.UmmahProfile || localStorage).setItem(STORAGE_KEY, JSON.stringify(state.save)); }
      catch (error) { state.storageAvailable = false; byId('saveNote').textContent = 'Progress will last for this visit.'; }
    }
    function imagePath(animal, style = 'round') { return `assets/${style}/${animal}.png`; }
    function closeDialog(dialog) { if (dialog && dialog.open) dialog.close(); }
    function showScreen(name) {
      doc.querySelectorAll('.screen').forEach(screen => screen.classList.toggle('active', screen.id === `${name}Screen`));
      state.screen = name;
      if (name !== 'play') stopClock();
      byId('mainContent').focus({ preventScroll: true });
    }
    function toast(message) {
      const element = byId('toast'); clearTimeout(state.toastTimer); element.textContent = message; element.classList.remove('visible'); void element.offsetWidth; element.classList.add('visible');
      state.toastTimer = setTimeout(() => element.classList.remove('visible'), 2900);
    }

    function sound(kind) {
      if (!state.save.settings.sound) return;
      try {
        const AudioContext = window.AudioContext || window.webkitAudioContext;
        if (!AudioContext) return;
        state.audio = state.audio || new AudioContext();
        if (state.audio.state === 'suspended') state.audio.resume();
        const now = state.audio.currentTime;
        const notes = kind === 'found' ? [523,659,784] : kind === 'complete' ? [392,523,659,784] : [190,145];
        notes.forEach((frequency, index) => {
          const oscillator = state.audio.createOscillator(); const gain = state.audio.createGain();
          oscillator.type = kind === 'wrong' ? 'triangle' : 'sine'; oscillator.frequency.value = frequency;
          gain.gain.setValueAtTime(.001, now + index * .07); gain.gain.exponentialRampToValueAtTime(.12, now + index * .07 + .015); gain.gain.exponentialRampToValueAtTime(.001, now + index * .07 + .16);
          oscillator.connect(gain); gain.connect(state.audio.destination); oscillator.start(now + index * .07); oscillator.stop(now + index * .07 + .18);
        });
      } catch (error) { /* Audio is optional. */ }
    }

    function updateHome() {
      const completed = Object.keys(state.save.completed).filter(key => state.save.completed[key]).length;
      const current = state.save.current;
      byId('continueButton').textContent = current ? 'Continue current trail' : completed ? 'Continue adventure' : 'Begin adventure';
      byId('collectionSummary').textContent = `${state.save.discovered.length} of ${Object.keys(ANIMALS).length} animals found`;
      byId('saveNote').textContent = state.storageAvailable ? 'Bookmark this page or copy a save code to keep your progress.' : 'Progress will last for this visit.';
      const today = new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' });
      byId('dailyLabel').textContent = state.save.daily[today] ? `Completed ${today} · replay anytime` : `${today} · one shared daily seed`;
    }
    function goHome() { abandonRuntime(); updateHome(); showScreen('home'); }

    function renderMap() {
      const map = byId('habitatMap'); map.textContent = '';
      const total = Object.keys(state.save.completed).filter(key => state.save.completed[key]).length;
      byId('mapProgress').textContent = `${total} of ${HABITATS.length * ROUNDS_PER_HABITAT} trails complete`;
      HABITATS.forEach((habitat, index) => {
        const count = completedCount(state.save, habitat.id); const unlocked = habitatUnlocked(state.save, index);
        const button = doc.createElement('button'); button.type = 'button'; button.className = 'habitat-card'; button.disabled = !unlocked; button.style.background = habitat.color;
        button.innerHTML = `<span class="card-progress">${count} / 8</span><span class="map-icon" aria-hidden="true">${habitat.icon}</span><h2>${habitat.name}</h2><p>${habitat.description}</p>${unlocked ? '' : `<span class="lock"><span>🔒</span>Complete 6 trails in<br>${HABITATS[index - 1].name}</span>`}`;
        button.addEventListener('click', () => openHabitat(index)); map.appendChild(button);
      });
      showScreen('map');
    }

    function openHabitat(index) {
      state.selectedHabitat = index; const habitat = HABITATS[index]; const count = completedCount(state.save, habitat.id);
      byId('roundsEyebrow').textContent = `Habitat ${index + 1} of ${HABITATS.length}`; byId('roundsTitle').textContent = habitat.name; byId('roundsProgress').textContent = `${count} of 8 complete`;
      byId('habitatIntro').style.background = `linear-gradient(115deg, ${habitat.color}, #fffdf5)`;
      byId('habitatIntro').innerHTML = `<span class="intro-icon" aria-hidden="true">${habitat.icon}</span><div><h2>${count >= 6 ? 'Habitat path unlocked!' : `${UNLOCK_AFTER - Math.min(count, UNLOCK_AFTER)} trail${UNLOCK_AFTER - Math.min(count, UNLOCK_AFTER) === 1 ? '' : 's'} until the next habitat`}</h2><p>${habitat.description} Find its animals to fill your journal.</p></div>`;
      const grid = byId('roundGrid'); grid.textContent = '';
      ROUND_RECIPES.forEach((recipe, roundIndex) => {
        const key = `${habitat.id}:${roundIndex}`; const complete = !!state.save.completed[key]; const unlocked = roundUnlocked(state.save, habitat, roundIndex);
        const button = doc.createElement('button'); button.type = 'button'; button.disabled = !unlocked; button.className = `round-card${complete ? ' complete' : ''}`;
        const badge = state.save.badges[key] || {};
        button.innerHTML = `<span class="round-number">${complete ? '✓' : roundIndex + 1}</span><span class="stars">${badge.unassisted ? '★' : ''}${badge.careful ? '★' : ''}</span><h3>${recipe.title}</h3><p>${unlocked ? recipe.description : 'Complete the previous trail'}</p>`;
        button.addEventListener('click', () => startAdventure(index, roundIndex)); grid.appendChild(button);
      });
      showScreen('rounds');
    }

    function savedCurrentIsValid(current) {
      if (!current || !['adventure','free','daily'].includes(current.mode)) return false;
      if (!Number.isInteger(current.habitatIndex) || !HABITATS[current.habitatIndex]) return false;
      if (!Number.isInteger(current.roundIndex) || current.roundIndex < 0 || current.roundIndex >= ROUND_RECIPES.length) return false;
      if (current.mode === 'free' && (!current.recipe || !Number.isInteger(current.recipe.count) || !Number.isInteger(current.recipe.targets) || !['species','exact','checklist'].includes(current.recipe.rule))) return false;
      return true;
    }
    function startAdventure(habitatIndex, roundIndex, restore) {
      const habitat = HABITATS[habitatIndex]; const seed = `wild-trails:${habitat.id}:${roundIndex}:v2`;
      startRound({ mode: 'adventure', habitatIndex, roundIndex, seed, restore });
    }
    function continueAdventure() {
      if (savedCurrentIsValid(state.save.current)) { const current = state.save.current; startRound(Object.assign({}, current, { restore: current })); return; }
      for (let h = 0; h < HABITATS.length; h += 1) {
        if (!habitatUnlocked(state.save, h)) break;
        for (let r = 0; r < ROUNDS_PER_HABITAT; r += 1) if (roundUnlocked(state.save, HABITATS[h], r) && !state.save.completed[`${HABITATS[h].id}:${r}`]) { startAdventure(h, r); return; }
      }
      startAdventure(0, 0);
    }

    function startRound(options) {
      abandonRuntime();
      const habitat = HABITATS[options.habitatIndex];
      const customRecipe = options.recipe || null;
      const generated = generateRound({ habitat, roundIndex: options.roundIndex, seed: options.seed, recipe: customRecipe });
      const restoredFound = options.restore && Array.isArray(options.restore.foundTargetIds) ? options.restore.foundTargetIds.filter(id => generated.targetIds.includes(id)) : [];
      state.round = Object.assign(generated, { mode: options.mode, habitatIndex: options.habitatIndex, roundIndex: options.roundIndex, foundTargetIds: restoredFound, foundSpecies: restoredFound.map(id => generated.instances.find(item => item.id === id).animal), challenge: !!options.challenge, completed: false, token: Date.now() + Math.random() });
      state.mistakes = options.restore ? Number(options.restore.mistakes || 0) : 0; state.hints = options.restore ? Number(options.restore.hints || 0) : 0; state.hintStage = 0; state.paused = false; state.pausedDuration = 0; state.startedAt = Date.now();
      showScreen('play'); renderRound(); updateTarget(); saveCurrent(); startClock(); scheduleAutoHint();
    }

    function saveCurrent() {
      if (!state.round || state.round.completed) return;
      state.save.current = { mode: state.round.mode, habitatIndex: state.round.habitatIndex, roundIndex: state.round.roundIndex, seed: state.round.seed, recipe: state.round.mode === 'free' ? state.round.recipe : undefined, challenge: state.round.challenge, foundTargetIds: state.round.foundTargetIds.slice(), mistakes: state.mistakes, hints: state.hints };
      persist();
    }
    function abandonRuntime() { clearInterval(state.timerId); clearTimeout(state.autoHintId); clearTimeout(state.messageTimer); state.timerId = null; state.autoHintId = null; state.round = null; state.paused = false; closeDialog(byId('pauseDialog')); }

    function landmarksFor(habitatId) {
      const common = '<span class="landmark tree one"></span><span class="landmark tree two"></span>';
      if (habitatId === 'farm') return `${common}<span class="landmark barn"></span><span class="landmark pond"></span>`;
      if (habitatId === 'woodland') return `${common}<span class="landmark mountain"></span><span class="landmark reeds"></span>`;
      if (habitatId === 'savanna') return '<span class="landmark tree two"></span><span class="landmark pond"></span>';
      if (habitatId === 'rainforest') return `${common}<span class="landmark reeds"></span>`;
      if (habitatId === 'bamboo') return '<span class="landmark bamboo-stalk one"></span><span class="landmark bamboo-stalk two"></span><span class="landmark pond"></span>';
      return '<span class="landmark ice"></span><span class="landmark reeds"></span>';
    }
    function renderRound() {
      const round = state.round; const habitat = HABITATS[round.habitatIndex];
      byId('playHabitatIcon').textContent = habitat.icon; byId('playHabitat').textContent = habitat.name;
      byId('playRound').textContent = round.mode === 'adventure' ? `Trail ${round.roundIndex + 1} of 8` : round.mode === 'daily' ? 'Today’s daily trail' : `${titleCase(round.recipe.title)} free play`;
      byId('timer').classList.toggle('hidden', !round.challenge); byId('scene').className = `scene ${habitat.id}`; byId('sceneBackdrop').innerHTML = landmarksFor(habitat.id);
      const layer = byId('animalLayer'); layer.textContent = ''; const size = round.instances.length >= 18 ? 10 : round.instances.length >= 13 ? 11.5 : 13;
      round.instances.forEach(instance => {
        const button = doc.createElement('button'); button.type = 'button'; button.className = `animal-button${round.foundTargetIds.includes(instance.id) ? ' found' : ''}`; button.dataset.id = instance.id;
        button.style.setProperty('--x', `${instance.x}%`); button.style.setProperty('--y', `${instance.y}%`); button.style.setProperty('--rotation', `${instance.rotation}deg`); button.style.setProperty('--animal-size', `${size}cqw`);
        button.setAttribute('aria-label', `${titleCase(instance.animal)}${instance.style === 'square' ? ', square portrait' : ', round portrait'}${round.foundTargetIds.includes(instance.id) ? ', found' : ''}`);
        button.innerHTML = `<img src="${imagePath(instance.animal, instance.style)}" alt="" draggable="false">`;
        button.addEventListener('click', () => chooseAnimal(instance, button)); layer.appendChild(button);
      });
    }

    function remainingTargets() { return state.round.targetIds.filter(id => !state.round.foundTargetIds.includes(id)); }
    function currentTarget() {
      const remaining = remainingTargets(); if (!remaining.length) return null;
      const id = remaining[0]; return state.round.instances.find(item => item.id === id);
    }
    function updateTarget() {
      const round = state.round; if (!round) return; const remaining = remainingTargets(); const target = currentTarget();
      byId('findProgress').textContent = `${round.foundTargetIds.length} / ${round.targetIds.length} found`;
      const tray = byId('targetTray'); tray.textContent = '';
      round.targetIds.forEach(id => { const item = round.instances.find(instance => instance.id === id); const found = round.foundTargetIds.includes(id); const span = doc.createElement('span'); span.className = `tray-animal${found ? ' found' : ''}`; span.title = `${titleCase(item.animal)}${found ? ' found' : ''}`; span.innerHTML = `<img src="${imagePath(item.animal, item.style)}" alt="">`; tray.appendChild(span); });
      if (!target) return;
      const checklist = round.recipe.rule === 'checklist'; const label = checklist ? 'Choose any remaining animal' : round.recipe.rule === 'exact' ? `Find the ${target.style} ${target.animal}` : `Find the ${target.animal}`;
      byId('targetEyebrow').textContent = checklist ? `${remaining.length} left on the ranger’s list` : 'Your next find'; byId('targetText').textContent = label; byId('targetClue').textContent = checklist ? `You can find ${remaining.map(id => titleCase(round.instances.find(item => item.id === id).animal)).join(', ')} in any order.` : ANIMALS[target.animal].clue;
      byId('targetPreview').src = imagePath(target.animal, target.style); byId('targetPreview').alt = `${titleCase(target.animal)} target portrait`;
      byId('ruleLabel').textContent = round.recipe.rule === 'exact' ? 'Match both the animal and portrait shape' : checklist ? 'Find the remaining animals in any order' : 'Match the animal in the picture';
      clearHintVisuals();
    }

    function isCorrect(instance) {
      const remaining = remainingTargets();
      return state.round.recipe.rule === 'checklist' ? remaining.includes(instance.id) : instance.id === remaining[0];
    }
    function chooseAnimal(instance, button) {
      if (!state.round || state.round.completed || state.paused || state.round.foundTargetIds.includes(instance.id)) return;
      if (!isCorrect(instance)) {
        state.mistakes += 1; sound('wrong'); button.classList.remove('wrong'); void button.offsetWidth; button.classList.add('wrong');
        const target = currentTarget(); showSceneMessage(`That’s the ${titleCase(instance.animal)}. ${state.round.recipe.rule === 'checklist' ? 'Try another animal on the list.' : `Keep looking for the ${titleCase(target.animal)}.`}`); saveCurrent(); return;
      }
      state.round.foundTargetIds.push(instance.id); state.round.foundSpecies.push(instance.animal); button.classList.add('found'); button.setAttribute('aria-label', `${titleCase(instance.animal)}, found`);
      if (!state.save.discovered.includes(instance.animal)) { state.save.discovered.push(instance.animal); toast(`New journal page: ${titleCase(instance.animal)}!`); }
      sound('found'); sparkleAt(instance.x, instance.y); state.hintStage = 0; clearTimeout(state.autoHintId); saveCurrent();
      if (remainingTargets().length === 0) { setTimeout(() => completeRound(), state.save.settings.motion ? 450 : 20); }
      else { updateTarget(); showSceneMessage(`You found the ${titleCase(instance.animal)}!`); scheduleAutoHint(); }
    }

    function showSceneMessage(message) { const element = byId('sceneMessage'); clearTimeout(state.messageTimer); element.textContent = message; element.classList.remove('visible'); void element.offsetWidth; element.classList.add('visible'); state.messageTimer = setTimeout(() => element.classList.remove('visible'), 2300); }
    function sparkleAt(x, y) {
      if (!state.save.settings.motion) return; const holder = byId('sceneSparkles'); holder.style.left = `${x}%`; holder.style.top = `${y}%`; holder.textContent = '';
      const colors = ['#ffe36f','#ffffff','#ef765e','#87d9bd'];
      for (let i = 0; i < 12; i += 1) { const spark = doc.createElement('i'); const angle = i / 12 * Math.PI * 2; spark.className = 'spark'; spark.style.setProperty('--dx', `${Math.cos(angle) * (35 + i * 2)}px`); spark.style.setProperty('--dy', `${Math.sin(angle) * (35 + i * 2)}px`); spark.style.setProperty('--spark', colors[i % colors.length]); holder.appendChild(spark); }
      setTimeout(() => { holder.textContent = ''; }, 850);
    }

    function clearHintVisuals() { state.hintStage = 0; byId('hintRegion').classList.remove('visible'); byId('scene').classList.remove('hint-dim'); doc.querySelectorAll('.animal-button.target-hint').forEach(button => button.classList.remove('target-hint')); byId('hintButton').innerHTML = '<span aria-hidden="true">💡</span> Give me a hint'; }
    function useHint() {
      if (!state.round || state.round.completed) return; const target = currentTarget(); if (!target) return; state.hints += 1; state.hintStage = Math.min(3, state.hintStage + 1);
      const button = byId('animalLayer').querySelector(`[data-id="${target.id}"]`); const region = byId('hintRegion');
      if (state.hintStage === 1) { region.style.setProperty('--hint-x', `${target.x}%`); region.style.setProperty('--hint-y', `${target.y}%`); region.classList.add('visible'); showSceneMessage('The animal is somewhere inside the glowing region.'); byId('hintButton').textContent = 'Make the clue stronger'; }
      if (state.hintStage === 2) { byId('scene').classList.add('hint-dim'); button.classList.add('target-hint'); region.classList.remove('visible'); showSceneMessage('Look for the animal that is glowing.'); byId('hintButton').textContent = 'Show me again'; }
      if (state.hintStage === 3) { button.classList.add('target-hint'); button.focus({ preventScroll: true }); showSceneMessage(`Here is the ${titleCase(target.animal)}.`); }
      saveCurrent(); sound('found');
    }
    function scheduleAutoHint() { clearTimeout(state.autoHintId); if (!state.save.settings.autoHint) return; state.autoHintId = setTimeout(() => { if (state.round && !state.round.completed && !state.paused) toast('Need a clue? The hint button is ready when you are.'); }, 18000); }

    function elapsedSeconds() { return Math.max(0, Math.floor((Date.now() - state.startedAt - state.pausedDuration) / 1000)); }
    function formatTime(seconds) { return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`; }
    function startClock() { clearInterval(state.timerId); if (!state.round || !state.round.challenge) return; byId('timer').textContent = formatTime(elapsedSeconds()); state.timerId = setInterval(() => { if (!state.paused) byId('timer').textContent = formatTime(elapsedSeconds()); }, 1000); }
    function stopClock() { clearInterval(state.timerId); state.timerId = null; }
    function pauseRound() { if (!state.round || state.round.completed) return; state.paused = true; state.pausedAt = Date.now(); clearTimeout(state.autoHintId); byId('pauseDialog').showModal(); }
    function resumeRound() { if (!state.paused) return; state.pausedDuration += Date.now() - state.pausedAt; state.paused = false; closeDialog(byId('pauseDialog')); scheduleAutoHint(); }

    function completeRound() {
      const round = state.round; if (!round || round.completed) return; round.completed = true; stopClock(); clearTimeout(state.autoHintId); state.save.current = null;
      if (round.mode === 'adventure') {
        const key = `${round.habitatId}:${round.roundIndex}`; state.save.completed[key] = true; const prior = state.save.badges[key] || {};
        state.save.badges[key] = { unassisted: prior.unassisted || state.hints === 0, careful: prior.careful || state.mistakes <= 2, bestTime: round.challenge ? Math.min(prior.bestTime || Infinity, elapsedSeconds()) : prior.bestTime };
      }
      if (round.mode === 'daily') state.save.daily[new Date().toLocaleDateString('en-CA', { year: 'numeric', month: '2-digit', day: '2-digit' })] = true;
      persist(); sound('complete');
      const newFinds = [...new Set(round.foundSpecies)]; byId('resultAnimals').innerHTML = newFinds.map(animal => `<img src="${imagePath(animal)}" alt="${titleCase(animal)}">`).join('');
      byId('resultEyebrow').textContent = round.mode === 'daily' ? 'Daily trail complete' : round.mode === 'free' ? 'Free trail complete' : 'Trail complete';
      byId('resultTitle').textContent = state.hints === 0 ? 'Sharp eyes, ranger!' : 'Every pawprint found!';
      byId('resultMessage').textContent = `You found ${round.targetIds.length} animal${round.targetIds.length === 1 ? '' : 's'} in ${formatTime(elapsedSeconds())}${state.mistakes ? ` with ${state.mistakes} careful correction${state.mistakes === 1 ? '' : 's'}` : ''}.`;
      const badges = []; if (state.hints === 0) badges.push('★ Eagle Eyes'); if (state.mistakes <= 2) badges.push('★ Gentle Tracker'); if (round.challenge) badges.push(`⏱ ${formatTime(elapsedSeconds())}`); byId('resultBadges').innerHTML = badges.map(item => `<span>${item}</span>`).join('');
      byId('nextRoundButton').textContent = round.mode === 'adventure' && round.roundIndex < 7 ? 'Next trail' : 'Play another'; byId('resultDialog').showModal();
    }

    function leaveRound() { state.save.current = state.round && !state.round.completed ? state.save.current : null; persist(); const mode = state.round ? state.round.mode : 'adventure'; const habitat = state.round ? state.round.habitatIndex : state.selectedHabitat; abandonRuntime(); if (mode === 'adventure') openHabitat(habitat); else goHome(); }
    function restartRound() { const round = state.round; if (!round) return; const options = { mode: round.mode, habitatIndex: round.habitatIndex, roundIndex: round.roundIndex, seed: round.seed, recipe: round.mode === 'free' ? round.recipe : undefined, challenge: round.challenge }; closeDialog(byId('pauseDialog')); startRound(options); }
    function resultMap() { closeDialog(byId('resultDialog')); const round = state.round; if (round && round.mode === 'adventure') { const index = round.habitatIndex; abandonRuntime(); openHabitat(index); } else goHome(); }
    function nextRound() { closeDialog(byId('resultDialog')); const round = state.round; if (round && round.mode === 'adventure' && round.roundIndex < 7) startAdventure(round.habitatIndex, round.roundIndex + 1); else { abandonRuntime(); renderMap(); } }

    function renderJournal(filter = state.journalFilter) {
      state.journalFilter = filter; const filters = [{ id: 'all', label: 'All' }, ...HABITATS.map(item => ({ id: item.id, label: `${item.icon} ${item.name.split(' ')[0]}` }))];
      byId('journalFilters').innerHTML = ''; filters.forEach(item => { const button = doc.createElement('button'); button.type = 'button'; button.className = `filter-pill${filter === item.id ? ' active' : ''}`; button.textContent = item.label; button.addEventListener('click', () => renderJournal(item.id)); byId('journalFilters').appendChild(button); });
      const names = Object.keys(ANIMALS).filter(name => filter === 'all' || ANIMALS[name].homes.includes(filter)); byId('journalProgress').textContent = `${state.save.discovered.length} of ${Object.keys(ANIMALS).length} discovered`;
      byId('journalGrid').innerHTML = names.map(name => { const found = state.save.discovered.includes(name); const home = HABITATS.find(item => ANIMALS[name].homes.includes(item.id)); return `<article class="journal-entry${found ? '' : ' unknown'}"><img src="${imagePath(name)}" alt="${found ? titleCase(name) : ''}"><strong>${found ? titleCase(name) : 'Undiscovered'}</strong><small>${found ? `${home.icon} ${home.name}` : 'Keep exploring'}</small></article>`; }).join('');
      showScreen('journal');
    }

    function openSettings() {
      state.settingsPausedRound = !!(state.round && !state.round.completed && !state.paused);
      if (state.settingsPausedRound) { state.paused = true; state.pausedAt = Date.now(); clearTimeout(state.autoHintId); }
      byId('soundSetting').checked = state.save.settings.sound; byId('motionSetting').checked = state.save.settings.motion; byId('autoHintSetting').checked = state.save.settings.autoHint; byId('settingsDialog').showModal();
    }
    function closeSettings() {
      syncSettings(); closeDialog(byId('settingsDialog'));
      if (state.settingsPausedRound && state.round && !state.round.completed) { state.pausedDuration += Date.now() - state.pausedAt; state.paused = false; scheduleAutoHint(); }
      state.settingsPausedRound = false;
    }
    function syncSettings() { state.save.settings.sound = byId('soundSetting').checked; state.save.settings.motion = byId('motionSetting').checked; state.save.settings.autoHint = byId('autoHintSetting').checked; doc.body.classList.toggle('reduce-motion', !state.save.settings.motion); updateSoundButton(); persist(); }
    function updateSoundButton() { byId('soundButton').textContent = state.save.settings.sound ? '🔊' : '🔇'; byId('soundButton').setAttribute('aria-label', state.save.settings.sound ? 'Mute sound' : 'Turn on sound'); byId('soundButton').setAttribute('aria-pressed', String(!state.save.settings.sound)); }
    function openFreePlay() {
      byId('freeHabitatChoices').innerHTML = HABITATS.map((habitat, index) => `<label><input type="radio" name="freeHabitat" value="${index}"${index === 0 ? ' checked' : ''}><span>${habitat.icon} ${habitat.name.split(' ')[0]}</span></label>`).join(''); byId('freePlayDialog').showModal();
    }
    function startFreePlay() {
      const habitatIndex = Number(doc.querySelector('input[name="freeHabitat"]:checked').value); const difficulty = doc.querySelector('input[name="difficulty"]:checked').value; const counts = { easy: 8, medium: 14, hard: 20 }; const targets = { easy: 2, medium: 3, hard: 4 }; const rule = difficulty === 'hard' ? 'checklist' : difficulty === 'medium' ? 'exact' : 'species'; const seed = `free:${Date.now()}`;
      closeDialog(byId('freePlayDialog')); startRound({ mode: 'free', habitatIndex, roundIndex: difficulty === 'easy' ? 1 : difficulty === 'medium' ? 4 : 7, seed, challenge: byId('challengeSetting').checked, recipe: { title: difficulty, description: '', count: counts[difficulty], targets: targets[difficulty], rule } });
    }
    function startDaily() { const date = new Date(); const key = `${date.getFullYear()}-${date.getMonth() + 1}-${date.getDate()}`; const index = hashString(key) % HABITATS.length; startRound({ mode: 'daily', habitatIndex: index, roundIndex: 6, seed: `daily:${key}:v2`, challenge: false }); }
    function speakClue() { if (!state.round || !('speechSynthesis' in window)) return; const voices = window.speechSynthesis.getVoices(); const voice = voices.find(item => item.localService && item.lang.startsWith('en')); if (!voice) { toast('No local reading voice is available in this browser.'); return; } const utterance = new SpeechSynthesisUtterance(`${byId('targetText').textContent}. ${byId('targetClue').textContent}`); utterance.voice = voice; window.speechSynthesis.cancel(); window.speechSynthesis.speak(utterance); }

    function bind() {
      byId('homeButton').addEventListener('click', goHome); byId('continueButton').addEventListener('click', continueAdventure); byId('mapButton').addEventListener('click', renderMap); byId('adventureCard').addEventListener('click', renderMap); byId('collectionButton').addEventListener('click', () => renderJournal()); byId('journalButton').addEventListener('click', () => renderJournal()); byId('freePlayButton').addEventListener('click', openFreePlay); byId('dailyButton').addEventListener('click', startDaily);
      doc.querySelectorAll('[data-back]').forEach(button => button.addEventListener('click', () => button.dataset.back === 'home' ? goHome() : renderMap()));
      byId('settingsButton').addEventListener('click', openSettings); byId('closeSettingsButton').addEventListener('click', closeSettings); ['soundSetting','motionSetting','autoHintSetting'].forEach(id => byId(id).addEventListener('change', syncSettings));
      byId('soundButton').addEventListener('click', () => { state.save.settings.sound = !state.save.settings.sound; updateSoundButton(); persist(); if (state.save.settings.sound) sound('found'); });
      byId('resetProgressButton').addEventListener('click', () => byId('confirmDialog').showModal()); byId('cancelResetButton').addEventListener('click', () => closeDialog(byId('confirmDialog'))); byId('confirmResetButton').addEventListener('click', () => { state.save = defaultSave(); persist(); closeDialog(byId('confirmDialog')); closeDialog(byId('settingsDialog')); updateSoundButton(); updateHome(); goHome(); toast('Adventure progress reset.'); });
      byId('cancelFreePlayButton').addEventListener('click', () => closeDialog(byId('freePlayDialog'))); byId('startFreePlayButton').addEventListener('click', startFreePlay);
      byId('leaveRoundButton').addEventListener('click', leaveRound); byId('pauseButton').addEventListener('click', pauseRound); byId('resumeButton').addEventListener('click', resumeRound); byId('restartButton').addEventListener('click', restartRound); byId('pauseLeaveButton').addEventListener('click', () => { closeDialog(byId('pauseDialog')); leaveRound(); });
      byId('hintButton').addEventListener('click', useHint); byId('speakButton').addEventListener('click', speakClue); byId('resultMapButton').addEventListener('click', resultMap); byId('nextRoundButton').addEventListener('click', nextRound);
      byId('pauseDialog').addEventListener('cancel', event => { event.preventDefault(); resumeRound(); });
      byId('resultDialog').addEventListener('cancel', event => event.preventDefault());
      byId('settingsDialog').addEventListener('cancel', event => { event.preventDefault(); closeSettings(); });
      doc.addEventListener('ummah:pause',()=>{if(state.round&&!state.paused&&!state.round.completed)pauseRound();});
      doc.addEventListener('visibilitychange', () => { if (!state.round || state.round.completed) return; if (doc.hidden && !state.paused) { state.paused = true; state.pausedAt = Date.now(); } else if (!doc.hidden && state.paused && !byId('pauseDialog').open) { state.pausedDuration += Date.now() - state.pausedAt; state.paused = false; scheduleAutoHint(); } });
    }

    function init() { loadSave(); bind(); updateSoundButton(); doc.body.classList.toggle('reduce-motion', !state.save.settings.motion); updateHome(); showScreen('home'); }
    return { init, state, generateRound, normalizeSave };
  }

  function init(doc) { return createApp(doc).init(); }
  return { VERSION, ANIMALS, HABITATS, ROUND_RECIPES, hashString, makeRandom, shuffle, buildPositions, generateRound, defaultSave, normalizeSave, completedCount, habitatUnlocked, roundUnlocked, createApp, init };
});
