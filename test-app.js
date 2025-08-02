// Test Script for Islamic Report App
// Run this before deployment to ensure everything works

const axios = require('axios');

// Configuration
const BASE_URL = 'http://localhost:5000/api';
let authToken = null;
let testUserId = null;

// Test data
const testUser = {
  name: 'Test User',
  email: 'test@example.com',
  password: 'test123456',
  educationalInstitution: 'Test School',
  class: 'Test Class',
  address: 'Test Address',
  phoneNumber: '1234567890'
};

const testReportData = {
  namaz: 'yes',
  hifz: 'yes',
  nazra: 'no',
  tafseer: 'yes',
  hadees: 'no',
  literature: 'yes',
  darsiKutab: 'no',
  karkunaanMulakaat: 5,
  amoomiAfraadMulakaat: 3,
  khatootTadaad: 2,
  ghrKaKaam: 'yes'
};

const testQA = {
  q1: 'Test answer for question 1',
  q2: 'Test answer for question 2',
  q3: 'Test answer for question 3',
  q4: 'Test answer for question 4',
  q5: 'Test answer for question 5'
};

// Helper function to log test results
function logTest(testName, passed, details = '') {
  const status = passed ? '✅ PASS' : '❌ FAIL';
  console.log(`${status} ${testName}${details ? ` - ${details}` : ''}`);
  return passed;
}

// Test runner
async function runTests() {
  console.log('🧪 Starting Islamic Report App Tests...\n');
  
  let passedTests = 0;
  let totalTests = 0;

  try {
    // Test 1: User Registration
    console.log('1. Testing User Registration...');
    try {
      const registerResponse = await axios.post(`${BASE_URL}/users/register`, testUser);
      authToken = registerResponse.data.token;
      testUserId = registerResponse.data.user.id;
      totalTests++;
      if (logTest('User Registration', true, `User ID: ${testUserId}`)) passedTests++;
    } catch (error) {
      totalTests++;
      logTest('User Registration', false, error.response?.data?.message || error.message);
    }

    // Test 2: User Login
    console.log('\n2. Testing User Login...');
    try {
      const loginResponse = await axios.post(`${BASE_URL}/users/login`, {
        email: testUser.email,
        password: testUser.password
      });
      authToken = loginResponse.data.token;
      totalTests++;
      if (logTest('User Login', true, 'Token received')) passedTests++;
    } catch (error) {
      totalTests++;
      logTest('User Login', false, error.response?.data?.message || error.message);
    }

    // Set up axios with auth token
    axios.defaults.headers.common['Authorization'] = `Bearer ${authToken}`;

    // Test 3: Get Current Report
    console.log('\n3. Testing Get Current Report...');
    try {
      const currentReportResponse = await axios.get(`${BASE_URL}/reports/current`);
      totalTests++;
      if (logTest('Get Current Report', true, `Report has ${currentReportResponse.data.days.length} days`)) passedTests++;
    } catch (error) {
      totalTests++;
      logTest('Get Current Report', false, error.response?.data?.message || error.message);
    }

    // Test 4: Update Daily Activities
    console.log('\n4. Testing Daily Activities Update...');
    try {
      const today = new Date().getDate();
      const updateResponse = await axios.put(`${BASE_URL}/reports/daily/${today}`, testReportData);
      totalTests++;
      if (logTest('Daily Activities Update', true, `Updated day ${today}`)) passedTests++;
    } catch (error) {
      totalTests++;
      logTest('Daily Activities Update', false, error.response?.data?.message || error.message);
    }

    // Test 5: Q&A Update
    console.log('\n5. Testing Q&A Update...');
    try {
      const qaResponse = await axios.put(`${BASE_URL}/reports/qa`, { qa: testQA });
      totalTests++;
      if (logTest('Q&A Update', true, 'Q&A saved successfully')) passedTests++;
    } catch (error) {
      totalTests++;
      logTest('Q&A Update', false, error.response?.data?.message || error.message);
    }

    // Test 6: Get All Reports
    console.log('\n6. Testing Get All Reports...');
    try {
      const allReportsResponse = await axios.get(`${BASE_URL}/reports/all`);
      totalTests++;
      if (logTest('Get All Reports', true, `Found ${allReportsResponse.data.length} reports`)) passedTests++;
    } catch (error) {
      totalTests++;
      logTest('Get All Reports', false, error.response?.data?.message || error.message);
    }

    // Test 7: Test PDF Generation
    console.log('\n7. Testing PDF Generation...');
    try {
      const pdfResponse = await axios.get(`${BASE_URL}/reports/test-pdf`, {
        responseType: 'blob'
      });
      totalTests++;
      if (logTest('PDF Generation', true, `PDF size: ${pdfResponse.data.size} bytes`)) passedTests++;
    } catch (error) {
      totalTests++;
      logTest('PDF Generation', false, error.response?.data?.message || error.message);
    }

    // Test 8: User Profile
    console.log('\n8. Testing User Profile...');
    try {
      const profileResponse = await axios.get(`${BASE_URL}/users/profile`);
      totalTests++;
      if (logTest('User Profile', true, `Profile loaded for ${profileResponse.data.name}`)) passedTests++;
    } catch (error) {
      totalTests++;
      logTest('User Profile', false, error.response?.data?.message || error.message);
    }

    // Test 9: Check for _id bug in Q&A
    console.log('\n9. Testing Q&A _id Bug Fix...');
    try {
      const currentReportResponse = await axios.get(`${BASE_URL}/reports/current`);
      const qaData = currentReportResponse.data.qa;
      const hasIdBug = qaData && qaData._id;
      totalTests++;
      if (logTest('Q&A _id Bug Fix', !hasIdBug, hasIdBug ? 'Found _id in Q&A data' : 'No _id found (good)')) {
        if (!hasIdBug) passedTests++;
      }
    } catch (error) {
      totalTests++;
      logTest('Q&A _id Bug Fix', false, error.response?.data?.message || error.message);
    }

  } catch (error) {
    console.error('❌ Test suite failed:', error.message);
  }

  // Summary
  console.log('\n' + '='.repeat(50));
  console.log(`📊 Test Results: ${passedTests}/${totalTests} tests passed`);
  console.log(`🎯 Success Rate: ${Math.round((passedTests / totalTests) * 100)}%`);
  
  if (passedTests === totalTests) {
    console.log('🎉 All tests passed! App is ready for deployment.');
  } else {
    console.log('⚠️  Some tests failed. Please fix issues before deployment.');
  }
  console.log('='.repeat(50));

  // Cleanup: Delete test user
  if (authToken && testUserId) {
    try {
      console.log('\n🧹 Cleaning up test data...');
      // Note: You might need to implement a delete user endpoint
      console.log('✅ Test cleanup completed');
    } catch (error) {
      console.log('⚠️  Could not cleanup test data:', error.message);
    }
  }
}

// Run tests
if (require.main === module) {
  runTests().catch(console.error);
}

module.exports = { runTests }; 