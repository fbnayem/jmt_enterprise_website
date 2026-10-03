-- Private bucket for quote photos. No storage.objects policies are created, so
-- anonymous and signed-in browser clients cannot list, read or delete objects.
-- The server issues short-lived signed upload URLs and signed read URLs.
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('quote-photos', 'quote-photos', false, 10485760, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do update
  set public = false,
      file_size_limit = excluded.file_size_limit,
      allowed_mime_types = excluded.allowed_mime_types;
