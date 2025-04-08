/**
 * Simple test for JSON newline handling
 */

// Test function to validate newline handling in JSON 
function testJsonNewlineHandling() {
  console.log('Testing JSON newline handling...');
  
  // Original JSON with escaped newlines
  const originalJson = `{"title":"Test Document","content":"Line 1\\nLine 2\\nLine 3"}`;
  
  // Test 1: Proper JSON parsing preserves newlines as \n for display
  try {
    const parsedObj = JSON.parse(originalJson);
    console.log('Original parsed:', parsedObj);
    
    // When displaying in UI, \n should already be actual newlines after parsing
    const displayLines = parsedObj.content.split('\n');
    console.log('Display lines count:', displayLines.length);
    
    if (displayLines.length === 3) {
      console.log('✅ Test 1 PASSED: Correct number of lines after splitting');
    } else {
      console.log('❌ Test 1 FAILED: Wrong number of lines after splitting');
    }
  } catch (e) {
    console.error('❌ Test 1 FAILED: Error parsing JSON:', e);
  }
  
  // Test 2: Replacing content with actual newlines
  try {
    const obj = JSON.parse(originalJson);
    // Replace with text containing actual newlines
    obj.content = "New Line 1\nNew Line 2\nNew Line 3";
    
    // Stringify the object - should escape newlines properly
    const newJson = JSON.stringify(obj);
    console.log('New JSON:', newJson);
    
    // Check that newlines are properly escaped as \n (not \\n) in the JSON string
    if (newJson.includes('\\n') && !newJson.includes('\\\\n')) {
      console.log('✅ Test 2 PASSED: Newlines properly escaped in JSON string');
    } else {
      console.log('❌ Test 2 FAILED: Newlines not properly escaped in JSON string');
    }
    
    // Parse the new JSON to verify
    const reParsed = JSON.parse(newJson);
    // Now split on actual newlines (not escaped ones)
    const displayLines = reParsed.content.split('\n');
    
    if (displayLines.length === 3) {
      console.log('✅ Test 2 PASSED: Re-parsed JSON has correct number of lines');
    } else {
      console.log('❌ Test 2 FAILED: Re-parsed JSON has wrong number of lines');
      console.log('Display lines:', displayLines);
    }
  } catch (e) {
    console.error('❌ Test 2 FAILED: Error in newline replacement test:', e);
  }
  
  // Test 3: Handling literal \n sequences in JSON string (before parsing)
  try {
    const originalWithLiteralNewlines = `{"title":"Test Document","content":"Line 1\\nLine 2\\nLine 3"}`;
    
    // Replace with text containing literal \n sequences in the JSON string
    let replacedContent = originalWithLiteralNewlines.replace(
      '"content":"Line 1\\nLine 2\\nLine 3"',
      '"content":"New Line 1\\nNew Line 2\\nNew Line 3"'
    );
    
    // Parse and check
    const parsedObj = JSON.parse(replacedContent);
    console.log('Parsed with literal \\n:', parsedObj);
    
    // After parsing, we should have actual newlines
    const displayLines = parsedObj.content.split('\n');
    console.log('Test 3 display lines count:', displayLines.length);
    
    if (displayLines.length === 3) {
      console.log('✅ Test 3 PASSED: Literal \\n sequences correctly converted to newlines during parsing');
    } else {
      console.log('❌ Test 3 FAILED: Literal \\n sequences not correctly converted');
      console.log('Display lines:', displayLines);
    }
  } catch (e) {
    console.error('❌ Test 3 FAILED: Error in literal \\n test:', e);
  }
  
  // Test 4: Ensuring JSON.stringify properly escapes newlines 
  try {
    const objWithNewlines = {
      title: "Test Document",
      content: "Line with\na newline\ncharacter"
    };
    
    // Convert to JSON - this should properly escape the newlines
    const jsonStr = JSON.stringify(objWithNewlines);
    console.log('JSON with escaped newlines:', jsonStr);
    
    // The JSON string should contain the escaped sequence \n, not actual newlines
    if (jsonStr.includes('\\n') && !jsonStr.includes('\n\n')) {
      console.log('✅ Test 4 PASSED: JSON.stringify properly escapes newlines');
    } else {
      console.log('❌ Test 4 FAILED: JSON.stringify did not properly escape newlines');
    }
  } catch (e) {
    console.error('❌ Test 4 FAILED: Error testing JSON.stringify:', e);
  }
  
  console.log('All tests completed');
}

// Execute the test
console.log('======================================');
console.log('Running Simple JSON Newline Tests');
console.log('======================================');

testJsonNewlineHandling();

console.log('======================================'); 