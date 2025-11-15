-- =====================================================
-- Migration: RPC functions and Files table (Cloudflare R2 + TUS)
-- Date: 2025-11-13
-- Notes:
--  - Adds transactional RPCs for creating polls and casting votes
--  - Adds a minimal 'files' table with RLS for R2 object metadata
--  - Functions are SECURITY INVOKER to respect table-level RLS
--  - Designed to complement existing schema in supabase/schema.sql
-- =====================================================

-- =====================================================
-- RPC: Create Poll Transactionally
-- =====================================================
CREATE OR REPLACE FUNCTION public.create_poll_tx(
  p_title               TEXT,
  p_description         TEXT,
  p_options             TEXT[],
  p_allow_multiple      BOOLEAN DEFAULT FALSE,
  p_expires_at          TIMESTAMPTZ DEFAULT NULL,
  p_category_id         UUID DEFAULT NULL
) RETURNS UUID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_poll_id UUID;
  v_creator UUID := auth.uid();
BEGIN
  IF v_creator IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF p_title IS NULL OR btrim(p_title) = '' THEN
    RAISE EXCEPTION 'Poll title is required';
  END IF;

  IF p_options IS NULL OR array_length(p_options, 1) IS NULL OR array_length(p_options, 1) < 2 THEN
    RAISE EXCEPTION 'At least 2 options are required';
  END IF;

  -- Insert poll (RLS policy requires creator_id = auth.uid())
  INSERT INTO public.polls (
    title, description, creator_id, allow_multiple_choices, expires_at, category_id
  )
  VALUES (
    btrim(p_title),
    CASE WHEN p_description IS NULL OR btrim(p_description) = '' THEN NULL ELSE btrim(p_description) END,
    v_creator,
    COALESCE(p_allow_multiple, FALSE),
    p_expires_at,
    p_category_id
  )
  RETURNING id INTO v_poll_id;

  -- Insert options with stable ordering via ordinality
  INSERT INTO public.poll_options (poll_id, text, "order")
  SELECT v_poll_id, btrim(opt), ord - 1
  FROM unnest(p_options) WITH ORDINALITY AS t(opt, ord);

  RETURN v_poll_id;
END;
$$;

-- Grant execute to anon and authenticated (optional, maintain least privilege at API layer)
GRANT EXECUTE ON FUNCTION public.create_poll_tx(TEXT, TEXT, TEXT[], BOOLEAN, TIMESTAMPTZ, UUID) TO anon, authenticated;

-- =====================================================
-- RPC: Cast Vote Transactionally
-- =====================================================
CREATE OR REPLACE FUNCTION public.cast_vote_tx(
  poll_uuid  UUID,
  option_ids UUID[]
) RETURNS VOID
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
DECLARE
  v_uid UUID := auth.uid();
  v_allow_multiple BOOLEAN;
BEGIN
  IF v_uid IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  IF poll_uuid IS NULL THEN
    RAISE EXCEPTION 'poll_uuid is required';
  END IF;

  IF option_ids IS NULL OR array_length(option_ids, 1) IS NULL OR array_length(option_ids, 1) = 0 THEN
    RAISE EXCEPTION 'option_ids is required';
  END IF;

  -- Ensure poll exists and is currently active
  PERFORM 1
  FROM public.polls p
  WHERE p.id = poll_uuid
    AND p.is_active = TRUE
    AND (p.expires_at IS NULL OR p.expires_at > NOW());

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Poll not found or inactive/expired';
  END IF;

  SELECT allow_multiple_choices INTO v_allow_multiple
  FROM public.polls
  WHERE id = poll_uuid;

  -- If single-choice, remove previous votes by this user on this poll first
  IF COALESCE(v_allow_multiple, FALSE) = FALSE THEN
    DELETE FROM public.votes
    WHERE poll_id = poll_uuid
      AND user_id = v_uid;
  END IF;

  -- Insert votes (RLS + triggers validate constraints)
  INSERT INTO public.votes (user_id, poll_id, option_id)
  SELECT v_uid, poll_uuid, oid
  FROM unnest(option_ids) AS t(oid);

  RETURN;
END;
$$;

GRANT EXECUTE ON FUNCTION public.cast_vote_tx(UUID, UUID[]) TO anon, authenticated;

-- =====================================================
-- FILES TABLE for Cloudflare R2 object metadata
-- =====================================================
CREATE TABLE IF NOT EXISTS public.files (
  id         UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id    UUID REFERENCES public.users(id) ON DELETE SET NULL,
  key        TEXT UNIQUE NOT NULL,           -- object key in R2 (path/filename)
  filename   TEXT NOT NULL,                  -- original filename
  size       BIGINT NOT NULL CHECK (size >= 0),
  mime_type  TEXT,
  status     TEXT NOT NULL DEFAULT 'uploaded' CHECK (status IN ('uploaded','processing','ready','failed')),
  metadata   JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT TIMEZONE('utc'::text, NOW())
);

-- Indexes
CREATE INDEX IF NOT EXISTS files_user_id_idx ON public.files(user_id);
CREATE INDEX IF NOT EXISTS files_created_at_idx ON public.files(created_at DESC);

-- RLS
ALTER TABLE public.files ENABLE ROW LEVEL SECURITY;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'files' AND policyname = 'Users can view their files'
  ) THEN
    CREATE POLICY "Users can view their files" ON public.files
      FOR SELECT USING (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'files' AND policyname = 'Users can insert their files'
  ) THEN
    CREATE POLICY "Users can insert their files" ON public.files
      FOR INSERT WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'files' AND policyname = 'Users can update their files'
  ) THEN
    CREATE POLICY "Users can update their files" ON public.files
      FOR UPDATE USING (user_id = auth.uid())
      WITH CHECK (user_id = auth.uid());
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies WHERE schemaname = 'public' AND tablename = 'files' AND policyname = 'Users can delete their files'
  ) THEN
    CREATE POLICY "Users can delete their files" ON public.files
      FOR DELETE USING (user_id = auth.uid());
  END IF;
END $$;
