# Supabase Database Setup

This directory contains the database schema and setup instructions for the Polls application using Supabase as the backend.

## 📋 Prerequisites

1. **Supabase Account**: Create a free account at [supabase.com](https://supabase.com)
2. **Supabase CLI**: Install the Supabase CLI tool
   ```bash
   npm install -g supabase
   ```
3. **Node.js**: Version 16 or higher

## 🚀 Quick Setup

### 1. Create a New Supabase Project

1. Go to [supabase.com/dashboard](https://supabase.com/dashboard)
2. Click "New Project"
3. Choose your organization
4. Fill in project details:
   - **Name**: `polls-app` (or your preferred name)
   - **Database Password**: Use a strong password (save this!)
   - **Region**: Choose closest to your users
5. Wait for project creation (usually 2-3 minutes)

### 2. Get Your Project Credentials

From your Supabase project dashboard, go to **Settings → API**:

- **Project URL**: `https://xxxxxxxxxxxxx.supabase.co`
- **Anon Key**: `eyJhbGciOiJIUzI1NiIsI...` (public key)
- **Service Role Key**: `eyJhbGciOiJIUzI1NiIsI...` (secret key)

### 3. Setup Environment Variables

Create or update your `.env.local` file in the project root:

```bash
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key-here
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key-here

# Optional: For local development
SUPABASE_PROJECT_ID=your-project-ref
```

### 4. Run Database Schema

#### Option A: Using Supabase Dashboard (Recommended for beginners)

1. Open your Supabase project dashboard
2. Go to **SQL Editor**
3. Click "New Query"
4. Copy and paste the entire content of `schema.sql`
5. Click "Run" to execute

#### Option B: Using Supabase CLI (Recommended for developers)

1. Initialize Supabase in your project:
   ```bash
   cd polls
   supabase init
   ```

2. Link to your remote project:
   ```bash
   supabase link --project-ref your-project-ref
   ```

3. Push the migration:
   ```bash
   supabase db push
   ```

### 5. Verify Setup

After running the schema, verify your setup:

1. **Check Tables**: In Supabase Dashboard → Table Editor, you should see:
   - `users`
   - `polls`
   - `poll_options`
   - `votes`
   - `poll_categories`

2. **Check Policies**: In Authentication → Policies, verify RLS policies are created

3. **Test Connection**: Run your Next.js app and try signing up/in

## 🗄️ Database Schema Overview

### Core Tables

#### `users`
Extends Supabase auth.users with profile information
```sql
- id (UUID, PK, references auth.users)
- email (TEXT, UNIQUE)
- name (TEXT)
- avatar_url (TEXT, optional)
- bio (TEXT, optional)
- is_active (BOOLEAN)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `polls`
Main polls table
```sql
- id (UUID, PK)
- title (TEXT)
- description (TEXT, optional)
- creator_id (UUID, FK → users)
- is_active (BOOLEAN)
- allow_multiple_choices (BOOLEAN)
- expires_at (TIMESTAMPTZ, optional)
- category_id (UUID, FK → poll_categories, optional)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `poll_options`
Individual options for each poll
```sql
- id (UUID, PK)
- poll_id (UUID, FK → polls)
- text (TEXT)
- order (INTEGER)
- created_at, updated_at (TIMESTAMPTZ)
```

#### `votes`
Individual votes cast by users
```sql
- id (UUID, PK)
- user_id (UUID, FK → users)
- poll_id (UUID, FK → polls)
- option_id (UUID, FK → poll_options)
- created_at (TIMESTAMPTZ)
```

#### `poll_categories`
Optional categorization system
```sql
- id (UUID, PK)
- name (TEXT, UNIQUE)
- description (TEXT, optional)
- color (TEXT)
- is_active (BOOLEAN)
- created_at (TIMESTAMPTZ)
```

### Security Features

#### Row Level Security (RLS)
All tables have RLS enabled with policies that ensure:
- Users can only see public data or their own data
- Users can only modify their own content
- Votes are restricted to active, non-expired polls

#### Automatic Triggers
- **User Profile Creation**: Automatically creates user profile when someone signs up
- **Vote Validation**: Prevents invalid votes (expired polls, duplicate votes, etc.)
- **Updated At**: Automatically updates `updated_at` timestamps

#### Helper Functions
- `get_poll_results(poll_id)`: Get vote counts and percentages
- `user_has_voted(poll_id, user_id)`: Check if user voted
- `get_user_votes(poll_id, user_id)`: Get user's votes for a poll

## 🔧 Development Commands

### Local Development
```bash
# Start local Supabase (requires Docker)
supabase start

# Reset local database
supabase db reset

# Generate TypeScript types
supabase gen types typescript --local > types/supabase.ts
```

### Production Commands
```bash
# Push local changes to remote
supabase db push

# Pull remote changes to local
supabase db pull

# Create new migration
supabase migration new your_migration_name
```

## 🧪 Sample Data

The schema includes sample poll categories. To add test polls for development:

```sql
-- Insert test user (run after signing up)
INSERT INTO polls (title, description, creator_id, category_id) VALUES
(
    'Favorite Programming Language',
    'What is your favorite programming language for web development?',
    'your-user-id-here',
    (SELECT id FROM poll_categories WHERE name = 'Technology')
);

-- Get the poll ID and add options
INSERT INTO poll_options (poll_id, text, "order") VALUES
('poll-id-here', 'JavaScript', 0),
('poll-id-here', 'TypeScript', 1),
('poll-id-here', 'Python', 2),
('poll-id-here', 'Go', 3);
```

## 🔍 Troubleshooting

### Common Issues

#### 1. Authentication Error
```
Error: Invalid JWT
```
**Solution**: Check your `NEXT_PUBLIC_SUPABASE_ANON_KEY` in `.env.local`

#### 2. RLS Policy Error
```
Error: new row violates row-level security policy
```
**Solution**: Ensure user is authenticated and policies are correctly set

#### 3. Migration Failed
```
Error: relation "table_name" already exists
```
**Solution**: Reset database or check for existing tables

#### 4. Vote Validation Error
```
Error: Cannot vote on expired poll
```
**Solution**: This is expected behavior - the poll has expired

### Debug Commands

```bash
# Check Supabase status
supabase status

# View logs
supabase logs

# Check database connection
supabase db ping
```

## 📊 Performance Optimizations

The schema includes several optimizations:

1. **Indexes**: On frequently queried columns
2. **Views**: Pre-calculated statistics (`polls_with_stats`)
3. **Constraints**: Data validation at database level
4. **Triggers**: Automatic data maintenance

## 🔐 Security Best Practices

1. **Never expose service role key** in frontend code
2. **Use RLS policies** instead of bypassing security
3. **Validate data** both client-side and server-side
4. **Regular backups** of your Supabase project
5. **Monitor usage** in Supabase dashboard

## 🚀 Next Steps

After setting up the database:

1. Update your authentication hooks to use the new schema
2. Create API routes for poll operations
3. Implement real-time subscriptions for live vote updates
4. Add data validation in your TypeScript types
5. Set up automated backups

## 📞 Support

- **Supabase Docs**: [supabase.com/docs](https://supabase.com/docs)
- **Supabase Discord**: [discord.supabase.com](https://discord.supabase.com)
- **Issues**: Create an issue in this repository

---

**Note**: This schema is production-ready and includes all necessary security policies, constraints, and optimizations for a robust polling application.