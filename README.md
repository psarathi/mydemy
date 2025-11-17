# Mydemy

A modern video course learning platform built with Next.js and React, featuring a desktop application powered by Tauri. Mydemy provides a seamless experience for browsing and watching educational video courses with an intuitive interface and powerful features.

## What is Mydemy?

Mydemy is a self-hosted video learning platform that allows you to organize and watch your educational video content. It automatically scans your video library, organizes courses by topics, and provides a modern video player with features like subtitles, autoplay, and playback speed control.

### Key Features

- **Course Management**: Automatically discovers and organizes video courses from your local file system
- **Modern Video Player**: Custom video player with:
  - Subtitle support (.vtt files)
  - Playback speed control
  - Autoplay functionality
  - Keyboard shortcuts
  - Picture-in-Picture mode
- **Real-time Updates**: Server-Sent Events (SSE) for live course catalog updates
- **User Authentication**: Secure authentication with NextAuth
- **Course Tracking**: Automatically tracks viewing history and progress
- **Search & Filter**: Search courses and filter by tags
- **Favorites**: Bookmark your favorite courses for quick access
- **Dark Mode**: Built-in theme toggle for comfortable viewing
- **Desktop App**: Native desktop application for macOS (powered by Tauri)
- **Responsive Design**: Works seamlessly on desktop and mobile devices

## Tech Stack

- **Frontend**: React 18, Next.js 15
- **Desktop**: Tauri 2.x (macOS support)
- **Authentication**: NextAuth.js
- **Data Fetching**: SWR for efficient data synchronization
- **Real-time Updates**: Server-Sent Events (SSE) with Kafka integration
- **Testing**: Jest with React Testing Library
- **Styling**: CSS Modules

## Prerequisites

Before setting up Mydemy, ensure you have the following installed:

- **Node.js**: Version 16.x or higher
- **npm** or **yarn**: Package manager
- **Rust** (optional): Required only for building the Tauri desktop app
  - Install from [rustup.rs](https://rustup.rs/)

## Installation & Setup

### 1. Clone the Repository

```bash
git clone <repository-url>
cd mydemy
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Configuration

Create a `.env.local` file in the root directory (or copy from `.env.example`):

```bash
cp .env.example .env.local
```

Configure the following environment variables:

```env
# CDN Base Path - URL where video content is served from
NEXT_PUBLIC_BASE_CDN_PATH=http://localhost:5555

# Courses Folder - Local filesystem path where course videos are stored
COURSES_FOLDER=/path/to/your/video/courses

# Kafka Configuration (optional - for real-time updates)
KAFKA_SERVER=localhost
KAFKA_SERVER_PORT=9092
```

**Important**:
- `NEXT_PUBLIC_BASE_CDN_PATH`: This is the URL where your video files are accessible (e.g., via a file server)
- `COURSES_FOLDER`: Local path to the directory containing your course videos

### 4. Course Folder Structure

Organize your video courses in the following structure:

```
COURSES_FOLDER/
├── Course Name 1/
│   ├── Topic 1/
│   │   ├── Lesson 1.mp4
│   │   ├── Lesson 1.vtt (optional subtitles)
│   │   └── Lesson 2.mp4
│   └── Topic 2/
│       └── Lesson 3.mp4
└── Course Name 2/
    └── Introduction.mp4
```

The application will automatically scan this folder and generate a course catalog.

### 5. Set Up a File Server (for video streaming)

You need a file server to serve your video files. You can use:

**Option 1: Simple HTTP Server**
```bash
cd $COURSES_FOLDER
python3 -m http.server 5555
```

**Option 2: Nginx or Apache**
Configure a web server to serve files from `COURSES_FOLDER`

**Option 3: CDN**
Upload videos to a CDN and update `NEXT_PUBLIC_BASE_CDN_PATH`

## Running the Application

### Web Application (Development)

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Web Application (Production)

```bash
npm run build
npm start
```

The production server runs on port 4000 by default.

### Desktop Application (Tauri)

**Development mode:**
```bash
npm run tauri:dev
```

**Build for production:**
```bash
# macOS (Apple Silicon)
npm run tauri:build:mac

# All platforms
npm run tauri:build
```

The built application will be available in `src-tauri/target/release/`.

## Testing

Run the test suite:

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

## Project Structure

```
mydemy/
├── components/          # React components
│   ├── common/         # Reusable UI components
│   ├── layout/         # Layout components
│   └── player/         # Video player components
├── pages/              # Next.js pages and API routes
│   ├── api/           # API endpoints
│   ├── auth/          # Authentication pages
│   ├── [courseName].js # Dynamic course page
│   └── index.js       # Home page
├── hooks/              # Custom React hooks
├── utils/              # Utility functions
├── styles/             # CSS modules and global styles
├── src-tauri/          # Tauri desktop app configuration
├── constants.js        # Application constants
└── courses.json        # Generated course catalog
```

## Available Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start development server |
| `npm run build` | Build for production |
| `npm start` | Start production server (port 4000) |
| `npm run lint` | Run ESLint |
| `npm test` | Run Jest tests |
| `npm run test:watch` | Run tests in watch mode |
| `npm run tauri:dev` | Start Tauri desktop app in dev mode |
| `npm run tauri:build` | Build Tauri desktop app |
| `npm run tauri:build:mac` | Build for macOS (Apple Silicon) |

## Features in Detail

### Authentication
- User authentication powered by NextAuth
- Support for multiple authentication providers
- Session management

### Course Discovery
- Automatically scans the configured `COURSES_FOLDER`
- Generates course metadata at build time
- Supports real-time updates via Kafka/SSE

### Video Player
- HTML5 video player with custom controls
- Subtitle support (WebVTT format)
- Playback speed adjustment (0.5x - 2x)
- Keyboard shortcuts for common actions
- Automatic progression to next video
- Countdown timer for autoplay

### Real-time Updates
- Server-Sent Events for instant notifications
- Kafka integration for distributed systems
- Automatic course list refresh on new content

## Configuration

### Kafka (Optional)
For real-time course updates across multiple instances, configure Kafka:

```env
KAFKA_SERVER=your-kafka-server
KAFKA_SERVER_PORT=9092
```

### Tauri Desktop App
Desktop app settings are configured in `src-tauri/tauri.conf.json`:
- Window dimensions: 1400x900 (min: 1024x768)
- Auto-updater support
- macOS minimum version: 10.13

## Troubleshooting

### Videos not loading
- Verify `NEXT_PUBLIC_BASE_CDN_PATH` is correct and accessible
- Ensure your file server is running
- Check CORS settings if videos are on a different domain

### Course catalog empty
- Verify `COURSES_FOLDER` path is correct
- Run `node fetchCoursesScript.js` manually to regenerate the catalog
- Check console for errors during build

### Desktop app build fails
- Ensure Rust is installed: `rustup --version`
- Update Tauri CLI: `npm install -g @tauri-apps/cli@latest`
- Check Tauri prerequisites: [Tauri Docs](https://tauri.app/v1/guides/getting-started/prerequisites)

## Contributing

Contributions are welcome! Please follow these guidelines:
1. Fork the repository
2. Create a feature branch
3. Make your changes with tests
4. Submit a pull request

## License

This project is private and proprietary.

## Support

For issues and questions, please open an issue on the repository.
