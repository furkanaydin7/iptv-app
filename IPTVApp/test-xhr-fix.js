#!/usr/bin/env node

// Test-Script für XMLHttpRequest-Fix
console.log('🧪 === Testing XMLHttpRequest Fix ===\n');

// Simuliere XMLHttpRequest wie in der App
const testXHR = (url, userAgent) => {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.timeout = 20000;
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        console.log(`✅ XHR Success: ${xhr.status} ${xhr.statusText}`);
        try {
          const data = JSON.parse(xhr.responseText);
          resolve({ status: xhr.status, data });
        } catch (parseError) {
          console.log('📄 Response:', xhr.responseText.substring(0, 200));
          reject(new Error(`Invalid JSON: ${parseError}`));
        }
      } else {
        console.log(`❌ XHR Error: ${xhr.status} ${xhr.statusText}`);
        reject(new Error(`HTTP ${xhr.status}: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = () => {
      console.log('❌ XHR Network error');
      reject(new Error('Network error'));
    };
    
    xhr.ontimeout = () => {
      console.log('⏰ XHR Timeout');
      reject(new Error('Timeout'));
    };
    
    try {
      console.log(`🌐 XHR Testing: ${url}`);
      xhr.open('GET', url, true);
      
      xhr.setRequestHeader('Accept', 'application/json');
      xhr.setRequestHeader('User-Agent', userAgent);
      xhr.setRequestHeader('Cache-Control', 'no-cache');
      
      console.log(`🤖 User-Agent: ${userAgent}`);
      console.log('📤 Sending...');
      
      xhr.send();
    } catch (error) {
      reject(error);
    }
  });
};

// Test mit sky1001eu.xyz
const testUrl = 'http://sky1001eu.xyz:8080/player_api.php?username=test&password=test&action=get_account_info';
const userAgent = 'VLC/3.0.0 LibVLC/3.0.0';

console.log('🎯 Testing sky1001eu.xyz with XMLHttpRequest...');
console.log('🔗 URL:', testUrl);
console.log('🤖 User-Agent:', userAgent);
console.log('');

testXHR(testUrl, userAgent)
  .then(result => {
    console.log(`✅ SUCCESS: HTTP ${result.status}`);
    console.log('📄 Response:', JSON.stringify(result.data, null, 2));
    console.log('\n🎯 XMLHttpRequest works! The iOS app should now work too.');
  })
  .catch(error => {
    console.log(`❌ FAILED: ${error.message}`);
    console.log('\n🔧 If this fails, there might be a deeper iOS networking issue.');
  });
