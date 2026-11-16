/* Fabrique les versions réduites (apercus/400 et apercus/1600) des photos déjà déposées
   qui n'en ont pas encore. À lancer une fois, et à relancer sans risque : ce qui existe est sauté.

     npm i sharp @supabase/supabase-js
     node outils/generer-apercus.cjs

   L'URL et la clé publique sont lues dans assets/commun.js. */
const fs = require('fs'), path = require('path');
const sharp = require('sharp');
const { createClient } = require('@supabase/supabase-js');

const commun = fs.readFileSync(path.join(__dirname, '..', 'assets', 'commun.js'), 'utf8');
const lire = cle => commun.match(new RegExp(cle + ":\\s*'([^']+)'"))[1];
const BUCKET = lire('BUCKET_SOUVENIRS');
const sb = createClient(lire('SUPABASE_URL'), lire('SUPABASE_ANON_KEY'), { auth: { persistSession: false } });
const TAILLES = [[1600, 82], [400, 70]];
const cheminApercu = (chemin, l) => `apercus/${l}/${chemin}.jpg`;

async function existants(dossier){
  const { data, error } = await sb.storage.from(BUCKET).list(dossier, { limit: 1000 });
  if (error) throw error;
  return new Set((data || []).map(o => `${dossier}/${o.name}`));
}

(async () => {
  const { data: fichiers, error } = await sb.from('mo_fichiers').select('chemin, type_mime, nom_original');
  if (error) throw error;
  const photos = fichiers.filter(f => /^image\//.test(f.type_mime || '') && !/gif|svg/i.test(f.type_mime));
  const dejaFaits = new Map();
  let faits = 0, sautes = 0, echecs = 0;
  for (const f of photos) {
    const envoi = f.chemin.split('/')[0];
    const manquent = [];
    for (const [l] of TAILLES) {
      const dossier = `apercus/${l}/${envoi}`;
      if (!dejaFaits.has(dossier)) dejaFaits.set(dossier, await existants(dossier));
      if (!dejaFaits.get(dossier).has(cheminApercu(f.chemin, l))) manquent.push(l);
    }
    if (!manquent.length) { sautes++; continue; }
    try {
      const { data: blob, error: e1 } = await sb.storage.from(BUCKET).download(f.chemin);
      if (e1) throw e1;
      const original = Buffer.from(await blob.arrayBuffer());
      for (const [l, q] of TAILLES.filter(([l]) => manquent.includes(l))) {
        const sortie = await sharp(original).rotate().resize({ width: l, withoutEnlargement: true }).jpeg({ quality: q, mozjpeg: true }).toBuffer();
        const { error: e2 } = await sb.storage.from(BUCKET).upload(cheminApercu(f.chemin, l), sortie, { contentType: 'image/jpeg', cacheControl: '31536000', upsert: true });
        if (e2) throw e2;
      }
      faits++; console.log(`ok  ${f.nom_original}`);
    } catch (e) { echecs++; console.warn(`--  ${f.nom_original} : ${e.message || e}`); }
  }
  console.log(`\n${faits} photo(s) traitée(s), ${sautes} déjà prête(s), ${echecs} échec(s) (HEIC, fichier abîmé… : la projection lira l'original).`);
})().catch(e => { console.error(e); process.exit(1); });
