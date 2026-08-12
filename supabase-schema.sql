-- Supabase setup for the public volunteer map.
-- Run this file once in Supabase > SQL Editor.
-- Time fields are TEXT so source values such as "24 h" are preserved.

create extension if not exists pgcrypto;

create table if not exists public.points (
  id uuid primary key default gen_random_uuid(),
  category text not null default 'Voluntariado' check (category in ('Voluntariado','Acopio')),
  legacy_id text,
  name text not null,
  address text not null,
  lat double precision not null check (lat between -90 and 90),
  lon double precision not null check (lon between -180 and 180),
  start_time text,
  end_time text,
  dates text,
  contact text,
  people_needed text,
  requirements text,
  description text,
  submitted_by text,
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create unique index if not exists points_legacy_category_uidx
  on public.points (legacy_id, category)
  where legacy_id is not null;

create table if not exists public.comments (
  id uuid primary key default gen_random_uuid(),
  point_id uuid not null references public.points(id) on delete cascade,
  author_name text,
  body text not null check (char_length(body) between 1 and 600),
  status text not null default 'pending' check (status in ('pending','approved','rejected')),
  created_at timestamptz not null default now()
);

create table if not exists public.admins (
  user_id uuid primary key references auth.users(id) on delete cascade
);

alter table public.points enable row level security;
alter table public.comments enable row level security;
alter table public.admins enable row level security;

create or replace function public.is_admin()
returns boolean language sql security definer set search_path = public as $$
  select exists(select 1 from public.admins where user_id = auth.uid());
$$;

drop policy if exists "public_read_approved_points" on public.points;
create policy "public_read_approved_points" on public.points
  for select to anon, authenticated using (status = 'approved');

drop policy if exists "public_read_approved_comments" on public.comments;
create policy "public_read_approved_comments" on public.comments
  for select to anon, authenticated using (status = 'approved');

drop policy if exists "public_submit_points" on public.points;
create policy "public_submit_points" on public.points
  for insert to anon, authenticated with check (
    status = 'pending'
    and char_length(name) between 1 and 160
    and char_length(address) between 1 and 220
    and lat between -90 and 90
    and lon between -180 and 180
  );

drop policy if exists "public_submit_comments" on public.comments;
create policy "public_submit_comments" on public.comments
  for insert to anon, authenticated with check (
    status = 'pending' and char_length(body) between 1 and 600
  );

drop policy if exists "admins_read_all_points" on public.points;
create policy "admins_read_all_points" on public.points
  for select to authenticated using (public.is_admin());

drop policy if exists "admins_update_points" on public.points;
create policy "admins_update_points" on public.points
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins_delete_points" on public.points;
create policy "admins_delete_points" on public.points
  for delete to authenticated using (public.is_admin());

drop policy if exists "admins_read_all_comments" on public.comments;
create policy "admins_read_all_comments" on public.comments
  for select to authenticated using (public.is_admin());

drop policy if exists "admins_update_comments" on public.comments;
create policy "admins_update_comments" on public.comments
  for update to authenticated using (public.is_admin()) with check (public.is_admin());

drop policy if exists "admins_delete_comments" on public.comments;
create policy "admins_delete_comments" on public.comments
  for delete to authenticated using (public.is_admin());

-- Initial data from "Mapa voluntariado(1).xlsx" — 25 records.
insert into public.points
(category, legacy_id, name, address, lat, lon, start_time, end_time, dates, contact, people_needed, requirements, description, status)
values
  ('Voluntariado', '1', 'Parque La Reforma', 'Cl. 69f Sur #20, Bogotá', 4.513733244311091, -74.06457822550036, '11:00', '18:00', 'Hasta el 14 de agosto', '30169834353022500000', null, null, null, 'approved'),
  ('Voluntariado', '2', 'Centro Comercial Multiplaza - Sotano 2', 'Cra. 72 #17a-63, Bogotá', 4.662942194288313, -74.08929746261934, '14:00', '21:00', 'Del 10 hasta el 17 de agosto', 'IG @multiplazabogota', '5/5', null, null, 'approved'),
  ('Voluntariado', '3', 'SAMU Norte Calle 134 Cruz Roja', 'Cra. 7b Bis #132 31, Usaquén, Bogotá, Cundinamarca', 4.7279545894257495, -74.00964658745828, '08:00', '21:00', null, 'IG @cruzrojabogota', null, null, null, 'approved'),
  ('Voluntariado', '4', 'Galería Aborigen', 'Cra. 6a #116-17, Usaquén, Bogotá, Cundinamarca', 4.704003359719706, -74.0020934872275, '10:00', '20:00', null, 'IG @galeriaaborigen', null, null, null, 'approved'),
  ('Voluntariado', '5', 'Palacio de Los Deportes - Cruz Roja', 'Ac 63 #59a-06, Bogotá', 4.66841715548629, -74.04054563385698, '08:00', '21:00', null, 'IG @cruzrojabogota', null, null, null, 'approved'),
  ('Voluntariado', '6', 'Estadio Nemesio Camacho El Campín', 'Carrera 30 y Calle 57, Teusaquillo, Bogotá', 4.646097056945061, -74.07636515017782, '08:00', '21:00', '12, 13 y 14 de Agosto', '3107859941', '1/5', 'Camisa blanca o amarilla y contactarse antes de llegar', 'Entrada por la carrera 30 al lado de la tienda de Millonarios', 'approved'),
  ('Voluntariado', '7', 'Banco de Alimentos de Bogotá', 'Cl. 19A #32-50, Bogotá', 4.6210385407143715, -74.08851254395788, '09:00', '17:00', '12, 13 y 14 de Agosto', '3115763645', '1/5', null, null, 'approved'),
  ('Voluntariado', '8', 'Cruz roja Bodega', 'Dg. 79b #62-53, Barrios Unidos, Bogotá', 4.679545755648608, -74.07695569576242, '08:00', '21:00', null, 'IG @cruzrojabogota', null, null, null, 'approved'),
  ('Voluntariado', '9', 'SAMU Alqueria Cruz Roja Bogotá', 'Av. 68 #31, Bogotá', 4.607313637363723, -74.12993351962776, '08:00', '21:00', null, 'IG @cruzrojabogota', null, null, null, 'approved'),
  ('Voluntariado', '10', 'Universidad de Bogotá Jorge Tadeo Lozano', 'Cra. 4 #22-61, Bogotá', 4.607962588895463, -74.0662506832623, '08:00', '18:00', null, 'IG @utadeo.edu.co', null, null, null, 'approved'),
  ('Voluntariado', '11', 'Uniminuto', 'Tv. 73a #82 61, Bogotá', 4.702581054977111, -74.09029540804349, '08:00', '16:00', null, '3174321703', '5/5', 'https://forms.cloud.microsoft/Pages/ResponsePage.aspx?id=1hktZcHt20OiTp6UP97jlZ5x13KKd9FLmDdE5QCDthVURE5BWlEwVFUyNVlDS1lXN0NCWk40WFI4OS4u', 'Banco de ropa', 'approved'),
  ('Voluntariado', '12', 'Salón Comunal Barrio Casa Rey', 'Cra. 14 R, Bogotá', 4.5196675866370315, -74.12082222682845, '10:00', '18:00', '13 y 14 de agosto', '3132539126', null, null, null, 'approved'),
  ('Voluntariado', '13', 'Fundación Catalina Muñoz', 'Dg. 48 #19-16, Bogotá', 4.636938433848099, -74.07103513083017, '08:00', '18:00', '12, 13 y 14 de Agosto', '3002618537', null, null, null, 'approved'),
  ('Voluntariado', '14', 'Cruz Roja Colombiana Seccional Cundinamarca y Bogotá', 'Cra. 23 #N° 73 - 19, Barrios Unidos, Bogotá, Cundinamarca', 4.664268397406716, -74.06525043893232, '24 h', '24 h', null, 'IG @cruzrojabogota', null, null, null, 'approved'),
  ('Voluntariado', '15', 'Centro de Salvamento Acuático Cruz Roja', 'Av. La Esmeralda #63-81, Bogotá', 4.666358518859422, -74.08507174038226, '08:00', '21:00', null, 'IG @cruzrojabogota', null, null, null, 'approved'),
  ('Voluntariado', '16', 'Vive Claro Distrito Cultural', 'Av. La Esmeralda #42-41, Bogotá', 4.649531077228136, -74.09630188082595, '09:00', '17:00', 'del 12 hasta el 31 de agosto', 'https://forms.cloud.microsoft/pages/responsepage.aspx?id=VHyXFlpS7Ey9K8HEea7b6wSRScHkLPtFsicCOZ0Y3u1UOUlMOUNDMDVOSVdaQ0VGRlU1U1AySE1GUi4u&fbclid=PAb21jcATooC1wZG9mAmV4dG4DYWVtAjExAHNydGMGYXBwX2lkDzU2NzA2NzM0MzM1MjQyNwABp7C18_rw90XfFhzqKdrVAqOGqumjWFe6viGoIahPl8BGpEp2Ys7tnJWmZTBr_aem_ulxRHxpIiPCCbp520Ji5hA&route=shorturl', '5/5', 'Inscripción', null, 'approved'),
  ('Voluntariado', '17', 'Human Construction - Local 1', 'Cra. 52a #134d-23, Bogotá', 4.722714098865295, -74.05686794512334, '08:00', '18:00', '12, 13 y 14 de Agosto', '3016441221', null, null, null, 'approved'),
  ('Voluntariado', '18', 'Unicentro Bogotá Centro Comercial', 'Ak 15 #124-30, Usaquén, Bogotá', 4.703556811078048, -74.04134232833567, '08:00', '18:00', '12, 13 y 14 de Agosto', 'IG @unicentrobogota', '1/5', 'Inscripción en administración, queda abajo en Banderas por la rampa.', null, 'approved'),
  ('Voluntariado', '19', 'Scientology fundacion', 'Cra 19 #100-21, Bogotá', 4.686633691725093, -74.05218220500069, '09:30', '21:00', '12, 13 y 14 de Agosto', null, null, null, null, 'approved'),
  ('Voluntariado', '20', 'Punto por identificar (#20)', 'Cra. 6b Este #89-14', 4.500817910154906, -74.10229806995473, null, null, null, null, null, null, 'El nombre no estaba registrado en el Excel original.', 'approved'),
  ('Voluntariado', '21', 'Cruz roja SAMU Sur', 'Av. 68 #31-41, Bogotá', 4.607555618409338, -74.1312687301233, '08:00', '21:00', null, 'IG @cruzrojabogota', null, null, null, 'approved'),
  ('Voluntariado', '22', 'CRIC Nacional', 'Cra. 29 #39-92, Teusaquillo, Bogotá, Cundinamarca', 4.629206411271491, -74.07919251073949, '09:00', '21:00', '12 de Agosto', null, '5/5', null, null, 'approved'),
  ('Voluntariado', '23', 'Punto por identificar (#23)', 'Av. Ciudad de Lima #32-50, Bogotá', 4.6203999005121315, -74.09007415921913, null, null, null, null, null, null, 'El nombre no estaba registrado en el Excel original.', 'approved'),
  ('Voluntariado', '24', 'Casa de la memoria', 'Cl. 161a #7 F 55, Bogotá', 4.737304681832439, -74.02573674929404, '07:00', '21:00', null, null, null, null, 'Por favor llevar cajas', 'approved'),
  ('Voluntariado', '25', 'Fundación FUNSAR', 'Cl. 59 Sur #80C-4, Bogotá', 4.610602242727065, -74.18079097609326, null, null, null, 'https://docs.google.com/forms/d/e/1FAIpQLSdB_abs3mHI0QTLiUk48HRkFKoupTEBDHUWqrNbatKoIK-WwA/viewform', '5/5', 'Inscripción', null, 'approved')
on conflict (legacy_id, category) do update set
  name=excluded.name, address=excluded.address, lat=excluded.lat, lon=excluded.lon,
  start_time=excluded.start_time, end_time=excluded.end_time, dates=excluded.dates,
  contact=excluded.contact, people_needed=excluded.people_needed, requirements=excluded.requirements,
  description=excluded.description, status=excluded.status;

-- Create an admin user in Supabase Authentication first.
-- Then run:
-- insert into public.admins (user_id) values ('UUID-DEL-USUARIO-ADMIN');
