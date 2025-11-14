# Deployment Guide

This document describes how to deploy the Mydemy application to a remote server.

## Overview

The deployment process consists of two scripts:

1. **`deploy.sh`** - Local deployment script that runs on the server
2. **`remote-deploy.sh`** - Remote deployment wrapper that SSHs into the server and executes `deploy.sh`

## Local Deployment (`deploy.sh`)

This script is executed on the server itself and performs the following steps:

1. Pulls the latest changes from `origin/main`
2. Installs dependencies (`npm install`)
3. Builds the project (`npm run build`)
4. Restarts the PM2 process
5. Displays PM2 status

### Usage

SSH into your server and run:

```bash
cd /path/to/mydemy
./deploy.sh
```

## Remote Deployment (`remote-deploy.sh`)

This script automates the deployment process by:

1. SSHing into the remote server
2. Navigating to the project directory
3. Executing the `deploy.sh` script remotely

### Prerequisites

- SSH access to the remote server
- The project already cloned on the remote server
- PM2 configured and running on the remote server
- `deploy.sh` present in the project directory

### Usage

```bash
./remote-deploy.sh [OPTIONS]
```

### Options

| Option | Description | Required | Default |
|--------|-------------|----------|---------|
| `-h, --host HOST` | SSH host (IP or domain) | Yes | - |
| `-u, --user USER` | SSH username | No | Current user |
| `-d, --dir DIRECTORY` | Project directory on remote server | Yes | - |
| `-p, --port PORT` | SSH port | No | 22 |
| `-s, --script SCRIPT` | Deploy script name | No | ./deploy.sh |
| `-k, --key KEY_FILE` | SSH private key file | No | Default SSH key |
| `--help` | Display help message | No | - |

### Examples

#### Basic deployment with password authentication
```bash
./remote-deploy.sh -h example.com -u deploy -d /var/www/mydemy
```

#### Deployment with SSH key
```bash
./remote-deploy.sh -h 192.168.1.10 -u ubuntu -d /home/ubuntu/mydemy -k ~/.ssh/id_rsa
```

#### Deployment with custom port
```bash
./remote-deploy.sh --host example.com --user deploy --dir /var/www/mydemy --port 2222
```

#### Deployment with all options
```bash
./remote-deploy.sh \
  --host myserver.com \
  --user deployer \
  --dir /var/www/mydemy \
  --port 22 \
  --key ~/.ssh/deploy_key \
  --script ./deploy.sh
```

## Deployment Process

When you run `remote-deploy.sh`, it will:

1. Display deployment configuration
2. Ask for confirmation
3. Test SSH connection
4. Verify remote directory exists
5. Verify deploy script exists
6. Execute the deployment remotely
7. Display deployment status

## Troubleshooting

### SSH Connection Failed

**Problem:** Cannot connect to the remote server

**Solutions:**
- Verify the host, user, and port are correct
- Check if SSH key has proper permissions (`chmod 600 ~/.ssh/id_rsa`)
- Ensure the server allows SSH connections from your IP
- Test manual SSH connection: `ssh -p PORT USER@HOST`

### Directory Not Found

**Problem:** Remote directory doesn't exist

**Solutions:**
- Verify the directory path is correct
- SSH into the server and create the directory
- Clone the repository to the server first

### Deploy Script Not Found

**Problem:** `deploy.sh` not found in remote directory

**Solutions:**
- Ensure `deploy.sh` exists in the project root
- Make sure the script has execute permissions: `chmod +x deploy.sh`
- Verify you're specifying the correct script path with `-s` option

### PM2 Process Not Found

**Problem:** PM2 can't find the 'mydemy' process

**Solutions:**
- Start the application manually first: `pm2 start npm --name mydemy -- start`
- Save the PM2 process list: `pm2 save`
- Setup PM2 startup: `pm2 startup`

### Build Failures

**Problem:** `npm run build` fails

**Solutions:**
- Check Node.js version compatibility
- Clear build cache: `rm -rf .next`
- Manually run build to see detailed errors: `npm run build`
- Check environment variables are set correctly

## Server Setup

### Initial Server Setup

1. **Install Node.js and npm**
   ```bash
   curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
   sudo apt-get install -y nodejs
   ```

2. **Install PM2**
   ```bash
   npm install -g pm2
   ```

3. **Clone the repository**
   ```bash
   git clone <repository-url> /path/to/mydemy
   cd /path/to/mydemy
   ```

4. **Install dependencies**
   ```bash
   npm install
   ```

5. **Build the project**
   ```bash
   npm run build
   ```

6. **Start with PM2**
   ```bash
   pm2 start npm --name mydemy -- start
   pm2 save
   pm2 startup
   ```

7. **Make deploy script executable**
   ```bash
   chmod +x deploy.sh
   ```

## CI/CD Integration

You can integrate `remote-deploy.sh` into your CI/CD pipeline:

### GitHub Actions Example

```yaml
name: Deploy to Production

on:
  push:
    branches: [ main ]

jobs:
  deploy:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2

      - name: Setup SSH Key
        run: |
          mkdir -p ~/.ssh
          echo "${{ secrets.SSH_PRIVATE_KEY }}" > ~/.ssh/deploy_key
          chmod 600 ~/.ssh/deploy_key

      - name: Deploy to Server
        run: |
          ./remote-deploy.sh \
            --host ${{ secrets.SERVER_HOST }} \
            --user ${{ secrets.SERVER_USER }} \
            --dir ${{ secrets.SERVER_DIR }} \
            --key ~/.ssh/deploy_key
```

## Security Best Practices

1. **Use SSH Keys**: Prefer SSH key authentication over passwords
2. **Restrict Key Permissions**: Ensure private keys have 600 permissions
3. **Use Deploy User**: Create a dedicated deployment user with limited privileges
4. **Firewall Rules**: Restrict SSH access to specific IP addresses
5. **Keep Keys Secure**: Never commit SSH keys to version control
6. **Use Environment Variables**: Store sensitive data in environment variables, not in code

## Maintenance

### Viewing Logs

```bash
ssh user@host "cd /path/to/mydemy && pm2 logs mydemy"
```

### Checking Status

```bash
ssh user@host "pm2 list"
```

### Restarting Without Deployment

```bash
ssh user@host "pm2 restart mydemy"
```

### Stopping the Application

```bash
ssh user@host "pm2 stop mydemy"
```
