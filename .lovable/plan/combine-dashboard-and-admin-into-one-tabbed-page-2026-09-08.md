# Combine dashboard and admin into one tabbed page

## Goal
Replace the separate `/` dashboard and `/admin` management pages with a single page at `/` that has three tabs: **Dashboard**, **Campaigns**, and **Influencers**.

## Plan

1. **Create tabbed layout on `/`**
   - Add a tab navigation bar below the page header with: Dashboard, Campaigns, Influencers.
   - Keep the existing white/minimal header and date pill from the current dashboard.

2. **Dashboard tab**
   - Reuse the current dashboard content: stat strip, traction flow, campaign details table, and "Add influencer" button.
   - Keep all existing data fetching, calculations, and the Add Influencer dialog unchanged.

3. **Campaigns tab**
   - Move the Campaigns table from `/admin` here.
   - Keep edit/delete actions, confirmation dialogs, toasts, and the "New campaign" button.

4. **Influencers tab**
   - Move the Influencers table from `/admin` here.
   - Keep the campaign filter dropdown, edit/delete actions, Copy link button, confirmation dialogs, and toasts.

5. **Remove or redirect `/admin`**
   - Replace `src/routes/admin.tsx` with a redirect to `/` so existing bookmarks and links still work.

6. **Verification**
   - Load `/`, confirm all three tabs switch correctly and data still loads.
   - Confirm `/admin` redirects to `/`.
   - Check build output for errors.

## Out of scope
- No changes to the Create Campaign or Add Influencer forms beyond reusing them.
- No new influencer login portal (separate future task).
- No auth/login changes.
