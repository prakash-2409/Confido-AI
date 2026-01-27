# CareerAI Frontend

Modern Next.js frontend for the Career AI SaaS platform.

## 🚀 Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS
- **UI Components**: Shadcn/UI
- **HTTP Client**: Axios
- **Icons**: Lucide React

## 📁 Project Structure

```
frontend/
├── src/
│   ├── app/                    # Next.js App Router pages
│   │   ├── page.tsx           # Landing page
│   │   ├── login/             # Login page
│   │   ├── register/          # Registration page
│   │   └── dashboard/         # Protected dashboard
│   │       ├── page.tsx       # Main dashboard
│   │       ├── resume/        # Resume analysis
│   │       ├── interview/     # Interview practice
│   │       └── profile/       # User profile
│   ├── components/            # React components
│   │   ├── ui/               # Shadcn UI components
│   │   ├── Sidebar.tsx       # Dashboard navigation
│   │   ├── ScoreGauge.tsx    # ATS score visualization
│   │   ├── KeywordList.tsx   # Keyword display
│   │   └── ProtectedRoute.tsx
│   ├── contexts/             # React contexts
│   │   └── AuthContext.tsx   # Auth state management
│   ├── lib/                  # Utilities
│   │   ├── api.ts           # Axios API client
│   │   └── utils.ts         # Helper functions
│   └── hooks/               # Custom hooks
├── .env.local               # Environment variables
└── package.json
```

## 🛠️ Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Backend API running on port 5000
- MongoDB running

### Installation

```bash
# Navigate to frontend directory
cd frontend

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:3000`

### Environment Variables

Create a `.env.local` file:

```env
NEXT_PUBLIC_API_URL=http://localhost:5000/api/v1
```

## 📱 Features

### 1. Landing Page (`/`)
- Hero section with value proposition
- Feature highlights
- Call-to-action buttons

### 2. Authentication
- **Login** (`/login`) - Email/password authentication
- **Register** (`/register`) - New user signup
- JWT token management with automatic refresh

### 3. Dashboard (`/dashboard`)
- Overview of ATS score
- Quick stats (resumes uploaded, profile completion)
- Recent activity
- Quick action cards

### 4. Resume Analysis (`/dashboard/resume`)
- Drag & drop file upload (PDF/DOCX)
- Job description input
- ATS compatibility scoring
- Matched vs. missing keywords
- Actionable improvement tips

### 5. Interview Practice (`/dashboard/interview`)
- Create practice sessions
- Role-specific questions
- Text-based answer input
- AI-powered feedback
- Progress tracking

### 6. Profile (`/dashboard/profile`)
- Personal information management
- Career goals (current/target role)
- Profile completion tracking

## 🔧 Development

```bash
# Run development server
npm run dev

# Build for production
npm run build

# Run production build
npm start

# Lint code
npm run lint
```

## 🎨 UI Components

Using Shadcn/UI for consistent, accessible components:
- Button, Card, Input, Label
- Progress, Badge, Avatar
- Toast notifications (Sonner)
- Dropdown menus, Sheets

## 🔒 Authentication Flow

1. User logs in → Receives access + refresh tokens
2. Access token stored in memory
3. Refresh token stored in localStorage
4. Axios interceptor handles token refresh on 401
5. Protected routes redirect to login if not authenticated

## 📝 API Integration

All API calls go through the centralized Axios client (`src/lib/api.ts`) which handles:
- Base URL configuration
- Token injection in headers
- Automatic token refresh
- Error handling

---

Built with ❤️ for job seekers
