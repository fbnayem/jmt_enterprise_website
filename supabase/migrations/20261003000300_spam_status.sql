-- Honeypot hits are saved for review as 'suspected_spam' instead of being
-- discarded, so a real customer whose browser autofilled the hidden field is
-- never lost. They get no notification jobs.
alter table public.quote_requests drop constraint if exists quote_requests_status_check;
alter table public.quote_requests add constraint quote_requests_status_check
  check (status in ('awaiting_review', 'suspected_spam', 'quoted', 'confirmed', 'declined', 'closed'));

-- Supports the per-recipient receipt limit.
create index if not exists notification_jobs_recipient_idx on public.notification_jobs (kind, recipient, created_at);
