# Use Node.js as the base image
FROM node:18-slim

WORKDIR /app

# Install jq for JSON processing
RUN apt-get update && apt-get install -y jq && apt-get clean

# Copy monorepo files
COPY package*.json ./
COPY turbo.json ./
COPY tsconfig.json ./

# Remove husky prepare script to prevent errors in Docker build
RUN cat package.json | jq 'del(.scripts.prepare)' > package.json.tmp && mv package.json.tmp package.json

# Copy workspace package.json files for workspace detection
COPY apps/api/package*.json ./apps/api/
COPY packages/types/package*.json ./packages/types/
COPY packages/utils/package*.json ./packages/utils/
COPY packages/ai-tools/package*.json ./packages/ai-tools/

# Install dependencies
RUN npm install

# Copy source code
COPY apps/api ./apps/api
COPY packages/types ./packages/types
COPY packages/utils ./packages/utils
COPY packages/ai-tools ./packages/ai-tools

# Set the working directory to the API folder
WORKDIR /app/apps/api

# Create a placeholder .env file with valid-looking example values
# These will be overridden by environment variables passed to docker run
RUN echo "NODE_ENV=production" > .env \
    && echo "PORT=8080" >> .env \
    && echo "SUPABASE_URL=https://example.supabase.co" >> .env \
    && echo "SUPABASE_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.example" >> .env \
    && echo "CLAUDE_API_KEY=sk-ant-api00-examplekey" >> .env \
    && echo "CLAUDE_MODEL=claude-3-7-sonnet-20250219" >> .env \
    && echo "CLAUDE_MAX_TOKENS=1024" >> .env

# Expose the port
EXPOSE 8080

# Install tsx globally for running TypeScript directly
RUN npm install -g tsx

# Run the development server
CMD ["tsx", "-r", "dotenv/config", "src/index.ts"] 