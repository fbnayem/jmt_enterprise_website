-- JMT Enterprise quote requests: leads, stops, items, photos and the
-- notification outbox. All tables have RLS enabled with NO policies, so the
-- anon and authenticated roles (the browser) can never read or write them.
-- Only the server, using the service-role key, touches this data.

create table public.quote_requests (
  id uuid primary key,
  reference text not null unique,
  idempotency_key uuid not null unique,
  draft_id uuid not null,
  status text not null default 'awaiting_review'
    check (status in ('awaiting_review', 'quoted', 'confirmed', 'declined', 'closed')),
  created_at timestamptz not null default now(),
  service_type text not null,
  customer_type text not null check (customer_type in ('individual', 'business')),
  company_name text,
  date_mode text not null check (date_mode in ('asap', 'date')),
  requested_date date,
  time_window text not null,
  timezone text not null,
  vehicle_pref text not null,
  loading_help text not null,
  special_instructions text,
  photo_notes text,
  contact_name text not null,
  contact_phone text not null,
  contact_email text not null,
  preferred_contact text not null,
  acknowledgement_version text not null,
  source jsonb not null default '{}'::jsonb,
  -- Complete validated submission, kept for recovery and audit.
  payload jsonb not null
);

create index quote_requests_created_at_idx on public.quote_requests (created_at desc);

create table public.route_stops (
  id bigint generated always as identity primary key,
  quote_request_id uuid not null references public.quote_requests (id) on delete cascade,
  position int not null,
  kind text not null check (kind in ('pickup', 'dropoff')),
  street text not null,
  unit text,
  city text not null,
  state text not null,
  zip text not null,
  stairs text,
  floor text,
  elevator text,
  parking_notes text,
  notes text,
  unique (quote_request_id, position)
);

create table public.items (
  id bigint generated always as identity primary key,
  quote_request_id uuid not null references public.quote_requests (id) on delete cascade,
  position int not null,
  description text not null,
  quantity int not null check (quantity > 0),
  size_known text not null,
  length numeric,
  width numeric,
  height numeric,
  dimension_unit text,
  weight numeric,
  weight_unit text,
  fragile boolean not null default false,
  oversized boolean not null default false,
  unique (quote_request_id, position)
);

create table public.attachments (
  id uuid primary key,
  draft_id uuid not null,
  quote_request_id uuid references public.quote_requests (id) on delete set null,
  status text not null check (status in ('pending', 'ready', 'rejected')),
  original_name text not null,
  declared_type text not null,
  declared_size bigint not null,
  upload_key text not null,
  storage_key text,
  final_size bigint,
  width int,
  height int,
  created_at timestamptz not null default now()
);

create index attachments_draft_idx on public.attachments (draft_id);
create index attachments_request_idx on public.attachments (quote_request_id);

