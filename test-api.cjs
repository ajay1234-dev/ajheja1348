const http = require("http");

// Test the timeline API endpoint
const options = {
  hostname: "localhost",
  port: 5000,
  path: "/api/timeline",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const req = http.request(options, (res) => {
  console.log(`Status: ${res.statusCode}`);
  console.log(`Headers: ${JSON.stringify(res.headers)}`);

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Response body:");
    console.log(data);
  });
});

req.on("error", (error) => {
  console.error("Error:", error);
});

req.end();
