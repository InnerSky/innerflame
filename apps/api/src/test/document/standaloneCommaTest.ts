/**
 * Standalone test for comma handling in monetary values
 * This tests our replacement function specifically for handling values with commas
 */

import { processSearchReplace } from '../../services/documents/documentVersionService.js';

// Simple test to verify comma handling
async function runTest() {
  console.log('Testing comma handling in monetary values');
  
  const jsonContent = `{"Title":"InnerFlame","Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users."}`;
  
  const diffBlock = `<<<<<<< SEARCH
"Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users."
=======
"Revenue Streams":"**Tiered subscription model** starting at $98/month for core features and $298/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $1,798/month for 20 users."
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
    
    // Check Revenue Streams field
    if (!resultObj["Revenue Streams"]) {
      console.log('\n❌ FAIL: Revenue Streams field not found in result');
      return;
    }
    
    const revenueStreams = resultObj["Revenue Streams"];
    console.log('\n=== Revenue Streams Content ===');
    console.log(revenueStreams);
    
    // Check for specific issues
    const hasCommaValue = revenueStreams.includes('$1,798/month');
    const hasNestedQuotes = revenueStreams.includes('"Revenue Streams"');
    
    console.log('\n=== Test Results ===');
    if (hasCommaValue) {
      console.log('✅ SUCCESS: Revenue Streams contains price with comma ($1,798)');
    } else {
      console.log('❌ FAIL: Revenue Streams does not contain price with comma');
    }
    
    if (hasNestedQuotes) {
      console.log('❌ FAIL: Revenue Streams contains nested key name in its value');
    } else {
      console.log('✅ SUCCESS: Revenue Streams does not contain nested key name');
    }
    
    console.log('\n=== Overall Result ===');
    console.log(hasCommaValue && !hasNestedQuotes ? '✅ TEST PASSED' : '❌ TEST FAILED');
    
  } catch (error) {
    console.error('\n❌ ERROR parsing result JSON:', error);
  }
}

// Run the test
runTest(); 