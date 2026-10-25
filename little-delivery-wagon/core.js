(function (root) {
  'use strict';

  const LEVELS = [
    { id: 1, title: 'Morning Bread', icon: '☀️', color: '#f2a43b', story: 'The street is waking up. Let’s bring breakfast!', ordered: false, deliveries: [
      { id: 'bread', item: 'Warm bread', icon: '🥖', destination: 'Bakery', buildingIcon: '🥨', color: '#eaa75e' },
      { id: 'milk', item: 'Fresh milk', icon: '🥛', destination: 'Blue house', buildingIcon: '🫐', color: '#79aee8' }
    ]},
    { id: 2, title: 'Garden Helpers', icon: '🌱', color: '#70ad72', story: 'The community garden needs a few useful things.', ordered: false, deliveries: [
      { id: 'seeds', item: 'Flower seeds', icon: '🌻', destination: 'Flower garden', buildingIcon: '🌻', color: '#e68188' },
      { id: 'can', item: 'Watering can', icon: '🚿', destination: 'Greenhouse', buildingIcon: '🌿', color: '#6ba47b' },
      { id: 'boots', item: 'Garden boots', icon: '🥾', destination: 'Garden shed', buildingIcon: '🪴', color: '#c88b5a' }
    ]},
    { id: 3, title: 'Rainy-Day Round', icon: '🌦️', color: '#658cba', story: 'Drip, drop! These neighbors are getting ready for rain.', ordered: false, deliveries: [
      { id: 'umbrella', item: 'Yellow umbrella', icon: '☂️', destination: 'Yellow door', buildingIcon: '☂️', color: '#e7ba45' },
      { id: 'coat', item: 'Raincoat', icon: '🧥', destination: 'Coat shop', buildingIcon: '🧥', color: '#d86c62' },
      { id: 'tea', item: 'Warm tea', icon: '🫖', destination: 'Cozy cottage', buildingIcon: '☕', color: '#9e7aaf' }
    ]},
    { id: 4, title: 'Park Picnic', icon: '🧺', color: '#d36e64', story: 'A picnic is about to begin under the big tree.', ordered: false, deliveries: [
      { id: 'apples', item: 'Red apples', icon: '🍎', destination: 'Picnic blanket', buildingIcon: '🍎', color: '#dc6861' },
      { id: 'juice', item: 'Fruit juice', icon: '🧃', destination: 'Drinks table', buildingIcon: '🧃', color: '#ef9a58' },
      { id: 'ball', item: 'Play ball', icon: '⚽', destination: 'Playground', buildingIcon: '⚽', color: '#55a4a0' },
      { id: 'book', item: 'Story book', icon: '📘', destination: 'Reading tree', buildingIcon: '📖', color: '#6e8dc7' }
    ]},
    { id: 5, title: 'Busy Workshop', icon: '🛠️', color: '#a67555', story: 'The makers are building and mending today.', ordered: false, deliveries: [
      { id: 'hammer', item: 'Little hammer', icon: '🔨', destination: 'Carpenter', buildingIcon: '🪚', color: '#bc8155' },
      { id: 'thread', item: 'Colorful thread', icon: '🧵', destination: 'Tailor', buildingIcon: '🧶', color: '#a676b0' },
      { id: 'paint', item: 'Blue paint', icon: '🎨', destination: 'Sign painter', buildingIcon: '🖌️', color: '#618fc4' },
      { id: 'gear', item: 'Shiny gear', icon: '⚙️', destination: 'Clock shop', buildingIcon: '🕰️', color: '#668d88' }
    ]},
    { id: 6, title: 'Market Morning', icon: '🧺', color: '#bd7e43', story: 'Follow the delivery list from first to last.', ordered: true, deliveries: [
      { id: 'carrots', item: 'Crunchy carrots', icon: '🥕', destination: 'Vegetable stall', buildingIcon: '🥕', color: '#ef8a43' },
      { id: 'flowers', item: 'Fresh flowers', icon: '💐', destination: 'Flower stall', buildingIcon: '🌷', color: '#d8799d' },
      { id: 'cheese', item: 'Round cheese', icon: '🧀', destination: 'Dairy stall', buildingIcon: '🐄', color: '#e1b746' },
      { id: 'bread2', item: 'Flat bread', icon: '🫓', destination: 'Bread stall', buildingIcon: '🥐', color: '#c98a58' },
      { id: 'honey', item: 'Honey jar', icon: '🍯', destination: 'Bee stall', buildingIcon: '🐝', color: '#dc9f37' }
    ]},
    { id: 7, title: 'Festival Street', icon: '🏮', color: '#b86176', story: 'Deliver the decorations in the order on the wagon list.', ordered: true, deliveries: [
      { id: 'lanterns', item: 'Paper lanterns', icon: '🏮', destination: 'Town arch', buildingIcon: '🏮', color: '#c95757' },
      { id: 'ribbons', item: 'Bright ribbons', icon: '🎀', destination: 'Ribbon booth', buildingIcon: '🎀', color: '#d36c99' },
      { id: 'drum', item: 'Parade drum', icon: '🥁', destination: 'Music stage', buildingIcon: '🎵', color: '#795d9f' },
      { id: 'cakes', item: 'Little cakes', icon: '🧁', destination: 'Treat table', buildingIcon: '🧁', color: '#db8e7c' },
      { id: 'flags', item: 'Festival flags', icon: '🚩', destination: 'Meeting square', buildingIcon: '🎉', color: '#4f9b8c' }
    ]},
    { id: 8, title: 'The Grand Round', icon: '⭐', color: '#367d72', story: 'One last journey around the whole neighborhood!', ordered: true, deliveries: [
      { id: 'bread3', item: 'Morning loaf', icon: '🥖', destination: 'Bakery', buildingIcon: '🥨', color: '#d89a5d' },
      { id: 'sapling', item: 'Tiny tree', icon: '🌱', destination: 'Community garden', buildingIcon: '🌳', color: '#66a36c' },
      { id: 'mail', item: 'Friendly letter', icon: '💌', destination: 'Post office', buildingIcon: '📯', color: '#d66772' },
      { id: 'book2', item: 'New story', icon: '📚', destination: 'Little library', buildingIcon: '📚', color: '#657fc0' },
      { id: 'kite', item: 'Rainbow kite', icon: '🪁', destination: 'Hilltop park', buildingIcon: '🌈', color: '#5ca3a3' },
      { id: 'cake', item: 'Thank-you cake', icon: '🎂', destination: 'Neighborhood table', buildingIcon: '♥', color: '#b776a7' }
    ]}
  ];

  function checksum(text) {
    let value = 17;
    for (let i = 0; i < text.length; i += 1) value = (value * 31 + text.charCodeAt(i)) % 1296;
    return value.toString(36).toUpperCase().padStart(2, '0');
  }

  function normalizeMask(mask) {
    const maximum = (1 << LEVELS.length) - 1;
    return Number.isFinite(mask) ? Math.max(0, Math.min(maximum, Math.floor(mask))) : 0;
  }

  function encodeProgress(mask) {
    const payload = normalizeMask(mask).toString(36).toUpperCase();
    return `LDW1-${payload}-${checksum(payload)}`;
  }

  function decodeProgress(code) {
    const match = String(code || '').trim().toUpperCase().match(/^LDW1-([0-9A-Z]+)-([0-9A-Z]{2})$/);
    if (!match || checksum(match[1]) !== match[2]) return null;
    const mask = parseInt(match[1], 36);
    return Number.isFinite(mask) ? normalizeMask(mask) : null;
  }

  function isComplete(mask, levelId) { return Boolean(normalizeMask(mask) & (1 << (levelId - 1))); }
  function completeLevel(mask, levelId) { return normalizeMask(mask) | (1 << (levelId - 1)); }
  function isUnlocked(mask, levelId) { return levelId === 1 || isComplete(mask, levelId - 1); }
  function completedCount(mask) { return LEVELS.reduce((total, level) => total + (isComplete(mask, level.id) ? 1 : 0), 0); }
  function nextUnlockedLevel(mask) {
    const firstIncomplete = LEVELS.find((level) => isUnlocked(mask, level.id) && !isComplete(mask, level.id));
    return firstIncomplete ? firstIncomplete.id : LEVELS.length;
  }
  function canDeliver(level, parcelId, destinationId, deliveredIds) {
    const item = level.deliveries.find((delivery) => delivery.id === parcelId);
    if (!item || deliveredIds.includes(parcelId) || destinationId !== parcelId) return { ok: false, reason: 'match' };
    if (level.ordered) {
      const next = level.deliveries.find((delivery) => !deliveredIds.includes(delivery.id));
      if (!next || next.id !== parcelId) return { ok: false, reason: 'order', expected: next ? next.id : null };
    }
    return { ok: true };
  }

function encodeSession(mask,level,ids,mistakes=0){const data=LEVELS[level-1],bits=data.deliveries.reduce((n,item,i)=>n|(ids.includes(item.id)?1<<i:0),0),payload=[mask.toString(36),level,bits.toString(36),Math.min(9999,mistakes).toString(36)].join('.').toUpperCase();return`LDW2-${payload}-${checksum(payload)}`;}
function decodeSession(input){try{let code=String(input||'').trim();if(code.includes('#'))code=new URLSearchParams(code.slice(code.indexOf('#')+1)).get('save')||'';const match=code.toUpperCase().match(/^LDW2-([0-9A-Z]+\.[1-8]\.[0-9A-Z]+\.[0-9A-Z]+)-([0-9A-Z]{2})$/);if(!match||checksum(match[1])!==match[2])return null;const [mask,level,bits,mistakes]=match[1].split('.').map(x=>parseInt(x,36)),data=LEVELS[level-1];if(mask>255||bits>=1<<data.deliveries.length||mistakes>9999||!(level===1||mask&1<<(level-2)))return null;if(data.ordered&&(bits&(bits+1))!==0)return null;return{mask,level,ids:data.deliveries.filter((_,i)=>bits&1<<i).map(item=>item.id),mistakes};}catch(_){return null;}}
  const api = { encodeSession, decodeSession, LEVELS, checksum, encodeProgress, decodeProgress, isComplete, completeLevel, isUnlocked, completedCount, nextUnlockedLevel, canDeliver };
  if (typeof module !== 'undefined' && module.exports) { require('./procedural.js')(api,'little-delivery-wagon'); module.exports = api; }
  root.DeliveryCore = api;
}(typeof window !== 'undefined' ? window : globalThis));
