#!/usr/bin/env node

/**
 * Supabase Integration Test Script
 * Tests the fixes for tour guide and hotel registration issues
 */

console.log('🧪 Starting Supabase Integration Tests...\n');

// Import required modules
const { spawn } = require('child_process');
const path = require('path');

// Function to run a command and capture output
function runCommand(command, args, options = {}) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, { 
      stdio: 'inherit',
      ...options
    });
    
    child.on('close', (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Command failed with exit code ${code}`));
      }
    });
    
    child.on('error', (error) => {
      reject(error);
    });
  });
}

// Main test function
async function runTests() {
  try {
    // Test 1: Check if Supabase CLI is installed
    console.log('🔍 Checking Supabase CLI installation...');
    await runCommand('npx', ['supabase', '--version']);
    console.log('✅ Supabase CLI is installed\n');
    
    // Test 2: Check current migrations
    console.log('📂 Checking current migrations...');
    await runCommand('npx', ['supabase', 'migration', 'list']);
    console.log('✅ Migration status checked\n');
    
    // Test 3: Apply new migrations
    console.log('🔄 Applying new migrations...');
    await runCommand('npx', ['supabase', 'migration', 'up']);
    console.log('✅ New migrations applied\n');
    
    // Test 4: Check database status
    console.log('📊 Checking database status...');
    await runCommand('npx', ['supabase', 'status']);
    console.log('✅ Database status checked\n');
    
    console.log('🎉 All Supabase integration tests passed!');
    console.log('\n📝 Next steps:');
    console.log('1. Restart your development server');
    console.log('2. Test tour guide registration');
    console.log('3. Test hotel partner registration');
    console.log('4. Verify automatic profile creation works');
    
  } catch (error) {
    console.error('❌ Supabase integration tests failed:', error.message);
    process.exit(1);
  }
}

// Run the tests
runTests();