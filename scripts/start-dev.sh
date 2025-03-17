#!/usr/bin/env bash

# Print with colors for better visibility
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
RED='\033[0;31m'
NC='\033[0m' # No Color

# Get the absolute path to the project root
PROJECT_ROOT="$(cd "$(dirname "$0")/.." && pwd)"

echo -e "${YELLOW}=== Starting InnerFlame Development Environment ===${NC}"

# Check if the reset flag is passed
if [ "$1" == "--reset" ]; then
  echo -e "${BLUE}Cleaning up previous development environment...${NC}"
  # Source the clear-dev-servers.sh script
  source "$(dirname "$0")/clear-dev-servers.sh"
fi

# Start the development servers
echo -e "${BLUE}Starting API and Web development servers...${NC}"
echo -e "${GREEN}Press Ctrl+C to stop all servers${NC}"

# Track the PIDs of the processes we start
pids=()

# Function to kill all started processes on exit
cleanup() {
  echo -e "\n${YELLOW}Stopping all development servers...${NC}"
  for pid in "${pids[@]}"; do
    if ps -p "$pid" > /dev/null; then
      echo -e "Stopping process $pid"
      kill "$pid" 2>/dev/null || true
    fi
  done
  echo -e "${GREEN}All servers stopped${NC}"
  exit 0
}

# Set up trap to catch Ctrl+C and other termination signals
trap cleanup SIGINT SIGTERM EXIT

# Start API server (in background)
echo -e "${BLUE}Starting API server...${NC}"
if [ -d "${PROJECT_ROOT}/apps/api" ]; then
  cd "${PROJECT_ROOT}/apps/api" || { echo -e "${RED}Failed to access API directory${NC}"; exit 1; }
  npm run dev &
  api_pid=$!
  pids+=("$api_pid")
  cd "${PROJECT_ROOT}" || { echo -e "${RED}Failed to return to project root${NC}"; exit 1; }
  echo -e "${GREEN}✓ API server started (PID: $api_pid)${NC}"
else
  echo -e "${RED}API directory not found at ${PROJECT_ROOT}/apps/api${NC}"
  exit 1
fi

# Wait a moment for API to initialize
sleep 2

# Start Web client (in background)
echo -e "${BLUE}Starting Web client...${NC}"
if [ -d "${PROJECT_ROOT}/apps/web" ]; then
  cd "${PROJECT_ROOT}/apps/web" || { echo -e "${RED}Failed to access Web directory${NC}"; exit 1; }
  npm run dev &
  web_pid=$!
  pids+=("$web_pid")
  cd "${PROJECT_ROOT}" || { echo -e "${RED}Failed to return to project root${NC}"; exit 1; }
  echo -e "${GREEN}✓ Web client started (PID: $web_pid)${NC}"
else
  echo -e "${RED}Web directory not found at ${PROJECT_ROOT}/apps/web${NC}"
  exit 1
fi

echo -e "\n${YELLOW}=== Development Environment Started ===${NC}"
echo -e "${GREEN}API and Web client are now running${NC}"
echo -e "${BLUE}Waiting for log output...${NC}\n"

# Wait for both processes to finish (which they won't unless terminated)
wait 