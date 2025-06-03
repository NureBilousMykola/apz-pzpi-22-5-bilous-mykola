import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 10 },    // Warm up
    { duration: '30s', target: 100 },  // Spike to 100 users
    { duration: '3m', target: 100 },   // Stay at 100 users
    { duration: '30s', target: 300 },  // Spike to 300 users
    { duration: '3m', target: 300 },   // Stay at 300 users
    { duration: '1m', target: 0 },     // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<1000'],
    http_req_failed: ['rate<0.15'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Mix of different endpoints to test various services
  let endpoints = [
    '/health',
    '/api/auth/login',
    '/api/devices',
    '/api/orders'
  ];

  let endpoint = endpoints[Math.floor(Math.random() * endpoints.length)];
  let response = http.get(`${BASE_URL}${endpoint}`);

  check(response, {
    'spike test status is not 5xx': (r) => r.status < 500,
    'spike test response time < 2000ms': (r) => r.timings.duration < 2000,
  });

  sleep(0.5);
}
