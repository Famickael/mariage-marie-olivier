-- ============================================================
-- Mariage Marie & Olivier · schéma Supabase
-- Projet partagé avec le site d'Aude & Jérémie : tout est préfixé mo_ / mo-
-- Règle générale : les invités (rôle anon) peuvent DÉPOSER des souvenirs
-- et LIRE le programme public ; tout le reste demande d'être connecté
-- (comptes créés dans Authentication > Users : Marie, Olivier, famille).
-- ============================================================

-- ---------- Souvenirs : envois des invités ----------
create table public.mo_envois (
  id uuid primary key,
  created_at timestamptz not null default now(),
  invite_nom text,
  message text,
  appareil text,
  nb_fichiers integer,
  visible boolean not null default true
);
create table public.mo_fichiers (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  envoi_id uuid not null references public.mo_envois(id) on delete cascade,
  chemin text not null,
  nom_original text not null,
  taille bigint,
  type_mime text,
  message text,
  visible boolean not null default true
);
create index mo_fichiers_envoi_id_idx on public.mo_fichiers(envoi_id);
alter table public.mo_envois enable row level security;
alter table public.mo_fichiers enable row level security;

create policy mo_invites_depot_envois on public.mo_envois for insert to anon with check (visible = true);
create policy mo_invites_depot_fichiers on public.mo_fichiers for insert to anon with check (visible = true);
create policy mo_organisateurs_envois on public.mo_envois for all to authenticated using (true) with check (true);
create policy mo_organisateurs_fichiers on public.mo_fichiers for all to authenticated using (true) with check (true);

-- ---------- Programme / planning ----------
create table public.mo_programme (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  jour date not null,
  debut time not null,
  duree integer not null default 30,
  titre text not null,
  lieu text,
  qui text,
  description text,
  categorie text not null default 'autre',
  public boolean not null default false
);
alter table public.mo_programme enable row level security;
-- Lecture par lien (témoins, famille) ; modification une fois connecté.
create policy mo_lecture_programme on public.mo_programme for select to anon using (true);
create policy mo_organisateurs_programme on public.mo_programme for all to authenticated using (true) with check (true);

-- ---------- Plan de table ----------
create table public.mo_plans (
  id uuid primary key default gen_random_uuid(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  nom text not null,
  data jsonb not null default '{}'::jsonb,
  version integer not null default 1,
  publie boolean not null default false
);
alter table public.mo_plans enable row level security;
create policy mo_organisateurs_plans on public.mo_plans for all to authenticated using (true) with check (true);

create function public.mo_maj_updated_at() returns trigger language plpgsql set search_path = '' as $$
begin new.updated_at = now(); return new; end $$;
create trigger mo_plans_updated_at before update on public.mo_plans for each row execute function public.mo_maj_updated_at();

-- Le plan publié, sans aucun nom d'invité (pour le mini-plan de « Trouver ma table »).
create function public.mo_plan_public() returns jsonb
language sql stable security definer set search_path = '' as $$
  select jsonb_build_object(
    'salle', jsonb_build_object('l', p.data->'salle'->'l', 'h', p.data->'salle'->'h'),
    'tables', coalesce((select jsonb_agg(t - 'sieges') from jsonb_array_elements(p.data->'tables') t), '[]'::jsonb),
    'decors', coalesce(p.data->'decors', '[]'::jsonb))
  from public.mo_plans p where p.publie order by p.updated_at desc limit 1
$$;

-- Recherche d'un invité par son nom dans le plan publié (3 lettres minimum).
create function public.mo_trouver_ma_place(recherche text)
returns table(nom text, table_id text, table_nom text, table_numero text, place integer, voisins text[])
language sql stable security definer set search_path = '' as $$
  with p as (select data from public.mo_plans where publie order by updated_at desc limit 1),
  inv as (select i->>'id' as id, i->>'nom' as nom from p, jsonb_array_elements(p.data->'invites') i),
  places as (
    select t->>'id' as tid, t->>'nom' as tnom, t->>'numero' as tnum, (s.ord - 1)::int as place, s.gid
    from p, jsonb_array_elements(p.data->'tables') t, jsonb_array_elements_text(t->'sieges') with ordinality s(gid, ord)
    where s.gid is not null),
  norm as (select translate(lower(trim(recherche)), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy') as q)
  select inv.nom, pl.tid, pl.tnom, pl.tnum, pl.place,
         array(select i2.nom from places pl2 join inv i2 on i2.id = pl2.gid where pl2.tid = pl.tid and pl2.gid <> pl.gid order by pl2.place)
  from inv join places pl on pl.gid = inv.id, norm
  where length(norm.q) >= 3
    and translate(lower(inv.nom), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy') like '%' || norm.q || '%'
  order by inv.nom
  limit 8
$$;
revoke all on function public.mo_plan_public() from public;
revoke all on function public.mo_trouver_ma_place(text) from public;
grant execute on function public.mo_plan_public() to anon, authenticated;
grant execute on function public.mo_trouver_ma_place(text) to anon, authenticated;

-- ---------- Stockage ----------
insert into storage.buckets (id, name, public) values ('mo-souvenirs', 'mo-souvenirs', false), ('mo-plans', 'mo-plans', false)
on conflict (id) do nothing;

create policy mo_invites_depot_souvenirs on storage.objects for insert to anon with check (bucket_id = 'mo-souvenirs');
create policy mo_organisateurs_souvenirs on storage.objects for all to authenticated using (bucket_id = 'mo-souvenirs') with check (bucket_id = 'mo-souvenirs');
create policy mo_organisateurs_plans_fichiers on storage.objects for all to authenticated using (bucket_id = 'mo-plans') with check (bucket_id = 'mo-plans');
