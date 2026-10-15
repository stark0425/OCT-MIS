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

## Supabase October connection
- This build reads from and inserts into `public.business_oct`.
- It does not read from or write to the September `business` table.
- Keep RLS enabled with SELECT and INSERT policies on `business_oct`.
- The frontend uses the public publishable/anon key only.


## Added in this update
- Each employee is shown against a ₹2,00,000 monthly net-business target.
- Employee leaderboard shows net achieved, target progress, and remaining amount.
- Each policy has a `Cancel for Net` action. Cancellation keeps gross premium counted but excludes its net ex-GST amount from net business and target progress.
- Cancelled policies can be restored to net business.
- CSV export includes cancellation status and counted net business.

## Required Supabase migration
Run this once in Supabase SQL Editor before using cancellation actions with cloud sync:

```sql
ALTER TABLE public.business_oct
ADD COLUMN IF NOT EXISTS cancelled_from_net boolean NOT NULL DEFAULT false;
```

Existing rows default to `false`, so existing business remains included in net business. After running the migration, refresh the website.
