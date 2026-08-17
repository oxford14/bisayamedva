-- Full MedVA Deep Dive course + next Live Zoom session
insert into public.courses (
  id,
  slug,
  title,
  subtitle,
  course_type,
  price,
  currency,
  description,
  status,
  sort_order
)
values (
  '22222222-2222-2222-2222-222222222222',
  'full-medva-deep-dive',
  'Full MedVA Deep Dive Bundle',
  'Six specialized Medical VA topics · Live Zoom',
  'UPSKILL',
  2499,
  'PHP',
  'Deep-dive training across Insurance Verification, Claims, Payment Posting, Denials, A/R, and Credentialing.',
  'PUBLISHED',
  20
)
on conflict (id) do update set
  slug = excluded.slug,
  title = excluded.title,
  subtitle = excluded.subtitle,
  course_type = excluded.course_type,
  price = excluded.price,
  currency = excluded.currency,
  description = excluded.description,
  status = excluded.status,
  sort_order = excluded.sort_order;

insert into public.sessions (
  id,
  course_id,
  title,
  starts_at,
  ends_at,
  timezone,
  format,
  capacity,
  status
)
values (
  '33333333-3333-3333-3333-333333333333',
  '22222222-2222-2222-2222-222222222222',
  'Deep Dive Live Zoom — Next cohort',
  '2026-09-06 11:00:00+08',
  '2026-09-06 13:00:00+08',
  'Asia/Manila',
  'Online',
  30,
  'PUBLISHED'
)
on conflict (id) do update set
  course_id = excluded.course_id,
  title = excluded.title,
  starts_at = excluded.starts_at,
  ends_at = excluded.ends_at,
  timezone = excluded.timezone,
  format = excluded.format,
  capacity = excluded.capacity,
  status = excluded.status;
