/* Local UI pictograms and illustrated inventory atlas. No network dependency. */
(function () {
  const paths = {
    chips: '<path d="m5 2 2 2 2-2 3 2 3-2 2 2 2-2-1 10 1 10-2-2-2 2-3-2-3 2-2-2-2 2 1-10-1-10Z" fill="#e7c170"/><ellipse cx="12" cy="12" rx="4" ry="3" fill="#f7df8d"/><path d="m9 11 5 2m-4-3 5 2"/>',
    coffee: '<path d="M5 8h12v9a4 4 0 0 1-4 4H9a4 4 0 0 1-4-4V8Z" fill="#c49363"/><path d="M17 9h2a3 3 0 0 1 0 6h-2M8 2v3m4-3v3m4-3v3M3 22h17"/>',
    energy: '<rect x="3" y="5" width="17" height="14" rx="3" fill="#d6e8c2"/><path d="M20 10h2v4h-2M12 7l-5 6h5l-1 4 6-7h-5l1-3"/>',
    toxin: '<path d="M8 3h8M9 3v5l-5 8a4 4 0 0 0 4 6h8a4 4 0 0 0 4-6l-5-8V3"/><path d="M7 15h10"/><circle cx="10" cy="18" r="1" fill="currentColor"/><circle cx="14" cy="16" r="1" fill="currentColor"/>',
    fuel: '<path d="M7 3h9l2 4v14H6V7l1-4Z"/><path d="M8 8h8M9 12h6M16 4h3l2 3v5h-3"/><path d="M11 18c0-2 2-4 2-4s2 2 2 4a2 2 0 1 1-4 0Z"/>',
    lighter: '<rect x="6" y="9" width="12" height="13" rx="2"/><path d="M8 9V5h8v4M10 5V2h5M12 9c-2-3 1-5 2-6 2 3 3 5 0 6"/>',
    armor: '<path d="M5 5 9 2h6l4 3-2 5v11H7V10L5 5Z"/><path d="M9 2c0 3 6 3 6 0M9 11h6v6H9z"/>',
    syringe: '<path d="m14 3 7 7M16 1l7 7M5 19l-2 2m5-5 8-8 3 3-8 8H8v-3ZM11 13l3 3"/>',
    shelter: '<path d="m3 11 9-8 9 8M5 10v11h14V10M9 21v-7h6v7"/>',
    ruins: '<path d="M4 21V6h7v6h9v9M2 21h20M7 9h1m-1 4h1m-1 4h1m6-2h2m-2 3h2M11 6l3-3 2 4 4 1"/>',
    market: '<path d="M3 9h18l-2-6H5L3 9Zm1 0v3a2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0 2 2 0 0 0 4 0V9M5 14v7h14v-7M9 21v-5h6v5"/>',
    water: '<path d="M12 2S5 10 5 14a7 7 0 0 0 14 0c0-4-7-12-7-12Z"/><path d="M9 14a3 3 0 0 0 3 3"/>',
    hospital: '<path d="M6 21V3h12v18M3 21h18M9 7h6m-3-3v6m-3 4h1m4 0h1m-6 3h1m4 0h1"/>',
    metro: '<rect x="5" y="3" width="14" height="16" rx="4"/><path d="M5 11h14M8 19l-2 3m10-3 2 3M9 15h.01M15 15h.01M12 3v8"/>',
    plant: '<path d="M3 21V11l6-4v5l6-4v13M15 13h6v8M18 13V3h3v10M7 16h1m3 0h1M2 21h20"/>',
    tower: '<path d="M12 6 6 22m6-16 6 16M8 16h8m-6-5h4m-7 10 9-5m-8 0 9 5M5 3a10 10 0 0 0 0 9M19 3a10 10 0 0 1 0 9M8 5a6 6 0 0 0 0 5M16 5a6 6 0 0 1 0 5"/><circle cx="12" cy="7" r="1"/>',
    anomaly: '<path d="m13 2-8 12h6l-1 8 9-13h-7l1-7Z"/>',
    heart: '<path d="M20 5c-3-3-6-1-8 1-2-2-5-4-8-1-5 5 3 12 8 16 5-4 13-11 8-16Z"/>',
    hunger: '<path d="M6 2v7m-3-7v5a3 3 0 0 0 6 0V2M6 10v12M19 22V2c-5 1-5 10 0 10"/>',
    brain: '<path d="M12 4C7-1 3 4 5 7c-5 1-4 7-1 8-2 5 4 8 8 5 4 3 10 0 8-5 3-1 4-7-1-8 2-3-2-8-7-3Zm0 0v16M5 7l3 2m11-2-3 2M4 15l4-2m12 2-4-2"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="4"/><path d="M7 7h.01M17 7h.01M12 12h.01M7 17h.01M17 17h.01" stroke-width="3"/>',
    backpack: '<path d="M8 5V3h8v2M5 10a7 7 0 0 1 14 0v10H5V10Z"/><rect x="8" y="12" width="8" height="5" rx="1"/><path d="M2 11v7m20-7v7M9 7h6"/>',
    journal: '<path d="M5 3h15v18H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2Zm2 0v18M10 8h6m-6 4h6m-6 4h4"/>',
    map: '<path d="m2 5 7-3 6 3 7-3v17l-7 3-6-3-7 3V5Zm7-3v17m6-14v17"/>',
    compass: '<circle cx="12" cy="12" r="10"/><path d="m16 8-3 5-5 3 3-5 5-3Z"/>',
    sun: '<circle cx="12" cy="12" r="4"/><path d="M12 1v2m0 18v2M1 12h2m18 0h2M4 4l2 2m12 12 2 2M4 20l2-2M18 6l2-2"/>',
    wrench: '<path d="M14 3a6 6 0 0 0-6 8L2 17a3 3 0 0 0 5 5l7-7a6 6 0 0 0 7-8l-4 4-4-4 4-4Z"/>',
    question: '<circle cx="12" cy="12" r="10"/><path d="M9 8a3 3 0 1 1 5 2c-1 1-2 1-2 4m0 3h.01"/>',
    shield: '<path d="m12 2 9 4-1 7c-1 5-5 7-8 9-3-2-7-4-8-9L3 6l9-4Z"/>',
    arrow: '<path d="M4 12h16m-6-6 6 6-6 6"/>',
    refresh: '<path d="M21 3v6h-6M3 21v-6h6M5 7a8 8 0 0 1 14-1l2 3M3 15l2 3a8 8 0 0 0 14-1"/>',
    flag: '<path d="M5 22V3h14l-3 5 3 5H5"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12Z"/><circle cx="12" cy="12" r="3"/>'
  };
  const atlas = {food:0,bottle:1,med:2,scrap:3,crowbar:4,knife:5,shield:6,bandage:7,firebottle:8,spark:9,photo:10,core:11};
  function icon(id) { return `<svg class="ui-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.7" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[id] || paths.compass}</svg>`; }
  function glyph(id, tone) {
    if (Object.hasOwn(atlas,id)) {
      const i=atlas[id];
      return `<span class="glyph glyph-art" style="--atlas-x:${(i%4)*100/3}%;--atlas-y:${Math.floor(i/4)*50}%" aria-hidden="true"></span>`;
    }
    return `<span class="glyph glyph-map" style="--glyph-color:${tone}" aria-hidden="true">${icon(id)}</span>`;
  }
  window.GameArt={icon,glyph};
})();
