/* ============================================================
   Ouverture du faire-part : plein écran, à chaque arrivée sur une page.
   Le nœud se défait brin par brin, le ruban glisse, les volets s'ouvrent,
   la page apparaît dans l'ouverture. À charger après commun.js.
   ============================================================ */
(function(){
  if (matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const M = n => `<img class="motif" src="${BASE_ASSETS}motifs/${n}.png" alt="" draggable="false">`;
  const ov = document.createElement('div');
  ov.id = 'ouverture'; ov.setAttribute('aria-hidden', 'true');
  ov.innerHTML = `
  <div class="fp" id="fp">
    <div class="volet g">
      <div class="face recto">
        <span class="m m1">${M('motif-a')}</span><span class="m m2">${M('couv-gauche-bas')}</span><span class="m m3">${M('colibri')}</span>
        <div class="cartouche"><p class="capitales">Notre Mariage</p><div class="monogramme">M<span class="et">&amp;</span>O</div><p class="capitales date">05.12.2026</p></div>
      </div>
      <div class="face dos"></div>
    </div>
    <div class="volet d">
      <div class="face recto">
        <span class="m m1">${M('couv-droite-haut')}</span><span class="m m2">${M('oiseau-branche')}</span><span class="m m3 miroir">${M('colibri')}</span>
      </div>
      <div class="face dos"></div>
    </div>
    <div class="ruban"></div>
    <div class="noeud">
      <svg viewBox="0 0 320 260" xmlns="http://www.w3.org/2000/svg">
        <defs><pattern id="gg" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#1b2652"/><rect width="1" height="3" fill="#2b3b7c"/></pattern></defs>
        <g class="pan a"><path d="M152 128 C 120 160, 96 200, 70 250 L 112 250 L 100 232 C 124 196, 146 164, 166 136 Z" fill="url(#gg)"/></g>
        <g class="pan b"><path d="M168 128 C 196 150, 232 170, 268 180 L 274 212 L 246 204 C 216 190, 186 168, 162 142 Z" fill="url(#gg)"/></g>
        <g class="boucle a"><path d="M158 122 C 110 70, 30 74, 26 118 C 22 164, 96 170, 158 128 Z" fill="url(#gg)"/><path d="M152 122 C 110 92, 56 94, 48 118 C 56 146, 112 146, 150 124" fill="none" stroke="#0f1838" stroke-opacity=".45" stroke-width="4"/></g>
        <g class="boucle b"><path d="M162 122 C 206 60, 300 66, 298 112 C 296 160, 214 172, 162 128 Z" fill="url(#gg)"/><path d="M168 122 C 210 90, 268 90, 276 112 C 268 142, 212 146, 170 124" fill="none" stroke="#0f1838" stroke-opacity=".45" stroke-width="4"/></g>
        <g class="centre"><path d="M136 104 C 148 98, 172 98, 184 104 C 194 118, 194 136, 184 148 C 170 156, 150 156, 136 148 C 126 136, 126 118, 136 104 Z" fill="#141d4a"/><path d="M144 112 C 156 108, 166 108, 176 112 M 142 138 C 156 142, 166 142, 178 138" fill="none" stroke="#33438a" stroke-width="2.5"/></g>
      </svg>
    </div>
  </div>
  <button class="passer" type="button">Passer</button>`;
  document.body.prepend(ov);
  document.body.classList.add('fp-en-cours');
  const fp = ov.querySelector('#fp');
  const fin = () => { ov.classList.add('fin'); document.body.classList.remove('fp-en-cours'); setTimeout(() => ov.remove(), 800); };
  const t = [];
  t.push(setTimeout(() => fp.classList.add('tire'), 1100));                                 // on tire sur un pan
  t.push(setTimeout(() => fp.classList.add('denoue'), 1500));                               // les boucles se défont, le nœud lâche
  t.push(setTimeout(() => fp.classList.add('glisse'), 2900));                               // le ruban tombe
  t.push(setTimeout(() => { fp.classList.add('ouvert'); ov.classList.add('ouvre'); }, 3500)); // les volets s'ouvrent, la page apparaît
  t.push(setTimeout(fin, 5600));
  ov.querySelector('.passer').onclick = () => { t.forEach(clearTimeout); fin(); };
})();
