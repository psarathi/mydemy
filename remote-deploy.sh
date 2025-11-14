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
RUN_TESTS=false

# SSH ControlMaster settings for persistent connection (ask password only once)
SSH_CONTROL_PATH="/tmp/ssh-control-%r@%h:%p"
SSH_CONTROL_PERSIST="10m"

# Function to load environment files
load_env_files() {
    # Load .env first (default values)
    if [ -f ".env" ]; then
        echo -e "${BLUE}📄 Loading configuration from .env${NC}"
        set -a  # automatically export all variables
        source .env
        set +a
    fi

    # Load .env.local second (overrides .env)
    if [ -f ".env.local" ]; then
        echo -e "${BLUE}📄 Loading configuration from .env.local${NC}"
        set -a
        source .env.local
        set +a
    fi

    # Map environment variables to script variables if not set via CLI
    if [ -z "$SSH_HOST" ] && [ -n "$DEPLOY_SSH_HOST" ]; then
        SSH_HOST="$DEPLOY_SSH_HOST"
    fi

    if [ -z "$SSH_USER" ] && [ -n "$DEPLOY_SSH_USER" ]; then
        SSH_USER="$DEPLOY_SSH_USER"
    fi

    if [ -z "$REMOTE_DIR" ] && [ -n "$DEPLOY_REMOTE_DIR" ]; then
        REMOTE_DIR="$DEPLOY_REMOTE_DIR"
    fi

    if [ -z "$SSH_PORT" ] && [ -n "$DEPLOY_SSH_PORT" ]; then
        SSH_PORT="$DEPLOY_SSH_PORT"
    fi

    if [ -z "$SSH_KEY" ] && [ -n "$DEPLOY_SSH_KEY" ]; then
        SSH_KEY="$DEPLOY_SSH_KEY"
    fi

    if [ -z "$DEPLOY_SCRIPT" ] && [ -n "$DEPLOY_SCRIPT_NAME" ]; then
        DEPLOY_SCRIPT="$DEPLOY_SCRIPT_NAME"
    fi
}

# Function to display usage
usage() {
    echo -e "${BLUE}Usage:${NC} $0 [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -h, --host HOST          SSH host (can be set via DEPLOY_SSH_HOST in .env)"
    echo "  -u, --user USER          SSH user (can be set via DEPLOY_SSH_USER in .env)"
    echo "  -d, --dir DIRECTORY      Project directory on remote server (can be set via DEPLOY_REMOTE_DIR in .env)"
    echo "  -p, --port PORT          SSH port (default: 22, can be set via DEPLOY_SSH_PORT in .env)"
    echo "  -s, --script SCRIPT      Deploy script name (default: ./deploy.sh, can be set via DEPLOY_SCRIPT_NAME in .env)"
    echo "  -k, --key KEY_FILE       SSH private key file (can be set via DEPLOY_SSH_KEY in .env)"
    echo "  -t, --test               Run unit tests before deployment"
    echo "  --help                   Display this help message"
    echo ""
    echo "Environment Configuration:"
    echo "  The script reads from .env and .env.local files (if present)"
    echo "  Command line arguments override environment variables"
    echo ""
    echo "Examples:"
    echo "  $0 -h example.com -u deploy -d /var/www/mydemy"
    echo "  $0 -h 192.168.1.10 -u ubuntu -d /home/ubuntu/mydemy -k ~/.ssh/id_rsa"
    echo "  $0 --host example.com --user deploy --dir /var/www/mydemy --port 2222"
    echo "  $0 --test  # Run tests before deployment, use .env config"
    exit 1
}

# Load environment configuration first
load_env_files

# Parse command line arguments (these override .env values)
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
        -t|--test)
            RUN_TESTS=true
            shift
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

# Build SSH command with ControlMaster for persistent connection
SSH_CMD="ssh -p $SSH_PORT"
if [ -n "$SSH_KEY" ]; then
    SSH_CMD="$SSH_CMD -i $SSH_KEY"
fi
# Add ControlMaster settings to reuse connection (ask password only once)
SSH_CMD="$SSH_CMD -o ControlMaster=auto -o ControlPath=$SSH_CONTROL_PATH -o ControlPersist=$SSH_CONTROL_PERSIST"
SSH_CMD="$SSH_CMD ${SSH_USER}@${SSH_HOST}"

# Function to cleanup SSH control socket
cleanup_ssh() {
    if [ -S "$SSH_CONTROL_PATH" ]; then
        ssh -O exit -o ControlPath="$SSH_CONTROL_PATH" "${SSH_USER}@${SSH_HOST}" 2>/dev/null || true
    fi
}

# Trap to cleanup on exit
trap cleanup_ssh EXIT

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
echo -e "  Run Tests:  ${GREEN}${RUN_TESTS}${NC}"
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

# Run tests if requested
if [ "$RUN_TESTS" = true ]; then
    echo -e "${BLUE}🧪 Running unit tests...${NC}"
    echo -e "${BLUE}═══════════════════════════════════════════${NC}"
    echo ""

    # Check if package.json exists
    if ! $SSH_CMD "[ -f '$REMOTE_DIR/package.json' ]"; then
        echo -e "${RED}❌ package.json not found in '$REMOTE_DIR'${NC}"
        exit 1
    fi

    # Run npm test
    if ! $SSH_CMD "cd '$REMOTE_DIR' && npm test"; then
        echo ""
        echo -e "${RED}❌ Tests failed! Deployment aborted.${NC}"
        exit 1
    fi

    echo ""
    echo -e "${GREEN}✅ All tests passed!${NC}"
    echo ""
fi

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
