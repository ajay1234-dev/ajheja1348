const http = require("http");
const cookies = [];

// First, get the session cookie
const authOptions = {
  hostname: "localhost",
  port: 5000,
  path: "/api/auth/debug",
  method: "GET",
  headers: {
    "Content-Type": "application/json",
  },
};

const authReq = http.request(authOptions, (res) => {
  console.log(`Auth Status: ${res.statusCode}`);

  // Store cookies
  if (res.headers["set-cookie"]) {
    cookies.push(...res.headers["set-cookie"]);
  }

  let data = "";
  res.on("data", (chunk) => {
    data += chunk;
  });

  res.on("end", () => {
    console.log("Auth Response:", data);

    // Now test the notifications endpoint with cookies
    testEndpoint("/api/notifications");

    // Test the timeline endpoint with cookies
    testEndpoint("/api/timeline");
  });
});

authReq.on("error", (error) => {
  console.error("Auth Error:", error);
});

authReq.end();

function testEndpoint(endpoint) {
  const options = {
    hostname: "localhost",
    port: 5000,
    path: endpoint,
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Cookie: cookies.join("; "),
    },
  };

  const req = http.request(options, (res) => {
    console.log(`\n${endpoint} Status: ${res.statusCode}`);

    let data = "";
    res.on("data", (chunk) => {
      data += chunk;
    });

    res.on("end", () => {
      console.log(`${endpoint} Response:`, data);
    });
  });

  req.on("error", (error) => {
    console.error(`${endpoint} Error:`, error);
  });

  req.end();
}
