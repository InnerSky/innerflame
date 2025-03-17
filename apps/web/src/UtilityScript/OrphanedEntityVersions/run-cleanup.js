/**
 * This script compiles and runs the TypeScript cleanup utility
 * 
 * Usage: node run-cleanup.js
 */

import { exec } from 'child_process';
import { fileURLToPath } from 'url';
import { dirname, join, resolve } from 'path';

// Get the current file's directory path (ESM equivalent of __dirname)
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Path to the TypeScript file and project root
const scriptPath = join(__dirname, 'cleanupOrphanedEntityVersions.ts');
const rootDir = resolve(__dirname, '../../../');

console.log('Compiling and running TypeScript cleanup utility...');
console.log(`Script path: ${scriptPath}`);

// Compile and run the TypeScript file using npx tsx
const command = `cd ${rootDir} && npx tsx ${scriptPath}`;

exec(command, (error, stdout, stderr) => {
  if (error) {
    console.error(`Error executing script: ${error.message}`);
    return;
  }
  
  if (stderr) {
    console.error(`Script error: ${stderr}`);
    return;
  }
  
  console.log(stdout);
  console.log('Cleanup utility completed successfully.');
}); 