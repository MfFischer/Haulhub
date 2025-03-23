#!/bin/bash

# Exit on error
set -e

# Color codes for output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Display help information
show_help() {
    echo "HaulHub Deployment Script"
    echo "Usage: ./deploy.sh [OPTIONS]"
    echo ""
    echo "Options:"
    echo "  -e, --environment ENV   Specify deployment environment (staging, production)"
    echo "  -b, --build-only        Build without deploying"
    echo "  -c, --contracts-only    Deploy only smart contracts"
    echo "  -n, --network NET       Specify blockchain network (mumbai, polygon)"
    echo "  -h, --help              Show this help message"
    echo ""
    echo "Examples:"
    echo "  ./deploy.sh -e staging              # Deploy to staging"
    echo "  ./deploy.sh -e production           # Deploy to production"
    echo "  ./deploy.sh -b                      # Build only, no deployment"
    echo "  ./deploy.sh -c -n mumbai            # Deploy contracts to Mumbai testnet"
}

# Parse command line arguments
ENVIRONMENT=""
BUILD_ONLY=false
CONTRACTS_ONLY=false
NETWORK="mumbai"

while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -e|--environment)
            ENVIRONMENT="$2"
            shift
            shift
            ;;
        -b|--build-only)
            BUILD_ONLY=true
            shift
            ;;
        -c|--contracts-only)
            CONTRACTS_ONLY=true
            shift
            ;;
        -n|--network)
            NETWORK="$2"
            shift
            shift
            ;;
        -h|--help)
            show_help
            exit 0
            ;;
        *)
            echo -e "${RED}Unknown option: $1${NC}"
            show_help
            exit 1
            ;;
    esac
done

# Validate environment
if [ "$BUILD_ONLY" = false ] && [ "$CONTRACTS_ONLY" = false ] && [ -z "$ENVIRONMENT" ]; then
    echo -e "${RED}Error: Environment (-e, --environment) must be specified when deploying.${NC}"
    show_help
    exit 1
fi

if [ -n "$ENVIRONMENT" ] && [ "$ENVIRONMENT" != "staging" ] && [ "$ENVIRONMENT" != "production" ]; then
    echo -e "${RED}Error: Environment must be either 'staging' or 'production'.${NC}"
    show_help
    exit 1
fi

# Validate network
if [ "$NETWORK" != "mumbai" ] && [ "$NETWORK" != "polygon" ]; then
    echo -e "${RED}Error: Network must be either 'mumbai' or 'polygon'.${NC}"
    show_help
    exit 1
fi

# Function to deploy smart contracts
deploy_contracts() {
    echo -e "${BLUE}Deploying smart contracts to $NETWORK...${NC}"
    
    # Navigate to contracts directory
    cd contracts
    
    # Run contract tests
    echo -e "${BLUE}Running contract tests...${NC}"
    npm test
    
    # Deploy contracts
    echo -e "${BLUE}Deploying contracts...${NC}"
    npx hardhat run scripts/deploy.js --network $NETWORK
    
    echo -e "${GREEN}Contracts deployed to $NETWORK!${NC}"
    
    # Copy deployed addresses for later use
    cp deployedAddresses.json ../client/public/
    
    # Return to root directory
    cd ..
}

# Function to build client
build_client() {
    echo -e "${BLUE}Building client...${NC}"
    
    # Navigate to client directory
    cd client
    
    # Install dependencies
    npm ci
    
    # Run linting
    echo -e "${BLUE}Running linting...${NC}"
    npm run lint
    
    # Run tests
    echo -e "${BLUE}Running tests...${NC}"
    npm test -- --watchAll=false
    
    # Set appropriate environment variables
    if [ "$ENVIRONMENT" = "production" ]; then
        echo -e "${BLUE}Setting production environment...${NC}"
        export REACT_APP_API_URL="https://api.haulhub.io/api"
        export REACT_APP_NETWORK="polygon"
    else
        echo -e "${BLUE}Setting staging environment...${NC}"
        export REACT_APP_API_URL="https://staging-api.haulhub.io/api"
        export REACT_APP_NETWORK="mumbai"
    fi
    
    # Build client
    npm run build
    
    echo -e "${GREEN}Client build complete!${NC}"
    
    # Return to root directory
    cd ..
}

# Function to build server
build_server() {
    echo -e "${BLUE}Building server...${NC}"
    
    # Navigate to server directory
    cd server
    
    # Install dependencies
    npm ci
    
    # Run linting
    echo -e "${BLUE}Running linting...${NC}"
    npm run lint
    
    # Run tests
    echo -e "${BLUE}Running tests...${NC}"
    npm test -- --watchAll=false
    
    echo -e "${GREEN}Server build complete!${NC}"
    
    # Return to root directory
    cd ..
}

# Function to deploy to server
deploy_to_server() {
    local target=$1
    local server_address
    
    if [ "$target" = "production" ]; then
        server_address="user@production-server.haulhub.io"
        echo -e "${YELLOW}Deploying to PRODUCTION server...${NC}"
    else
        server_address="user@staging-server.haulhub.io"
        echo -e "${BLUE}Deploying to STAGING server...${NC}"
    fi
    
    echo -e "${BLUE}Creating deployment package...${NC}"
    
    # Create a deployment directory
    mkdir -p deployment
    cp -r client/build deployment/client
    cp -r server deployment/server
    cp -r docker deployment/docker
    
    # Create .env file for server
    if [ "$target" = "production" ]; then
        cp server/.env.production deployment/server/.env
    else
        cp server/.env.staging deployment/server/.env
    fi
    
    # Package the deployment
    tar -czf deployment.tar.gz -C deployment .
    
    echo -e "${BLUE}Uploading to $target server...${NC}"
    
    # In a real script, you would use scp or rsync to upload to server
    # Here we just simulate it
    echo "scp deployment.tar.gz $server_address:/tmp/"
    echo "ssh $server_address 'cd /var/www/haulhub && tar -xzf /tmp/deployment.tar.gz && docker-compose -f docker/docker-compose.yml down && docker-compose -f docker/docker-compose.yml up -d'"
    
    echo -e "${GREEN}Deployment to $target complete!${NC}"
    
    # Clean up
    rm -rf deployment
    rm deployment.tar.gz
}

# Main deployment logic
if [ "$CONTRACTS_ONLY" = true ]; then
    deploy_contracts
    exit 0
fi

if [ "$BUILD_ONLY" = true ] || [ -n "$ENVIRONMENT" ]; then
    # Always deploy contracts first if not in build-only mode
    if [ "$BUILD_ONLY" = false ]; then
        if [ "$ENVIRONMENT" = "production" ]; then
            NETWORK="polygon"
        else
            NETWORK="mumbai"
        fi
        deploy_contracts
    fi
    
    # Build client and server
    build_client
    build_server
    
    # Deploy if not in build-only mode
    if [ "$BUILD_ONLY" = false ]; then
        deploy_to_server $ENVIRONMENT
    else
        echo -e "${GREEN}Build completed successfully!${NC}"
    fi
fi

echo -e "${GREEN}Deployment script completed!${NC}"