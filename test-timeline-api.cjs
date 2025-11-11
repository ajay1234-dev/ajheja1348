// Simple test script to verify timeline API fixes
const http = require('http');

// Test the timeline API endpoint
const options = {
  hostname: 'localhost',
  port: 5000,
  path: '/api/timeline',
  method: 'GET',
  headers: {
    'Content-Type': 'application/json',
  },
};

console.log('Testing timeline API endpoint...');

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);
  
  res.on('data', (chunk) => {
    console.log(`Body: ${chunk}`);
  });
  
  res.on('end', () => {
    console.log('Request completed');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();