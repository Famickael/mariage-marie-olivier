/* ============================================================
   Ouverture du faire-part : plein écran, à chaque arrivée sur une page.
   Séquence cinématographique en quatre plans, pilotée par des classes
   (chaque classe déclenche des animations CSS, voir charte.css) :
     1. approche  (0 → 1,6 s)   la caméra s'approche du faire-part fermé
     2. tire / denoue / glisse (1,6 → 4,5 s)  le ruban se dénoue brin par brin et tombe
     3. ouvert    (4,5 → 6,7 s)  les volets s'ouvrent en 3D, la caméra avance
     4. entree    (6,3 → 8,5 s)  on traverse l'ouverture, le site arrive en fondu
   À charger après commun.js.
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
      <svg viewBox="0 0 440 340" xmlns="http://www.w3.org/2000/svg">
        <defs>
          <!-- gros-grain : fines côtes perpendiculaires au sens du ruban -->
          <pattern id="gg" width="3" height="3" patternUnits="userSpaceOnUse"><rect width="3" height="3" fill="#1b2652"/><rect width="1" height="3" fill="#2d3c7e"/></pattern>
          <pattern id="gg-pa" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(72)"><rect width="3" height="3" fill="#1b2652"/><rect width="1" height="3" fill="#2d3c7e"/></pattern>
          <pattern id="gg-pb" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(118)"><rect width="3" height="3" fill="#1b2652"/><rect width="1" height="3" fill="#2d3c7e"/></pattern>
          <pattern id="gg-ba" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(-52)"><rect width="3" height="3" fill="#1b2652"/><rect width="1" height="3" fill="#2d3c7e"/></pattern>
          <pattern id="gg-bb" width="3" height="3" patternUnits="userSpaceOnUse" patternTransform="rotate(56)"><rect width="3" height="3" fill="#1b2652"/><rect width="1" height="3" fill="#2d3c7e"/></pattern>
        </defs>
        <!-- pans (derrière) -->
        <g class="pan a">
          <path d="M170 140 L 226 146 C 224 212, 204 272, 168 330 L 112 320 L 134 316 C 158 262, 172 200, 170 140 Z" fill="url(#gg-pa)"/>
          <path d="M226 146 C 224 212, 204 272, 168 330 L 150 326 C 184 270, 206 212, 206 146 Z" fill="#0f1838" fill-opacity=".22"/>
          <path d="M170 140 C 172 200, 158 262, 134 316 L 142 318 C 166 262, 182 200, 182 142 Z" fill="#fff" fill-opacity=".08"/>
        </g>
        <g class="pan b">
          <path d="M240 146 L 296 142 C 300 200, 318 250, 348 296 L 306 318 L 322 300 C 292 254, 264 206, 240 146 Z" fill="url(#gg-pb)"/>
          <path d="M240 146 C 264 206, 292 254, 322 300 L 302 306 C 272 260, 250 208, 240 146 Z" fill="#0f1838" fill-opacity=".2"/>
        </g>
        <!-- boucle gauche : deux brins (haut / bas) -->
        <g class="boucle a">
          <g class="brin bas"><path d="M44 72 C 22 112, 98 154, 206 154 L 206 122 C 134 118, 84 106, 62 90 Z" fill="url(#gg-ba)"/><path d="M62 90 C 84 106, 134 118, 206 122 L 206 132 C 130 130, 80 118, 54 100 Z" fill="#0f1838" fill-opacity=".28"/></g>
          <g class="brin haut"><path d="M206 92 C 160 40, 72 30, 40 68 L 62 90 C 92 64, 150 76, 204 120 Z" fill="url(#gg-ba)"/><path d="M206 92 C 160 40, 72 30, 40 68 L 48 76 C 80 46, 156 54, 204 104 Z" fill="#fff" fill-opacity=".10"/></g>
        </g>
        <!-- boucle droite : deux brins (haut / bas), plus grande -->
        <g class="boucle b">
          <g class="brin bas"><path d="M412 52 C 436 98, 362 142, 258 152 L 258 120 C 332 112, 386 90, 392 76 Z" fill="url(#gg-bb)"/><path d="M392 76 C 386 90, 332 112, 258 120 L 258 130 C 336 124, 392 102, 402 86 Z" fill="#0f1838" fill-opacity=".28"/></g>
          <g class="brin haut"><path d="M254 88 C 300 30, 384 10, 412 52 L 392 76 C 366 48, 310 70, 258 120 Z" fill="url(#gg-bb)"/><path d="M254 88 C 300 30, 384 10, 412 52 L 404 62 C 376 24, 302 42, 258 100 Z" fill="#fff" fill-opacity=".10"/></g>
        </g>
        <!-- nœud central -->
        <g class="centre">
          <path d="M214 76 C 230 66, 252 68, 264 82 C 276 108, 276 138, 262 160 C 248 172, 226 172, 212 160 C 198 136, 198 104, 214 76 Z" fill="#141d4a"/>
          <path d="M222 86 C 236 80, 250 82, 258 90 M 220 150 C 236 156, 250 156, 258 148" fill="none" stroke="#33438a" stroke-width="3" stroke-linecap="round"/>
          <path d="M214 76 C 230 66, 252 68, 264 82 C 268 92, 270 102, 270 112 C 258 96, 236 90, 212 96 C 212 88, 212 82, 214 76 Z" fill="#fff" fill-opacity=".08"/>
        </g>
      </svg>
    </div>
  </div>
  <p class="indice">Cliquez sur le faire-part pour l'ouvrir</p>
  <button class="passer" type="button">Passer</button>`;
  document.body.prepend(ov);
  document.body.classList.add('fp-en-cours');
  const fp = ov.querySelector('#fp');
  const t = [];
  let fini = false;
  const entree = () => { fp.classList.add('entree'); ov.classList.add('entree'); document.body.classList.add('fp-entree'); };
  const fin = () => {
    if (fini) return; fini = true;
    t.forEach(clearTimeout);
    ov.classList.add('fin');
    document.body.classList.remove('fp-en-cours');
    setTimeout(() => ov.remove(), 700);
    setTimeout(() => document.body.classList.remove('fp-entree'), 1600);
  };
  // Plan 1 : approche
  requestAnimationFrame(() => fp.classList.add('approche'));
  // Plans 2 à 4, décalés par rapport au moment où le dénouage commence
  const suite = [[() => fp.classList.add('tire'), 0], [() => fp.classList.add('denoue'), 600], [() => fp.classList.add('glisse'), 2300],
                 [() => { fp.classList.add('ouvert'); ov.classList.add('ouvre'); }, 2900], [entree, 4700], [fin, 6900]];
  let lance = false;
  const lancer = () => { if (lance) return; lance = true; ov.classList.remove('attente'); suite.forEach(([f, d]) => t.push(setTimeout(f, d))); };
  if (document.body.dataset.ouverture === 'clic') {
    // page principale : le faire-part attend qu'on clique dessus
    t.push(setTimeout(() => ov.classList.add('attente'), 1500));
    fp.addEventListener('click', lancer); ov.querySelector('.indice').addEventListener('click', lancer);
    document.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') lancer(); }, { once: true });
  } else t.push(setTimeout(lancer, 1600));
  // « Passer » : on saute directement à l'arrivée du site
  ov.querySelector('.passer').onclick = () => { if (!fp.classList.contains('entree')) entree(); fin(); };
})();
