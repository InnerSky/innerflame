import { processSearchReplace } from '../../services/documents/documentVersionService.js';

/**
 * Test literal "\n" string handling in text content
 * This ensures that text containing literal "\n" sequences are properly handled
 */
function testLiteralNewlineHandling() {
  console.log('Testing handling of literal "\\n" sequences in text');

  // JSON with a simple structure for testing
  const jsonContent = `{"Title":"InnerFlame","Our Why":"We want to democratise founder education\\nWe want to help founders get their first paying customer\\nWe want to inspire a new generation of founders to turn their vision into reality"}`;

  // Diff block adding a Mantra field with literal \n sequences in the text
  const diffBlock = `<<<<<<< SEARCH
"Our Why":"We want to democratise founder education\\nWe want to help founders get their first paying customer\\nWe want to inspire a new generation of founders to turn their vision into reality"}
=======
"Our Why":"We want to democratise founder education\\nWe want to help founders get their first paying customer\\nWe want to inspire a new generation of founders to turn their vision into reality",

"Mantra":"**Ignite Your Potential, Build With Confidence**\\n\\nAt InnerFlame, we believe that entrepreneurial success shouldn't be limited by access to mentorship or education. We exist to democratize the startup journey, making world-class guidance accessible to every founder regardless of their background or resources.\\n\\nWe stand as the trusted companion who walks beside you through uncertainty, transforms complex frameworks into actionable steps, and celebrates your victories both small and large. Our AI doesn't replace human wisdom—it amplifies it, bringing proven methodologies to life when you need them most.\\n\\nEvery founder deserves the chance to see their vision become reality. By combining cutting-edge technology with timeless entrepreneurial principles, we're creating a world where passion paired with the right guidance can truly change the world. Your inner flame is what drives you—we're just here to help it burn brighter."}
>>>>>>> REPLACE`;

  // Process the replacement
  const result = processSearchReplace(jsonContent, diffBlock);

  try {
    // Parse the result to verify it's valid JSON
    const resultObj = JSON.parse(result);
    console.log('Result is valid JSON');

    // Check if the Mantra field was added and contains proper newlines
    if (!resultObj["Mantra"]) {
      console.log('❌ FAIL: Mantra field was not added to JSON');
      return { success: false, result };
    }

    const mantraValue = resultObj["Mantra"];
    console.log('Raw Mantra value:', JSON.stringify(mantraValue));

    // Check for literal \n sequences that shouldn't be in the JSON representation
    const containsLiteralBackslashN = mantraValue.includes('\\n');
    if (containsLiteralBackslashN) {
      console.log('❌ FAIL: Mantra field contains literal "\\\\n" sequences');
    } else {
      console.log('✅ PASS: Mantra field does not contain literal "\\\\n" sequences');
    }

    // Check if actual newlines are present - they should be escaped as \n in JSON
    const containsEscapedNewlines = (JSON.stringify(mantraValue).match(/\\n/g) || []).length > 0;
    if (containsEscapedNewlines) {
      console.log('✅ PASS: Mantra field contains properly escaped newlines in JSON');
    } else {
      console.log('❌ FAIL: Mantra field is missing expected newlines');
    }

    // Simulate how this would be displayed in the UI
    const displayMantra = mantraValue.replace(/\\n/g, '\n');
    const mantraLines = displayMantra.split('\n');
    console.log(`Mantra would display as ${mantraLines.length} lines of text`);
    console.log('First line:', mantraLines[0]);

    // The mantra should have multiple paragraphs with blank lines between them
    const hasMultipleParagraphs = mantraLines.some((line: string) => line === '');
    if (hasMultipleParagraphs) {
      console.log('✅ PASS: Mantra displays with multiple paragraphs');
    } else {
      console.log('❌ FAIL: Mantra is missing paragraph breaks');
    }

    return {
      success: !containsLiteralBackslashN && containsEscapedNewlines && hasMultipleParagraphs,
      result
    };
  } catch (error) {
    console.error('Error parsing result JSON:', error);
    return {
      success: false,
      result,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

// Run the test
const result = testLiteralNewlineHandling();

// Exit with appropriate code
if (result.success) {
  console.log('✅ TEST PASSED: Literal "\\n" sequences are handled correctly');
  process.exit(0);
} else {
  console.error('❌ TEST FAILED: Literal "\\n" sequences are not handled correctly');
  process.exit(1);
} 