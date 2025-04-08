/**
 * Standalone test for numbered list replacement
 * This tests our replacement function specifically for handling numbered lists without duplicating field name
 */

import { processSearchReplace } from '../../services/documents/documentVersionService.js';

// Simple test to verify numbered list handling
async function runTest() {
  console.log('Testing numbered list replacement in Early Adopters field');
  
  const jsonContent = `{"Title":"InnerFlame","Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out."}`;
  
  const diffBlock = `<<<<<<< SEARCH
"Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out."
=======
"Early Adopters":"1. First-time solo technical founders with limited business experience who need guidance on business fundamentals.

2. Bootstrapped founders who can't afford traditional mentorship but are committed to methodical validation.

3. Technical co-founders who need help translating their technical vision into business language for investors and partners."
>>>>>>> REPLACE`;

  console.log('\n=== Original Content ===');
  console.log(jsonContent);
  
  console.log('\n=== Diff Block ===');
  console.log(diffBlock);
  
  // Run the test
  const result = processSearchReplace(jsonContent, diffBlock);
  
  // Check the result
  try {
    console.log('\n=== Raw Result ===');
    console.log(result);
    
    const resultObj = JSON.parse(result);
    console.log('\n=== Result is valid JSON ===');
    console.log(JSON.stringify(resultObj, null, 2));
    
    // Check Early Adopters field
    if (!resultObj["Early Adopters"]) {
      console.log('\n❌ FAIL: Early Adopters field not found in result');
      return;
    }
    
    const earlyAdopters = resultObj["Early Adopters"];
    console.log('\n=== Early Adopters Content ===');
    console.log(earlyAdopters);
    
    // Check for specific issues
    const hasDuplicateFieldName = earlyAdopters.includes('"Early Adopters"');
    const hasAllNumberedItems = earlyAdopters.includes('1.') && 
                               earlyAdopters.includes('2.') && 
                               earlyAdopters.includes('3.');
    
    console.log('\n=== Test Results ===');
    if (hasDuplicateFieldName) {
      console.log('❌ FAIL: Early Adopters contains duplicated field name in its value');
    } else {
      console.log('✅ SUCCESS: Early Adopters does not contain duplicated field name');
    }
    
    if (hasAllNumberedItems) {
      console.log('✅ SUCCESS: Early Adopters contains all numbered list items');
    } else {
      console.log('❌ FAIL: Early Adopters is missing some numbered list items');
    }
    
    console.log('\n=== Overall Result ===');
    console.log(!hasDuplicateFieldName && hasAllNumberedItems ? '✅ TEST PASSED' : '❌ TEST FAILED');
    
  } catch (error) {
    console.error('\n❌ ERROR parsing result JSON:', error);
  }
}

// Run the test
runTest(); 