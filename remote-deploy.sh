#!/bin/bash

# Remote Deployment Script for Mydemy
# This script SSHs into a server and runs the deployment script

set -e  # Exit immediately if a command exits with a non-zero status

# Color codes for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Default values
DEPLOY_SCRIPT="./deploy.sh"
SSH_PORT=22

# Function to display usage
usage() {
    echo -e "${BLUE}Usage:${NC} $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST          SSH host (required)"
    echo "  -u, --user USER          SSH user (default: current user)"
    echo "  -d, --dir DIRECTORY      Project directory on remote server (required)"
    echo "  -p, --port PORT          SSH port (default: 22)"
    echo "  -s, --script SCRIPT      Deploy script name (default: ./deploy.sh)"
    echo "  -k, --key KEY_FILE       SSH private key file"
    echo "  --help                   Display this help message"
    echo ""
    echo "Examples:"
    echo "  $0 -h example.com -u deploy -d /var/www/mydemy"
    echo "  $0 -h 192.168.1.10 -u ubuntu -d /home/ubuntu/mydemy -k ~/.ssh/id_rsa"
    echo "  $0 --host example.com --user deploy --dir /var/www/mydemy --port 2222"
    exit 1
}

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    case $1 in
        -h|--host)
            SSH_HOST="$2"
            shift 2
            ;;
        -u|--user)
            SSH_USER="$2"
            shift 2
            ;;
        -d|--dir)
            REMOTE_DIR="$2"
            shift 2
            ;;
        -p|--port)
            SSH_PORT="$2"
            shift 2
            ;;
        -s|--script)
            DEPLOY_SCRIPT="$2"
            shift 2
            ;;
        -k|--key)
            SSH_KEY="$2"
            shift 2
            ;;
        --help)
            usage
            ;;
        *)
            echo -e "${RED}Error: Unknown option $1${NC}"
            usage
            ;;
    esac
done

# Validate required arguments
if [ -z "$SSH_HOST" ]; then
    echo -e "${RED}Error: SSH host is required${NC}"
    usage
fi

if [ -z "$REMOTE_DIR" ]; then
    echo -e "${RED}Error: Remote directory is required${NC}"
    usage
fi

# Set default user if not provided
if [ -z "$SSH_USER" ]; then
    SSH_USER=$(whoami)
fi

# Build SSH command
SSH_CMD="ssh -p $SSH_PORT"
if [ -n "$SSH_KEY" ]; then
    SSH_CMD="$SSH_CMD -i $SSH_KEY"
fi
SSH_CMD="$SSH_CMD ${SSH_USER}@${SSH_HOST}"

# Display deployment information
echo -e "${BLUE}╔════════════════════════════════════════════╗${NC}"
echo -e "${BLUE}║     Remote Deployment for Mydemy          ║${NC}"
echo -e "${BLUE}╚════════════════════════════════════════════╝${NC}"
echo ""
echo -e "${YELLOW}Deployment Configuration:${NC}"
echo -e "  Server:     ${GREEN}${SSH_USER}@${SSH_HOST}:${SSH_PORT}${NC}"
echo -e "  Directory:  ${GREEN}${REMOTE_DIR}${NC}"
echo -e "  Script:     ${GREEN}${DEPLOY_SCRIPT}${NC}"
if [ -n "$SSH_KEY" ]; then
    echo -e "  SSH Key:    ${GREEN}${SSH_KEY}${NC}"
fi
echo ""

# Confirm before proceeding
read -p "$(echo -e ${YELLOW}Do you want to proceed with deployment? [y/N]:${NC} )" -n 1 -r
echo ""
if [[ ! $REPLY =~ ^[Yy]$ ]]; then
    echo -e "${RED}Deployment cancelled${NC}"
    exit 0
fi
echo ""

# Test SSH connection
echo -e "${BLUE}🔌 Testing SSH connection...${NC}"
if ! $SSH_CMD "echo 'SSH connection successful'" > /dev/null 2>&1; then
    echo -e "${RED}❌ Failed to connect to ${SSH_HOST}${NC}"
    echo -e "${RED}Please check your SSH credentials and try again${NC}"
    exit 1
fi
echo -e "${GREEN}✅ SSH connection established${NC}"
echo ""

# Check if directory exists
echo -e "${BLUE}📂 Checking remote directory...${NC}"
if ! $SSH_CMD "[ -d '$REMOTE_DIR' ]"; then
    echo -e "${RED}❌ Directory '$REMOTE_DIR' does not exist on remote server${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Remote directory found${NC}"
echo ""

# Check if deploy script exists
echo -e "${BLUE}📜 Checking deploy script...${NC}"
if ! $SSH_CMD "[ -f '$REMOTE_DIR/$DEPLOY_SCRIPT' ]"; then
    echo -e "${RED}❌ Deploy script '$DEPLOY_SCRIPT' not found in '$REMOTE_DIR'${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Deploy script found${NC}"
echo ""

# Execute deployment
echo -e "${BLUE}🚀 Starting remote deployment...${NC}"
echo -e "${BLUE}═══════════════════════════════════════════${NC}"
echo ""

$SSH_CMD "cd '$REMOTE_DIR' && bash '$DEPLOY_SCRIPT'"

DEPLOY_STATUS=$?

echo ""
echo -e "${BLUE}═══════════════════════════════════════════${NC}"

if [ $DEPLOY_STATUS -eq 0 ]; then
    echo -e "${GREEN}✨ Remote deployment completed successfully!${NC}"
    exit 0
else
    echo -e "${RED}❌ Deployment failed with status code: $DEPLOY_STATUS${NC}"
    exit $DEPLOY_STATUS
fi
