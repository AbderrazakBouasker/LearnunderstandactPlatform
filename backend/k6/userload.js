import { check } from 'k6';
import http from 'k6/http';
import headers from './header.js';

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
	const userId = '67c7076749acfa321b58adfe'; // Replace with an actual user ID
	let res = http.get(`http://nginx/api/user/${userId}`, headers);
    check(res, {
        'is status 200': (r) => r.status === 200,
        'response time is below 300ms': (r) => r.timings.duration < 300,
      });
	console.log(res.body);
}