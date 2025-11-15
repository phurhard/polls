# Improvements at a Glance

What this pass adds on top of what was already in the repo:

- Database-side transactions (pSQL RPCs)
  - New RPCs: `create_poll_tx` and `cast_vote_tx` perform multi-step writes atomically inside Postgres, under RLS.
  - Benefit: fewer roundtrips, DB-enforced rules (active/expired/multi-choice), less duplicated app logic, easier to port to a future Node backend.

- API/Data-layer performance and correctness
  - Poll creation and voting now call RPCs instead of manual multi-query sequences.
  - Poll listings batch-load options and user-votes across all polls (no N+1).
  - Result: lower latency, fewer queries, more consistent behavior at scale.

- Cloudflare R2 + TUS upload scaffold (resumable uploads)
  - Added env config, Next.js rewrites (`/uploads/*` → tusd), and a docker-compose for tusd backed by R2 (S3-compatible).
  - Docs include a minimal `tus-js-client` example and how to record uploads in DB.
  - Outcome: fast, resumable uploads ready for scale with a stable client endpoint.

- Files table with RLS for uploaded objects
  - New `public.files` table + policies so users only see/manage their own uploads.
  - Enables tracking delivery keys, sizes, and statuses safely.

- Types updated for RPCs and files
  - `types/database.ts` includes RPC arg/return types and `files` table types.
  - Better DX now; future path to remove `@ts-nocheck` in the data layer if desired.

- Scale & future-proofing
  - Keeps logic close to data (RLS + RPCs + triggers), reduces app complexity.
  - Upload path and client endpoint remain stable when you later move to a Node backend.
  - Existing indexes, views, and full-text search are leveraged; caching/ISR can be layered easily.

See also:
- docs/MVP_IMPROVEMENTS.md — Full rationale and before/after details
- docs/r2-tus.md — Setup for R2 + tusd, client snippet, and optional hooks
