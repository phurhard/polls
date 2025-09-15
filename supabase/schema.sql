-- =====================================================
-- POLLS APPLICATION DATABASE SCHEMA
-- =====================================================
-- This schema creates all necessary tables, relationships,
-- security policies, and functions for a comprehensive
-- polling application with user authentication.

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- =====================================================
-- USERS TABLE (extends auth.users)
-- =====================================================
-- Custom user profiles that extend Supabase auth
CREATE TABLE public.users (
    id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
    email TEXT UNIQUE NOT NULL,
    name TEXT NOT NULL,
    avatar_url TEXT,
    bio TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    -- Add constraints
    CONSTRAINT users_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 100),
    CONSTRAINT users_email_valid CHECK (email ~* '^[A-Za-z0-9._%-]+@[A-Za-z0-9.-]+[.][A-Za-z]+$'),
    CONSTRAINT users_bio_length CHECK (bio IS NULL OR char_length(bio) <= 500)
);

-- =====================================================
-- POLLS TABLE
-- =====================================================
-- Main polls table with all poll metadata
CREATE TABLE public.polls (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    creator_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    is_active BOOLEAN DEFAULT true NOT NULL,
    allow_multiple_choices BOOLEAN DEFAULT false NOT NULL,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    -- Add constraints
    CONSTRAINT polls_title_length CHECK (char_length(title) >= 3 AND char_length(title) <= 200),
    CONSTRAINT polls_description_length CHECK (description IS NULL OR char_length(description) <= 1000),
    CONSTRAINT polls_expires_at_future CHECK (expires_at IS NULL OR expires_at > created_at)
);

-- =====================================================
-- POLL OPTIONS TABLE
-- =====================================================
-- Individual options for each poll
CREATE TABLE public.poll_options (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    text TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    -- Add constraints
    CONSTRAINT poll_options_text_length CHECK (char_length(text) >= 1 AND char_length(text) <= 200),
    CONSTRAINT poll_options_order_positive CHECK ("order" >= 0),

    -- Ensure unique order per poll
    UNIQUE(poll_id, "order")
);

-- =====================================================
-- VOTES TABLE
-- =====================================================
-- Individual votes cast by users
CREATE TABLE public.votes (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    user_id UUID REFERENCES public.users(id) ON DELETE CASCADE NOT NULL,
    poll_id UUID REFERENCES public.polls(id) ON DELETE CASCADE NOT NULL,
    option_id UUID REFERENCES public.poll_options(id) ON DELETE CASCADE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    -- Note: Option-poll relationship enforced by foreign key and trigger instead of check constraint
);

-- =====================================================
-- POLL CATEGORIES TABLE (Optional for future expansion)
-- =====================================================
CREATE TABLE public.poll_categories (
    id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
    name TEXT UNIQUE NOT NULL,
    description TEXT,
    color TEXT DEFAULT '#6B7280',
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT TIMEZONE('utc'::text, NOW()) NOT NULL,

    CONSTRAINT poll_categories_name_length CHECK (char_length(name) >= 2 AND char_length(name) <= 50),
    CONSTRAINT poll_categories_color_hex CHECK (color ~* '^#([A-Fa-f0-9]{6}|[A-Fa-f0-9]{3})$')
);

-- Add category relationship to polls (optional)
ALTER TABLE public.polls
ADD COLUMN category_id UUID REFERENCES public.poll_categories(id) ON DELETE SET NULL;

-- =====================================================
-- INDEXES FOR PERFORMANCE
-- =====================================================

-- Users indexes
CREATE INDEX users_email_idx ON public.users(email);
CREATE INDEX users_created_at_idx ON public.users(created_at DESC);
CREATE INDEX users_is_active_idx ON public.users(is_active) WHERE is_active = true;

