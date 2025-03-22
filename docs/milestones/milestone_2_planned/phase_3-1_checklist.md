# Phase 3-1: API Path Normalization Checklist

## Overview
This phase focuses on unifying and normalizing the API endpoints for the InnerFlame application, specifically addressing inconsistencies between the `/api/ai/stream` and `/ai/stream` paths. The goal is to implement a middleware-based solution that allows for consistent frontend communication while ensuring backward compatibility.

## Investigation Tasks

- [x] **Review Express Server Setup**
  - [x] Examine `apps/api/src/index.ts` to understand the current route definitions
    - Found duplicate route handlers for `/api/ai/stream` and `/ai/stream` for both POST and GET methods
    - Current approach manually duplicates code for each endpoint
  - [x] Identify how routes are currently organized and mounted
    - Main routes are defined directly in index.ts
    - tRPC router is mounted at `/trpc`
    - Standard REST endpoints are defined with Express
  - [x] Check for existing middleware that might affect routing
    - CORS middleware is properly configured
    - No existing path normalization middleware

- [x] **Review Frontend API Client**
  - [x] Examine `apps/web/src/features/documents/services/sseClient.ts` to understand the current approach
    - Client uses a fallback strategy to try multiple endpoint paths
    - First tries with `/api` prefix, then without it in production
  - [x] Identify how the frontend constructs API URLs
    - Base URL comes from environment variable VITE_API_URL or defaults to localhost
    - Endpoints array is constructed based on environment (production vs development)
  - [x] Check for any environment-specific logic that might need to be updated
    - Logic checks if API_BASE_URL includes 'localhost' to determine production status
    - Different endpoint paths are used in production vs development

- [x] **Review Current API Routes**
  - [x] Identify all routes that might be affected by the normalization
    - `/api/ai/stream` (POST and GET)
    - `/ai/stream` (POST and GET)
  - [x] Check if there are any route conflicts to be aware of
    - No conflicts identified, duplicated routes have identical implementations
  - [x] Document the expected behavior after normalization
    - After normalization, both `/api/ai/stream` and `/ai/stream` should work
    - Frontend should consistently use `/api/ai/stream` for better organization

## Implementation Tasks

- [x] **Implement Path Normalization Middleware**
  - [x] Add middleware to `apps/api/src/index.ts` that strips `/api` prefix from incoming requests
    - Implemented middleware that detects and transforms paths starting with `/api/`
    - Added development-mode logging for easier debugging
  - [x] Ensure middleware is positioned correctly in the middleware pipeline
    - Placed after core Express middleware but before route handlers
  - [x] Test the middleware with various path combinations
    - Confirmed it works with both prefixed and non-prefixed paths

- [x] **Update Backend Routes**
  - [x] Consolidate duplicate route definitions to use a single pattern
    - Removed duplicate route handlers that were handling non-prefixed paths
    - Added comments explaining the middleware approach
  - [x] Update documentation and comments to reflect the new routing strategy
    - Added TODO note for eventual cleanup when all clients are updated
  - [x] Ensure all route handlers are using the correct paths
    - Updated startup logs to show both path versions

- [x] **Update Frontend API Client**
  - [x] Modify `sseClient.ts` to use consistent paths with the `/api` prefix
    - Updated to always use `/api/ai/stream` format
  - [x] Remove fallback logic that tries multiple URLs
    - Removed the endpoint loop that tried multiple paths
  - [x] Update any environment-specific URL construction
    - Simplified URL construction to use a single pattern
    - Improved error handling and logging

## Testing Tasks

- [x] **Test in Development Environment**
  - [x] Verify that the API works with or without the `/api` prefix
  - [x] Confirm SSE connections are established correctly
  - [x] Verify that existing functionality is not affected

- [x] **Test in Production-like Environment**
  - [x] Verify Cloud Run compatibility with the new routing
  - [x] Test with production frontend pointing to production backend
  - [x] Ensure no CORS or other networking issues

## Documentation Tasks

- [x] **Update Technical Documentation**
  - [x] Document the new routing strategy in the technical blueprint
  - [x] Update API endpoint documentation to reflect the normalized paths
  - [x] Add a note about the middleware for future developers

- [x] **Update Code Comments**
  - [x] Add clear comments to the middleware explaining its purpose
  - [x] Update any misleading comments in the route definitions
  - [x] Document the expected behavior of the API paths

## Completion Criteria

- [x] All tasks in this checklist are complete
- [x] The API can be accessed consistently with the `/api` prefix
- [x] The frontend uses a single, consistent URL pattern
- [x] All functionality works as expected with the normalized paths
- [x] Documentation is updated to reflect the new approach

## Progress Updates

### 2024-03-21: Investigation completed
- Reviewed the current backend implementation and found duplicate route handlers for different path patterns
- Analyzed frontend client which uses a fallback strategy to try multiple endpoint patterns
- Determined that a normalization middleware is the best approach to standardize the API paths

### 2024-03-21: Implementation completed
- Added path normalization middleware to the Express app that removes the `/api` prefix from incoming requests
- Removed duplicate route handlers that were manually handling paths without the `/api` prefix
- Updated the frontend SSE client to consistently use the `/api` prefix for all requests
- Simplified error handling and improved logging throughout the system

### 2024-03-21: Testing and Documentation completed
- Successfully tested the API path normalization in both development and production environments
- Verified that the frontend can now reliably connect to the backend with consistent `/api` prefix
- Updated CORS configuration to support Netlify preview domains for smoother testing workflows
- Updated technical blueprint with information about path normalization strategy
- Added clear code comments to document the middleware and its behavior
- Fixed a TypeScript error related to an unused parameter in the middleware
- All functionality works correctly with the normalized path approach 