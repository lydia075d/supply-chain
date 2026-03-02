// Test script for blockchain integration
const axios = require("axios");

const BASE_URL = "http://localhost:5000/api";

async function test() {
  try {
    console.log("=== Step 1: Register Producer ===");
    const registerRes = await axios.post(`${BASE_URL}/auth/register`, {
      email: "producer@test.com",
      password: "test123",
      role: "producer",
    });
    console.log("Registered:", registerRes.data);
    const token = registerRes.data.token;

    console.log("\n=== Step 2: Create Batch ===");
    const batchRes = await axios.post(
      `${BASE_URL}/batch/create`,
      {
        batchId: "TEST001",
        productType: "Rice",
        quantity: 100,
        productionDate: "2024-01-01",
        expiryDate: "2024-12-31",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log("Batch created:", batchRes.data);

    console.log("\n=== Step 3: Record Checkpoint (with blockchain) ===");
    const checkpointRes = await axios.post(
      `${BASE_URL}/checkpoint`,
      {
        batchId: "TEST001",
        location: {
          latitude: 13.0827,
          longitude: 80.2704,
        },
        scannerRole: "distributor",
      },
      {
        headers: { Authorization: `Bearer ${token}` },
      },
    );
    console.log("Checkpoint recorded:", checkpointRes.data);

    console.log("\n=== Step 4: Verify via QR (Consumer) ===");
    const verifyRes = await axios.get(`${BASE_URL}/verify/TEST001`);
    console.log("Verification:", verifyRes.data);

    console.log("\n=== TEST COMPLETE ===");
    console.log(
      "Check the checkpoint response for blockchain transaction hash!",
    );
  } catch (err) {
    console.error("Error:", err.response?.data || err.message);
  }
}

test();
