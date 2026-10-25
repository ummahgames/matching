'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const C = require('../core.js');

test('the campaign contains eight valid authored routes', () => {
  assert.equal(C.LEVELS.length, 8);
  C.LEVELS.forEach((level, index) => {
    assert.equal(level.id, index + 1);
    assert.ok(level.deliveries.length >= 2 && level.deliveries.length <= 6);
    assert.equal(new Set(level.deliveries.map((item) => item.id)).size, level.deliveries.length);
    level.deliveries.forEach((item) => assert.ok(item.item && item.icon && item.destination && item.buildingIcon && item.color));
  });
});

test('matching accepts the correct building and rejects another building', () => {
  const level = C.LEVELS[0];
  assert.deepEqual(C.canDeliver(level, 'bread', 'bread', []), { ok: true });
  assert.equal(C.canDeliver(level, 'bread', 'milk', []).reason, 'match');
  assert.equal(C.canDeliver(level, 'bread', 'bread', ['bread']).reason, 'match');
});

test('ordered routes require the next parcel', () => {
  const level = C.LEVELS[5];
  const early = C.canDeliver(level, 'flowers', 'flowers', []);
  assert.equal(early.ok, false);
  assert.equal(early.reason, 'order');
  assert.equal(early.expected, 'carrots');
  assert.equal(C.canDeliver(level, 'flowers', 'flowers', ['carrots']).ok, true);
});

test('routes unlock one at a time as preceding routes are completed', () => {
  let mask = 0;
  assert.equal(C.isUnlocked(mask, 1), true);
  assert.equal(C.isUnlocked(mask, 2), false);
  mask = C.completeLevel(mask, 1);
  assert.equal(C.isUnlocked(mask, 2), true);
  assert.equal(C.nextUnlockedLevel(mask), 2);
  for (let id = 2; id <= 8; id += 1) mask = C.completeLevel(mask, id);
  assert.equal(C.completedCount(mask), 8);
  assert.equal(C.nextUnlockedLevel(mask), 8);
});

test('save codes round trip every possible completion mask', () => {
  for (let mask = 0; mask < 256; mask += 1) {
    const code = C.encodeProgress(mask);
    assert.match(code, /^LDW1-[0-9A-Z]+-[0-9A-Z]{2}$/);
    assert.equal(C.decodeProgress(code), mask);
    assert.equal(C.decodeProgress(code.toLowerCase()), mask);
  }
});

test('save codes reject damage and unrelated text', () => {
  const code = C.encodeProgress(27);
  const replacement = code.endsWith('Z') ? 'Y' : 'Z';
  assert.equal(C.decodeProgress(`${code.slice(0, -1)}${replacement}`), null);
  assert.equal(C.decodeProgress('27'), null);
  assert.equal(C.decodeProgress('LDW2-R-XX'), null);
  assert.equal(C.decodeProgress(''), null);
});

test('portable session codes preserve partial ordered deliveries and reject impossible order',()=>{
  for(const level of C.LEVELS){const ids=level.deliveries.slice(0,1).map(v=>v.id),mask=255,code=C.encodeSession(mask,level.id,ids,2);assert.deepEqual(C.decodeSession(code),{mask,level:level.id,ids,mistakes:2});assert.equal(C.decodeSession(code+'x'),null);}
  const level=C.LEVELS.find(l=>l.ordered);assert.equal(C.decodeSession(C.encodeSession(255,level.id,[level.deliveries[1].id])),null);
});
