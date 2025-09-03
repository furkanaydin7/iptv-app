#!/usr/bin/env node

// Debug-Script für sky1001eu.xyz:8080
console.log('🧪 === Debug sky1001eu.xyz:8080 ===\n');

// Simuliere verschiedene User-Agents wie die App sie verwenden würde
const testUserAgents = [
  'IPTV-App/1.0 (iOS) Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15',
  'VLC/3.0.0 LibVLC/3.0.0',
  'IPTV Smarters Pro'
];

const testUrl = 'http://sky1001eu.xyz:8080/player_api.php?username=test&password=test&action=get_account_info';

console.log('🔗 Test URL:', testUrl);
console.log('🎯 Testing different User-Agents...\n');

// Verwende node-fetch für echte Tests
const testUserAgent = async (userAgent) => {
  console.log(`🤖 Testing User-Agent: ${userAgent}`);
  
  try {
    const response = await fetch(testUrl, {
      method: 'GET',
      headers: {
        'User-Agent': userAgent,
        'Accept': 'application/json'
      }
    });
    
    console.log(`📥 Response: ${response.status} ${response.statusText}`);
    
    if (response.status === 200) {
      const data = await response.text();
      console.log(`📄 Response body: ${data.substring(0, 100)}...`);
    }
    
    return response.status;
    
  } catch (error) {
    console.log(`❌ Error: ${error.message}`);
    return null;
  }
};

// Teste alle User-Agents sequenziell
const runTests = async () => {
  for (const userAgent of testUserAgents) {
    const status = await testUserAgent(userAgent);
    
    if (status === 200) {
      console.log(`✅ SUCCESS: ${userAgent} works!\n`);
    } else if (status === 520) {
      console.log(`❌ BLOCKED: ${userAgent} (HTTP 520)\n`);
    } else {
      console.log(`⚠️ OTHER: ${userAgent} (HTTP ${status})\n`);
    }
  }
  
  console.log('🎯 Tests completed!');
  console.log('📋 Expected: VLC and IPTV Smarters Pro should work (HTTP 200)');
  console.log('📱 If these work here, the iOS app should work too');
};

runTests().catch(console.error);
