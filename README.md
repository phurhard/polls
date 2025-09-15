# Polls App - Next.js 15 with Shadcn/ui

A modern, responsive polling application built with Next.js 15, TypeScript, Tailwind CSS, and Shadcn/ui components. This app allows users to create, manage, and participate in polls with real-time results.

## 🚀 Features

- **Authentication System**: Sign up, sign in, and user management
- **Poll Creation**: Create polls with multiple options and customizable settings
- **Poll Management**: Edit, delete, and manage your polls
- **Real-time Voting**: Vote on polls and see results update
- **Responsive Design**: Works seamlessly on desktop and mobile
- **Dark Mode Ready**: Built with Shadcn/ui for consistent theming

## 🛠 Tech Stack

- **Framework**: Next.js 15 with App Router
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/ui
- **Icons**: Radix UI icons
- **State Management**: React hooks and context
- **Form Handling**: React Hook Form

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

### Authentication

The app includes mock authentication for development:
- **Demo credentials**: `demo@example.com` / `password`
- Sign up with any email and password for testing
- Authentication state is managed with localStorage

### Managing Polls

- **Dashboard**: View and manage your created polls
- **Edit Polls**: Modify poll details and settings
- **Delete Polls**: Remove polls you no longer need
- **View Results**: See real-time voting results

## 🎨 UI Components

This project uses Shadcn/ui for consistent, accessible components:

- **Forms**: Input, Label, Button, Form validation
- **Layout**: Card, Badge, Navigation
- **Interactive**: Modal, Dropdown, Toast (when needed)

### Adding New Components

To add more Shadcn/ui components:

```bash
npx shadcn-ui@latest add [component-name]
```

## 🔧 Configuration

### Tailwind CSS

The project uses Tailwind CSS v4 with the following configuration:
- Custom color scheme
- Responsive breakpoints
- Dark mode support (ready)

### TypeScript

Strong typing is enforced throughout:
- Custom types in `/types/index.ts`
- API response types
- Component prop types

## 🚧 Development Notes

### Current State

This is a **scaffold/starter project** with:
- ✅ Complete UI components and layouts
- ✅ Mock authentication system
- ✅ Placeholder API endpoints
- ✅ Type definitions
- ✅ Responsive design
- ⚠️ Mock data (replace with real database)
- ⚠️ Placeholder API calls (implement backend)

### Next Steps

1. **Database Integration**
   - Set up database (PostgreSQL, MongoDB, etc.)
   - Implement data models
   - Replace mock data with real queries

2. **Authentication**
   - Integrate with auth provider (NextAuth.js, Auth0, etc.)
   - Implement JWT tokens
   - Add protected routes middleware

3. **API Implementation**
   - Replace placeholder API routes
   - Add validation and error handling
   - Implement rate limiting

4. **Real-time Features**
   - Add WebSocket support for live updates
   - Implement real-time vote counting
   - Live poll results

5. **Additional Features**
   - Poll sharing and embedding
   - Poll analytics and insights
   - User profiles and settings
   - Poll categories and tags

## 📚 API Endpoints

### Authentication
- `POST /api/auth/signin` - User sign in
- `POST /api/auth/signup` - User registration
- `POST /api/auth/signout` - User sign out
- `GET /api/auth/me` - Get current user

### Polls
- `GET /api/polls` - List all polls
- `POST /api/polls/create` - Create new poll
- `GET /api/polls/[id]` - Get specific poll
- `PUT /api/polls/[id]` - Update poll
- `DELETE /api/polls/[id]` - Delete poll
- `POST /api/polls/[id]/vote` - Vote on poll

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- [Next.js](https://nextjs.org/) for the amazing framework
- [Shadcn/ui](https://ui.shadcn.com/) for beautiful components
- [Tailwind CSS](https://tailwindcss.com/) for utility-first styling
- [Radix UI](https://www.radix-ui.com/) for accessible primitives

---

**Note**: This is a development scaffold. Remember to implement proper authentication, database integration, and security measures before deploying to production.