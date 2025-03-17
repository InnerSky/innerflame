#!/usr/bin/env bash

# Print with colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${YELLOW}=== InnerFlame Development Environment Cleanup ===${NC}"

# Step 1: Kill all Vite and Turbo processes
echo -e "${BLUE}Stopping all running Vite servers...${NC}"
pkill -f "vite" || true
pkill -f "turbo" || true
echo -e "${GREEN}✓ All Vite and Turbo processes terminated${NC}"

# Step 2: Clear Vite cache from all workspaces
echo -e "${BLUE}Clearing Vite caches...${NC}"
find . -type d -name ".vite" -exec rm -rf {} +
find . -type d -name ".turbo" -exec rm -rf {} +
echo -e "${GREEN}✓ Vite and Turbo caches cleared${NC}"

# Step 3: Check for any lingering processes using development ports
echo -e "${BLUE}Checking for processes still using development ports (5173-5180)...${NC}"
for port in {5173..5180}; do
  pid=$(lsof -i :$port -t 2>/dev/null)
  if [ -n "$pid" ]; then
    echo -e "Freeing port $port (PID: $pid)..."
    kill -9 $pid 2>/dev/null || true
  fi
done
echo -e "${GREEN}✓ All development ports cleared${NC}"

# Step 4: Clear node_modules/.vite in web app
echo -e "${BLUE}Clearing Vite cache in node_modules...${NC}"
if [ -d "apps/web/node_modules/.vite" ]; then
  rm -rf apps/web/node_modules/.vite
  echo -e "${GREEN}✓ Web app Vite cache cleared${NC}"
else
  echo -e "${GREEN}✓ No Vite cache found in web app node_modules${NC}"
fi

if [ -d "node_modules/.vite" ]; then
  rm -rf node_modules/.vite
  echo -e "${GREEN}✓ Root Vite cache cleared${NC}"
else
  echo -e "${GREEN}✓ No Vite cache found in root node_modules${NC}"
fi

echo -e "${YELLOW}=== Cleanup Complete! ===${NC}"
echo -e "${GREEN}Your development environment is now fresh and ready to start.${NC}"
echo -e "${BLUE}You can now run 'npm run dev' to start development servers.${NC}" 