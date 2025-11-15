# What the Improvements Add (MVP delta)

This pass turns the repo into a Supabase-first, scalable MVP with resumable uploads readiness. Summary of what’s new and why it matters:

## 1) Database-side transactional logic (pSQL RPCs)
- Added transactional RPCs in Postgres (Supabase):
  - create_poll_tx: creates a poll and all options in one transaction, under RLS.
  - cast_vote_tx: enforces active/expiry/multi-choice rules server-side and inserts votes (also under RLS).
- Files:
  - supabase/migrations/20251113000002_rpc_and_files.sql
- Why it matters:
  - Moves business rules as close to data as possible (consistency, less app logic duplication).
  - Fewer roundtrips from the API to the DB (lower latency).
  - RLS is respected because calls are made with a token-bound client (auth.uid()).
  - Easier to port API to a future Node service without re-implementing core logic.

## 2) API/data-layer now call RPCs + fewer queries
- Updated lib/database.ts:
  - createPoll/createPollWithClient now call create_poll_tx then hydrate via getPoll.
  - castVote now calls cast_vote_tx and returns the user’s votes.
  - getPolls avoids N+1: batch-fetches options and user votes for all listed polls.
- Updated app/api/polls/vote/route.ts to use cast_vote_tx.
- Why it matters:
  - Fewer client <-> DB calls.
  - Consistency and correctness from DB-level validations.
  - Better baseline performance for large user counts.

## 3) Upload infra scaffold: Cloudflare R2 + tus (resumable)
- Next.js rewrites: /uploads/* → TUSD_INTERNAL_URL/files/* (next.config.ts).
- Docker Compose for tusd: scripts/docker-compose.tusd.yml (R2 S3-compatible backend).
- Environment vars added: .env.example (R2 credentials, TUS endpoints).
- Documentation: docs/r2-tus.md (setup, tus-js-client code snippet, DB recording, hooks).
- Why it matters:
  - Ready for fast, resumable uploads at scale.
  - Clean client endpoint (NEXT_PUBLIC_TUS_ENDPOINT) that survives a future Node backend (just repoint the proxy).

## 4) Files table + RLS for uploaded objects
- new table public.files (id, user_id, key, filename, size, mime_type, status, metadata, created_at) with RLS and indexes.
- Types extended in types/database.ts (DbFile, Insert/Update).
- Why it matters:
  - Track uploads without exposing ACLs in-app.
  - Enforces per-user visibility securely (RLS).

## 5) Types augmented for RPCs and files
- types/database.ts now declares create_poll_tx and cast_vote_tx Arg/Return types and files table types.
- Why it matters:
  - Better editor hints and future path to remove @ts-nocheck in lib/database.ts.

## 6) Prepared for scale (1M+ path)
- Fewer DB roundtrips for list views; batch queries reduce load.
- DB validations + RLS in Postgres keep application logic thin and consistent.
- Views + indexes already in schema (polls_with_stats, poll_options_with_stats + GIN/text indexes).
- Upload path is horizontally scalable (tusd + R2); client uses a stable endpoint.

---

## Before vs After (quick diff)

- Poll creation:
  - Before: Insert poll + loop insert options in app, multiple DB roundtrips and manual cleanup on failure.
  - After: Single DB transaction via create_poll_tx, atomic and consistent.

- Voting:
  - Before: App validates state (active/expiry/choice) then performs deletes/inserts; risk of race conditions across separate queries.
  - After: Single DB transaction via cast_vote_tx with server-side rules and triggers.

- Poll listing:
  - Before: Per-poll follow-up queries for options/user votes (N+1 pattern).
  - After: Batch fetch options and user votes for all polls in one go.

- Uploads:
  - Before: No R2/tus structure.
  - After: R2 + tusd scaffold, Next.js proxy endpoint, env, and docs ready.

---

## How to verify quickly

1) Apply DB changes:
   - Supabase SQL Editor: run supabase/schema.sql and supabase/migrations/20251113000002_rpc_and_files.sql
   - CLI (linked project):  
     supabase link --project-ref <project-ref>  
     supabase db push

2) Run TUS locally:
   - Fill required R2 variables in .env.local (see .env.example).
   - docker compose -f scripts/docker-compose.tusd.yml up -d

3) Start the app:
   - npm run dev
   - Create polls, vote, and (optionally) test uploads (see docs/r2-tus.md).

---

## What to do next (optional)

- Add ISR/Cache for listing pages to further cut DB load (e.g., revalidate = 10).
- Add a minimal upload UI with tus-js-client (docs already include snippet).
- Implement a /api/tus/hooks endpoint to insert records into public.files as uploads finish.
- Remove @ts-nocheck in lib/database.ts by using generated types or explicit RPC param types.

These improvements deliver a robust, performant MVP with a clear path to a Node backend and scale readiness.
