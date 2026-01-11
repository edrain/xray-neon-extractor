# Neon CRM Member Extractor

A Google Apps Script that extracts active member data from Neon CRM and populates a Google Sheet.

## Features

- Fetches all active members from Neon CRM
- Automatic pagination for large member lists
- Extracts key member fields: ID, name, email, phone, address, membership details
- One-click refresh via custom Google Sheets menu

## Setup

### 1. Get Neon CRM API Credentials

1. Log in to your Neon CRM account
2. Go to **Settings > API Keys**
3. Create a new API key or use an existing one
4. Note your **Organization ID** and **API Key**

### 2. Create a Google Sheet

1. Create a new Google Sheet (or open an existing one)
2. Go to **Extensions > Apps Script**
3. Delete any existing code in the editor
4. Copy the contents of `scripts/test-script.js` into the editor

### 3. Configure Credentials

In the Apps Script editor, update the configuration at the top of the script:

```javascript
const NEON_ORG_ID = 'your-org-id';      // Your Neon Organization ID
const NEON_API_KEY = 'your-api-key';    // Your Neon API Key
```

### 4. Save and Authorize

1. Click **Save** (or Ctrl/Cmd + S)
2. Refresh your Google Sheet
3. You'll see a new **Neon CRM** menu appear
4. Click **Neon CRM > Refresh Members**
5. Authorize the script when prompted

## Usage

After setup, click **Neon CRM > Refresh Members** to pull the latest active member data into your sheet.

### Data Fields

The script extracts the following fields for each active member:

| Column | Field |
|--------|-------|
| Account ID | Neon account identifier |
| First Name | Member's first name |
| Last Name | Member's last name |
| Email | Primary email address |
| Phone | Primary phone number |
| Address | Street address |
| City | City |
| State | State/Province |
| Zip | Postal code |
| Membership | Membership type name |
| Expiration | Membership expiration date |

## API Reference

This script uses the [Neon CRM v2 API](https://developer.neoncrm.com/api-v2/).

## License

MIT
