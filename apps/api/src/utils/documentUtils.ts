/**
 * Utility functions for document operations
 */

/**
 * Creates full document content for storing in the database
 * Uses the same format as the frontend document repository
 */
export function createFullContent(title: string, content: string): string {
  return JSON.stringify({
    title,
    content
  });
} 