#!/usr/bin/env node

// Test-Script für User-Agent-Fixes
const { XtreamCodesClient } = require('./utils/xtreamClient');

console.log('🧪 === Testing User-Agent Fixes ===\n');

// Teste mit sky1001eu.xyz:8080
const testCredentials = {
  serverUrl: 'http://sky1001eu.xyz:8080',
  username: 'test',
  password: 'test'
};

console.log('🔗 Testing server: http://sky1001eu.xyz:8080');
console.log('👤 Username: test');
console.log('🔑 Password: test\n');

try {
  const client = new XtreamCodesClient(testCredentials);
  
  console.log('✅ XtreamCodesClient created successfully');
  console.log(`🔧 Base URL: ${client.baseUrl}`);
  console.log(`🤖 Working User-Agent: ${client.workingUserAgent}\n`);
  
  console.log('📋 Expected behavior:');
  console.log('1. Server reachability test will try multiple User-Agents');
  console.log('2. Should find VLC or IPTV Smarters Pro User-Agent works');
  console.log('3. Authentication should succeed with working User-Agent');
  console.log('4. Detailed logs will show which User-Agent was successful\n');
  
} catch (error) {
  console.log(`❌ Error: ${error.message}\n`);
}

console.log('🎯 Test setup completed!');
console.log('📱 Now test in the iOS app - it should work with sky1001eu.xyz:8080');
