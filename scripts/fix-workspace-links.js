#!/usr/bin/env node

/**
 * This script verifies and fixes symlinks between workspace packages.
 * Run it after pnpm install if you're experiencing workspace resolution issues.
 */

const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const workspaceRoot = path.resolve(__dirname, '..');
const packagesDir = path.join(workspaceRoot, 'packages');
const appsDir = path.join(workspaceRoot, 'apps');

console.log('Checking workspace package links...');

// Get all workspace packages
const packages = [
  ...fs.readdirSync(packagesDir).map(pkg => ({ name: pkg, path: path.join(packagesDir, pkg) })),
  ...fs.readdirSync(appsDir).map(app => ({ name: app, path: path.join(appsDir, app) }))
];

// Verify each package.json and ensure it's correctly linked
packages.forEach(pkg => {
  const packageJsonPath = path.join(pkg.path, 'package.json');
  
  if (fs.existsSync(packageJsonPath)) {
    const pkgJson = JSON.parse(fs.readFileSync(packageJsonPath, 'utf8'));
    const deps = {
      ...(pkgJson.dependencies || {}),
      ...(pkgJson.devDependencies || {})
    };
    
    // Check for @innerflame/* dependencies
    Object.entries(deps).forEach(([depName, version]) => {
      if (depName.startsWith('@innerflame/')) {
        console.log(`Checking ${pkgJson.name} -> ${depName}`);
        
        // If version is "*", that's good
        if (version === '*') {
          console.log(`  ✓ ${depName} is using wildcard version`);
        } else {
          console.log(`  ⚠ ${depName} is using specific version: ${version}. This might cause issues.`);
        }
      }
    });
  }
});

console.log('\nFixing workspace links by reinstalling with workspace flags...');
try {
  execSync('pnpm install --link-workspace-packages --prefer-workspace-packages', 
    { stdio: 'inherit', cwd: workspaceRoot });
  console.log('Workspace links fixed! The installation should work correctly now.');
} catch (err) {
  console.error('Failed to fix workspace links:', err);
} 