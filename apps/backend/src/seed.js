const { db } = require('./config/db');
const bcrypt = require('bcryptjs');

async function runSeed() {
  const hash = await bcrypt.hash('password123', 10);

  const stakeholders = [
    {
      id: 'PROCESSOR_01',
      name: 'AyurProcess Extraction Ltd',
      email: 'processor@ayuverify.org',
      role: 'PROCESSOR',
      publicKey: 'wT1yP8f/0j3n9X4Qk4m3yJ7hN8kL9vP2qR4sT5uV6w8='
    },
    {
      id: 'QC_LAB_01',
      name: 'BioAyu Analytical Laboratories',
      email: 'qc@ayuverify.org',
      role: 'QC_LAB',
      publicKey: 'xK9yP8f/0j3n9X4Qk4m3yJ7hN8kL9vP2qR4sT5uV6w8='
    },
    {
      id: 'MANUFACTURER_01',
      name: 'PureVeda Naturals',
      email: 'manufacturer@ayuverify.org',
      role: 'MANUFACTURER',
      publicKey: 'zM2yP8f/0j3n9X4Qk4m3yJ7hN8kL9vP2qR4sT5uV6w8='
    }
  ];

  db.serialize(() => {
    for (const user of stakeholders) {
      db.run(
        `INSERT OR REPLACE INTO users (id, name, email, password_hash, role, public_key)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [user.id, user.name, user.email, hash, user.role, user.publicKey],
        (err) => {
          if (err) console.error(`Failed to seed ${user.email}:`, err.message);
          else console.log(`✅ Seeded: ${user.email} (${user.role})`);
        }
      );
    }
  });
}

runSeed();