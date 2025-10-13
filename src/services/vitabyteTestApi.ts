// Vitabyte API Testing Service
// Quick test to find correct Calendar IDs and Provider IDs

import axios from 'axios';

const username = 'Miro';
const password = '#dCdGV;f8je,1Tj34nxo';

/**
 * Test API and get all available services/calendars
 */
export async function testVitabyteConnection() {
  const authToken = btoa(`${username}:${password}`);
  
  const client = axios.create({
    baseURL: '/api/vitabyte-proxy',
    headers: {
      'Content-Type': 'application/json',
      'X-API-Type': 'system'
    },
    timeout: 15000
  });

  console.log('🧪 Testing Vitabyte API connection...');

  try {
    // Test 1: Verify credentials
    console.log('\n📡 Test 1: Verifying credentials...');
    const verifyResponse = await client.post('/verify');
    console.log('✅ Verify response:', verifyResponse.data);

    // Test 2: Get services (this should show available calendars)
    console.log('\n📡 Test 2: Getting services...');
    const servicesResponse = await client.post('/booking/getServices', {
      location: 0
    });
    console.log('✅ Services response:', servicesResponse.data);
    
    if (servicesResponse.data.result) {
      console.log('\n📋 Available Services:');
      servicesResponse.data.result.forEach((service: any) => {
        console.log(`  - ${service.name} (ID: ${service.serviceid})`);
        console.log(`    Duration: ${service.duration} min`);
        console.log(`    Providers: ${JSON.stringify(service.providers)}`);
        console.log(`    Calendars: ${JSON.stringify(service.calendars)}`);
      });
    }

    // Test 3: Get providers
    console.log('\n📡 Test 3: Getting providers...');
    const providersResponse = await client.post('/getProviders');
    console.log('✅ Providers response:', providersResponse.data);
    
    if (providersResponse.data.result) {
      console.log('\n👥 Available Providers:');
      providersResponse.data.result.forEach((provider: any) => {
        console.log(`  - ${provider.title || ''} ${provider.givenname || ''} ${provider.familyname || ''}`);
        console.log(`    User ID: ${provider.userid}`);
        console.log(`    Specialization: ${provider.specialization || 'N/A'}`);
      });
    }

    return {
      success: true,
      services: servicesResponse.data.result,
      providers: providersResponse.data.result
    };

  } catch (error: any) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

