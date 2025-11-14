# Mydemy - Video Course Learning Platform

A full-stack Next.js application for managing and viewing video courses, similar to Udemy. Features real-time updates via Kafka, course favorites, tagging system, and view history tracking.

## Features

- 📚 **Course Management** - Browse and search video courses with topics and lessons
- ⭐ **Favorites System** - Mark courses as favorites for quick access
- 🏷️ **Course Tagging** - Add custom tags to courses for organization
- 🕐 **View History** - Track recently viewed courses
- 🔍 **Advanced Search** - Search courses with exact match and lesson search options
- 🌓 **Dark Mode** - System-aware theme with manual toggle
- 🔐 **Authentication** - NextAuth integration with Google and GitHub providers
- 📡 **Real-time Updates** - Server-Sent Events (SSE) powered by Kafka
- 📱 **Responsive Design** - Mobile-friendly hamburger menu and layouts

## Tech Stack

- **Framework**: Next.js 15 with React 18
- **Authentication**: NextAuth.js
- **Data Fetching**: SWR for client-side caching
- **Messaging**: Apache Kafka for real-time updates
- **Testing**: Jest with React Testing Library
- **Code Quality**: ESLint + Prettier
- **Deployment**: PM2 for production

## Project Structure

```
mydemy/
├── components/          # React components
│   ├── common/         # Reusable UI components
│   ├── layout/         # Layout components
│   └── player/         # Video player components
├── contexts/           # React Context providers
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
│   ├── constants.js    # App-wide constants
│   ├── env.js         # Environment validation
│   ├── courses/       # Course-related utilities
│   ├── kafka/         # Kafka handlers
│   ├── tags/          # Tagging utilities
│   └── tracking/      # Course tracking utilities
├── pages/              # Next.js pages & API routes
│   ├── api/           # API endpoints
│   ├── auth/          # Auth pages
│   └── [courseName].js # Dynamic course pages
├── public/             # Static assets
├── styles/             # CSS files
└── __tests__/         # Test files

```

## Getting Started

### Prerequisites

- Node.js 18+
- npm or yarn
- Apache Kafka (optional, for real-time updates)
- Video course files directory

### Installation

1. Clone the repository:
```bash
git clone <repository-url>
cd mydemy
```

2. Install dependencies:
```bash
npm install
```

3. Configure environment variables:
```bash
cp .env.example .env.local
```

Edit `.env.local` with your configuration:

```env
# Required for production
NEXTAUTH_SECRET=your-secret-here
NEXTAUTH_URL=http://localhost:3000

# OAuth Providers (optional)
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret
GITHUB_ID=your-github-id
GITHUB_SECRET=your-github-secret

# Course storage (defaults provided)
COURSES_FOLDER=/path/to/video/courses
NEXT_PUBLIC_BASE_CDN_PATH=http://localhost:5555

# Kafka (optional, has defaults)
KAFKA_SERVER=localhost
KAFKA_SERVER_PORT=9092
```

### Development

Run the development server:
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Building for Production

1. Fetch courses and build:
```bash
npm run build
```

2. Start production server:
```bash
npm start
```

The app will run on [http://localhost:4000](http://localhost:4000).

## Scripts

- `npm run dev` - Start development server
- `npm run build` - Fetch courses and build for production
- `npm start` - Start production server (port 4000)
- `npm run lint` - Run ESLint
- `npm test` - Run Jest tests
- `npm run test:watch` - Run tests in watch mode

## Environment Variables

### Required in Production

- `NEXTAUTH_SECRET` - Secret for NextAuth session encryption

### Optional (with defaults)

- `COURSES_FOLDER` - Path to video courses directory
- `NEXT_PUBLIC_BASE_CDN_PATH` - Base URL for video CDN
- `KAFKA_SERVER` - Kafka broker host
- `KAFKA_SERVER_PORT` - Kafka broker port

### OAuth (optional)

Configure at least one OAuth provider for authentication:
- Google: `GOOGLE_CLIENT_ID`, `GOOGLE_CLIENT_SECRET`
- GitHub: `GITHUB_ID`, `GITHUB_SECRET`

## Path Aliases

The project uses path aliases for cleaner imports:

```javascript
import Component from '@/components/Component'
import { utility } from '@/lib/utility'
import useCourses from '@/hooks/useCourses'
import { ThemeContext } from '@/contexts/ThemeContext'
```

Available aliases:
- `@/components/*` - Components directory
- `@/lib/*` - Library utilities
- `@/hooks/*` - Custom hooks
- `@/contexts/*` - React contexts
- `@/pages/*` - Pages directory
- `@/styles/*` - Styles directory

## Testing

Run all tests:
```bash
npm test
```

Run tests in watch mode:
```bash
npm run test:watch
```

Coverage is collected for:
- `components/**/*.{js,jsx}`
- `lib/**/*.{js,jsx}`
- `hooks/**/*.{js,jsx}`
- `contexts/**/*.{js,jsx}`

## Deployment

### PM2 Deployment

The project includes PM2 configuration for production deployment:

```bash
# Using local deploy script
./deploy.sh

# Using remote deploy script
./remote-deploy.sh
```

See `DEPLOYMENT.md` and `PM2_DEPLOYMENT.md` for detailed deployment instructions.

### Vercel Deployment

The app can also be deployed to Vercel:

1. Push to GitHub
2. Import project in Vercel
3. Configure environment variables
4. Deploy

## Architecture

### Data Flow

1. **Course Fetching**: `fetchCoursesScript.js` scans video directory and generates `courses.json`
2. **Real-time Updates**: Kafka consumer listens for new uploads and triggers course refresh
3. **Client Updates**: SSE endpoint streams updates to connected clients
4. **State Management**: SWR handles client-side caching and revalidation

### Key Components

- **Landing** - Main course listing with search and filters
- **VideoPlayer** - Video playback with playlist navigation
- **HamburgerMenu** - Mobile-friendly navigation with favorites and history
- **ErrorBoundary** - Catches React errors and displays fallback UI

### API Routes

- `/api/courses` - Returns course listings
- `/api/serverNotifier` - SSE endpoint for real-time updates
- `/api/auth/[...nextauth]` - NextAuth authentication

## Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue on GitHub.
