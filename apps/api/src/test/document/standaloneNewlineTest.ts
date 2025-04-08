import { processSearchReplace } from '../../services/documents/documentVersionService.js';

/**
 * Test newline encoding in JSON - checks that we have proper \n encoding in JSON
 * not double-escaped \\n which would be incorrect and render improperly in the UI
 */
function testCorrectNewlineEncoding() {
  console.log('Testing correct newline encoding in bulleted lists');
  
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
  
  // Capture raw JSON structure to check encoding
  console.log('Raw JSON result:', result);
  
  // Check for double-escaped newlines which indicate a problem
  const hasDoubleEscapedNewlines = result.includes('\\\\n');
  const hasCorrectNewlines = result.includes('\\n') && !hasDoubleEscapedNewlines;
  
  if (hasDoubleEscapedNewlines) {
    console.log('❌ FAIL: JSON contains double-escaped newlines (\\\\n) which is incorrect');
  } else if (hasCorrectNewlines) {
    console.log('✅ PASS: JSON contains correctly escaped newlines (\\n)');
  } else {
    console.log('❓ UNKNOWN: Could not find any newline encodings');
  }
  
  // Parse JSON to verify we can display it correctly
  try {
    const resultObj = JSON.parse(result);
    const existingAlternatives = resultObj["Existing Alternatives"];
    
    // Simulate what would happen when displaying this content in UI
    // In the UI, \n would be rendered as actual newlines
    const displayValue = existingAlternatives.replace(/\\n/g, '\n');
    
    // Verify the display format has proper line breaks
    const displayLines = displayValue.split('\n');
    console.log('Display lines count:', displayLines.length);
    console.log('First line:', displayLines[0]);
    
    // Expected: 5 bullet points with 4 newlines between them
    const correctLineCount = displayLines.length === 5;
    const allLinesStartWithDash = displayLines.every((line: string) => line.trim().startsWith('-'));
    
    if (correctLineCount && allLinesStartWithDash) {
      console.log('✅ PASS: Content displays correctly with proper newlines');
    } else {
      console.log('❌ FAIL: Content does not display correctly');
      console.log('Lines:', displayLines);
    }
    
    return {
      success: hasCorrectNewlines && correctLineCount && allLinesStartWithDash,
      result,
      isDoubleEscaped: hasDoubleEscapedNewlines
    };
  } catch (error) {
    console.error('Error parsing JSON result:', error);
    return {
      success: false,
      result,
      error: error instanceof Error ? error.message : 'Unknown error',
      isDoubleEscaped: hasDoubleEscapedNewlines
    };
  }
}

// Run the test
const result = testCorrectNewlineEncoding();

// Exit with appropriate code
if (result.success) {
  console.log('✅ TEST PASSED: Newline encoding is correct');
  process.exit(0);
} else {
  console.error('❌ TEST FAILED: Newline encoding is incorrect');
  if (result.isDoubleEscaped) {
    console.error('The JSON contains double-escaped newlines (\\\\n) which will display incorrectly');
    console.error('This is likely caused by manually escaping newlines in the code before JSON.stringify()');
  }
  process.exit(1);
} 