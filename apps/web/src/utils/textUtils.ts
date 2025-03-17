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