const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const game = require('../game.js');

const root = path.resolve(__dirname, '..');

test('every habitat recipe generates valid, reproducible rounds', () => {
  let generated = 0;
  for (const habitat of game.HABITATS) {
    for (let roundIndex = 0; roundIndex < game.ROUND_RECIPES.length; roundIndex += 1) {
      for (let sample = 0; sample < 250; sample += 1) {
        const seed = `${habitat.id}:${roundIndex}:${sample}`;
        const round = game.generateRound({ habitat, roundIndex, seed });
        const replay = game.generateRound({ habitat, roundIndex, seed });
        const recipe = game.ROUND_RECIPES[roundIndex];
        const ids = new Set(round.instances.map(instance => instance.id));
        assert.deepEqual(round, replay);
        assert.equal(round.instances.length, recipe.count);
        assert.equal(round.targetIds.length, recipe.targets);
        assert.equal(ids.size, round.instances.length);
        assert.ok(round.targetIds.every(id => ids.has(id)));
        assert.equal(round.instances.filter(instance => instance.isTarget).length, recipe.targets);
        assert.ok(round.instances.every(instance => instance.x >= 7 && instance.x <= 93 && instance.y >= 10 && instance.y <= 90));
        if (recipe.rule !== 'exact') {
          for (const target of round.instances.filter(instance => instance.isTarget)) assert.equal(round.instances.filter(instance => instance.animal === target.animal).length, 1);
        } else {
          for (const target of round.instances.filter(instance => instance.isTarget)) {
            assert.equal(round.instances.filter(instance => instance.animal === target.animal && instance.style === target.style).length, 1);
            assert.ok(round.instances.some(instance => !instance.isTarget && instance.animal === target.animal && instance.style !== target.style));
          }
        }
        generated += 1;
      }
    }
  }
  assert.equal(generated, 12000);
});

test('every animal asset declared by the game exists', () => {
  for (const animal of Object.keys(game.ANIMALS)) for (const style of ['round', 'square']) assert.ok(fs.existsSync(path.join(root, 'assets', style, `${animal}.png`)), `${style}/${animal}.png is missing`);
});

test('habitats unlock after six completed trails', () => {
  const save = game.defaultSave();
  assert.equal(game.habitatUnlocked(save, 0), true);
  assert.equal(game.habitatUnlocked(save, 1), false);
  for (let index = 0; index < 5; index += 1) save.completed[`farm:${index}`] = true;
  assert.equal(game.habitatUnlocked(save, 1), false);
  save.completed['farm:5'] = true;
  assert.equal(game.habitatUnlocked(save, 1), true);
  assert.equal(game.habitatUnlocked(save, 2), false);
});

test('save validation removes unknown discoveries and restores setting defaults', () => {
  const save = game.normalizeSave({ version: game.VERSION, completed: { 'farm:0': true, 'farm:99': true, 'unknown:0': true }, discovered: ['bear', 'not-real', 'bear'], settings: { sound: false, motion: 'yes' } });
  assert.deepEqual(save.discovered, ['bear']);
  assert.equal(save.settings.sound, false);
  assert.equal(save.settings.motion, true);
  assert.deepEqual(save.completed, { 'farm:0': true });
});

test('all JavaScript DOM references exist in the HTML shell', () => {
  const html = fs.readFileSync(path.join(root, 'index.html'), 'utf8');
  const script = fs.readFileSync(path.join(root, 'game.js'), 'utf8');
  const ids = new Set([...html.matchAll(/\bid="([^"]+)"/g)].map(match => match[1]));
  const references = new Set([...script.matchAll(/byId\('([^']+)'\)/g)].map(match => match[1]));
  assert.deepEqual([...references].filter(id => !ids.has(id)), []);
});
