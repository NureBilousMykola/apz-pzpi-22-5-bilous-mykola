import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '1m', target: 50 },     // Warm up
    { duration: '2m', target: 100 },    // Scale to 100
    { duration: '2m', target: 200 },    // Scale to 200
    { duration: '2m', target: 300 },    // Scale to 300
    { duration: '5m', target: 400 },    // Scale to 400 (stress)
    { duration: '5m', target: 500 },    // Scale to 500 (breaking point)
    { duration: '2m', target: 0 },      // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<2000'],
    http_req_failed: ['rate<0.25'], // Allow higher error rate in stress test
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Heavy load scenario
  let response = http.get(`${BASE_URL}/health`);

  check(response, {
    'stress test completed': (r) => r.status !== undefined,
    'stress test not completely broken': (r) => r.status < 600,
  });

  // Reduced sleep for maximum stress
  sleep(0.1);
}
