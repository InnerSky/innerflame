# Google Cloud Run Setup Guide

This guide walks through the process of setting up Google Cloud Run for deploying the InnerFlame backend.

## Prerequisites

- Google Cloud Platform account
- `gcloud` CLI tool installed locally
- Docker installed locally (for testing)
- Git repository with GitHub Actions enabled

## Step 1: Create a Google Cloud Project

1. Visit the [Google Cloud Console](https://console.cloud.google.com/)
2. Click on the project dropdown at the top of the page
3. Click "New Project"
4. Enter a project name (e.g., "innerflame-prod")
5. Click "Create"

Once created, note your Project ID as you'll need it for deployment.

## Step 2: Enable Required APIs

1. Navigate to "APIs & Services > Library"
2. Search for and enable the following APIs:
   - Cloud Run API
   - Container Registry API
   - Secret Manager API (if using for secrets)
   - Cloud Build API

## Step 3: Create a Service Account

1. Navigate to "IAM & Admin > Service Accounts"
2. Click "Create Service Account"
3. Enter a name (e.g., "innerflame-deployer")
4. Click "Create and Continue"
5. Add the following roles:
   - Cloud Run Admin
   - Storage Admin (for Container Registry)
   - Service Account User
   - Secret Manager Secret Accessor (if using Secret Manager)
6. Click "Done"

## Step 4: Create and Download Service Account Key

1. Find your service account in the list
2. Click the three dots menu and select "Manage keys"
3. Click "Add Key" > "Create new key"
4. Choose JSON format
5. Click "Create" to download the key file

## Step 5: Add Secrets to GitHub

1. In your GitHub repository, go to "Settings > Secrets and variables > Actions"
2. Add the following repository secrets:
   - `GCP_PROJECT_ID`: Your Google Cloud project ID
   - `GCP_SA_KEY`: The entire content of the JSON key file (copy and paste)
   - `SUPABASE_URL`: URL for your Supabase instance
   - `SUPABASE_KEY`: Service role key for Supabase
   - `CLAUDE_API_KEY`: API key for Claude AI
   - `CLAUDE_MODEL`: Model version for Claude AI
   - `CLAUDE_MAX_TOKENS`: Maximum tokens for Claude responses

## Step 6: Test Deployment Locally (Optional)

Before pushing to GitHub, you can test building and running the Docker image locally:

```bash
# Build the Docker image
docker build -t innerflame-api .

# Run the container with environment variables
docker run -p 8080:8080 \
  -e NODE_ENV=production \
  -e SUPABASE_URL=YOUR_SUPABASE_URL \
  -e SUPABASE_KEY=YOUR_SUPABASE_KEY \
  -e CLAUDE_API_KEY=YOUR_CLAUDE_API_KEY \
  innerflame-api
```

Visit http://localhost:8080/health to confirm the API is running correctly.

## Step 7: Deploy with GitHub Actions

1. Ensure the Dockerfile, .dockerignore, and GitHub workflow files are committed
2. Push to the main branch to trigger the GitHub Actions workflow:

```bash
git add .
git commit -m "Set up Cloud Run deployment"
git push origin main
```

3. Monitor the workflow execution in the "Actions" tab of your GitHub repository

## Step 8: Verify Deployment

1. Visit the Google Cloud Console > Cloud Run
2. Click on the "innerflame-api" service
3. Click on the URL to access your deployed API
4. Append "/health" to the URL to check the health endpoint
5. Test the API endpoints from your frontend application

## Troubleshooting

### Deployment Failures

- Check GitHub Actions logs for detailed error messages
- Verify that all required secrets are set correctly
- Ensure the service account has the necessary permissions

### API Errors

- Check Cloud Run logs for runtime errors
- Verify environment variables are set correctly
- Test the health endpoint to confirm basic functionality

## Maintenance

### Updating the Deployment

Any push to the main branch that modifies files in the following paths will trigger a new deployment:
- `apps/api/**`
- `packages/types/**`
- `packages/utils/**`
- `packages/ai-tools/**`
- `Dockerfile`
- `.github/workflows/deploy-backend.yml`

### Monitoring

1. Navigate to Google Cloud Console > Cloud Run > innerflame-api
2. The "Metrics" tab provides information on:
   - Request count
   - Response latency
   - CPU and memory utilization
   - Error rates 