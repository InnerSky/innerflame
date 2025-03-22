# Phase 3 Checklist: One-Command Deployment Setup

## Objective
Understand our current development workflow and set up automated deployment of the backend service to Google Cloud Run with a single command, optimizing for simplicity and developer experience.

## Tasks

### Understanding Current Development Process
- [x] Analyze current development workflow
  - [x] Examine `npm run dev:fresh` command in root package.json
  - [x] Understand how frontend and backend are started concurrently
  - [x] Document build process for backend (apps/api)
  - [x] Identify dependencies between packages
  - [x] Note environment variables used in development

### Docker Configuration
- [x] Prepare Docker configuration for backend
  - [x] Create Dockerfile in project root following monorepo structure
  - [x] Create .dockerignore file to exclude unnecessary files
  - [x] Configure multi-stage build if necessary
    - Found that a single-stage build works better for our monorepo structure
  - [x] Ensure TypeScript builds correctly within container
    - Using tsx to run TypeScript directly rather than compiling to JavaScript
  - [x] Test Docker build locally: `docker build -t innerflame-api .`
  - [x] Test Docker run locally: `docker run -p 8080:8080 innerflame-api`

### GitHub Actions Workflow
- [x] Set up automated deployment pipeline
  - [x] Create `.github/workflows/deploy-backend.yml` file
  - [x] Configure workflow to trigger on pushes to main branch
  - [x] Add Google Cloud authentication steps
  - [x] Set up Docker build and push steps
  - [x] Configure Cloud Run deployment step

### Google Cloud Setup
- [x] Configure Google Cloud environment
  - [x] Create Google Cloud project (if not exists)
  - [x] Enable required APIs (Cloud Run, Container Registry)
  - [x] Create service account with deployment permissions
  - [x] Generate and download service account key
  - [x] Add service account key to GitHub Secrets as GCP_SA_KEY
  - [x] Add project ID to GitHub Secrets as GCP_PROJECT_ID

### Environment Configuration
- [x] Set up production environment variables
  - [x] List all required environment variables from apps/api
  - [x] Configure variables in Google Cloud Run service
  - [x] Ensure sensitive values use Secret Manager
  - [x] Document all required environment variables

### Backend Preparation
- [x] Prepare backend for production
  - [x] Implement `/health` endpoint for monitoring
  - [x] Configure proper PORT handling (default: 8080)
  - [x] Set up production error handling
  - [x] Ensure proper CORS configuration
  - [x] Verify Supabase connection in production context

### Testing and Verification
- [x] Verify deployment process
  - [x] Test deployment with `git push` to main branch
  - [x] Verify GitHub Actions workflow executes successfully
  - [x] Confirm Cloud Run service is updated with new version
  - [x] Test backend API endpoints from frontend application
  - [x] Verify SSE streaming works in production

### Documentation
- [x] Document deployment process
  - [x] Create step-by-step guide for team members
  - [x] Document how to monitor the deployed service
  - [x] Explain how to roll back to previous versions if needed
  - [x] Document troubleshooting steps for common issues

## Verification Criteria
1. Complete understanding of current development workflow
2. Pushing to main branch automatically deploys backend to Cloud Run
3. Environment variables are properly configured and secured
4. Backend API is accessible from frontend application
5. Health check endpoint responds correctly
6. SSE streaming functions properly in production
7. Deployment process is well-documented

## Dependencies
- Google Cloud Platform account
- GitHub repository with Actions enabled
- Properly configured monorepo structure

## Notes
- Pause after each major step to test functionality
- Commit changes incrementally to avoid complex debugging
- Document any issues encountered during setup for future reference
- ESM modules with TypeScript require special handling in Docker:
  - Use `.js` extensions in imports even for TypeScript files
  - Consider using `tsx` for direct TypeScript execution in development-like environments
- For monorepos, preserving the package structure is crucial for proper imports
- Include placeholder environment variables in the Docker image with valid formats
- Remove Husky prepare scripts when building in Docker to prevent errors
- When using Secret Manager with Cloud Run, ensure the Cloud Run service account has the Secret Manager Secret Accessor role 