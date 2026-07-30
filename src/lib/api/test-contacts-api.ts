// Test file to verify API connection
// You can run this in your browser console to test the API

import { contactsAPI } from './contacts';
import { API_ROOT } from "@/config/api";

// Test function to verify API connectivity
export async function testContactsAPI(businessId: string) {
  try {
    console.log('Testing Contacts API...');
    
    // Test GET contacts
    console.log('1. Testing GET contacts...');
    const contactsResponse = await contactsAPI.getContacts(businessId);
    console.log('✅ GET contacts successful:', contactsResponse);
    
    // Test GET customers
    console.log('2. Testing GET customers...');
    const customersResponse = await contactsAPI.getCustomers(businessId);
    console.log('✅ GET customers successful:', customersResponse);
    
    console.log('🎉 All API tests passed!');
    return true;
  } catch (error) {
    console.error('❌ API test failed:', error);
    return false;
  }
}

// Usage in browser console:
// import('./test-contacts-api.js').then(module => module.testContactsAPI('your-business-id-here'));