-- Polls indexes
CREATE INDEX polls_creator_id_idx ON public.polls(creator_id);
CREATE INDEX polls_created_at_idx ON public.polls(created_at DESC);
CREATE INDEX polls_updated_at_idx ON public.polls(updated_at DESC);
CREATE INDEX polls_is_active_idx ON public.polls(is_active) WHERE is_active = true;
CREATE INDEX polls_expires_at_idx ON public.polls(expires_at) WHERE expires_at IS NOT NULL;
CREATE INDEX polls_category_id_idx ON public.polls(category_id) WHERE category_id IS NOT NULL;

-- Full-text search index on polls
CREATE INDEX polls_title_text_search_idx ON public.polls USING gin(to_tsvector('english', title));
CREATE INDEX polls_description_text_search_idx ON public.polls USING gin(to_tsvector('english', coalesce(description, '')));

-- Poll options indexes
CREATE INDEX poll_options_poll_id_idx ON public.poll_options(poll_id);
CREATE INDEX poll_options_poll_id_order_idx ON public.poll_options(poll_id, "order");

-- Votes indexes
CREATE INDEX votes_user_id_idx ON public.votes(user_id);
CREATE INDEX votes_poll_id_idx ON public.votes(poll_id);
CREATE INDEX votes_option_id_idx ON public.votes(option_id);
CREATE INDEX votes_created_at_idx ON public.votes(created_at DESC);

-- Composite indexes for common queries
CREATE INDEX votes_user_poll_idx ON public.votes(user_id, poll_id);
CREATE INDEX votes_poll_option_idx ON public.votes(poll_id, option_id);

-- Unique constraint to prevent duplicate votes (unless multiple choices allowed)
-- This will be handled by policies and application logic

-- =====================================================
-- FUNCTIONS AND TRIGGERS
-- =====================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = TIMEZONE('utc'::text, NOW());
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply updated_at triggers to all tables
CREATE TRIGGER update_users_updated_at
    BEFORE UPDATE ON public.users
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_polls_updated_at
    BEFORE UPDATE ON public.polls
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_poll_options_updated_at
    BEFORE UPDATE ON public.poll_options
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Function to handle user registration
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
    INSERT INTO public.users (id, email, name)
    VALUES (
        NEW.id,
        NEW.email,
        COALESCE(NEW.raw_user_meta_data->>'name', split_part(NEW.email, '@', 1))
    );
    RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Trigger to automatically create user profile
CREATE TRIGGER on_auth_user_created
    AFTER INSERT ON auth.users
    FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- Function to prevent voting on expired or inactive polls
CREATE OR REPLACE FUNCTION public.validate_vote()
RETURNS TRIGGER AS $$
DECLARE
    poll_record RECORD;
    existing_votes INTEGER;
BEGIN
    -- Get poll information
    SELECT is_active, allow_multiple_choices, expires_at
    INTO poll_record
    FROM public.polls
    WHERE id = NEW.poll_id;

    -- Check if poll is active
    IF NOT poll_record.is_active THEN
        RAISE EXCEPTION 'Cannot vote on inactive poll';
    END IF;

    -- Check if poll is expired
    IF poll_record.expires_at IS NOT NULL AND poll_record.expires_at < NOW() THEN
        RAISE EXCEPTION 'Cannot vote on expired poll';
    END IF;

    -- Check for duplicate votes if multiple choices not allowed
    IF NOT poll_record.allow_multiple_choices THEN
        SELECT COUNT(*) INTO existing_votes
        FROM public.votes
        WHERE user_id = NEW.user_id AND poll_id = NEW.poll_id;

        IF existing_votes > 0 THEN
            RAISE EXCEPTION 'Multiple votes not allowed on this poll';
        END IF;
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate votes
CREATE TRIGGER validate_vote_trigger
    BEFORE INSERT ON public.votes
    FOR EACH ROW EXECUTE FUNCTION public.validate_vote();

-- Function to ensure vote option belongs to the poll
CREATE OR REPLACE FUNCTION public.validate_option_poll_relationship()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the option belongs to the specified poll
    IF NOT EXISTS (
        SELECT 1 FROM public.poll_options
        WHERE id = NEW.option_id AND poll_id = NEW.poll_id
    ) THEN
        RAISE EXCEPTION 'Option does not belong to the specified poll';
    END IF;

    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to validate option-poll relationship
