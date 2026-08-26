# Bulk Photo Upload for Site Profiles

## Problem
Each system section (Heating, Cooling, Boiler, RTU, etc.) has up to 6 photo slots, and a profile can have many systems. Every photo must be uploaded one slot at a time — slow and painful on-site.

## Solution: 3-part upgrade

### 1. Multi-select per photo slot (quick win)
- Add `multiple` to the gallery file input in `PhotoSlot.tsx` so one picker session can select many photos at once.
- Upload them sequentially with a visible progress indicator ("Uploading 3 of 8…") instead of blocking on one file.

### 2. Global "Bulk Upload" panel at the top of the Site Profile form
A new `BulkPhotoUpload.tsx` section on `SiteProfileForm.tsx`:
- Drag-and-drop zone + "Choose photos" + "Camera" buttons; accepts dozens of photos in one go.
- Shows a thumbnail grid of staged photos.
- Each staged photo gets two dropdowns: **System** (e.g. Heating #1, Boiler #2) and **Slot** (e.g. Unit Photo, Pre Filter, Expansion Tank) — with smart defaults (first empty slot of the selected system).
- "Upload All" button processes the queue with per-photo progress bars and individual retry on failure; uploaded photos land directly into the correct `PhotoSlot` (same `site_profile_photos` table + storage bucket — no schema change).
- Successfully uploaded photos auto-clear from the staging grid; failures stay for retry.

### 3. Auto image compression before upload
- Downscale photos to max 1600px and re-encode as JPEG (~80% quality) via canvas before uploading (in a small `src/lib/imageCompress.ts` helper, reused by both PhotoSlot and the bulk panel).
- Keeps uploads fast on mobile data and keeps PDF/email sizes small. Original aspect ratio preserved.

## Files
- `src/lib/imageCompress.ts` — new: client-side resize/compress helper.
- `src/components/admin/siteprofile/PhotoSlot.tsx` — multi-select + progress + compression.
- `src/components/admin/siteprofile/BulkPhotoUpload.tsx` — new: drag-drop staging grid with system/slot assignment.
- `src/components/admin/siteprofile/SiteProfileForm.tsx` — render the bulk panel near the top, pass systems list + reload hook.

## Notes
- No database or migration needed — reuses existing `site_profile_photos` table and `site-profile-photos` bucket.
- Existing per-slot upload behavior stays unchanged as a fallback.
