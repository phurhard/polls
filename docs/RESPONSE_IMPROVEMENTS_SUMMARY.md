# What these improvements add (short summary)

- DB-side transactions (Supabase RPCs)
  - New functions: create_poll_tx and cast_vote_tx
  - Atomic, RLS-respecting operations move rules (active/expired/multi-choice) into Postgres
  - Fewer roundtrips and race conditions; simpler, more consistent server code

- Faster list queries (no N+1)
  - Poll listings batch-load options and user votes across all polls
  - Cuts queries from O(n) to O(1-ish), lowering latency and DB load

- Leaner, safer API
  - Vote API now calls a single transactional RPC instead of multiple statements
  - Less surface area for failures; correctness enforced at the DB

- Uploads at scale (Cloudflare R2 + TUS scaffold)
  - Next.js /uploads proxy + tusd docker-compose + envs
  - Resumable, large-file friendly path ready for future Node backend

- Files table with RLS
  - Track uploaded objects (key, size, metadata)
  - Per-user visibility enforced by policies

- Types and docs
  - types/database.ts extended for RPCs and files
  - New docs: 
    - docs/IMPROVEMENTS_AT_A_GLANCE.md (quick overview)
    - docs/MVP_IMPROVEMENTS.md (before/after details)
    - docs/r2-tus.md (R2/TUS setup + client snippet)

Net effect: stronger consistency (DB-validated transactions), fewer queries, lower latency, upload readiness, and a clear path to scaling and a future Node backend without changing the client surface.
