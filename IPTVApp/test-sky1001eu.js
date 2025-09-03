#!/usr/bin/env node

// Test-Script für sky1001eu.xyz:8080 Server
const { XtreamCodesClient } = require('./utils/xtreamClient');

console.log('🧪 === Testing sky1001eu.xyz:8080 Server ===\n');

// Teste verschiedene URL-Formate
const testUrls = [
  'http://sky1001eu.xyz:8080',
  'http://sky1001eu.xyz:8080/player_api.php',
  'http://sky1001eu.xyz:8080/get.php',
  'http://sky1001eu.xyz:8080/c/',
  'https://sky1001eu.xyz:8080',
  'http://sky1001eu.xyz:80',
  'https://sky1001eu.xyz:443',
  'http://sky1001eu.xyz:8443',
];

testUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}: ${url}`);
  
  try {
    const client = new XtreamCodesClient({
      serverUrl: url,
      username: 'test',
      password: 'test'
    });
    
    console.log(`  Normalized: ${client.baseUrl}`);
    console.log(`  ✅ URL normalization successful\n`);
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }
});

console.log('🎯 URL normalization test completed!');
console.log('\n📋 Next steps:');
console.log('1. Try the app with a real Xtream account');
console.log('2. Check the console logs for detailed error messages');
console.log('3. The app will now test multiple endpoints automatically');
