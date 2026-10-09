# Pulsebridge AI Automation Course 2026

Standalone course application source.

## Production
https://pulsebridge-ai-automation-course.vercel.app

## Stack
- Next.js 16
- React 19
- Supabase Auth + Postgres + RLS
- Stripe Payment Link entitlement via verified webhook
- Vercel deployment

## Student features
- Individual paid-student accounts
- 12 modules
- Per-student progress tracking
- Protected Resource Vault
- Profile/account settings
- Completion certificate at 12/12 modules

## Security model
Stripe Checkout creates an entitlement in Supabase. A purchase is claimed once by a Supabase Auth user, and RLS gates modules, resources, progress and profile data to the paid claimed user.

Environment variables required:
- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY

Server-side secrets remain in Supabase/Vercel and are intentionally not stored here.
