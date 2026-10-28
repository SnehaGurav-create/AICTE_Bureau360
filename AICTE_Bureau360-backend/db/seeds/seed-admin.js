// Creates or updates the first ADMIN user from environment variables.

import bcrypt from 'bcrypt';
import { pool } from '../../src/config/database.js';
import { env } from '../../src/config/env.js';

async function seedAdmin() {
  const email = (process.env.ADMIN_EMAIL || env.ADMIN_EMAIL || 'admin@aicte.gov.in').toLowerCase();
  const password = process.env.ADMIN_PASSWORD || 'Admin@123';
  const fullName = process.env.ADMIN_NAME || env.ADMIN_NAME || 'System Administrator';

  console.log(`Seeding admin user: ${email}...`);

  try {
    // 1. Fetch ADMIN role
    const { rows: roleRows } = await pool.query(
      `SELECT id FROM roles WHERE code = 'ADMIN'`,
    );

    if (roleRows.length === 0) {
      console.error('❌  ADMIN role not found in database. Run schema.sql first.');
      process.exit(1);
    }

    const adminRoleId = roleRows[0].id;

    // 2. Hash password
    const saltRounds = env.BCRYPT_ROUNDS || 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);

    // 3. Upsert admin user
    const { rows: userRows } = await pool.query(
      `INSERT INTO users (full_name, email, password_hash, role_id, is_active)
       VALUES ($1, $2, $3, $4, true)
       ON CONFLICT (email)
       DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         full_name = EXCLUDED.full_name,
         role_id = EXCLUDED.role_id,
         is_active = true,
         updated_at = now()
       RETURNING id, full_name, email, role_id`,
      [fullName, email, passwordHash, adminRoleId],
    );

    console.log('✅ Admin user ready:');
    console.log(`   ID:       ${userRows[0].id}`);
    console.log(`   Name:     ${userRows[0].full_name}`);
    console.log(`   Email:    ${userRows[0].email}`);
    console.log(`   Password: ${password}`);
  } catch (err) {
    console.error('❌  Failed to seed admin user:', err.message);
    process.exit(1);
  } finally {
    await pool.end();
  }
}

seedAdmin();
