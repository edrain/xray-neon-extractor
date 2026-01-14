# CLAUDE.md

This file provides guidance to Claude Code when working on this project.

## Project Overview

A Google Apps Script that extracts all available data from Neon CRM and populates separate tabs in a Google Sheet. Includes Node.js scripts for testing API authentication.

## Tech Stack

- **Language**: JavaScript (Google Apps Script + Node.js)
- **Platform**: Google Sheets via Apps Script
- **External APIs**:
  - Neon CRM v2 API (https://api.neoncrm.com/v2) - RESTful with Basic Auth
  - Neon CRM Legacy API (https://api.neoncrm.com) - Session-based auth
- **Auth**:
  - v2 API: Basic Auth with Base64-encoded `orgId:apiKey`
  - Legacy API: Login endpoint returns session ID for subsequent requests

## Project Structure

```
scripts/
  test-script.js      # Google Apps Script for v2 API (copy to Apps Script editor)
  test-script-v1.js   # Google Apps Script for legacy API
  auth-test.js        # Node.js script to test v2 API authentication
  auth-test-v1.js     # Node.js script to test legacy API authentication
.env                  # Local credentials (not committed)
.env.example          # Credential template
```

## Key Concepts

- **Google Apps Script**: Runs in Google's environment, not Node.js. Uses `UrlFetchApp` for HTTP requests, `SpreadsheetApp` for sheet manipulation.
- **Neon CRM v2 API**: RESTful API with Basic Auth and pagination. Search endpoints return paginated results.
- **Neon CRM Legacy API**: Uses session-based auth. Login with orgId/apiKey returns a `userSessionId` for subsequent requests.
- **onOpen()**: Special function that runs when the spreadsheet opens, creates custom menu.
- **Existing tabs only**: Script uses pre-existing tabs, does not create new ones.

## API Differences

| Feature | v2 API | Legacy API |
|---------|--------|------------|
| Base URL | `https://api.neoncrm.com/v2` | `https://api.neoncrm.com/neonws/services/api` |
| Auth Method | Basic Auth header | Session ID from login endpoint |
| Format | REST/JSON | REST/JSON (also has SOAP services) |
| Login | Not required | `GET /common/login?login.orgid=X&login.apikey=Y` |

## Data Endpoints (v2 API)

The script fetches from these Neon CRM endpoints:

| Tab Name | Endpoint | Method | Notes |
|----------|----------|--------|-------|
| Memberships | `/accounts/search` | POST (search) | Uses account search with membership output fields |

## Development Workflow

1. Edit scripts locally
2. For Google Sheets: Copy contents to Apps Script editor (Extensions > Apps Script)
3. For auth testing: Run Node.js scripts from terminal

## Testing Authentication

```bash
# Test v2 API
node scripts/auth-test.js

# Test legacy API
node scripts/auth-test-v1.js
```

## Common Tasks

- **Add new endpoint**: Create fetch function, add to menu in `onOpen()`, add to `fetchAllData()`
- **Change search criteria**: Modify `searchFields` array in the relevant fetch function
- **Test API**: Use the Node.js auth test scripts or curl with credentials from `.env`

## API Reference

- [Neon CRM API v2 Docs](https://developer.neoncrm.com/api-v2/)
- [Google Apps Script Reference](https://developers.google.com/apps-script/reference)
