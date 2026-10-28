// Seeds default demo accounts for each of the 5 portals and ensures regions and bureaus exist.
// Run with: npm run seed:admin

import bcrypt from 'bcrypt';
import pg from 'pg';

const DATABASE_URL = process.env.DATABASE_URL || 'postgresql://bureau360_user:bureau360_secret@localhost:5432/bureau360';
const pool = new pg.Pool({ connectionString: DATABASE_URL });

async function seed() {
  console.log('🌱 Seeding demo accounts and organizational units for AICTE Bureau360...');

  // 1. Ensure Regions exist
  const regionNames = ['Northern Region', 'Southern Region', 'Western Region', 'Eastern Region'];
  const regionMap = {};
  for (const name of regionNames) {
    const res = await pool.query(
      `INSERT INTO regions (name) VALUES ($1) ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name RETURNING id, name`,
      [name],
    );
    regionMap[res.rows[0].name] = res.rows[0].id;
  }
  console.log(`✅ Ensured ${Object.keys(regionMap).length} regions.`);

  // 2. Ensure Bureaus exist
  const bureausToSeed = [
    { code: 'REG_BUREAU', name: 'Regulation Bureau', type: 'BUREAU', regionId: null },
    { code: 'PGRC', name: 'Public Grievance Redressal Cell', type: 'CELL', regionId: null },
    { code: 'RO_NORTH', name: 'Northern Regional Office (Kanpur)', type: 'REGIONAL_OFFICE', regionId: regionMap['Northern Region'] },
    { code: 'RO_SOUTH', name: 'Southern Regional Office (Chennai)', type: 'REGIONAL_OFFICE', regionId: regionMap['Southern Region'] },
  ];

  const bureauMap = {};
  for (const b of bureausToSeed) {
    const res = await pool.query(
      `INSERT INTO bureaus (code, name, type, region_id)
       VALUES ($1, $2, $3, $4)
       ON CONFLICT (code) DO UPDATE SET name = EXCLUDED.name, region_id = EXCLUDED.region_id
       RETURNING id, code`,
      [b.code, b.name, b.type, b.regionId],
    );
    bureauMap[res.rows[0].code] = res.rows[0].id;
  }
  console.log(`✅ Ensured bureaus (${Object.keys(bureauMap).join(', ')}).`);

  // 3. Fetch Role IDs
  const rolesRes = await pool.query(`SELECT id, code FROM roles`);
  const roleMap = {};
  for (const r of rolesRes.rows) {
    roleMap[r.code] = r.id;
  }

  // 4. Seed Demo Users for the 5 Portals
  const usersToSeed = [
    {
      full_name: 'AICTE Administrator',
      email: 'admin@aicte.gov.in',
      password: 'Admin@123',
      designation: 'Chief Administrator',
      role_code: 'ADMIN',
      bureau_code: null,
    },
    {
      full_name: 'Dr. Ramesh Sharma (Regulation Bureau)',
      email: 'rb@aicte.gov.in',
      password: 'Rb@123',
      designation: 'Director (Regulation)',
      role_code: 'REGULATION_BUREAU',
      bureau_code: 'REG_BUREAU',
    },
    {
      full_name: 'Priyanka Verma (PGRC)',
      email: 'pgrc@aicte.gov.in',
      password: 'Pgrc@123',
      designation: 'Grievance Officer',
      role_code: 'PGRC',
      bureau_code: 'PGRC',
    },
    {
      full_name: 'Rajesh Gupta (RO North)',
      email: 'ro.north@aicte.gov.in',
      password: 'Ro@123',
      designation: 'Regional Officer (North)',
      role_code: 'REGIONAL_OFFICE',
      bureau_code: 'RO_NORTH',
    },
    {
      full_name: 'Vikram Malhotra (Inspection Officer)',
      email: 'officer@aicte.gov.in',
      password: 'Officer@123',
      designation: 'Senior Inspection Officer',
      role_code: 'AUTHORIZED_OFFICER',
      bureau_code: 'REG_BUREAU',
    },
  ];

  for (const u of usersToSeed) {
    const roleId = roleMap[u.role_code];
    if (!roleId) {
      console.warn(`⚠️ Role ${u.role_code} not found, skipping ${u.email}`);
      continue;
    }

    const bureauId = u.bureau_code ? bureauMap[u.bureau_code] : null;
    const passwordHash = await bcrypt.hash(u.password, 10);

    await pool.query(
      `INSERT INTO users (full_name, email, password_hash, designation, role_id, bureau_id, is_active, failed_login_count, locked_until)
       VALUES ($1, $2, $3, $4, $5, $6, TRUE, 0, NULL)
       ON CONFLICT (email) DO UPDATE
       SET full_name = EXCLUDED.full_name,
           password_hash = EXCLUDED.password_hash,
           designation = EXCLUDED.designation,
           role_id = EXCLUDED.role_id,
           bureau_id = EXCLUDED.bureau_id,
           is_active = TRUE,
           failed_login_count = 0,
           locked_until = NULL`,
      [u.full_name, u.email, passwordHash, u.designation, roleId, bureauId],
    );

    console.log(`  👤 Seeded account: ${u.email} [${u.role_code}] (Password: ${u.password})`);
  }

  console.log('\n✨ Database seeding completed successfully!');
  await pool.end();
}

seed().catch((err) => {
  console.error('❌ Seeding failed:', err);
  process.exit(1);
});
