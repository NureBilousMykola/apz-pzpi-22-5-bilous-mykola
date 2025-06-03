import http from 'k6/http';
import { check, sleep } from 'k6';

export let options = {
  stages: [
    { duration: '2m', target: 5 },   // Warm up
    { duration: '5m', target: 10 },  // Stay at 10 users
    { duration: '2m', target: 0 },   // Cool down
  ],
  thresholds: {
    http_req_duration: ['p(95)<300'],
    http_req_failed: ['rate<0.05'],
  },
};

const BASE_URL = __ENV.BASE_URL || 'http://localhost:8080';

export default function () {
  // Simple health check
  let response = http.get(`${BASE_URL}/health`);

  check(response, {
    'baseline status is 200': (r) => r.status === 200,
    'baseline response time < 100ms': (r) => r.timings.duration < 100,
  });

  sleep(1);
}
