# Neon CRM Data Extractor

A Google Apps Script that extracts all available data from Neon CRM and populates a Google Sheet with separate tabs for each data type.

## Features

- Fetches all data from multiple Neon CRM endpoints
- Automatic pagination for large datasets
- Dynamically retrieves all available fields from the API
- Separate tabs for each data type
- One-click refresh via custom Google Sheets menu
- Node.js scripts for testing API authentication

## Scripts

| Script | Description |
|--------|-------------|
| `scripts/test-script.js` | Google Apps Script for Neon CRM v2 API |
| `scripts/auth-test.js` | Node.js script to test v2 API authentication |

## Setup

### 1. Get Neon CRM API Credentials

1. Log in to your Neon CRM account
2. Go to **Settings > API Keys**
3. Create a new API key or use an existing one
4. Note your **Organization ID** and **API Key**

### 2. Configure Local Credentials

Create a `.env` file in the project root:

```
NEON_ORG_ID=your-org-id
NEON_API_KEY=your-api-key
```

### 3. Test API Authentication

```bash
node scripts/auth-test.js
```

### 4. Create Required Tabs in Google Sheets

Create the following tabs in your Google Sheet:

- `Memberships`

### 5. Add the Script to Google Sheets

1. Open your Google Sheet
2. Go to **Extensions > Apps Script**
3. Delete any existing code in the editor
4. Copy the contents of `scripts/test-script.js` into the editor

### 6. Configure Credentials in Apps Script

Update the configuration at the top of the script:

```javascript
const NEON_ORG_ID = 'your-org-id';      // Your Neon Organization ID
const NEON_API_KEY = 'your-api-key';    // Your Neon API Key
```

### 7. Save and Authorize

1. Click **Save** (or Ctrl/Cmd + S)
2. Refresh your Google Sheet
3. You'll see a new **Neon CRM** menu appear
4. Click **Neon CRM > Refresh All Data**
5. Authorize the script when prompted

## Usage

### Menu Options

| Menu Item | Description |
|-----------|-------------|
| Refresh All Data | Fetches all data and updates all tabs |
| Refresh Memberships | Updates only the Memberships tab |

### Data Tabs

| Tab | Data |
|-----|------|
| Memberships | Accounts with membership data (uses account search with membership fields) |
| Refresh Info | Auto-generated tab showing last refresh timestamps and record counts |

## Notes

- The script uses existing tabs only - it will not create new tabs
- If a tab is missing, that endpoint will show "Sheet not found" in results
- All available fields are fetched dynamically from the API
- Nested objects are serialized as JSON strings

## API Reference

- [Neon CRM API v2 Docs](https://developer.neoncrm.com/api-v2/)

## License

MIT
