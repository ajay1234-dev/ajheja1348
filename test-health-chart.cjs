// Test script to verify health chart fixes
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
  
  let data = '';
  res.on('data', (chunk) => {
    data += chunk;
  });
  
  res.on('end', () => {
    try {
      const timelineData = JSON.parse(data);
      console.log(`Received ${timelineData.length} timeline events`);
      
      // Log the structure of the first few events to understand the data
      timelineData.slice(0, 3).forEach((event, index) => {
        console.log(`\nEvent ${index + 1}:`);
        console.log(`  ID: ${event.id}`);
        console.log(`  Type: ${event.eventType}`);
        console.log(`  Title: ${event.title}`);
        console.log(`  Has metrics: ${!!event.metrics}`);
        console.log(`  Has analysis: ${!!event.analysis}`);
        console.log(`  Has medications: ${!!event.medications}`);
        
        if (event.metrics) {
          console.log(`  Metrics keys: ${Object.keys(event.metrics).join(', ')}`);
        }
        
        if (event.analysis) {
          console.log(`  Analysis keys: ${Object.keys(event.analysis).join(', ')}`);
        }
        
        if (event.medications) {
          console.log(`  Medications count: ${event.medications.length}`);
        }
      });
    } catch (e) {
      console.log('Data received:', data);
    }
    console.log('\nRequest completed');
  });
});

req.on('error', (e) => {
  console.error(`Problem with request: ${e.message}`);
});

req.end();