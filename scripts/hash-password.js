#!/usr/bin/env node
/**
 * PocketCloud Password Hasher Utility
 * Generates a secure bcrypt password hash to be stored in your .env file as ADMIN_PASSWORD_HASH.
 *
 * Usage:
 *   node scripts/hash-password.js <your_secure_password>
 *   OR run interactively without arguments:
 *   node scripts/hash-password.js
 */

const bcrypt = require('bcryptjs');
const readline = require('readline');

async function generateHash(password) {
  const saltRounds = 12;
  console.log('Generating secure bcrypt hash (salt rounds = 12)...');
  const hash = await bcrypt.hash(password, saltRounds);
  console.log('\n=============================================================');
  console.log('SUCCESS! Copy the line below into your .env file:\n');
  console.log(`ADMIN_PASSWORD_HASH=${hash}`);
  console.log('=============================================================\n');
}

const inputPassword = process.argv[2];

if (inputPassword) {
  generateHash(inputPassword).catch(console.error);
} else {
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout
  });

  rl.question('Enter the password you want to use for PocketCloud admin login: ', (answer) => {
    rl.close();
    if (!answer || answer.trim() === '') {
      console.error('Error: Password cannot be empty.');
      process.exit(1);
    }
    generateHash(answer.trim()).catch(console.error);
  });
}
