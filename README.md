# Campaign Connect DB

Set up Supabase tables for an Influencer Marketing Campaign Tracker app.

Create two tables:

1. campaigns
   - id (uuid, primary key, default gen_random_uuid())
   - name (text, required)
   - start_date (date, required)
   - end_date (date, required)
   - created_at (timestamp, default now())

2. campaign_influencers
   - id (uuid, primary key, default gen_random_uuid())
   - campaign_id (uuid, foreign key referencing campaigns.id, required)
   - influencer_handle (text, required) — e.g. "@sarahcreates"
   - content_type (text, required) — e.g. "Instagram Reel", "TikTok Video"
   - leads (integer, required, default 0)
   - cost_per_lead (numeric, required, default 0)
   - date_onboarded (date, nullable)
   - date_paid (date, nullable)
   - status (text, required, default 'Pending') — allowed values: 'Paid', 'On Track', 'Pending'
   - content_views (integer, required, default 0)
   - engagements (integer, required, default 0)
   - link_clicks (integer, required, default 0)
   - created_at (timestamp, default now())

Enable Row Level Security on both tables. For now, add a policy that allows all read and write access (we'll restrict this later once auth is added).

Do not build any UI components yet — this step is database setup only.

Do not change:
- Nothing exists in the app yet, so there is nothing else to preserve.

This project was built with [Lovable](https://lovable.dev).

**Live app**: https://outstaconnect.lovable.app

## Build with Lovable

Continue developing this project in the [Lovable editor](https://lovable.dev/projects/41f67762-77ed-40a7-ae3b-4cc23066e748).

- **Ship faster**: describe what you want to build and Lovable handles the code.
- **Stay in sync**: every change made in Lovable is committed straight to this repository.
- **Full ownership**: this code is yours. Push to `main` on GitHub and your changes sync back into Lovable, ready for your next prompt.

## Development

Prefer working locally? You need Node.js and npm — [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating).

```sh
git clone <this-repository-url>
cd <repository-name>
npm i
npm run dev
```
