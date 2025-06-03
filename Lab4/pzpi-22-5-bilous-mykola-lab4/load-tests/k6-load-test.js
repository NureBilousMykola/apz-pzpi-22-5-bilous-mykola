import http from 'k6/http';
import { check, sleep } from 'k6';
import { Counter, Rate, Trend } from 'k6/metrics';

// Custom metrics
export let ErrorCount = new Counter('errors');
export let ErrorRate = new Rate('error_rate');
export let ResponseTime = new Trend('response_time');

// Test configuration
export let options = {
  stages: [
    // Warm up
    { duration: '2m', target: 10 },
    // Ramp up to 50 users
    { duration: '5m', target: 50 },
    // Stay at 50 users
    { duration: '10m', target: 50 },
    // Ramp up to 100 users
    { duration: '5m', target: 100 },
    // Stay at 100 users
    { duration: '10m', target: 100 },
    // Ramp up to 200 users (stress test)
    { duration: '5m', target: 200 },
    // Stay at 200 users
    { duration: '10m', target: 200 },
    // Cool down
    { duration: '5m', target: 0 },
  ],
  thresholds: {
    http_req_duration: ['p(95)<500'], // 95% of requests must complete below 500ms
    http_req_failed: ['rate<0.1'],    // Error rate must be below 10%
    error_rate: ['rate<0.1'],
  },
};

// Base URL - update this to your load balancer IP/hostname
const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

// Test data
const users = [
  { email: 'user1@test.com', password: 'password123' },
  { email: 'user2@test.com', password: 'password123' },
  { email: 'user3@test.com', password: 'password123' },
  { email: 'user4@test.com', password: 'password123' },
  { email: 'user5@test.com', password: 'password123' },
];

const printJobs = [
  {
    title: 'Document 1',
    pages: 5,
    copies: 1,
    paper_size: 'A4',
    color: false
  },
  {
    title: 'Document 2',
    pages: 10,
    copies: 2,
    paper_size: 'A4',
    color: true
  },
  {
    title: 'Document 3',
    pages: 3,
    copies: 5,
    paper_size: 'A3',
    color: false
  }
];

export function setup() {
  // Health check
  let healthResponse = http.get(`${BASE_URL}/health`);
  if (healthResponse.status !== 200) {
    throw new Error(`System health check failed: ${healthResponse.status}`);
  }
  console.log('System is healthy, starting load test...');
}

export default function () {
  let user = users[Math.floor(Math.random() * users.length)];
  let printJob = printJobs[Math.floor(Math.random() * printJobs.length)];

  // Authentication test
  let loginResponse = http.post(`${BASE_URL}/api/auth/login`, {
    email: user.email,
    password: user.password
  }, {
    headers: { 'Content-Type': 'application/json' },
  });

  let loginSuccess = check(loginResponse, {
    'login status is 200': (r) => r.status === 200,
    'login response time < 500ms': (r) => r.timings.duration < 500,
  });

  if (!loginSuccess) {
    ErrorCount.add(1);
    ErrorRate.add(1);
    return;
  }

  ErrorRate.add(0);
  ResponseTime.add(loginResponse.timings.duration);

  let token = '';
  try {
    token = JSON.parse(loginResponse.body).access_token;
  } catch (e) {
    ErrorCount.add(1);
    return;
  }

  sleep(0.5);

  // Get user profile
  let profileResponse = http.get(`${BASE_URL}/api/users/profile`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  check(profileResponse, {
    'profile status is 200': (r) => r.status === 200,
    'profile response time < 300ms': (r) => r.timings.duration < 300,
  });

  sleep(0.5);

  // Get available devices
  let devicesResponse = http.get(`${BASE_URL}/api/devices`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  check(devicesResponse, {
    'devices status is 200': (r) => r.status === 200,
    'devices response time < 400ms': (r) => r.timings.duration < 400,
  });

  sleep(0.5);

  // Create print order
  let orderPayload = {
    ...printJob,
    device_id: 1, // Assuming device with ID 1 exists
  };

  let orderResponse = http.post(`${BASE_URL}/api/orders`, JSON.stringify(orderPayload), {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  let orderSuccess = check(orderResponse, {
    'order creation status is 201': (r) => r.status === 201,
    'order creation response time < 1000ms': (r) => r.timings.duration < 1000,
  });

  if (!orderSuccess) {
    ErrorCount.add(1);
    return;
  }

  sleep(0.5);

  // Get orders list
  let ordersResponse = http.get(`${BASE_URL}/api/orders`, {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
  });

  check(ordersResponse, {
    'orders list status is 200': (r) => r.status === 200,
    'orders list response time < 500ms': (r) => r.timings.duration < 500,
  });

  sleep(1);
}

export function teardown(data) {
  console.log('Load test completed.');
  console.log(`Total errors: ${ErrorCount.value}`);
}
