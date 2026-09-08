# Influencer Marketing Campaign Tracker — Database Setup

## Goal
Create the Supabase-backed data schema for an Influencer Marketing Campaign Tracker app.

## Steps

1. Enable Lovable Cloud
   - Activate the managed backend so migrations and auth can be applied to the project.

2. Create migration `create_campaigns_tables`
   - Table `campaigns`:
     - `id` uuid primary key default gen_random_uuid()
     - `name` text not null
     - `start_date` date not null
     - `end_date` date not null
     - `created_at` timestamp default now()
   - Table `campaign_influencers`:
     - `id` uuid primary key default gen_random_uuid()
     - `campaign_id` uuid not null references campaigns(id)
     - `influencer_handle` text not null
     - `content_type` text not null
     - `leads` integer not null default 0
     - `cost_per_lead` numeric not null default 0
     - `date_onboarded` date nullable
     - `date_paid` date nullable
     - `status` text not null default 'Pending'
     - `content_views` integer not null default 0
     - `engagements` integer not null default 0
     - `link_clicks` integer not null default 0
     - `created_at` timestamp default now()
   - Add `ON DELETE CASCADE` to the `campaign_id` foreign key so influencer rows are removed when a campaign is deleted.
   - Grant Data API access:
     - `SELECT, INSERT, UPDATE, DELETE` on both tables to `authenticated`
     - `ALL` on both tables to `service_role`
   - Enable Row Level Security on both tables.
   - Add policies allowing `authenticated` users full read/write access on both tables (placeholder until auth-driven restrictions are added later).

3. Apply the migration
   - Run the migration against the Lovable Cloud project.

## Out of scope
- No UI components, pages, or server functions will be created in this step.
- No auth restrictions beyond the placeholder policies.