create table public.notification_jobs (
  id uuid primary key,
  quote_request_id uuid not null references public.quote_requests (id) on delete cascade,
  kind text not null check (kind in ('internal', 'customer_receipt')),
  recipient text not null,
  status text not null default 'pending'
    check (status in ('pending', 'sending', 'sent', 'delivered', 'delayed', 'bounced', 'failed')),
  attempts int not null default 0,
  next_attempt_at timestamptz not null default now(),
  locked_until timestamptz,
  provider_message_id text unique,
  last_error text,
  needs_attention boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index notification_jobs_due_idx on public.notification_jobs (status, next_attempt_at);

create table public.notification_events (
  id bigint generated always as identity primary key,
  job_id uuid references public.notification_jobs (id) on delete set null,
  provider_message_id text,
  type text not null,
  detail text,
  created_at timestamptz not null default now()
);

alter table public.quote_requests enable row level security;
alter table public.route_stops enable row level security;
alter table public.items enable row level security;
alter table public.attachments enable row level security;
alter table public.notification_jobs enable row level security;
alter table public.notification_events enable row level security;

-- Saves a complete request in one transaction. Idempotent on idempotency_key:
-- a retried or double-clicked submit returns the original reference and
-- creates nothing new.
create or replace function public.submit_quote_request(p jsonb, p_attachment_ids uuid[])
returns jsonb
language plpgsql
set search_path = public
as $$
declare
  r jsonb := p -> 'request';
  v_id uuid := (p ->> 'id')::uuid;
  v_existing record;
  v_inserted uuid;
  v_ready int;
  v_stop jsonb;
  v_item jsonb;
  v_job jsonb;
  v_pos int;
  v_created timestamptz := (p ->> 'createdAt')::timestamptz;
begin
  insert into quote_requests (
    id, reference, idempotency_key, draft_id, created_at, service_type, customer_type, company_name,
    date_mode, requested_date, time_window, timezone, vehicle_pref, loading_help, special_instructions,
    photo_notes, contact_name, contact_phone, contact_email, preferred_contact, acknowledgement_version,
    source, payload
  ) values (
    v_id, p ->> 'reference', (p ->> 'idempotencyKey')::uuid, (p ->> 'draftId')::uuid, v_created,
    r ->> 'serviceType', r ->> 'customerType', nullif(r ->> 'companyName', ''),
    r ->> 'dateMode', case when r ->> 'dateMode' = 'date' then (r ->> 'requestedDate')::date end,
    r ->> 'timeWindow', p ->> 'timezone', r ->> 'vehicle', r ->> 'loadingHelp',
    nullif(r ->> 'specialInstructions', ''), nullif(r ->> 'photoNotes', ''),
    r ->> 'name', r ->> 'phone', r ->> 'email', r ->> 'preferredContact', p ->> 'acknowledgementVersion',
    coalesce(p -> 'source', '{}'::jsonb), r
  )
  on conflict (idempotency_key) do nothing
  returning id into v_inserted;

  if v_inserted is null then
    select id, reference into v_existing from quote_requests where idempotency_key = (p ->> 'idempotencyKey')::uuid;
    return jsonb_build_object('id', v_existing.id, 'reference', v_existing.reference, 'duplicate', true);
  end if;

  if coalesce(array_length(p_attachment_ids, 1), 0) > 0 then
    perform 1 from attachments where id = any (p_attachment_ids) for update;
    select count(*) into v_ready from attachments
      where id = any (p_attachment_ids)
        and draft_id = (p ->> 'draftId')::uuid
        and status = 'ready'
        and quote_request_id is null;
    if v_ready <> array_length(p_attachment_ids, 1) then
      raise exception 'ATTACHMENT_OWNERSHIP' using errcode = 'P0001';
    end if;
    update attachments set quote_request_id = v_id where id = any (p_attachment_ids);
  end if;

  v_pos := 0;
  for v_stop in
    select jsonb_build_object('kind', 'pickup', 'address', r -> 'pickup', 'access', r -> 'pickupAccess', 'notes', '')
    union all
    select jsonb_build_object('kind', s ->> 'kind', 'address', s -> 'address', 'access', null, 'notes', s ->> 'notes')
      from jsonb_array_elements(coalesce(r -> 'extraStops', '[]'::jsonb)) s
    union all
    select jsonb_build_object('kind', 'dropoff', 'address', r -> 'dropoff', 'access', r -> 'dropoffAccess', 'notes', '')
  loop
    v_pos := v_pos + 1;
    insert into route_stops (quote_request_id, position, kind, street, unit, city, state, zip,
      stairs, floor, elevator, parking_notes, notes)
    values (v_id, v_pos, v_stop ->> 'kind',
      v_stop -> 'address' ->> 'street', nullif(v_stop -> 'address' ->> 'unit', ''),
      v_stop -> 'address' ->> 'city', v_stop -> 'address' ->> 'state', v_stop -> 'address' ->> 'zip',
      v_stop -> 'access' ->> 'stairs', nullif(v_stop -> 'access' ->> 'floor', ''),
      v_stop -> 'access' ->> 'elevator', nullif(v_stop -> 'access' ->> 'parkingNotes', ''),
      nullif(v_stop ->> 'notes', ''));
  end loop;

  v_pos := 0;
  for v_item in select * from jsonb_array_elements(r -> 'items') loop
    v_pos := v_pos + 1;
    insert into items (quote_request_id, position, description, quantity, size_known, length, width, height,
      dimension_unit, weight, weight_unit, fragile, oversized)
    values (v_id, v_pos, v_item ->> 'description', (v_item ->> 'quantity')::int, v_item ->> 'sizeKnown',
      nullif(v_item ->> 'length', '')::numeric, nullif(v_item ->> 'width', '')::numeric,
      nullif(v_item ->> 'height', '')::numeric, v_item ->> 'dimensionUnit',
      nullif(v_item ->> 'weight', '')::numeric, v_item ->> 'weightUnit',
      coalesce((v_item ->> 'fragile')::boolean, false), coalesce((v_item ->> 'oversized')::boolean, false));
  end loop;

  for v_job in select * from jsonb_array_elements(p -> 'jobs') loop
    insert into notification_jobs (id, quote_request_id, kind, recipient, next_attempt_at, created_at, updated_at)
    values ((v_job ->> 'id')::uuid, v_id, v_job ->> 'kind', v_job ->> 'recipient', v_created, v_created, v_created);
  end loop;

  return jsonb_build_object('id', v_id, 'reference', p ->> 'reference', 'duplicate', false);
end;
$$;

-- Claims due notification jobs with SKIP LOCKED so concurrent workers never
-- send the same email twice. Also releases jobs whose worker died mid-send.
create or replace function public.claim_notification_jobs(p_limit int, p_lock_seconds int, p_request uuid default null)
returns setof public.notification_jobs
language plpgsql
set search_path = public
as $$
begin
  update notification_jobs set status = 'pending', locked_until = null
    where status = 'sending' and locked_until < now();

  return query
  update notification_jobs j
     set status = 'sending',
         locked_until = now() + make_interval(secs => p_lock_seconds),
         updated_at = now()
   where j.id in (
     select id from notification_jobs
      where status = 'pending'
        and next_attempt_at <= now()
        and (p_request is null or quote_request_id = p_request)
      order by next_attempt_at
      limit p_limit
      for update skip locked
   )
  returning j.*;
end;
$$;

revoke all on all tables in schema public from anon, authenticated;
revoke execute on function public.submit_quote_request(jsonb, uuid[]) from public, anon, authenticated;
revoke execute on function public.claim_notification_jobs(int, int, uuid) from public, anon, authenticated;
grant execute on function public.submit_quote_request(jsonb, uuid[]) to service_role;
grant execute on function public.claim_notification_jobs(int, int, uuid) to service_role;
