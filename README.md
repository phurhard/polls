# Polls App - Next.js 15 with Shadcn/ui

A modern, responsive polling application built with Next.js 15, TypeScript, Tailwind CSS, and Shadcn/ui components. This app allows users to create, manage, and participate in polls with real-time results.

## How AI is used
AI is used to generate and to scaffold the project structures, components, and API routes. IT is used to generate code for the authentication system, poll creation, management, and real-time voting features.
AI is also used to generate documentation and test cases for the application.

## 🚀 Features

- **Authentication System**: Sign up, sign in, and user management
- **Poll Creation**: Create polls with multiple options and customizable settings
- **Poll Management**: Edit, delete, and manage your polls
- **Real-time Voting**: Vote on polls and see results update
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Mode Ready**: Built with Shadcn/ui for consistent theming
- **Accessibility**: Built with accessibility in mind
- **SEO**: Built with SEO in mind

## 🔧 What This Upgrade Adds (MVP)
- Database-side transactions via Supabase RPCs:
  - create_poll_tx: atomic poll + options creation under RLS
  - cast_vote_tx: server-validated voting (active/expired/multi-choice) under RLS
- Faster, fewer DB roundtrips:
  - Poll listings batch-load options and user votes (avoids N+1)
  - API routes call RPCs instead of multiple client-side statements
- Cloudflare R2 + Tus uploads scaffold:
  - /uploads proxy, docker-compose for tusd, envs and docs for resumable uploads
- Files table with RLS to track uploaded objects securely
- Types extended for RPCs/files to improve DX and future removal of @ts-nocheck

See docs/IMPROVEMENTS_AT_A_GLANCE.md for a quick overview and docs/MVP_IMPROVEMENTS.md for details.

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Icons**: Radix UI icons
- **State Management**: React hooks and context
- **Form Handling**: React Hook Form
- **Vercel SDK**: Make use of the ai sdk for interacting with AI models
- **Database** Supabase used for storing data and authentication
- **AI** OpenAI used for generating content and code

## 📁 Project Structure

```
polls/
├── app/                          # Next.js App Router
│   ├── api/                      # API routes
│   │   ├── auth/                 # Authentication endpoints
│   │   └── polls/                # Poll-related endpoints
│   ├── auth/                     # Authentication pages
│   │   ├── signin/              # Sign in page
│   │   └── signup/              # Sign up page
│   ├── polls/                    # Poll-related pages
│   │   ├── create/              # Create poll page
│   │   ├── [id]/                # Individual poll page
│   │   └── page.tsx             # All polls listing
│   ├── dashboard/               # User dashboard
│   ├── globals.css              # Global styles
│   ├── layout.tsx               # Root layout
│   └── page.tsx                 # Landing page
├── components/                   # Reusable components
│   ├── ui/                      # Shadcn/ui components
│   │   ├── button.tsx
│   │   ├── card.tsx
│   │   ├── input.tsx
│   │   ├── label.tsx
│   │   ├── form.tsx
│   │   └── badge.tsx
│   ├── auth/                    # Authentication components
│   │   ├── signin-form.tsx
│   │   └── signup-form.tsx
│   ├── polls/                   # Poll-related components
│   │   ├── poll-card.tsx
│   │   └── create-poll-form.tsx
│   └── navigation.tsx           # Main navigation
├── hooks/                       # Custom React hooks
│   └── useAuth.tsx             # Authentication hook
├── lib/                         # Utility libraries
│   └── utils.ts                # Utility functions
├── types/                       # TypeScript type definitions
│   └── index.ts                # Main types
├── components.json              # Shadcn/ui configuration
├── package.json
├── tailwind.config.js
├── tsconfig.json
└── README.md
```

## 🏃‍♂️ Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm

### Installation

1. **Clone the repository**
   ```bash
   git clone <your-repo-url>
   cd polls
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   ```

3. **Run the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   ```

4. **Open your browser**
   Navigate to [http://localhost:3000](http://localhost:3000)

## 📝 Usage

### Creating Your First Poll

1. Navigate to the home page
2. Click "Create New Poll" or go to `/polls/create`
3. Fill in the poll details:
   - Title (required)
   - Description (optional)
   - Poll options (minimum 2, maximum 10)
   - Settings (multiple choice, expiry date)
4. Click "Create Poll"
