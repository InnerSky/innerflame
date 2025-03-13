#!/bin/bash

# InnerFlame Development Server Cleanup Script
# This script identifies and terminates processes running on common development ports

# ANSI color codes for better readability
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo -e "${BLUE}InnerFlame Development Server Cleanup${NC}"
echo "This script will terminate all processes running on development ports"
echo -e "\n"

# Initialize counter for terminated processes
terminated_count=0

# Function to check and kill processes on a specific port
kill_process_on_port() {
    local port=$1
    local process_type=$2
    
    # Get the PID of the process running on the specified port
    pid=$(lsof -ti:$port)
    
    if [ -n "$pid" ]; then
        process_info=$(ps -p $pid -o command= | head -1)
        echo -e "${YELLOW}Found ${process_type} process on port ${port}:${NC} ${process_info}"
        
        # Kill the process
        kill -9 $pid 2>/dev/null
        
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}Successfully terminated process on port ${port} (PID: ${pid})${NC}"
            ((terminated_count++))
        else
            echo -e "${RED}Failed to terminate process on port ${port} (PID: ${pid})${NC}"
        fi
    else
        echo "No ${process_type} process found on port ${port}"
    fi
}

# Check web server ports (Vite, Next.js, etc.)
echo -e "${BLUE}Checking for web server processes...${NC}"
web_ports=(5173 5174 5175 5176 5177 5178 5179 5180)
web_processes_found=false

for port in "${web_ports[@]}"; do
    kill_process_on_port $port "web server"
    if [ -n "$(lsof -ti:$port)" ]; then
        web_processes_found=true
    fi
done

if [ "$web_processes_found" = false ]; then
    echo -e "${GREEN}No web server processes found on common ports${NC}"
fi
echo ""

# Check API/WebSocket server ports
echo -e "${BLUE}Checking for API/WebSocket server processes...${NC}"
api_ports=(3001 3002 3003 3004 3005)
api_processes_found=false

for port in "${api_ports[@]}"; do
    kill_process_on_port $port "API/WebSocket server"
    if [ -n "$(lsof -ti:$port)" ]; then
        api_processes_found=true
    fi
done

if [ "$api_processes_found" = false ]; then
    echo -e "${GREEN}No API/WebSocket server processes found on common ports${NC}"
fi
echo ""

# Print summary
echo -e "${BLUE}===== Summary =====${NC}"
echo -e "Total processes terminated: ${terminated_count}"

if [ $terminated_count -eq 0 ]; then
    echo -e "${GREEN}No development server processes were found running${NC}"
else
    echo -e "${GREEN}All development server processes have been terminated${NC}"
fi

echo -e "\n${GREEN}Server ports are now available for use${NC}"

exit 0
