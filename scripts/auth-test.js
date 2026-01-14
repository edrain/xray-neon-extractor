#!/usr/bin/env node

/**
 * Neon CRM API v2 Authentication Test
 *
 * Usage:
 *   node scripts/auth-test.js
 *
 * Requires environment variables:
 *   NEON_ORG_ID - Your Neon Organization ID
 *   NEON_API_KEY - Your Neon API Key
 *
 * You can set these in a .env file or export them directly.
 */

const https = require('https');
const fs = require('fs');
const path = require('path');

const BASE_URL = 'https://api.neoncrm.com/v2';

// Load .env file if it exists
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  const envContent = fs.readFileSync(envPath, 'utf8');
  envContent.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key.trim()]) {
        process.env[key.trim()] = value;
      }
    }
  });
}

const NEON_ORG_ID = process.env.NEON_ORG_ID;
const NEON_API_KEY = process.env.NEON_API_KEY;

if (!NEON_ORG_ID || !NEON_API_KEY) {
  console.error('Error: Missing credentials');
  console.error('Set NEON_ORG_ID and NEON_API_KEY environment variables');
  console.error('Or create a .env file with these values');
  process.exit(1);
}

function makeRequest(url, options) {
  return new Promise((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        resolve({
          status: res.statusCode,
          statusText: res.statusMessage,
          ok: res.statusCode >= 200 && res.statusCode < 300,
          data: data
        });
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function testAuth() {
  const credentials = Buffer.from(`${NEON_ORG_ID}:${NEON_API_KEY}`).toString('base64');

  console.log('Testing Neon CRM API v2 authentication...');
  console.log(`Base URL: ${BASE_URL}`);
  console.log(`Org ID: ${NEON_ORG_ID}`);
  console.log('');

  try {
    const response = await makeRequest(`${BASE_URL}/customFields?category=Account`, {
      method: 'GET',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/json'
      }
    });

    console.log(`Status: ${response.status} ${response.statusText}`);

    const data = JSON.parse(response.data);

    if (response.ok) {
      console.log('Authentication successful!');
      console.log('');
      console.log('Response preview:');
      console.log(JSON.stringify(data, null, 2).slice(0, 500) + '...');
    } else {
      console.error('Authentication failed');
      console.error('Response:', JSON.stringify(data, null, 2));
    }
  } catch (error) {
    console.error('Request failed:', error.message);
    process.exit(1);
  }
}

testAuth();
