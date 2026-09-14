# Password reset (production checklist)

Password reset links use **`NEXT_PUBLIC_APP_URL`** (fallback: `site.url` in `src/content/site.ts`).

## Environment

- `NEXT_PUBLIC_APP_URL=https://bisayamedva.com`
- `RESEND_API_KEY` and `RESEND_FROM_EMAIL` for branded emails
- `SUPABASE_SERVICE_ROLE_KEY` for `auth.admin.generateLink`

## Supabase Auth URLs

In [Supabase Dashboard](https://supabase.com/dashboard) → **Authentication** → **URL configuration**:

1. **Site URL:** same as `NEXT_PUBLIC_APP_URL`
2. **Redirect URLs** (allow list), for example:
   - `https://bisayamedva.com/auth/confirm`
   - `https://bisayamedva.com/auth/reset-password`
   - Add `https://www.bisayamedva.com/...` if www is canonical

## Flow

1. User submits email on `/auth/forgot-password`
2. Email contains link to `{APP_URL}/auth/confirm?token_hash=...&type=recovery`
3. Confirm route verifies OTP and redirects to `/auth/reset-password`
4. User sets a new password, then signs in at `/auth/login`

To avoid duplicate emails, rely on Resend for recovery mail; do not also enable Supabase’s default recovery SMTP for the same flow unless you disable the app’s custom send.