CREATE TRIGGER validate_option_poll_relationship_trigger
    BEFORE INSERT OR UPDATE ON public.votes
    FOR EACH ROW EXECUTE FUNCTION public.validate_option_poll_relationship();

-- =====================================================
-- VIEWS FOR COMMON QUERIES
-- =====================================================

-- View for polls with vote counts
CREATE VIEW public.polls_with_stats AS
SELECT
    p.*,
    COUNT(DISTINCT v.id) AS total_votes,
    COUNT(DISTINCT v.user_id) AS unique_voters,
    CASE
        WHEN p.expires_at IS NOT NULL AND p.expires_at < NOW() THEN false
        ELSE p.is_active
    END AS is_currently_active
FROM public.polls p
LEFT JOIN public.votes v ON p.id = v.poll_id
GROUP BY p.id;

-- View for poll options with vote counts
CREATE VIEW public.poll_options_with_stats AS
SELECT
    po.*,
    COUNT(v.id) AS vote_count,
    COALESCE(
        ROUND(
            (COUNT(v.id)::DECIMAL / NULLIF(poll_totals.total_votes, 0)) * 100,
            2
        ),
        0
    ) AS vote_percentage
FROM public.poll_options po
LEFT JOIN public.votes v ON po.id = v.option_id
LEFT JOIN (
    SELECT
        p.id,
        COUNT(v.id) AS total_votes
    FROM public.polls p
    LEFT JOIN public.votes v ON p.id = v.poll_id
    GROUP BY p.id
) poll_totals ON po.poll_id = poll_totals.id
GROUP BY po.id, po.poll_id, po.text, po."order", po.created_at, po.updated_at, poll_totals.total_votes
ORDER BY po.poll_id, po."order";

-- =====================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =====================================================

-- Enable RLS on all tables
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.polls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_options ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.votes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.poll_categories ENABLE ROW LEVEL SECURITY;

-- Users policies
CREATE POLICY "Users can view all profiles" ON public.users
    FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.users
    FOR UPDATE USING (auth.uid() = id);

-- Polls policies
CREATE POLICY "Anyone can view active polls" ON public.polls
    FOR SELECT USING (
        is_active = true AND
        (expires_at IS NULL OR expires_at > NOW())
    );

CREATE POLICY "Poll creators can view their own polls" ON public.polls
    FOR SELECT USING (auth.uid() = creator_id);

CREATE POLICY "Authenticated users can create polls" ON public.polls
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = creator_id
    );

CREATE POLICY "Poll creators can update their own polls" ON public.polls
    FOR UPDATE USING (auth.uid() = creator_id)
    WITH CHECK (auth.uid() = creator_id);

CREATE POLICY "Poll creators can delete their own polls" ON public.polls
    FOR DELETE USING (auth.uid() = creator_id);

-- Poll options policies
CREATE POLICY "Anyone can view poll options for visible polls" ON public.poll_options
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls
            WHERE id = poll_id
            AND (
                (is_active = true AND (expires_at IS NULL OR expires_at > NOW()))
                OR creator_id = auth.uid()
            )
        )
    );

CREATE POLICY "Poll creators can manage their poll options" ON public.poll_options
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.polls
            WHERE id = poll_id AND creator_id = auth.uid()
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM public.polls
            WHERE id = poll_id AND creator_id = auth.uid()
        )
    );

-- Votes policies
CREATE POLICY "Users can view votes on visible polls" ON public.votes
    FOR SELECT USING (
        EXISTS (
            SELECT 1 FROM public.polls
            WHERE id = poll_id
            AND (
                (is_active = true AND (expires_at IS NULL OR expires_at > NOW()))
                OR creator_id = auth.uid()
            )
        )
    );

