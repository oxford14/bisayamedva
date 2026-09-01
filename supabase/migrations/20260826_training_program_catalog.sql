-- Training program catalog: Foundation (2×499) + Upskill (3×1000)
-- Archive legacy bundle courses and seed published courses + sessions.

-- Legacy bundles → archived
update public.courses
set status = 'ARCHIVED'
where slug in ('core-beginner-bundle', 'full-medva-deep-dive');

-- Foundation courses
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
values
  (
    '11111111-1111-1111-1111-111111111111',
    'medical-billing-masterclass',
    'Medical Billing Masterclass',
    'Medical Billing fundamentals for aspiring Medical VAs',
    'BASIC',
    499,
    'PHP',
    'Core Medical Billing concepts, terminology, and where billing sits in the revenue cycle.',
    'PUBLISHED',
    10
  ),
  (
    '11111111-1111-1111-1111-111111111112',
    'medical-va-masterclass',
    'Medical VA Masterclass',
    'Front desk, workflow, and Medical VA fundamentals',
    'BASIC',
    499,
    'PHP',
    'Patient intake, scheduling basics, and day-to-day Medical VA workflow.',
    'PUBLISHED',
    11
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

-- Upskill courses (repurpose deep-dive UUID for Insurance Verification)
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
values
  (
    '22222222-2222-2222-2222-222222222222',
    'insurance-verification',
    'Insurance Verification',
    'Eligibility & benefits',
    'UPSKILL',
    1000,
    'PHP',
    'Confirm coverage, benefits, and patient responsibility before the claim path starts.',
    'PUBLISHED',
    20
  ),
  (
    '22222222-2222-2222-2222-222222222223',
    'claims',
    'Claims',
    'Clean claim workflow',
    'UPSKILL',
    1000,
    'PHP',
    'Prepare, check, and submit claims with fewer preventable denials.',
    'PUBLISHED',
    21
  ),
  (
    '22222222-2222-2222-2222-222222222224',
    'denials',
    'Denials',
    'Appeals & rework',
    'UPSKILL',
    1000,
    'PHP',
    'Read denial reasons, prioritize rework, and improve follow-through.',
    'PUBLISHED',
    22
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

-- Featured course for public register
insert into public.site_settings (key, value)
values ('featured_course_id', '"11111111-1111-1111-1111-111111111111"')
on conflict (key) do update set value = excluded.value;

-- Medical Billing Masterclass session
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
  '33333333-3333-3333-3333-333333333331',
  '11111111-1111-1111-1111-111111111111',
  'Medical Billing Masterclass — Next weekend',
  '2026-09-06 19:00:00+08',
  '2026-09-06 21:00:00+08',
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

-- Medical VA Masterclass session
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
  '33333333-3333-3333-3333-333333333332',
  '11111111-1111-1111-1111-111111111112',
  'Medical VA Masterclass — Next cohort',
  '2026-09-07 19:00:00+08',
  '2026-09-07 21:00:00+08',
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

-- Upskill sessions (reuse deep-dive session id for Insurance Verification)
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
values
  (
    '33333333-3333-3333-3333-333333333333',
    '22222222-2222-2222-2222-222222222222',
    'Insurance Verification — Next cohort',
    '2026-09-06 11:00:00+08',
    '2026-09-06 13:00:00+08',
    'Asia/Manila',
    'Online',
    30,
    'PUBLISHED'
  ),
  (
    '33333333-3333-3333-3333-333333333334',
    '22222222-2222-2222-2222-222222222223',
    'Claims — Next cohort',
    '2026-09-13 11:00:00+08',
    '2026-09-13 13:00:00+08',
    'Asia/Manila',
    'Online',
    30,
    'PUBLISHED'
  ),
  (
    '33333333-3333-3333-3333-333333333335',
    '22222222-2222-2222-2222-222222222224',
    'Denials — Next cohort',
    '2026-09-20 11:00:00+08',
    '2026-09-20 13:00:00+08',
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
