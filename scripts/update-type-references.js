#!/usr/bin/env node

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

// Configuration
const replacements = [
  { from: 'entities', to: 'documents' },
  { from: 'entity_versions', to: 'document_versions' }
];

const searchDir = path.resolve(__dirname, '../apps/web/src');
const fileExtensions = ['.ts', '.tsx', '.js', '.jsx'];

// Function to recursively find files
function findFiles(dir, extensions) {
  let results = [];
  const files = fs.readdirSync(dir);
  
  for (const file of files) {
    const filePath = path.join(dir, file);
    const stat = fs.statSync(filePath);
    
    if (stat.isDirectory()) {
      results = results.concat(findFiles(filePath, extensions));
    } else if (extensions.includes(path.extname(filePath))) {
      results.push(filePath);
    }
  }
  
  return results;
}

// Function to replace content in files
function replaceInFile(filePath, replacements) {
  let content = fs.readFileSync(filePath, 'utf8');
  let hasChanges = false;
  
  for (const { from, to } of replacements) {
    // Create regex patterns for different usage scenarios
    const patterns = [
      // Direct property/variable names
      new RegExp(`\\b${from}\\b`, 'g'),
      // For camelCase transformations (e.g., entityVersions -> documentVersions)
      new RegExp(`\\b${from.charAt(0)}${from.slice(1)}\\b`, 'g'),
      // For PascalCase transformations (e.g., EntityVersion -> DocumentVersion)
      new RegExp(`\\b${from.charAt(0).toUpperCase()}${from.slice(1)}\\b`, 'g'),
      // For table reference in code (like Database["public"]["Tables"]["entities"])
      new RegExp(`"${from}"`, 'g')
    ];
    
    // Apply each pattern
    for (const pattern of patterns) {
      const transformed = content.replace(pattern, (match) => {
        if (match === from) return to;
        if (match === from.charAt(0) + from.slice(1)) {
          return to.charAt(0) + to.slice(1);
        }
        if (match === from.charAt(0).toUpperCase() + from.slice(1)) {
          return to.charAt(0).toUpperCase() + to.slice(1);
        }
        if (match === `"${from}"`) return `"${to}"`;
        return match;
      });
      
      if (transformed !== content) {
        content = transformed;
        hasChanges = true;
      }
    }
  }
  
  if (hasChanges) {
    fs.writeFileSync(filePath, content, 'utf8');
    return true;
  }
  
  return false;
}

// Main execution
console.log('Finding files...');
const files = findFiles(searchDir, fileExtensions);
console.log(`Found ${files.length} files to process.`);

let changedFiles = 0;
for (const file of files) {
  const changed = replaceInFile(file, replacements);
  if (changed) {
    changedFiles++;
    console.log(`Updated: ${path.relative(process.cwd(), file)}`);
  }
}

console.log(`\nCompleted: Updated ${changedFiles} files.`);
