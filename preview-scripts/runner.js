#!/usr/bin/env node

/**
 * Generic Apps Script Runner
 *
 * Loads any Apps Script file from apps-scripts/, injects Node.js shims
 * for Google APIs, discovers functions from onOpen(), executes them,
 * and exports each sheet tab as a CSV to preview/.
 *
 * Usage:
 *   node preview-scripts/runner.js <script-file>
 *   node preview-scripts/runner.js test-script.js
 */

'use strict';

const { execFileSync } = require('child_process');
const vm = require('vm');
const fs = require('fs');
const path = require('path');

// ============ LOAD .env ============
const envPath = path.join(__dirname, '..', '.env');
if (fs.existsSync(envPath)) {
  fs.readFileSync(envPath, 'utf8').split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      const value = valueParts.join('=').trim().replace(/^['"]|['"]$/g, '');
      if (!process.env[key.trim()]) process.env[key.trim()] = value;
    }
  });
}

const NEON_ORG_ID = process.env.NEON_ORG_ID;
const NEON_API_KEY = process.env.NEON_API_KEY;

if (!NEON_ORG_ID || !NEON_API_KEY) {
  console.error('Error: Missing credentials. Set NEON_ORG_ID and NEON_API_KEY in .env');
  process.exit(1);
}

// ============ CLI ARG ============
const appsScriptsDir = path.join(__dirname, '..', 'apps-scripts');
const scriptArg = process.argv[2];
if (!scriptArg) {
  const available = fs.readdirSync(appsScriptsDir).filter(f => f.endsWith('.js'));
  console.error('Usage: node scripts/runner.js <script-file>');
  console.error('Available scripts: ' + available.join(', '));
  process.exit(1);
}

const scriptPath = path.isAbsolute(scriptArg)
  ? scriptArg
  : path.join(appsScriptsDir, scriptArg);

if (!fs.existsSync(scriptPath)) {
  console.error('Script not found: ' + scriptPath);
  process.exit(1);
}

// ============ SYNC HTTP via curl ============
function curlRequest(url, opts) {
  opts = opts || {};
  const method = (opts.method || 'GET').toUpperCase();
  const headers = opts.headers || {};

  const args = ['-s', '-w', '\n%{http_code}'];

  if (method !== 'GET') {
    args.push('-X', method);
  }

  for (const [key, val] of Object.entries(headers)) {
    args.push('-H', key + ': ' + val);
  }

  if (opts.contentType) {
    args.push('-H', 'Content-Type: ' + opts.contentType);
  }

  if (opts.payload) {
    args.push('-d', opts.payload);
  }

  args.push(url);

  const raw = execFileSync('curl', args, { encoding: 'utf8', maxBuffer: 50 * 1024 * 1024 });
  const lastNewline = raw.lastIndexOf('\n');
  const body = raw.substring(0, lastNewline);
  const statusCode = parseInt(raw.substring(lastNewline + 1).trim(), 10);

  return {
    getResponseCode: () => statusCode,
    getContentText: () => body
  };
}

// ============ SHEETSSTORE ============
const sheetsStore = new Map();

function makeRangeObj(name, rowStart, colStart, numRows, numCols) {
  return {
    setValues(values) {
      const store = sheetsStore.get(name);
      for (let r = 0; r < values.length; r++) {
        const rowIdx = rowStart - 1 + r;
        if (!store.data[rowIdx]) store.data[rowIdx] = [];
        for (let c = 0; c < values[r].length; c++) {
          store.data[rowIdx][colStart - 1 + c] = values[r][c];
        }
      }
    },
    setValue(val) {
      this.setValues([[val]]);
    },
    getValues() {
      const store = sheetsStore.get(name);
      const result = [];
      for (let r = 0; r < numRows; r++) {
        const row = store.data[rowStart - 1 + r] || [];
        const resultRow = [];
        for (let c = 0; c < numCols; c++) {
          resultRow.push(row[colStart - 1 + c] !== undefined ? row[colStart - 1 + c] : '');
        }
        result.push(resultRow);
      }
      return result;
    },
    setFontWeight() { /* no-op */ },
    setBackground() { /* no-op */ },
    setHorizontalAlignment() { /* no-op */ }
  };
}