CREATE POLICY "Authenticated users can vote" ON public.votes
    FOR INSERT WITH CHECK (
        auth.role() = 'authenticated' AND
        auth.uid() = user_id AND
        EXISTS (
            SELECT 1 FROM public.polls
            WHERE id = poll_id
            AND is_active = true
            AND (expires_at IS NULL OR expires_at > NOW())
        )
    );

CREATE POLICY "Users can delete their own votes" ON public.votes
    FOR DELETE USING (auth.uid() = user_id);

-- Poll categories policies (public read)
CREATE POLICY "Anyone can view poll categories" ON public.poll_categories
    FOR SELECT USING (is_active = true);

CREATE POLICY "Only admins can manage categories" ON public.poll_categories
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM public.users
            WHERE id = auth.uid()
            -- Add admin role check here when implementing roles
        )
    );

-- =====================================================
-- HELPER FUNCTIONS FOR COMMON OPERATIONS
-- =====================================================

-- Function to get poll results
CREATE OR REPLACE FUNCTION public.get_poll_results(poll_uuid UUID)
RETURNS TABLE (
    option_id UUID,
    option_text TEXT,
    option_order INTEGER,
    vote_count BIGINT,
    percentage DECIMAL(5,2)
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        po.id,
        po.text,
        po."order",
        COUNT(v.id) AS vote_count,
        COALESCE(
            ROUND(
                (COUNT(v.id)::DECIMAL / NULLIF(
                    (SELECT COUNT(*) FROM public.votes WHERE poll_id = poll_uuid),
                    0
                )) * 100,
                2
            ),
            0
        ) AS percentage
    FROM public.poll_options po
    LEFT JOIN public.votes v ON po.id = v.option_id
    WHERE po.poll_id = poll_uuid
    GROUP BY po.id, po.text, po."order"
    ORDER BY po."order";
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to check if user has voted on a poll
CREATE OR REPLACE FUNCTION public.user_has_voted(poll_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS BOOLEAN AS $$
BEGIN
    RETURN EXISTS (
        SELECT 1 FROM public.votes
        WHERE poll_id = poll_uuid AND user_id = user_uuid
    );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get user's votes for a poll
CREATE OR REPLACE FUNCTION public.get_user_votes(poll_uuid UUID, user_uuid UUID DEFAULT auth.uid())
RETURNS TABLE (
    vote_id UUID,
    option_id UUID,
    option_text TEXT,
    created_at TIMESTAMPTZ
) AS $$
BEGIN
    RETURN QUERY
    SELECT
        v.id,
        v.option_id,
        po.text,
        v.created_at
    FROM public.votes v
    JOIN public.poll_options po ON v.option_id = po.id
    WHERE v.poll_id = poll_uuid AND v.user_id = user_uuid
    ORDER BY v.created_at;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =====================================================
-- SAMPLE DATA (Optional - for development)
-- =====================================================

-- Insert sample poll categories
INSERT INTO public.poll_categories (name, description, color) VALUES
    ('General', 'General purpose polls', '#6B7280'),
    ('Technology', 'Technology and programming related polls', '#3B82F6'),
    ('Entertainment', 'Movies, music, games, and entertainment', '#8B5CF6'),
    ('Food & Drink', 'Culinary preferences and recommendations', '#F59E0B'),
    ('Sports', 'Sports and fitness related polls', '#10B981'),
    ('Education', 'Learning and educational topics', '#EF4444')
ON CONFLICT (name) DO NOTHING;

-- =====================================================
-- SECURITY NOTES
-- =====================================================
/*
1. RLS policies ensure users can only:
   - View their own and public data appropriately
   - Create/update/delete only their own content
   - Vote only on active, non-expired polls

2. Triggers prevent:
   - Voting on inactive/expired polls
   - Multiple votes (when not allowed)
   - Invalid data through constraints

3. Functions provide:
   - Automatic user profile creation
   - Safe poll result calculations
   - Efficient vote checking

4. Indexes ensure:
   - Fast queries on common operations
   - Full-text search capabilities
   - Optimal join performance

5. Views provide:
   - Pre-calculated statistics
   - Simplified complex queries
   - Consistent data access patterns
*/
