/**
 * LLM JSON Fixer Utility
 * 
 * Fixes common JSON formatting errors produced by LLMs, including:
 * - Unescaped line breaks in strings
 * - Inconsistent quotation marks
 * - Trailing commas
 * - Unquoted property names
 * - JavaScript-specific values not valid in JSON
 */

export class JsonFixer {
  /**
   * Main method to fix JSON with common LLM-generated errors
   * @param {string} jsonString - The potentially malformed JSON string
   * @returns {string} - Corrected JSON string
   */
  static fix(jsonString: string): string {
    try {
      // Try to parse as-is first
      try {
        JSON.parse(jsonString);
        console.log("JSON is already valid.");
        return jsonString;
      } catch (e) {
        // Continue with fixes
      }
      
      // Apply simple fixes first
      let correctedJson = this.applySimpleFixes(jsonString);
      
      // Test if fixes worked
      try {
        JSON.parse(correctedJson);
        return correctedJson;
      } catch (error) {
        // If simple fixes didn't work, try more aggressive approach
        return this.applyAggressiveFixes(jsonString);
      }
    } catch (e) {
      console.error("Failed to correct JSON:", e);
      return jsonString; // Return original if all fixes fail
    }
  }

  /**
   * Apply basic fixes that handle common JSON formatting issues
   */
  private static applySimpleFixes(jsonString: string): string {
    let correctedJson = jsonString;
    
    // 1. Fix line breaks in strings (simple cases)
    correctedJson = correctedJson.replace(/"([^"]*?)(?:\r?\n)([^"]*?)"/gs, function(match, p1, p2) {
      return `"${p1}\n${p2}"`;
    });
    
    // 2. Fix single quotes used instead of double quotes
    correctedJson = correctedJson.replace(/'/g, '"');
    
    // 3. Remove trailing commas
    correctedJson = correctedJson.replace(/,(\s*[}\]])/g, '$1');
    
    // 4. Fix unquoted property names
    correctedJson = correctedJson.replace(/(\{|\,)\s*([a-zA-Z0-9_$]+)\s*:/g, '$1"$2":');
    
    // 5. Replace invalid JS values with null
    correctedJson = correctedJson.replace(/:\s*undefined\s*([,}])/g, ':null$1');
    correctedJson = correctedJson.replace(/:\s*NaN\s*([,}])/g, ':null$1');
    correctedJson = correctedJson.replace(/:\s*Infinity\s*([,}])/g, ':null$1');
    
    return correctedJson;
  }

  /**
   * Apply more aggressive fixes for complex JSON issues
   */
  private static applyAggressiveFixes(jsonString: string): string {
    // This approach handles multi-line strings by processing the JSON line by line
    const lines = jsonString.split('\n');
    let inMultilineString = false;
    let result: string[] = [];
    let currentKey: string | null = null;
    let multilineValue = "";
    
    // Process line by line to handle multi-line strings
    for (let i = 0; i < lines.length; i++) {
      const line = lines[i].trim();
      
      if (!inMultilineString) {
        // Check if this line starts a new key-value pair with a string that might continue
        const keyMatch = line.match(/"([^"]+)":\s*"(.*)$/);
        if (keyMatch && !line.endsWith('",') && !line.endsWith('"}')) {
          // This is the start of a multi-line string
          currentKey = keyMatch[1];
          multilineValue = keyMatch[2];
          inMultilineString = true;
        } else {
          // Regular line, add it as is
          result.push(line);
        }
      } else {
        // We're in a multi-line string
        if (line.endsWith('",') || line.endsWith('"}')) {
          // This is the end of the multi-line string
          multilineValue += "\n" + line.replace(/",?$/, '');
          inMultilineString = false;
          
          // Add the fixed key-value pair
          const lastLine = result.pop() || "";
          const prefix = lastLine.substring(0, lastLine.indexOf(currentKey || "") + (currentKey?.length || 0) + 2);
          result.push(`${prefix}${multilineValue}",`);
        } else {
          // Middle of a multi-line string
          multilineValue += "\n" + line;
        }
      }
    }
    
    // Join the result back into a string
    const processedJson = result.join('\n');
    
    // Apply simple fixes to the processed result
    let finalJson = this.applySimpleFixes(processedJson);
    
    // Check if our aggressive fix worked
    try {
      JSON.parse(finalJson);
      return finalJson;
    } catch (error) {
      // One more targeted approach for fields known to have issues
      return this.applyTargetedFixes(jsonString);
    }
  }

  /**
   * Apply targeted fixes for known problematic fields
   */
  private static applyTargetedFixes(jsonString: string): string {
    // Create a clean object to rebuild the JSON
    const rebuiltObj: Record<string, string> = {};
    
    // Extract each field individually
    const fieldRegex = /"([^"]+)":\s*"/g;
    let match;
    let lastIndex = 0;
    
    while ((match = fieldRegex.exec(jsonString)) !== null) {
      const key = match[1];
      const startIdx = match.index + match[0].length;
      
      // Find the end of this value
      let endIdx = this.findValueEnd(jsonString, startIdx);
      if (endIdx > startIdx) {
        // Extract and fix the value
        let value = jsonString.substring(startIdx, endIdx);
        
        // Replace newlines with escaped newlines
        value = value.replace(/\r?\n/g, '\n');
        
        // Add to our rebuilt object
        rebuiltObj[key] = value;
        
        // Update last index for next search
        lastIndex = endIdx + 1;
      }
    }
    
    // Convert back to JSON string with proper formatting
    try {
      return JSON.stringify(rebuiltObj, null, 2);
    } catch (e) {
      // If all else fails, do a direct replacement on known problematic fields
      let lastResortFix = jsonString;
      
      const problemFields = [
        "Existing Alternatives",
        "Channels",
        "Cost Structure",
        "Key Metrics"
      ];
      
      for (const field of problemFields) {
        const targetKey = `"${field}": "`;
        const startIdx = lastResortFix.indexOf(targetKey);
        
        if (startIdx > -1) {
          const valueStartIdx = startIdx + targetKey.length;
          const valueEndIdx = this.findValueEnd(lastResortFix, valueStartIdx);
          
          if (valueEndIdx > valueStartIdx) {
            const value = lastResortFix.substring(valueStartIdx, valueEndIdx);
            const fixedValue = value.replace(/\r?\n/g, '\n');
            
            lastResortFix = 
              lastResortFix.substring(0, valueStartIdx) + 
              fixedValue + 
              lastResortFix.substring(valueEndIdx);
          }
        }
      }
      
      return lastResortFix;
    }
  }

  /**
   * Helper method to find the end of a JSON string value
   */
  private static findValueEnd(jsonString: string, startIdx: number): number {
    let i = startIdx;
    let escaped = false;
    
    while (i < jsonString.length) {
      const char = jsonString[i];
      
      if (char === '\\') {
        escaped = !escaped;
      } else if (char === '"' && !escaped) {
        return i;
      } else {
        escaped = false;
      }
      
      i++;
    }
    
    return -1; // Not found
  }
  
  /**
   * Validate fixed JSON
   * @param {string} jsonString - The JSON string to validate
   * @returns {boolean} - Whether the JSON is valid
   */
  static validate(jsonString: string): boolean {
    try {
      JSON.parse(jsonString);
      return true;
    } catch (e) {
      return false;
    }
  }
} 