/**
 * Counts words in text, handling both western languages and CJK characters
 */
export function countWords(text: string | null): number {
  if (!text) return 0;
  
  // First, extract all CJK (Chinese, Japanese, Korean) characters
  // This regex matches CJK Unified Ideographs (Chinese characters)
  const cjkPattern = /[\u4e00-\u9fff\u3400-\u4dbf\uf900-\ufaff\u3300-\u33ff\ufe30-\ufe4f\uf900-\ufaff\uff00-\uffef\u2e80-\u2eff\u3000-\u303f\u31c0-\u31ef\u3200-\u32ff]/g;
  
  // Extract CJK characters and count them individually
  const cjkMatches = text.match(cjkPattern) || [];
  const cjkCount = cjkMatches.length;
  
  // Remove CJK characters and count remaining words (western text)
  const westernText = text.replace(cjkPattern, '');
  const westernWords = westernText.split(/\s+/).filter(Boolean).length;
  
  // Total word count is CJK characters plus western words
  return cjkCount + westernWords;
}

/**
 * Estimate the number of tokens in a text string.
 * This is a simple approximation. For English, tokens are ~4 characters on average.
 * This is not exact but is sufficient for limiting chat history.
 */
export function estimateTokens(text: string | null): number {
  if (!text) return 0;
  
  // Simple heuristic: ~4 characters per token for English
  return Math.ceil(text.length / 4);
}

/**
 * Limit chat history to stay under a specified token limit
 * Keeps the most recent messages up to the token limit
 */
export function limitChatHistoryTokens(
  messages: any[], 
  tokenLimit: number = 2000,
  contentField: string = 'content'
): any[] {
  if (!messages || messages.length === 0) return [];
  
  const sortedMessages = [...messages].sort((a, b) => 
    new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
  );
  
  let totalTokens = 0;
  let includedMessages: any[] = [];
  
  // Process messages in reverse (from newest to oldest)
  for (let i = sortedMessages.length - 1; i >= 0; i--) {
    const message = sortedMessages[i];
    const content = message[contentField] || '';
    const tokenEstimate = estimateTokens(content);
    
    // Add message token count + overhead for message structure (estimated 20 tokens)
    const messageTokens = tokenEstimate + 20;
    
    // If adding this message would exceed the limit, stop
    if (totalTokens + messageTokens > tokenLimit && includedMessages.length > 0) {
      break;
    }
    
    totalTokens += messageTokens;
    includedMessages.unshift(message); // Add to front to maintain chronological order
  }
  
  return includedMessages;
} 