// Run with: npm run seed:admin
// Creates the first admin account interactively-safe via env vars, or defaults for local dev.
// IMPORTANT: change the default password immediately after first login in production.

const path = require('path');
const dotenv = require('dotenv');
dotenv.config({ path: path.join(__dirname, '..', '.env') });

const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const readline = require('readline');
const Admin = require('../models/Admin');

const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
const ask = (q) => new Promise((resolve) => rl.question(q, resolve));

const run = async () => {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log('Connected to MongoDB');

    const existingCount = await Admin.countDocuments();
    if (existingCount > 0) {
      console.log(`There are already ${existingCount} admin account(s). Exiting to avoid duplicates.`);
      console.log('Delete existing admins first if you want to reseed.');
      process.exit(0);
    }

    const name = (await ask('Admin name: ')) || 'Store Admin';
    const email = (await ask('Admin email: ')).toLowerCase().trim();
    const password = await ask('Admin password (min 6 chars): ');

    if (!email || !password || password.length < 6) {
      console.log('Email and a password of at least 6 characters are required.');
      process.exit(1);
    }

    const hashed = await bcrypt.hash(password, 10);
    const admin = await Admin.create({ name, email, password: hashed, role: 'superadmin' });

    console.log(`\nAdmin account created successfully!`);
    console.log(`Email: ${admin.email}`);
    console.log(`Login at /admin/login.html with this email and your password.\n`);
    process.exit(0);
  } catch (err) {
    console.error('Error creating admin:', err.message);
    process.exit(1);
  } finally {
    rl.close();
  }
};

run();
