import { check, sleep } from 'k6';
import http from 'k6/http';
import headers from './header.js';
export const options = {
	stages: [
		{ duration: '10s', target: 2 }, // fast ramp-up to a high point
    	// { duration: '1m', target: 0 },
	],
};

export default function() {
	const payload = JSON.stringify({
		email: 'test@gmail.com',
		password: '123456789',
	});
	let res = http.post('http://backend:5000/api/auth/login', payload, headers);
    check(res, {
        'is status 200': (r) => r.status === 200,
        'response time is below 300ms': (r) => r.timings.duration < 300,
      });
	  sleep(1);
}
