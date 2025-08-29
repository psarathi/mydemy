# PM2 Deployment Guide for Mydemy

This guide explains how to deploy and manage the Mydemy application using PM2.

## Prerequisites

- Node.js and npm installed on the server
- PM2 installed globally: `npm install -g pm2`
- Git access to the repository

## Configuration

### 1. Update ecosystem.config.js

Before deploying, update the following values in `ecosystem.config.js`:

#### Application Settings:
```javascript
cwd: '/path/to/your/mydemy', // Update to actual server path
```

#### Production Environment Variables:
```javascript
env_production: {
  BASE_CDN_PATH: 'http://your-production-server.com:5555', // Your CDN URL
  COURSES_FOLDER: '/var/www/courses', // Path to course videos on server
  KAFKA_SERVER: 'your-kafka-server.com', // Kafka server hostname
}
```

#### Deployment Settings:
```javascript
production: {
  user: 'your-username', // SSH username for server
  host: 'your-server.com', // Server hostname/IP
  path: '/var/www/mydemy', // Deployment directory on server
}
```

## Deployment Commands

### Initial Setup (First Time)
```bash
# Setup deployment directory on server
pm2 deploy ecosystem.config.js production setup

# Deploy to production
pm2 deploy ecosystem.config.js production
```

### Regular Deployments
```bash
# Deploy latest changes
pm2 deploy ecosystem.config.js production

# Deploy specific branch/commit
pm2 deploy ecosystem.config.js production --ref origin/feature-branch
```

### Direct Server Management

If you prefer to manage directly on the server:

```bash
# Start the application in production mode
pm2 start ecosystem.config.js --env production

# Restart the application
pm2 restart mydemy

# Stop the application
pm2 stop mydemy

# View logs
pm2 logs mydemy

# Monitor application
pm2 monit

# Reload with zero downtime
pm2 reload mydemy
```

## Environment-Specific Commands

### Production
```bash
pm2 start ecosystem.config.js --env production
```

### Staging
```bash
pm2 start ecosystem.config.js --env staging
```

### Development
```bash
pm2 start ecosystem.config.js --env development
```

## Monitoring and Management

### View Application Status
```bash
pm2 status
pm2 list
```

### View Logs
```bash
# All logs
pm2 logs

# Specific app logs
pm2 logs mydemy

# Real-time logs
pm2 logs mydemy --lines 50 -f
```

### Performance Monitoring
```bash
# Basic monitoring
pm2 monit

# Web-based monitoring (optional)
pm2 web
```

## Auto-Startup

To ensure PM2 starts on server boot:

```bash
# Generate startup script
pm2 startup

# Save current process list
pm2 save
```

## Troubleshooting

### Check Application Health
```bash
pm2 status mydemy
pm2 logs mydemy --lines 100
```

### Common Issues
1. **Port already in use**: Check if another process is using port 3000
2. **File permissions**: Ensure PM2 has access to course folders
3. **Environment variables**: Verify paths exist and are accessible

### Restart Services
```bash
# Restart application
pm2 restart mydemy

# Reload with zero downtime
pm2 reload mydemy

# Delete and restart
pm2 delete mydemy
pm2 start ecosystem.config.js --env production
```

## Configuration Templates

### Basic Server Setup
```bash
# Install dependencies
npm install

# Build Next.js application
npm run build

# Start with PM2
pm2 start ecosystem.config.js --env production
```

### Update Process
```bash
# Pull latest code
git pull origin main

# Install new dependencies
npm install

# Rebuild application
npm run build

# Reload PM2 process
pm2 reload mydemy
```