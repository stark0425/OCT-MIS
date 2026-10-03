# OCT MIS PRO — October 2026

This is the upgraded version of the existing NEON MIS.

## What is retained
- Shared business ledger
- Employee master list
- Customer name
- Mobile number
- Application number
- Premium / gross business
- Sum insured
- Plan name
- Add-on
- Status: ISSUED / LOGIN / PENDING / REJECTED
- Location / category
- Credit factor
- Credit business
- Net ex-GST
- Search and filters
- Supabase shared sync

## Category / factor details
All five factors are explicitly supported and independently trackable:
- CAT A — 40%
- CAT B — 50%
- CAT B — 75%
- CAT B — 90%
- ALL — 100%

Credit = Premium × selected factor
Net ex-GST = Credit ÷ 1.18

## October improvements
- October 2026 month filter
- Dynamic 31-day daily business chart
- Employee leaderboard
- Category/factor mix
- Status snapshot
- Full-detail transaction ledger
- Search across customer, employee, application, plan, mobile, add-on and location
- Factor filter
- CSV export
- Cleaner management dashboard
- Mobile responsive layout
- Separate factor field so 50% can never accidentally use the 40% formula

## Supabase
The existing Supabase configuration is retained in config.js. The frontend uses the public publishable/anon key only.

For a production company MIS, keep RLS/authentication enabled and restrict editing by employee/admin role.
