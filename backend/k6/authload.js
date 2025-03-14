import { check } from 'k6';
import http from 'k6/http';
import headers from './header.js';
//stages not being used i think
export const options = {
	stages: [
		{ duration: '1m', target: 10 }, // 10 VUs for 1 minute
		{ duration: '1m', target: 10 }, // keep 10 VUs
		{ duration: '30s', target: 20 }, 
		{ duration: '30s', target: 30 }, 
		{ duration: '30s', target: 50 }, 
		{ duration: '30s', target: 100 }, 
        { duration: '30s', target: 0 },
	],
};

export default function() {
	const payload = JSON.stringify({
		email: 'test@gmail.com',
		password: '123456789',
	});
	let res = http.post('http://nginx/api/auth/login', payload, headers);
    check(res, {
        'is status 200': (r) => r.status === 200,
        'response time is below 300ms': (r) => r.timings.duration < 300,
      });
}
