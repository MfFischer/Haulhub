#!/bin/bash

# Exit on error
set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Check system requirements
echo -e "${BLUE}Checking system requirements...${NC}"

# Check Node.js version
if ! command -v node &> /dev/null; then
    echo -e "${RED}Node.js is not installed. Please install Node.js v14 or later.${NC}"
    exit 1
fi

NODE_VERSION=$(node -v | cut -d 'v' -f 2)
NODE_MAJOR_VERSION=$(echo $NODE_VERSION | cut -d '.' -f 1)

if [ $NODE_MAJOR_VERSION -lt 14 ]; then
    echo -e "${RED}Node.js version is $NODE_VERSION. HaulHub requires Node.js v14 or later.${NC}"
    exit 1
fi

echo -e "${GREEN}Node.js v$NODE_VERSION ✓${NC}"

# Check npm
if ! command -v npm &> /dev/null; then
    echo -e "${RED}npm is not installed. Please install npm.${NC}"
    exit 1
fi

echo -e "${GREEN}npm $(npm -v) ✓${NC}"

# Check Docker
if ! command -v docker &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker is not installed. It's recommended for development.${NC}"
else
    echo -e "${GREEN}Docker $(docker --version | cut -d ' ' -f 3 | tr -d ',') ✓${NC}"
fi

# Check Docker Compose
if ! command -v docker-compose &> /dev/null; then
    echo -e "${YELLOW}Warning: Docker Compose is not installed. It's recommended for development.${NC}"
else
    echo -e "${GREEN}Docker Compose $(docker-compose --version | cut -d ' ' -f 3 | tr -d ',') ✓${NC}"
fi

# Create necessary directories
echo -e "${BLUE}Creating necessary directories...${NC}"
mkdir -p logs uploads

# Install root dependencies
echo -e "${BLUE}Installing root dependencies...${NC}"
npm install

# Install client dependencies
echo -e "${BLUE}Installing client dependencies...${NC}"
cd client
npm install
cd ..

# Install server dependencies
echo -e "${BLUE}Installing server dependencies...${NC}"
cd server
npm install
cd ..

# Install contracts dependencies
echo -e "${BLUE}Installing contracts dependencies...${NC}"
cd contracts
npm install
cd ..

# Setup environment variables
echo -e "${BLUE}Setting up environment variables...${NC}"

# Client environment
if [ ! -f "./client/.env" ]; then
    echo -e "${YELLOW}Creating client .env file...${NC}"
    cp ./client/.env.example ./client/.env || echo "REACT_APP_NAME=HaulHub" > ./client/.env
    echo -e "${GREEN}Created client .env file. Please update it with your API keys.${NC}"
else
    echo -e "${GREEN}Client .env file already exists.${NC}"
fi

# Server environment
if [ ! -f "./server/.env" ]; then
    echo -e "${YELLOW}Creating server .env file...${NC}"
    cp ./server/.env.example ./server/.env || echo "PORT=5001" > ./server/.env
    echo -e "${GREEN}Created server .env file. Please update it with your configuration.${NC}"
else
    echo -e "${GREEN}Server .env file already exists.${NC}"
fi

# Contracts environment
if [ ! -f "./contracts/.env" ]; then
    echo -e "${YELLOW}Creating contracts .env file...${NC}"
    cp ./contracts/.env.example ./contracts/.env || echo "POLYGON_MUMBAI_RPC_URL=https://rpc-mumbai.maticvigil.com" > ./contracts/.env
    echo -e "${GREEN}Created contracts .env file. Please update it with your private keys and RPC URLs.${NC}"
else
    echo -e "${GREEN}Contracts .env file already exists.${NC}"
fi

# Setup git hooks
echo -e "${BLUE}Setting up git hooks...${NC}"

# Create pre-commit hook
PRE_COMMIT_HOOK=".git/hooks/pre-commit"
if [ ! -f "$PRE_COMMIT_HOOK" ]; then
    echo -e "${YELLOW}Creating pre-commit hook...${NC}"
    
    cat > "$PRE_COMMIT_HOOK" << 'EOL'
#!/bin/bash
set -e

# Run linting on staged files
echo "Running lint checks..."
cd client && npm run lint
cd ../server && npm run lint

# Run tests
echo "Running tests..."
cd ../client && npm test -- --watchAll=false
cd ../server && npm test -- --watchAll=false
cd ../contracts && npm test

exit 0
EOL
    
    chmod +x "$PRE_COMMIT_HOOK"
    echo -e "${GREEN}Created pre-commit hook.${NC}"
else
    echo -e "${GREEN}Pre-commit hook already exists.${NC}"
fi

# Final message
echo -e "${GREEN}HaulHub setup complete!${NC}"
echo -e "${BLUE}To start the client dev server:${NC} cd client && npm start"
echo -e "${BLUE}To start the server:${NC} cd server && npm run dev"
echo -e "${BLUE}To run contract tests:${NC} cd contracts && npm test"
echo -e "${BLUE}To use Docker Compose:${NC} docker-compose -f docker/docker-compose.yml up"
echo ""
echo -e "${YELLOW}Don't forget to update your environment variables in the .env files!${NC}"
