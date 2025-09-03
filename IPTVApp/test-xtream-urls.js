#!/usr/bin/env node

// Test-Script für Xtream URL-Normalisierung
const { XtreamCodesClient } = require('./utils/xtreamClient');

const testUrls = [
  'http://example.com:8080',
  'http://example.com:8080/player_api.php',
  'http://example.com:8080/get.php',
  'http://example.com:8080/c/',
  'http://example.com:8080/iptv/',
  'https://example.com:8443',
  'http://example.com',
  'http://example.com:8080/',
  'http://ip.sltv.be:8080/get.php',
  'http://server.com:8080/c/username/password/',
];

console.log('🧪 === Xtream URL Normalization Test ===\n');

testUrls.forEach((url, index) => {
  console.log(`Test ${index + 1}:`);
  console.log(`  Original: ${url}`);
  
  try {
    const client = new XtreamCodesClient({
      serverUrl: url,
      username: 'test',
      password: 'test'
    });
    
    console.log(`  Normalized: ${client.baseUrl}`);
    console.log(`  ✅ Success\n`);
  } catch (error) {
    console.log(`  ❌ Error: ${error.message}\n`);
  }
});

console.log('🎯 Test completed!');
