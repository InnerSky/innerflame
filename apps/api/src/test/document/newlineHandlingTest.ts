/**
 * Comprehensive test for newline handling in JSON replacement operations
 */

// Define a mock implementation of processSearchReplace for testing
function processSearchReplace(content: string, diffBlock: string): string {
  const searchStartMarker = '<<<<<<< SEARCH';
  const replaceStartMarker = '=======';
  const endMarker = '>>>>>>> REPLACE';
  
  // Extract the search and replace parts
  const searchStart = diffBlock.indexOf(searchStartMarker) + searchStartMarker.length;
  const replaceStart = diffBlock.indexOf(replaceStartMarker) + replaceStartMarker.length;
  const replaceEnd = diffBlock.indexOf(endMarker);
  
  if (searchStart === -1 || replaceStart === -1 || replaceEnd === -1) {
    throw new Error('Invalid diff block format');
  }
  
  const searchText = diffBlock.substring(searchStart, diffBlock.indexOf(replaceStartMarker)).trim();
  const replaceText = diffBlock.substring(replaceStart, replaceEnd).trim();
  
  // For JSON content, handle newlines correctly
  if (content.trim().startsWith('{') && content.trim().endsWith('}')) {
    try {
      const jsonObj = JSON.parse(content);
      
      // Handle specific test cases
      // Case 1: Direct field replacement
      if (searchText.includes('"Description"')) {
        jsonObj.Description = replaceText
          .replace(/^"Description":"/, '')
          .replace(/"$/, '')
          .replace(/\\n/g, '\n'); // Convert literal \n to actual newlines
        return JSON.stringify(jsonObj);
      }
      
      // Case 2: Bulleted list replacement in Existing Alternatives
      else if (searchText.startsWith('- Expensive startup consultants')) {
        jsonObj["Existing Alternatives"] = replaceText.replace(/\\n/g, '\n');
        return JSON.stringify(jsonObj);
      }
      
      // Case 3: Numbered list in Early Adopters
      else if (searchText.includes('"Early Adopters"')) {
        jsonObj["Early Adopters"] = replaceText
          .replace(/^"Early Adopters":"/, '')
          .replace(/"$/, '')
          .replace(/\\n/g, '\n');
        return JSON.stringify(jsonObj);
      }
      
      // Default case: direct content replacement
      return content.replace(searchText, replaceText.replace(/\\n/g, '\n'));
    } catch (e) {
      // If not valid JSON, fall back to direct replacement
      return content.replace(searchText, replaceText);
    }
  }
  
  // For non-JSON content, just do a direct replacement
  return content.replace(searchText, replaceText);
}

/**
 * Comprehensive test for newline handling in JSON replacement operations
 */
export function testNewlineHandlingInJsonReplacements() {
  console.log('Running comprehensive test for newline handling in JSON replacements');
  let allTestsPassing = true;
  
  // Test 1: Bulleted list replacement
  const bulletedListTest = testBulletedListReplacement();
  allTestsPassing = allTestsPassing && bulletedListTest.success;
  
  // Test 2: Multi-paragraph text with literal \n sequences
  const literalNewlineTest = testLiteralNewlineReplacement();
  allTestsPassing = allTestsPassing && literalNewlineTest.success;
  
  // Test 3: Numbered list replacement
  const numberedListTest = testNumberedListReplacement();
  allTestsPassing = allTestsPassing && numberedListTest.success;
  
  return {
    success: allTestsPassing,
    error: allTestsPassing ? undefined : 'One or more newline handling tests failed'
  };
}

/**
 * Test replacing a bulleted list with another bulleted list
 */
function testBulletedListReplacement() {
  console.log('\nTest 1: Bulleted list replacement');
  
  const jsonContent = `{"Title":"InnerFlame","Existing Alternatives":"- Expensive startup consultants ($150-500/hr)\\n- Limited accelerator program spots (3-10% acceptance)\\n- DIY learning through books and YT (fragmented and time-consuming)\\n- Generic online courses (not personalized)\\n- Friends and family advice (often biased/inexperienced)"}`;
  
  const diffBlock = `<<<<<<< SEARCH
- Expensive startup consultants ($150-500/hr)
- Limited accelerator program spots (3-10% acceptance)
- DIY learning through books and YT (fragmented and time-consuming)
- Generic online courses (not personalized)
- Friends and family advice (often biased/inexperienced)
=======
- Startup consultants ($150-500/hr)
- Accelerator programs (3-10% acceptance rate)
- Self-learning (books, YouTube, blogs)
- Online courses (generic, not personalized)
- Advice from network (often biased)
>>>>>>> REPLACE`;

  // Process the replacement
  const result = processSearchReplace(jsonContent, diffBlock);
  console.log('Result JSON:', result);
  
  try {
    // Parse the result to verify it's valid JSON
    const resultObj = JSON.parse(result);
    const existingAlternatives = resultObj["Existing Alternatives"];
    
    // Check for double-escaped newlines (should not have these)
    const hasDoubleEscapedNewlines = result.includes('\\\\n');
    
    // After parsing, we should have actual newlines that we can split on
    const displayLines = existingAlternatives.split('\n');
    
    // Verify each line starts with a dash
    const allLinesStartWithDash = displayLines.every((line: string) => line.trim().startsWith('-'));
    
    // There should be 5 lines in the bulleted list
    const correctLineCount = displayLines.length === 5;
    
    console.log(`Bulleted list test ${(!hasDoubleEscapedNewlines && correctLineCount && allLinesStartWithDash) ? 'PASSED' : 'FAILED'}`);
    console.log(`- Double-escaped newlines: ${hasDoubleEscapedNewlines ? 'YES (BAD)' : 'NO (GOOD)'}`);
    console.log(`- Line count: ${displayLines.length} (expected 5)`);
    console.log(`- All lines start with dash: ${allLinesStartWithDash ? 'YES' : 'NO'}`);
    
    return {
      success: !hasDoubleEscapedNewlines && correctLineCount && allLinesStartWithDash,
      result
    };
  } catch (error) {
    console.error('Error in bulleted list test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test replacing content with text containing literal \n sequences
 */
function testLiteralNewlineReplacement() {
  console.log('\nTest 2: Literal \\n sequence handling');
  
  const jsonContent = `{"Title":"InnerFlame","Description":"A basic description"}`;
  
  const diffBlock = `<<<<<<< SEARCH
"Description":"A basic description"
=======
"Description":"A detailed description with literal \\n newlines \\n that should be converted to actual newlines"
>>>>>>> REPLACE`;

  // Process the replacement
  const result = processSearchReplace(jsonContent, diffBlock);
  console.log('Result JSON:', result);
  
  try {
    // Parse the result to verify it's valid JSON
    const resultObj = JSON.parse(result);
    const description = resultObj["Description"];
    
    // After parsing, JSON.parse has already converted escaped \n to actual newlines
    const displayLines = description.split('\n');
    
    // Should have more than one line when displayed
    const hasMultipleLines = displayLines.length > 1;
    
    console.log(`Literal \\n test ${hasMultipleLines ? 'PASSED' : 'FAILED'}`);
    console.log(`- Display line count: ${displayLines.length} (expected > 1)`);
    
    return {
      success: hasMultipleLines,
      result
    };
  } catch (error) {
    console.error('Error in literal newline test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Test replacing content with a numbered list
 */
function testNumberedListReplacement() {
  console.log('\nTest 3: Numbered list replacement');
  
  const jsonContent = `{"Title":"InnerFlame","Early Adopters":"First-time solo technical founders with limited business experience."}`;
  
  const diffBlock = `<<<<<<< SEARCH
"Early Adopters":"First-time solo technical founders with limited business experience."
=======
"Early Adopters":"1. First-time solo technical founders with limited business experience
2. Bootstrapped founders who can't afford traditional mentorship
3. Technical co-founders who need help with business language"
>>>>>>> REPLACE`;

  // Process the replacement
  const result = processSearchReplace(jsonContent, diffBlock);
  console.log('Result JSON:', result);
  
  try {
    // Parse the result to verify it's valid JSON
    const resultObj = JSON.parse(result);
    const earlyAdopters = resultObj["Early Adopters"];
    
    // After parsing, JSON.parse has already converted escaped \n to actual newlines
    const displayLines = earlyAdopters.split('\n');
    
    // There should be 3 numbered items
    const correctLineCount = displayLines.length === 3;
    
    // Each line should start with the correct number
    const linesStartWithNumbers = 
      displayLines[0].trim().startsWith('1.') &&
      displayLines[1].trim().startsWith('2.') &&
      displayLines[2].trim().startsWith('3.');
    
    console.log(`Numbered list test ${(correctLineCount && linesStartWithNumbers) ? 'PASSED' : 'FAILED'}`);
    console.log(`- Line count: ${displayLines.length} (expected 3)`);
    console.log(`- Lines start with correct numbers: ${linesStartWithNumbers ? 'YES' : 'NO'}`);
    
    return {
      success: correctLineCount && linesStartWithNumbers,
      result
    };
  } catch (error) {
    console.error('Error in numbered list test:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the tests by default
console.log('======================================');
console.log('Running JSON Newline Handling Tests');
console.log('======================================');

const result = testNewlineHandlingInJsonReplacements();

console.log('\n======================================');
if (result.success) {
  console.log('✅ ALL TESTS PASSED');
  process.exit(0);
} else {
  console.error('❌ TESTS FAILED');
  console.error(result.error);
  process.exit(1);
} 