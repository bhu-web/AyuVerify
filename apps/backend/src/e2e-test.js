const axios = require('axios');
const { generateKeyPair, hashPayload, signHash } = require('@ayuverify/shared-crypto');

const API_BASE = 'http://localhost:5000/api/v1';

async function runE2ETest() {
  console.log('🚀 Starting AyuVerify End-to-End Supply Chain Simulation...\n');

  try {
    const runId = Date.now();

    // 1. Generate Stakeholder Key Pairs
    console.log('1️⃣ Generating cryptographic key pairs for stakeholders...');
    const farmerKeys = await generateKeyPair();
    const processorKeys = await generateKeyPair();
    const labKeys = await generateKeyPair();
    const manufacturerKeys = await generateKeyPair();

    // Define unique stakeholder accounts for this test run
    const farmerId = `FARMER_${runId}`;
    const processorId = `PROCESSOR_${runId}`;
    const labId = `QCLAB_${runId}`;
    const manufacturerId = `MANUFACTURER_${runId}`;

    // 2. Register Stakeholders on Backend
    console.log('2️⃣ Registering stakeholders with public keys...');
    await axios.post(`${API_BASE}/auth/register`, {
      id: farmerId, name: 'Ramesh Kumar', email: `farmer_${runId}@ayuverify.org`,
      password: 'password123', role: 'FARMER', publicKey: farmerKeys.publicKey
    });

    await axios.post(`${API_BASE}/auth/register`, {
      id: processorId, name: 'AyurProcess Ltd', email: `process_${runId}@ayuverify.org`,
      password: 'password123', role: 'PROCESSOR', publicKey: processorKeys.publicKey
    });

    await axios.post(`${API_BASE}/auth/register`, {
      id: labId, name: 'Central Herbal Testing Lab', email: `lab_${runId}@ayuverify.org`,
      password: 'password123', role: 'QC_LAB', publicKey: labKeys.publicKey
    });

    await axios.post(`${API_BASE}/auth/register`, {
      id: manufacturerId, name: 'Herbal Care Pharma', email: `pharma_${runId}@ayuverify.org`,
      password: 'password123', role: 'MANUFACTURER', publicKey: manufacturerKeys.publicKey
    });

    console.log('   ✅ All stakeholders registered successfully.\n');

    // 3. Register New Batch
    const batchId = `BATCH-2026-ASHWA-${runId}`;
    console.log(`3️⃣ Registering new batch: ${batchId}...`);
    await axios.post(`${API_BASE}/batches/create`, {
      batchId,
      species: 'Ashwagandha (Withania somnifera)',
      originDistrict: 'Shimoga, Karnataka',
      collectorId: farmerId
    });
    console.log('   ✅ Batch registered.\n');

    // Helper function to sign and submit an event
    const submitSignedEvent = async (eventId, actorId, stage, privateKey, payloadData) => {
      const fullPayload = {
        eventId,
        batchId,
        actorId,
        stage,
        timestamp: new Date().toISOString(),
        data: payloadData
      };

      const recordHash = await hashPayload(fullPayload);
      const digitalSignature = await signHash(recordHash, privateKey);

      await axios.post(`${API_BASE}/batches/events/ingest`, {
        eventId,
        batchId,
        actorId,
        stage,
        payload: fullPayload,
        recordHash,
        digitalSignature
      });

      console.log(`   └─ [${stage}] Signed and ingested event: ${eventId}`);
    };

    // 4. Log Stages
    console.log('4️⃣ Logging supply chain events across all stages...');
    
    // Stage A: Collection
    await submitSignedEvent(`EVT-001-${runId}`, farmerId, 'COLLECTION', farmerKeys.privateKey, {
      harvestWeightKg: 250,
      gpsLocation: '13.9299° N, 75.5681° E',
      qualityGrade: 'A+'
    });

    // Stage B: Processing
    await submitSignedEvent(`EVT-002-${runId}`, processorId, 'PROCESSING', processorKeys.privateKey, {
      processType: 'Drying & Powdering',
      yieldWeightKg: 210,
      moistureContentPercent: 8.5
    });

    // Stage C: Quality Testing
    await submitSignedEvent(`EVT-003-${runId}`, labId, 'QC_TESTING', labKeys.privateKey, {
      testCertificateId: `CERT-${runId}`,
      purityPercent: 99.1,
      heavyMetalsPassed: true,
      labResult: 'PASSED'
    });

    // Stage D: Packaging
    await submitSignedEvent(`EVT-004-${runId}`, manufacturerId, 'PACKAGING', manufacturerKeys.privateKey, {
      unitsPackaged: 1000,
      packagingType: 'Airtight Glass Jars (200g)',
      expiryDate: '2028-08-01'
    });

    console.log('   ✅ All 4 supply chain stages logged and cryptographically verified.\n');

    // 5. Simulate Public Consumer Verification
    console.log('5️⃣ Simulating Public QR Scan Verification...');
    const verifyRes = await axios.get(`${API_BASE}/batches/verify/${batchId}`);

    console.log('====================================================');
    console.log(` Batch Status        : ${verifyRes.data.status === 'AUTHENTIC' ? '✅ AUTHENTIC' : '❌ SUSPICIOUS'}`);
    console.log(` Total Verified Stages: ${verifyRes.data.totalStages}`);
    console.log(' Provenance Chain Details:');
    verifyRes.data.provenanceChain.forEach((stage, idx) => {
      console.log(`   [Stage ${idx + 1}] ${stage.stage} | Actor: ${stage.actorName} (${stage.actorRole}) | Signature: ${stage.isSignatureValid ? 'VALID' : 'INVALID'}`);
    });
    console.log('====================================================');
    console.log(`\n🌐 Verification URL: http://localhost:5000/verify/${batchId}\n`);

  } catch (err) {
    console.error('❌ E2E Test Failed:', err.response?.data || err.message);
  }
}

runE2ETest();