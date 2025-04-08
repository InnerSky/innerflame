import { 
  processSearchReplace,
  extractDiffBlocks,
  applyDiffBlocks 
} from '../../services/documents/documentVersionService.js';

/**
 * Test case for document replacement
 */
interface DocumentReplaceTest {
  name: string;
  originalContent: string;
  replacementInstructions: string;
  expectedResult?: string; // Optional: if provided, the result should match this exactly
  shouldSucceed: boolean; // Whether the replacement should succeed (result is valid JSON)
}

/**
 * Check if a string is valid JSON
 */
function isValidJson(str: string): boolean {
  try {
    JSON.parse(str);
    return true;
  } catch (e) {
    return false;
  }
}

/**
 * Run a single test case and return the result
 */
function runTest(test: DocumentReplaceTest): {
  success: boolean;
  resultIsValidJson: boolean;
  result: string;
  error?: string;
} {
  try {
    console.log(`Running test: ${test.name}`);
    
    // Apply the diff blocks
    const result = applyDiffBlocks(test.originalContent, test.replacementInstructions);
    
    // Check if the result is valid JSON
    const resultIsValidJson = isValidJson(result);
    
    // If an expected result is provided, check if the result matches
    let matchesExpected = true;
    if (test.expectedResult) {
      // For JSON content, we compare the parsed objects instead of raw strings
      // This allows for different key ordering but same content
      if (isValidJson(result) && isValidJson(test.expectedResult)) {
        const resultObj = JSON.parse(result);
        const expectedObj = JSON.parse(test.expectedResult);
        
        // Check if all expected keys with their values exist in the result
        for (const [key, value] of Object.entries(expectedObj)) {
          if (!(key in resultObj) || JSON.stringify(resultObj[key]) !== JSON.stringify(value)) {
            matchesExpected = false;
            break;
          }
        }
        
        // Check if all keys in result exist in expected (to catch extras)
        for (const key of Object.keys(resultObj)) {
          if (!(key in expectedObj)) {
            matchesExpected = false;
            break;
          }
        }
      } else {
        // For non-JSON content, do a direct string comparison
        matchesExpected = result === test.expectedResult;
      }
    }
    
    // Print comparison if expected result is provided
    if (test.expectedResult && !matchesExpected) {
      console.log('EXPECTED JSON:');
      console.log(JSON.stringify(JSON.parse(test.expectedResult), null, 2));
      console.log('ACTUAL JSON:');
      console.log(JSON.stringify(JSON.parse(result), null, 2));
      console.log('DIFFERENCE: Expected but not found in actual:');
      try {
        const expectedObj = JSON.parse(test.expectedResult);
        const actualObj = JSON.parse(result);
        // Check for added keys that should be in actual but aren't
        Object.entries(expectedObj).forEach(([key, value]) => {
          if (actualObj[key] !== value) {
            console.log(`${key}: ${JSON.stringify(value)} vs ${JSON.stringify(actualObj[key])}`);
          }
        });
      } catch (e) {
        console.log('Error comparing JSON objects');
      }
    }
    
    // The test succeeds if:
    // 1. The result is valid JSON (if shouldSucceed is true)
    // 2. The result is not valid JSON (if shouldSucceed is false)
    // 3. The result matches the expected result (if provided)
    const success = (resultIsValidJson === test.shouldSucceed) && matchesExpected;
    
    return {
      success,
      resultIsValidJson,
      result,
      error: success ? undefined : 'Result did not match expectations'
    };
  } catch (error) {
    return {
      success: false,
      resultIsValidJson: false,
      result: test.originalContent,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Run all test cases and report the results
 */
function runAllTests(tests: DocumentReplaceTest[]): void {
  console.log(`Running ${tests.length} document replacement tests`);
  console.log('='.repeat(50));
  
  let passed = 0;
  let failed = 0;
  
  for (const test of tests) {
    const result = runTest(test);
    
    if (result.success) {
      passed++;
      console.log(`✅ PASS: ${test.name}`);
    } else {
      failed++;
      console.log(`❌ FAIL: ${test.name}`);
      console.log(`   Error: ${result.error}`);
      console.log(`   JSON Valid: ${result.resultIsValidJson}`);
      console.log('   Result:');
      console.log(result.result);
    }
    console.log('-'.repeat(50));
  }
  
  console.log('='.repeat(50));
  console.log(`Tests completed: ${passed + failed} total, ${passed} passed, ${failed} failed`);
  
  if (failed > 0) {
    console.error('Some tests failed!');
    process.exit(1);
  } else {
    console.log('All tests passed!');
  }
}

// Define test cases
const TEST_CASES: DocumentReplaceTest[] = [
  {
    name: 'Adding Mantra field at document beginning',
    originalContent: `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Customer Segments":"Founders","Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out.","Problem":"**Startup mentorship** are often costly and inaccessible.\\n\\n**Startup education** are often time-consuming, unpersonalized, and fragmented.\\n\\nLacking guidance, founders feel unconfident, distracted, and often build products without proper validation, falling into common traps despite consuming startup content. \\n","Existing Alternatives":"- Expensive startup consultants ($150-500/hr)\\n- Limited accelerator program spots (3-10% acceptance)\\n- DIY learning through books and YT (fragmented and time-consuming)\\n- Generic online courses (not personalized)\\n- Friends and family advice (often biased/inexperienced)","Unique Value Proposition":"**Skip the learning curve**\\nApply startup knowledge first with AI, then learn from that experience. \\n\\n**Built-in learning cycle**\\nSet milestones to test hypothesis. And live it with daily journal and weekly review to surface insights and iterate.\\n\\n**Single source of truth**\\nClear documentation of the evolution of your strategies to make data driven decisions. ","High Level Concept":"Your 1-on-1 accessible and affordable startup mentor who builds your venture with you.","Solution":"AI mentor writes your business document with you to **think strategically** with proven frameworks. \\n\\nAI coach chat with you to boost self-awareness and accelerate growth.","Channels":"","Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users.","Cost Structure":"- AI model development and improvement: $25,000/month\\n- Infrastructure and computing: $8,000/month\\n- Product and engineering team: $45,000/month\\n- Content and domain expertise acquisition: $15,000/month","Key Metrics":"","Unfair Advantage":"TBD\\n(Seek opportunity to create network effect)","Our Why":"We want to democratise founder education\\nWe want to help founders get their first paying customer\\nWe want to inspire a new generation of founders to turn their vision into reality"}`,
    replacementInstructions: `<replace_in_file>
<diff>
<<<<<<< SEARCH
{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance",
=======
{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Mantra":"Ignite your vision, navigate with wisdom",
>>>>>>> REPLACE
</diff>
</replace_in_file>`,
    expectedResult: `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Mantra":"Ignite your vision, navigate with wisdom","Customer Segments":"Founders","Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out.","Problem":"**Startup mentorship** are often costly and inaccessible.\\n\\n**Startup education** are often time-consuming, unpersonalized, and fragmented.\\n\\nLacking guidance, founders feel unconfident, distracted, and often build products without proper validation, falling into common traps despite consuming startup content. \\n","Existing Alternatives":"- Expensive startup consultants ($150-500/hr)\\n- Limited accelerator program spots (3-10% acceptance)\\n- DIY learning through books and YT (fragmented and time-consuming)\\n- Generic online courses (not personalized)\\n- Friends and family advice (often biased/inexperienced)","Unique Value Proposition":"**Skip the learning curve**\\nApply startup knowledge first with AI, then learn from that experience. \\n\\n**Built-in learning cycle**\\nSet milestones to test hypothesis. And live it with daily journal and weekly review to surface insights and iterate.\\n\\n**Single source of truth**\\nClear documentation of the evolution of your strategies to make data driven decisions. ","High Level Concept":"Your 1-on-1 accessible and affordable startup mentor who builds your venture with you.","Solution":"AI mentor writes your business document with you to **think strategically** with proven frameworks. \\n\\nAI coach chat with you to boost self-awareness and accelerate growth.","Channels":"","Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users.","Cost Structure":"- AI model development and improvement: $25,000/month\\n- Infrastructure and computing: $8,000/month\\n- Product and engineering team: $45,000/month\\n- Content and domain expertise acquisition: $15,000/month","Key Metrics":"","Unfair Advantage":"TBD\\n(Seek opportunity to create network effect)","Our Why":"We want to democratise founder education\\nWe want to help founders get their first paying customer\\nWe want to inspire a new generation of founders to turn their vision into reality"}`,
    shouldSucceed: true
  },
  {
    name: 'Updating Unfair Advantage with multiline content',
    originalContent: `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Customer Segments":"Founders","Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out.","Problem":"**Startup mentorship** are often costly and inaccessible.\\n\\n**Startup education** are often time-consuming, unpersonalized, and fragmented.\\n\\nLacking guidance, founders feel unconfident, distracted, and often build products without proper validation, falling into common traps despite consuming startup content. \\n","Existing Alternatives":"- Expensive startup consultants ($150-500/hr)\\n- Limited accelerator program spots (3-10% acceptance)\\n- DIY learning through books and YT (fragmented and time-consuming)\\n- Generic online courses (not personalized)\\n- Friends and family advice (often biased/inexperienced)","Unique Value Proposition":"**Skip the learning curve**\\nApply startup knowledge first with AI, then learn from that experience. \\n\\n**Built-in learning cycle**\\nSet milestones to test hypothesis. And live it with daily journal and weekly review to surface insights and iterate.\\n\\n**Single source of truth**\\nClear documentation of the evolution of your strategies to make data driven decisions. ","High Level Concept":"Your 1-on-1 accessible and affordable startup mentor who builds your venture with you.","Solution":"AI mentor writes your business document with you to **think strategically** with proven frameworks. \\n\\nAI coach chat with you to boost self-awareness and accelerate growth.","Channels":"","Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users.","Cost Structure":"- AI model development and improvement: $25,000/month\\n- Infrastructure and computing: $8,000/month\\n- Product and engineering team: $45,000/month\\n- Content and domain expertise acquisition: $15,000/month","Key Metrics":"","Unfair Advantage":"TBD\\n(Seek opportunity to create network effect)","Our Why":"We want to democratise founder education\\nWe want to help founders get their first paying customer\\nWe want to inspire a new generation of founders to turn their vision into reality"}`,
    replacementInstructions: `<replace_in_file>
<diff>
<<<<<<< SEARCH
"Unfair Advantage":"TBD
(Seek opportunity to create network effect)"
=======
"Unfair Advantage":"**Proprietary AI training on startup methodologies**
Our models are specifically trained on startup frameworks and founder experiences.

**Continuous learning system**
Our platform improves with each founder interaction, creating a virtuous cycle of knowledge.

**Scalable personalization**
We can deliver personalized guidance at scale in a way human mentors cannot."
>>>>>>> REPLACE
</diff>
</replace_in_file>`,
    shouldSucceed: true
  },
  {
    name: 'Combined test with both replacements',
    originalContent: `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Customer Segments":"Founders","Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out.","Problem":"**Startup mentorship** are often costly and inaccessible.\\n\\n**Startup education** are often time-consuming, unpersonalized, and fragmented.\\n\\nLacking guidance, founders feel unconfident, distracted, and often build products without proper validation, falling into common traps despite consuming startup content. \\n","Existing Alternatives":"- Expensive startup consultants ($150-500/hr)\\n- Limited accelerator program spots (3-10% acceptance)\\n- DIY learning through books and YT (fragmented and time-consuming)\\n- Generic online courses (not personalized)\\n- Friends and family advice (often biased/inexperienced)","Unique Value Proposition":"**Skip the learning curve**\\nApply startup knowledge first with AI, then learn from that experience. \\n\\n**Built-in learning cycle**\\nSet milestones to test hypothesis. And live it with daily journal and weekly review to surface insights and iterate.\\n\\n**Single source of truth**\\nClear documentation of the evolution of your strategies to make data driven decisions. ","High Level Concept":"Your 1-on-1 accessible and affordable startup mentor who builds your venture with you.","Solution":"AI mentor writes your business document with you to **think strategically** with proven frameworks. \\n\\nAI coach chat with you to boost self-awareness and accelerate growth.","Channels":"","Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users.","Cost Structure":"- AI model development and improvement: $25,000/month\\n- Infrastructure and computing: $8,000/month\\n- Product and engineering team: $45,000/month\\n- Content and domain expertise acquisition: $15,000/month","Key Metrics":"","Unfair Advantage":"TBD\\n(Seek opportunity to create network effect)","Our Why":"We want to democratise founder education\\nWe want to help founders get their first paying customer\\nWe want to inspire a new generation of founders to turn their vision into reality"}`,
    replacementInstructions: `<replace_in_file>
<diff>
<<<<<<< SEARCH
{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance",
=======
{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Mantra":"Ignite your vision, navigate with wisdom",
>>>>>>> REPLACE
</diff>
</replace_in_file>

<replace_in_file>
<diff>
<<<<<<< SEARCH
"Unfair Advantage":"TBD
(Seek opportunity to create network effect)"
=======
"Unfair Advantage":"**Proprietary AI training on startup methodologies**
Our models are specifically trained on startup frameworks and founder experiences.

**Continuous learning system**
Our platform improves with each founder interaction, creating a virtuous cycle of knowledge.

**Scalable personalization**
We can deliver personalized guidance at scale in a way human mentors cannot."
>>>>>>> REPLACE
</diff>
</replace_in_file>`,
    shouldSucceed: true
  },
  {
    name: 'Using multiple key-value pairs as anchors to add a new field',
    originalContent: `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Customer Segments":"Founders","Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out.","Problem":"**Startup mentorship** are often costly and inaccessible.\\n\\n**Startup education** are often time-consuming, unpersonalized, and fragmented.\\n\\nLacking guidance, founders feel unconfident, distracted, and often build products without proper validation, falling into common traps despite consuming startup content. \\n","Existing Alternatives":"- Expensive startup consultants ($150-500/hr)\\n- Limited accelerator program spots (3-10% acceptance)\\n- DIY learning through books and YT (fragmented and time-consuming)\\n- Generic online courses (not personalized)\\n- Friends and family advice (often biased/inexperienced)","Unique Value Proposition":"**Skip the learning curve**\\nApply startup knowledge first with AI, then learn from that experience. \\n\\n**Built-in learning cycle**\\nSet milestones to test hypothesis. And live it with daily journal and weekly review to surface insights and iterate.\\n\\n**Single source of truth**\\nClear documentation of the evolution of your strategies to make data driven decisions. ","High Level Concept":"Your 1-on-1 accessible and affordable startup mentor who builds your venture with you.","Solution":"AI mentor writes your business document with you to **think strategically** with proven frameworks. \\n\\nAI coach chat with you to boost self-awareness and accelerate growth.","Channels":"","Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users.","Cost Structure":"- AI model development and improvement: $25,000/month\\n- Infrastructure and computing: $8,000/month\\n- Product and engineering team: $45,000/month\\n- Content and domain expertise acquisition: $15,000/month","Key Metrics":"","Unfair Advantage":"TBD\\n(Seek opportunity to create network effect)","Our Why":"We want to democratise founder education\\nWe want to help founders get their first paying customer\\nWe want to inspire a new generation of founders to turn their vision into reality"}`,
    replacementInstructions: `<replace_in_file>
<diff>
<<<<<<< SEARCH
"Cost Structure":"- AI model development and improvement: $25,000/month
- Infrastructure and computing: $8,000/month
- Product and engineering team: $45,000/month
- Content and domain expertise acquisition: $15,000/month","Key Metrics":""
=======
"Cost Structure":"- AI model development and improvement: $25,000/month
- Infrastructure and computing: $8,000/month
- Product and engineering team: $45,000/month
- Content and domain expertise acquisition: $15,000/month","Key Metrics":"- Monthly active users (MAU)
- User retention rate (weekly/monthly)
- Average session duration
- Features used per session
- Time to first milestone completion"
>>>>>>> REPLACE
</diff>
</replace_in_file>`,
    shouldSucceed: true
  },
  {
    name: 'Proving the issue with direct field manipulation',
    originalContent: `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Customer Segments":"Founders"}`,
    replacementInstructions: `<replace_in_file>
<diff>
<<<<<<< SEARCH
{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance",
=======
{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Mantra":"Ignite your vision, navigate with wisdom",
>>>>>>> REPLACE
</diff>
</replace_in_file>`,
    expectedResult: `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Mantra":"Ignite your vision, navigate with wisdom","Customer Segments":"Founders"}`,
    shouldSucceed: true
  },
  {
    name: 'Replacing a multi-line bulleted list in Existing Alternatives field',
    originalContent: `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Customer Segments":"Founders","Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out.","Problem":"**Startup mentorship** are often costly and inaccessible.\\n\\n**Startup education** are often time-consuming, unpersonalized, and fragmented.\\n\\nLacking guidance, founders feel unconfident, distracted, and often build products without proper validation, falling into common traps despite consuming startup content. \\n","Existing Alternatives":"- Expensive startup consultants ($150-500/hr)\\n- Limited accelerator program spots (3-10% acceptance)\\n- DIY learning through books and YT (fragmented and time-consuming)\\n- Generic online courses (not personalized)\\n- Friends and family advice (often biased/inexperienced)","Unique Value Proposition":"**Skip the learning curve**\\nApply startup knowledge first with AI, then learn from that experience. \\n\\n**Built-in learning cycle**\\nSet milestones to test hypothesis. And live it with daily journal and weekly review to surface insights and iterate.\\n\\n**Single source of truth**\\nClear documentation of the evolution of your strategies to make data driven decisions. ","High Level Concept":"Your 1-on-1 accessible and affordable startup mentor who builds your venture with you.","Solution":"AI mentor writes your business document with you to **think strategically** with proven frameworks. \\n\\nAI coach chat with you to boost self-awareness and accelerate growth.","Channels":"","Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users.","Cost Structure":"- AI model development and improvement: $25,000/month\\n- Infrastructure and computing: $8,000/month\\n- Product and engineering team: $45,000/month\\n- Content and domain expertise acquisition: $15,000/month","Key Metrics":"","Unfair Advantage":"TBD\\n(Seek opportunity to create network effect)","Our Why":"We want to democratise founder education\\nWe want to help founders get their first paying customer\\nWe want to inspire a new generation of founders to turn their vision into reality"}`,
    replacementInstructions: `<replace_in_file>
<diff>
<<<<<<< SEARCH
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
>>>>>>> REPLACE
</diff>
</replace_in_file>`,
    shouldSucceed: true,
    expectedResult: `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Customer Segments":"Founders","Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out.","Problem":"**Startup mentorship** are often costly and inaccessible.\\n\\n**Startup education** are often time-consuming, unpersonalized, and fragmented.\\n\\nLacking guidance, founders feel unconfident, distracted, and often build products without proper validation, falling into common traps despite consuming startup content. \\n","Existing Alternatives":"- Startup consultants ($150-500/hr)\\n- Accelerator programs (3-10% acceptance rate)\\n- Self-learning (books, YouTube, blogs)\\n- Online courses (generic, not personalized)\\n- Advice from network (often biased)","Unique Value Proposition":"**Skip the learning curve**\\nApply startup knowledge first with AI, then learn from that experience. \\n\\n**Built-in learning cycle**\\nSet milestones to test hypothesis. And live it with daily journal and weekly review to surface insights and iterate.\\n\\n**Single source of truth**\\nClear documentation of the evolution of your strategies to make data driven decisions. ","High Level Concept":"Your 1-on-1 accessible and affordable startup mentor who builds your venture with you.","Solution":"AI mentor writes your business document with you to **think strategically** with proven frameworks. \\n\\nAI coach chat with you to boost self-awareness and accelerate growth.","Channels":"","Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users.","Cost Structure":"- AI model development and improvement: $25,000/month\\n- Infrastructure and computing: $8,000/month\\n- Product and engineering team: $45,000/month\\n- Content and domain expertise acquisition: $15,000/month","Key Metrics":"","Unfair Advantage":"TBD\\n(Seek opportunity to create network effect)","Our Why":"We want to democratise founder education\\nWe want to help founders get their first paying customer\\nWe want to inspire a new generation of founders to turn their vision into reality"}`
  },
  {
    name: 'Handling commas in monetary values',
    originalContent: `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users.","Cost Structure":"Basic costs"}`,
    replacementInstructions: `<replace_in_file>
<diff>
<<<<<<< SEARCH
"Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users."
=======
"Revenue Streams":"**Tiered subscription model** starting at $98/month for core features and $298/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $1,798/month for 20 users."
>>>>>>> REPLACE
</diff>
</replace_in_file>`,
    expectedResult: `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Revenue Streams":"**Tiered subscription model** starting at $98/month for core features and $298/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $1,798/month for 20 users.","Cost Structure":"Basic costs"}`,
    shouldSucceed: true
  },
  {
    name: 'Replacing Early Adopters with a numbered list',
    originalContent: `{"Title":"InnerFlame","Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out.","Problem":"Some problem"}`,
    replacementInstructions: `<replace_in_file>
<diff>
<<<<<<< SEARCH
"Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out."
=======
"Early Adopters":"1. First-time solo technical founders with limited business experience who need guidance on business fundamentals.

2. Bootstrapped founders who can't afford traditional mentorship but are committed to methodical validation.

3. Technical co-founders who need help translating their technical vision into business language for investors and partners."
>>>>>>> REPLACE
</diff>
</replace_in_file>`,
    expectedResult: `{"Title":"InnerFlame","Early Adopters":"1. First-time solo technical founders with limited business experience who need guidance on business fundamentals.\\n\\n2. Bootstrapped founders who can't afford traditional mentorship but are committed to methodical validation.\\n\\n3. Technical co-founders who need help translating their technical vision into business language for investors and partners.","Problem":"Some problem"}`,
    shouldSucceed: true
  },
  {
    name: 'Replacing Early Adopters with a numbered list',
    originalContent: `{
  "Title": "Project Phoenix",
  "Early Adopters": "Tech enthusiasts and early startup founders looking for productivity tools.",
  "Subtitle": "Rise from the ashes"
}`,
    replacementInstructions: `<replace_in_file>
<diff>
<<<<<<< SEARCH
"Early Adopters": "Tech enthusiasts and early startup founders looking for productivity tools."
=======
"Early Adopters": "1. Tech enthusiasts looking for the next productivity tool
2. Early-stage startup founders with teams of 2-5
3. Independent consultants managing multiple clients"
>>>>>>> REPLACE
</diff>
</replace_in_file>`,
    expectedResult: `{
  "Title": "Project Phoenix",
  "Early Adopters": "1. Tech enthusiasts looking for the next productivity tool\\n2. Early-stage startup founders with teams of 2-5\\n3. Independent consultants managing multiple clients",
  "Subtitle": "Rise from the ashes"
}`,
    shouldSucceed: true
  }
];

// ADD MORE TEST CASES HERE
// Just add new objects to the TEST_CASES array following the same format

// Run the tests
runAllTests(TEST_CASES);

// Create a test that directly tests our processSearchReplace function
function testProcessSearchReplace() {
  console.log('Testing processSearchReplace directly');
  
  const jsonContent = `{"Title":"InnerFlame","Subtitle":"AI-powered startup guidance","Customer Segments":"Founders","Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out.","Problem":"**Startup mentorship** are often costly and inaccessible.\\n\\n**Startup education** are often time-consuming, unpersonalized, and fragmented.\\n\\nLacking guidance, founders feel unconfident, distracted, and often build products without proper validation, falling into common traps despite consuming startup content. \\n","Existing Alternatives":"- Expensive startup consultants ($150-500/hr)\\n- Limited accelerator program spots (3-10% acceptance)\\n- DIY learning through books and YT (fragmented and time-consuming)\\n- Generic online courses (not personalized)\\n- Friends and family advice (often biased/inexperienced)","Unique Value Proposition":"**Skip the learning curve**\\nApply startup knowledge first with AI, then learn from that experience. \\n\\n**Built-in learning cycle**\\nSet milestones to test hypothesis. And live it with daily journal and weekly review to surface insights and iterate.\\n\\n**Single source of truth**\\nClear documentation of the evolution of your strategies to make data driven decisions. ","High Level Concept":"Your 1-on-1 accessible and affordable startup mentor who builds your venture with you.","Solution":"AI mentor writes your business document with you to **think strategically** with proven frameworks. \\n\\nAI coach chat with you to boost self-awareness and accelerate growth.","Channels":"","Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users.","Cost Structure":"- AI model development and improvement: $25,000/month\\n- Infrastructure and computing: $8,000/month\\n- Product and engineering team: $45,000/month\\n- Content and domain expertise acquisition: $15,000/month","Key Metrics":"","Unfair Advantage":"TBD\\n(Seek opportunity to create network effect)","Our Why":"We want to democratise founder education\\nWe want to help founders get their first paying customer\\nWe want to inspire a new generation of founders to turn their vision into reality"}`;
  
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

  // Run the test
  const result = processSearchReplace(jsonContent, diffBlock);
  
  // Check the result
  try {
    const resultObj = JSON.parse(result);
    console.log('Result is valid JSON');
    
    // The field should exist in the result
    if (!resultObj["Existing Alternatives"]) {
      console.log('❌ FAIL: Existing Alternatives field not found in result');
      return {
        success: false,
        result,
        error: 'Existing Alternatives field not found in result'
      };
    }
    
    // Check content normalized (removing newline differences)
    const actual = resultObj["Existing Alternatives"];
    
    // Create normalized versions for comparison by splitting on newlines and rejoining
    // This handles different newline formats between actual and expected
    const normalizedActual = actual.split(/\\n|\n/).map((line: string) => line.trim()).filter(Boolean).join('|');
    
    const expected = [
      "- Startup consultants ($150-500/hr)",
      "- Accelerator programs (3-10% acceptance rate)",
      "- Self-learning (books, YouTube, blogs)",
      "- Online courses (generic, not personalized)",
      "- Advice from network (often biased)"
    ];
    const normalizedExpected = expected.map(line => line.trim()).join('|');
    
    if (normalizedActual === normalizedExpected) {
      console.log('✅ SUCCESS: Existing Alternatives content matches expected (normalized)');
    } else {
      console.log('❌ FAIL: Existing Alternatives content does not match expected');
      console.log('Expected (normalized):', normalizedExpected);
      console.log('Actual (normalized):', normalizedActual);
    }
    
    // Check for JSON structure validity - each item should be on its own line in the UI
    const isValidJsonStructure = actual.includes('\\n') || (actual.match(/\n/g) || []).length === expected.length - 1;
    if (isValidJsonStructure) {
      console.log('✅ SUCCESS: Existing Alternatives has correct line breaks for UI rendering');
    } else {
      console.log('❌ FAIL: Existing Alternatives lacks proper line breaks for UI rendering');
    }
    
    return {
      success: normalizedActual === normalizedExpected && isValidJsonStructure,
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

/**
 * Test specifically for handling commas in monetary values
 */
function testCommaHandlingInMonetaryValues() {
  console.log('Testing comma handling in monetary values');
  
  const jsonContent = `{"Title":"InnerFlame","Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users."}`;
  
  const diffBlock = `<<<<<<< SEARCH
"Revenue Streams":"**Tiered subscription model** starting at $49/month for core features and $149/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $899/month for 20 users."
=======
"Revenue Streams":"**Tiered subscription model** starting at $98/month for core features and $298/month for premium features including unlimited consultations and document generation. Enterprise version for accelerators and incubators at $1,798/month for 20 users."
>>>>>>> REPLACE`;

  console.log('Original Content:', jsonContent);
  console.log('Diff Block:', diffBlock);

  // Run the test
  const result = processSearchReplace(jsonContent, diffBlock);
  
  // Check the result
  try {
    console.log('Raw Result:', result);
    const resultObj = JSON.parse(result);
    console.log('Result is valid JSON');
    console.log('Parsed Result:', JSON.stringify(resultObj, null, 2));
    
    // Check if Revenue Streams field exists and contains the correct values
    if (!resultObj["Revenue Streams"]) {
      console.log('❌ FAIL: Revenue Streams field not found in result');
      return {
        success: false,
        result,
        error: 'Revenue Streams field not found in result'
      };
    }
    
    const revenueStreams = resultObj["Revenue Streams"];
    console.log('Revenue Streams content:', JSON.stringify(revenueStreams));
    
    // Check for the presence of the full price with commas
    const hasCorrectPrice = revenueStreams.includes('$1,798/month');
    
    if (hasCorrectPrice) {
      console.log('✅ SUCCESS: Revenue Streams contains correct price with comma ($1,798)');
    } else {
      console.log('❌ FAIL: Revenue Streams does not contain the correct price with comma');
      console.log('Actual value:', revenueStreams);
    }
    
    // Examine if there's a string formatting issue
    if (revenueStreams.includes('"Revenue Streams"')) {
      console.log('❌ DETECTED ISSUE: Revenue Streams field contains the key name within its value');
      console.log('This indicates a problem with the key/value extraction in the replacement logic');
    }
    
    return {
      success: hasCorrectPrice && !revenueStreams.includes('"Revenue Streams"'),
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

/**
 * Test numbered list replacement in Early Adopters field
 * This tests for the bug where field names are duplicated in the content
 */
function testNumberedListReplacement() {
  console.log('Testing numbered list replacement in Early Adopters field');
  
  const jsonContent = `{"Title":"InnerFlame","Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out."}`;
  
  const diffBlock = `<<<<<<< SEARCH
"Early Adopters":"First-time solo technical founders with limited business experience who just started learning about the Lean Canvas and wanting to try it out."
=======
"Early Adopters":"1. First-time solo technical founders with limited business experience who need guidance on business fundamentals.

2. Bootstrapped founders who can't afford traditional mentorship but are committed to methodical validation.

3. Technical co-founders who need help translating their technical vision into business language for investors and partners."
>>>>>>> REPLACE`;

  // Run the test
  const result = processSearchReplace(jsonContent, diffBlock);
  
  // Check the result
  try {
    const resultObj = JSON.parse(result);
    console.log('Result is valid JSON');
    
    // Check if Early Adopters field exists
    if (!resultObj["Early Adopters"]) {
      console.log('❌ FAIL: Early Adopters field not found in result');
      return {
        success: false,
        result,
        error: 'Early Adopters field not found in result'
      };
    }
    
    const earlyAdopters = resultObj["Early Adopters"];
    console.log('Early Adopters content:', JSON.stringify(earlyAdopters));
    
    // Check for duplicate field name issue
    const hasDuplicateFieldName = earlyAdopters.includes('"Early Adopters"');
    if (hasDuplicateFieldName) {
      console.log('❌ FAIL: Early Adopters contains duplicated field name in its value');
    } else {
      console.log('✅ SUCCESS: Early Adopters does not contain duplicated field name');
    }
    
    // Check for numbered list items
    const hasAllItems = earlyAdopters.includes('1.') && 
                          earlyAdopters.includes('2.') && 
                          earlyAdopters.includes('3.');
    
    if (hasAllItems) {
      console.log('✅ SUCCESS: Early Adopters contains all numbered list items');
    } else {
      console.log('❌ FAIL: Early Adopters is missing numbered list items');
    }
    
    return {
      success: !hasDuplicateFieldName && hasAllItems,
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

// Add to exports
export { runTest, runAllTests, testProcessSearchReplace, testCorrectNewlineEncoding, testLiteralNewlineHandling, testCommaHandlingInMonetaryValues, testNumberedListReplacement };
export type { DocumentReplaceTest }; 