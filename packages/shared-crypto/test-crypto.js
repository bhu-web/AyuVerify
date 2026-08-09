const { generateKeyPair, hashPayload, signHash, verifySignature } = require('./src/index');

async function runTest() {
  console.log("--- Testing AyuVerify Crypto Engine ---");

  // 1. Generate Stakeholder Keys
  const farmerKeys = await generateKeyPair();
  console.log("Generated Farmer Public Key:", farmerKeys.publicKey);

  // 2. Create Sample Supply Chain Event
  const harvestEvent = {
    batchId: "BATCH-2026-001",
    actorId: "FARMER_102",
    stage: "COLLECTION",
    location: "District 4, Karnataka",
    timestamp: new Date().toISOString(),
    details: { species: "Ashwagandha", weightKg: 150 }
  };

  // 3. Hash Event Payload
  const payloadHash = await hashPayload(harvestEvent);
  console.log("Calculated Payload SHA-256 Hash:", payloadHash);

  // 4. Sign Hash with Farmer's Private Key
  const signature = await signHash(payloadHash, farmerKeys.privateKey);
  console.log("Generated Digital Signature:", signature);

  // 5. Verify Signature on Server Side using Farmer's Public Key
  const isValid = await verifySignature(payloadHash, signature, farmerKeys.publicKey);
  console.log("Signature Verification Result:", isValid ? "✅ VALID" : "❌ INVALID");

  // 6. Test Tamper Resistance
  const tamperedEvent = { ...harvestEvent, details: { species: "Ashwagandha", weightKg: 999 } };
  const tamperedHash = await hashPayload(tamperedEvent);
  const isTamperedValid = await verifySignature(tamperedHash, signature, farmerKeys.publicKey);
  console.log("Tampered Event Verification Result:", isTamperedValid ? "❌ FAILED TO DETECT" : "✅ TAMPER DETECTED (REJECTED)");
}

runTest();