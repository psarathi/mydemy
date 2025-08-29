module.exports = {
  apps: [
    {
      name: 'mydemy',
      script: 'npm',
      args: 'start',
      cwd: '/path/to/your/mydemy', // Update this to your actual server path
      instances: 1,
      autorestart: true,
      watch: false,
      max_memory_restart: '1G',
      env: {
        NODE_ENV: 'development',
        PORT: 3000,
        NEXT_PUBLIC_BASE_CDN_PATH: 'http://192.168.1.141:5555',
        COURSES_FOLDER: '/Volumes/medianas/Videos',
        KAFKA_SERVER: '192.168.1.141',
        KAFKA_SERVER_PORT: '9092'
      },
      env_production: {
        NODE_ENV: 'production',
        PORT: 3000,
        NEXT_PUBLIC_BASE_CDN_PATH: 'http://your-production-server.com:5555', // Update with production CDN URL
        COURSES_FOLDER: '/var/www/courses', // Update with production courses path
        KAFKA_SERVER: 'your-kafka-server.com', // Update with production Kafka server
        KAFKA_SERVER_PORT: '9092'
      },
      env_staging: {
        NODE_ENV: 'staging',
        PORT: 3001,
        NEXT_PUBLIC_BASE_CDN_PATH: 'http://staging-server.com:5555', // Update with staging CDN URL
        COURSES_FOLDER: '/var/staging/courses', // Update with staging courses path
        KAFKA_SERVER: 'staging-kafka-server.com', // Update with staging Kafka server
        KAFKA_SERVER_PORT: '9092'
      }
    }
  ],

  deploy: {
    production: {
      user: 'your-username', // Update with your server username
      host: 'your-server.com', // Update with your server hostname/IP
      ref: 'origin/main',
      repo: 'git@github.com:psarathi/mydemy.git', // Your repository URL
      path: '/var/www/mydemy', // Update with your deployment path
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env production',
      'pre-setup': ''
    },
    staging: {
      user: 'your-username', // Update with your server username
      host: 'staging-server.com', // Update with your staging server hostname/IP
      ref: 'origin/develop', // or whatever branch you use for staging
      repo: 'git@github.com:psarathi/mydemy.git',
      path: '/var/staging/mydemy', // Update with your staging deployment path
      'pre-deploy-local': '',
      'post-deploy': 'npm install && npm run build && pm2 reload ecosystem.config.js --env staging',
      'pre-setup': ''
    }
  }
};