/* Outils partagés par le planning (équipe) et le programme (invités). */
const JOURS = [
  ['2026-12-04', 'Vendredi 4 décembre', 'Ven. 4'],
  ['2026-12-05', 'Samedi 5 décembre', 'Sam. 5'],
  ['2026-12-06', 'Dimanche 6 décembre', 'Dim. 6']
];
const CATEGORIES = {
  ceremonie: { nom: 'Cérémonie', icone: '💍', couleur: '#b8913f' },
  cocktail:  { nom: 'Cocktail',  icone: '🥂', couleur: '#5b6799' },
  repas:     { nom: 'Repas',     icone: '🍽', couleur: '#26356f' },
  fete:      { nom: 'Fête',      icone: '🎶', couleur: '#7a5c9e' },
  photo:     { nom: 'Photos',    icone: '📷', couleur: '#3f6b55' },
  preparatif:{ nom: 'Préparatifs', icone: '✂', couleur: '#8a8fa8' },
  logistique:{ nom: 'Logistique', icone: '🚗', couleur: '#6b6f80' },
  autre:     { nom: 'Autre',     icone: '✦', couleur: '#26356f' }
};
/* Une nuit de fête se termine après minuit : tout ce qui commence avant 6 h
   appartient à la journée de la veille. */
const H_BASCULE = 6;
function dateISO(d){ return `${d.getFullYear()}-${String(d.getMonth()+1).padStart(2,'0')}-${String(d.getDate()).padStart(2,'0')}`; }
function jourLogique(d){ const x = new Date(d); if (x.getHours() < H_BASCULE) x.setDate(x.getDate() - 1); return dateISO(x); }
function minutes(it){ const [h, m] = it.debut.split(':').map(Number); return (h < H_BASCULE ? h + 24 : h) * 60 + m; }
/* « jour » est le jour de la fête : un moment à 1 h du matin le samedi soir est saisi au samedi. */
function jourDeMoment(it){ return it.jour; }
function minutesMaintenant(){ const n = new Date(); const h = n.getHours(); return (h < H_BASCULE ? h + 24 : h) * 60 + n.getMinutes(); }
function fmtH(min){ const h = Math.floor(min / 60) % 24, m = min % 60; return `${h}h${String(m).padStart(2,'0')}`; }
function fmtDuree(m){ return m < 60 ? `${m} min` : `${Math.floor(m/60)} h${m % 60 ? ' ' + String(m % 60).padStart(2,'0') : ''}`; }
