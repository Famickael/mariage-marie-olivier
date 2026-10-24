-- Marie & Olivier : garde-fous compatibles avec l'absence de mot de passe
-- 1. Suppression douce des souvenirs (corbeille) : plus de DELETE possible depuis le web
alter table public.mo_envois add column if not exists supprime boolean not null default false;
alter table public.mo_fichiers add column if not exists supprime boolean not null default false;
revoke delete on public.mo_envois from anon, authenticated;
revoke delete on public.mo_fichiers from anon, authenticated;
drop policy if exists mo_orga_souvenirs_anon on storage.objects;
create policy mo_orga_souvenirs_anon_lecture on storage.objects for select to anon using (bucket_id = 'mo-souvenirs');
create policy mo_orga_souvenirs_anon_maj on storage.objects for update to anon using (bucket_id = 'mo-souvenirs') with check (bucket_id = 'mo-souvenirs');
-- (l'insertion anon existe déjà : mo_invites_depot_souvenirs)
-- 2. Limites des buckets
update storage.buckets set file_size_limit = 524288000, allowed_mime_types = array['image/*','video/*'] where id = 'mo-souvenirs';
update storage.buckets set file_size_limit = 20971520, allowed_mime_types = array['image/*'] where id = 'mo-plans';
-- 3. Plans : historique des 20 dernières versions + protection contre la suppression du plan principal / publié
create table if not exists public.mo_plans_versions (
  id bigserial primary key, plan_id uuid not null, version integer, nom text, data jsonb, publie boolean, enregistre_le timestamptz not null default now());
alter table public.mo_plans_versions enable row level security;
create policy mo_plans_versions_lecture on public.mo_plans_versions for select to anon, authenticated using (true);
create or replace function public.mo_plans_historiser() returns trigger language plpgsql security definer set search_path = '' as $$
begin
  if old.data is distinct from new.data then
    insert into public.mo_plans_versions(plan_id, version, nom, data, publie) values (old.id, old.version, old.nom, old.data, old.publie);
    delete from public.mo_plans_versions v where v.plan_id = old.id and v.id not in (select id from public.mo_plans_versions where plan_id = old.id order by id desc limit 20);
  end if;
  -- refuser un écrasement massif accidentel (plus de 50 % des invités disparaissent d'un coup)
  if jsonb_typeof(old.data->'invites') = 'array' and jsonb_array_length(old.data->'invites') >= 20
     and jsonb_typeof(new.data->'invites') = 'array' and jsonb_array_length(new.data->'invites') < jsonb_array_length(old.data->'invites') / 2 then
    raise exception 'Protection : cette modification retirerait plus de la moitié des invités du plan. Supprimez-les en plusieurs fois si c''est voulu.';
  end if;
  return new;
end $$;
drop trigger if exists mo_plans_historiser on public.mo_plans;
create trigger mo_plans_historiser before update on public.mo_plans for each row execute function public.mo_plans_historiser();
create or replace function public.mo_plans_proteger() returns trigger language plpgsql set search_path = '' as $$
begin
  if old.publie then raise exception 'Ce plan est publié : dépubliez-le avant de le supprimer.'; end if;
  if old.nom = 'Plan principal' then raise exception 'Le plan principal ne peut pas être supprimé (renommez-le d''abord si c''est voulu).'; end if;
  return old;
end $$;
drop trigger if exists mo_plans_proteger on public.mo_plans;
create trigger mo_plans_proteger before delete on public.mo_plans for each row execute function public.mo_plans_proteger();
-- 4. Recherche : échapper % et _ dans le LIKE
create or replace function public.mo_trouver_ma_place(recherche text)
returns table(nom text, table_id text, table_nom text, table_numero text, place integer, voisins text[])
language sql stable security definer set search_path = '' as $$
  with p as (select data from public.mo_plans where publie order by updated_at desc limit 1),
  inv as (select i->>'id' as id, i->>'nom' as nom from p, jsonb_array_elements(p.data->'invites') i),
  places as (
    select t->>'id' as tid, t->>'nom' as tnom, t->>'numero' as tnum, (s.ord - 1)::int as place, s.gid
    from p, jsonb_array_elements(p.data->'tables') t, jsonb_array_elements_text(t->'sieges') with ordinality s(gid, ord)
    where s.gid is not null),
  norm as (select replace(replace(translate(lower(trim(recherche)), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy'), '%', '\%'), '_', '\_') as q)
  select inv.nom, pl.tid, pl.tnom, pl.tnum, pl.place,
         array(select i2.nom from places pl2 join inv i2 on i2.id = pl2.gid where pl2.tid = pl.tid and pl2.gid <> pl.gid order by pl2.place)
  from inv join places pl on pl.gid = inv.id, norm
  where length(norm.q) >= 3
    and translate(lower(inv.nom), 'àâäáãåçéèêëíìîïñóòôöõúùûüýÿ', 'aaaaaaceeeeiiiinooooouuuuyy') like '%' || norm.q || '%' escape '\'
  order by inv.nom
  limit 8
$$;
-- 5. Politiques redondantes
drop policy if exists mo_invites_depot_envois on public.mo_envois;
drop policy if exists mo_invites_depot_fichiers on public.mo_fichiers;
drop policy if exists mo_lecture_programme on public.mo_programme;