function makeSheetObj(name) {
  return {
    clear() {
      sheetsStore.set(name, { data: [] });
    },
    getRange(rowOrA1, col, numRows, numCols) {
      if (col === undefined) {
        return makeRangeObj(name, 1, 1, 1, 1);
      }
      const nr = numRows !== undefined ? numRows : 1;
      const nc = numCols !== undefined ? numCols : 1;
      return makeRangeObj(name, rowOrA1, col, nr, nc);
    },
    getDataRange() {
      const store = sheetsStore.get(name);
      const numRows = store.data.length;
      const numCols = numRows > 0 ? Math.max(...store.data.map(r => (r || []).length)) : 0;
      if (numRows === 0) {
        return { getValues: () => [] };
      }
      return makeRangeObj(name, 1, 1, numRows, numCols);
    },
    autoResizeColumns() { /* no-op */ },
    getName() { return name; }
  };
}

function getOrCreateSheet(name) {
  if (!sheetsStore.has(name)) {
    sheetsStore.set(name, { data: [] });
  }
  return makeSheetObj(name);
}

// ============ MENU CAPTURE ============
const capturedMenuItems = [];

function makeMenuObj() {
  const menuObj = {
    addItem(label, funcName) {
      capturedMenuItems.push(funcName);
      return menuObj;
    },
    addSeparator() { return menuObj; },
    addSubMenu() { return menuObj; },
    addToUi() { return menuObj; }
  };
  return menuObj;
}

// ============ GAS SHIMS ============
global.UrlFetchApp = {
  fetch(url, opts) {
    return curlRequest(url, opts);
  }
};

global.SpreadsheetApp = {
  getActiveSpreadsheet() {
    return {
      getSheetByName: name => getOrCreateSheet(name),
      insertSheet: name => getOrCreateSheet(name)
    };
  },
  getUi() {
    return {
      createMenu() { return makeMenuObj(); }
    };
  }
};

global.Utilities = {
  base64Encode(str) {
    return Buffer.from(str).toString('base64');
  },
  formatDate(date, _timezone, format) {
    const pad = n => String(n).padStart(2, '0');
    const d = new Date(date);
    return format
      .replace('yyyy', d.getFullYear())
      .replace('MM', pad(d.getMonth() + 1))
      .replace('dd', pad(d.getDate()))
      .replace('HH', pad(d.getHours()))
      .replace('mm', pad(d.getMinutes()))
      .replace('ss', pad(d.getSeconds()));
  }
};

global.Logger = {
  log(msg) { console.log('[GAS]', msg); }
};

global.Session = {
  getScriptTimeZone() {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  }
};

// ============ READ & EVAL SCRIPT ============
let source = fs.readFileSync(scriptPath, 'utf8');

// Inject credentials by replacing placeholder values
source = source.replace(
  /const NEON_ORG_ID\s*=\s*'[^']*'/,
  () => "const NEON_ORG_ID = '" + NEON_ORG_ID + "'"
);
source = source.replace(
  /const NEON_API_KEY\s*=\s*'[^']*'/,
  () => "const NEON_API_KEY = '" + NEON_API_KEY + "'"
);

// Run in global context so function declarations become global
vm.runInThisContext(source, { filename: scriptPath });

// ============ DISCOVER & RUN FUNCTIONS ============
console.log('\nRunning: ' + scriptArg);

if (typeof global.onOpen !== 'function') {
  console.error('No onOpen() function found in ' + scriptArg);
  process.exit(1);
}

global.onOpen();

if (capturedMenuItems.length === 0) {
  console.error('No menu items discovered from onOpen()');
  process.exit(1);
}

console.log('Discovered functions: ' + capturedMenuItems.join(', ') + '\n');

for (const funcName of capturedMenuItems) {
  if (typeof global[funcName] === 'function') {
    console.log('\n--- Running ' + funcName + ' ---');
    const result = global[funcName]();
    console.log('Result: ' + result);
  } else {
    console.warn('Warning: function ' + funcName + ' not found in script');
  }
}

// ============ EXPORT CSVs ============
const outputDir = path.join(__dirname, '..', 'preview');
if (!fs.existsSync(outputDir)) {
  fs.mkdirSync(outputDir, { recursive: true });
}

const escapeCsv = val => {
  if (val === null || val === undefined) return '';
  const str = typeof val === 'object' ? JSON.stringify(val) : String(val);
  return str.includes(',') || str.includes('"') || str.includes('\n')
    ? '"' + str.replace(/"/g, '""') + '"'
    : str;
};

console.log('\n=== Output Summary ===');
for (const [tabName, store] of sheetsStore.entries()) {
  if (store.data.length === 0) continue;

  const slug = tabName.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
  const filePath = path.join(outputDir, slug + '.csv');

  const lines = store.data.map(row => (row || []).map(escapeCsv).join(','));
  fs.writeFileSync(filePath, lines.join('\n'), 'utf8');

  const recordCount = store.data.length - 1; // subtract header row
  console.log('  ' + tabName + ': ' + recordCount + ' records → ' + slug + '.csv');
}
