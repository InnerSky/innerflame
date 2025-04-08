/**
 * Document replacement tests runner
 * 
 * Execute with: npm run test:docs
 */
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the current directory
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const documentsTestDir = path.join(__dirname, 'document');

console.log('Running document tests');
console.log('==================================================');

// Track test results
let totalTests = 0;
let passedTests = 0;
let failedTests = 0;
const failures: {file: string, name: string, error?: string}[] = [];

// Interface for test results
interface TestResult {
  success: boolean;
  error?: string;
  [key: string]: any; // Allow for additional properties
}

// Type for test functions
type TestFunction = () => Promise<TestResult> | TestResult;

// Function to run tests from a module
async function runTestsFromModule(modulePath: string, fileName: string) {
  try {
    // Import the module
    // For TS-Node/ESM compatibility, replace .ts with .js in the import path
    const importPath = modulePath.replace(/\.ts$/, '.js');
    const module = await import(importPath);
    
    // Find all exported functions that start with "test"
    const testFunctions: [string, TestFunction][] = Object.entries(module)
      .filter(([name, value]) => name.startsWith('test') && typeof value === 'function')
      .map(([name, fn]) => [name, fn as TestFunction]);
    
    if (testFunctions.length === 0) {
      console.log(`No tests found in ${fileName}`);
      return;
    }
    
    console.log(`Running ${testFunctions.length} tests from ${fileName}`);
    
    // Run each test function
    for (const [name, fn] of testFunctions) {
      totalTests++;
      console.log(`- Running test: ${name}`);
      
      try {
        // Handle both synchronous and asynchronous test functions
        const resultPromise = fn();
        const result = resultPromise instanceof Promise ? await resultPromise : resultPromise;
        
        if (result && result.success) {
          console.log(`  ✅ PASS: ${name}`);
          passedTests++;
        } else {
          console.log(`  ❌ FAIL: ${name}`);
          failedTests++;
          failures.push({
            file: fileName,
            name,
            error: result?.error
          });
        }
      } catch (error) {
        console.error(`  ❌ ERROR: ${name} threw an exception`);
        console.error(`    ${error instanceof Error ? error.message : 'Unknown error'}`);
        failedTests++;
        failures.push({
          file: fileName,
          name,
          error: error instanceof Error ? error.message : 'Unknown error'
        });
      }
    }
  } catch (error) {
    console.error(`Error importing ${fileName}:`, error);
  }
}

// Find all test files in the document folder
async function runAllTests() {
  try {
    const files = fs.readdirSync(documentsTestDir);
    // Find all .ts files but exclude:
    // - Declaration files (.d.ts)
    // - Index files (index.ts)
    // - Files that start with _
    const testFiles = files.filter(file => 
      file.endsWith('.ts') && 
      !file.endsWith('.d.ts') && 
      !file.startsWith('_') &&
      file !== 'index.ts'
    );
    
    if (testFiles.length === 0) {
      console.log('No test files found in the document folder');
      return;
    }
    
    console.log(`Running ${testFiles.length} test files`);

    // Run tests from each file
    for (const file of testFiles) {
      const filePath = path.join(documentsTestDir, file);
      await runTestsFromModule(`file://${filePath}`, file);
    }
    
    // Print summary
    console.log('==================================================');
    console.log(`Test Results: ${passedTests} passed, ${failedTests} failed of ${totalTests} total`);
    
    if (failures.length > 0) {
      console.log('\nFailed Tests:');
      failures.forEach(f => {
        console.log(`- ${f.file}: ${f.name}`);
        if (f.error) console.log(`  Error: ${f.error}`);
      });
    }
    
    // Exit with appropriate code
    if (failedTests > 0) {
      console.error('Some tests failed!');
      process.exit(1);
    } else {
      console.log('All tests passed!');
      process.exit(0);
    }
  } catch (error) {
    console.error('Error discovering test files:', error);
    process.exit(1);
  }
}

// Run all tests
runAllTests(); 