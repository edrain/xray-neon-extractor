# CLAUDE.md

This file provides guidance to Claude Code when working on this project.

## Project Overview

A Google Apps Script that extracts all available data from Neon CRM and populates separate tabs in a Google Sheet. Includes Node.js scripts for testing API authentication.

## Tech Stack

- **Language**: JavaScript (Google Apps Script + Node.js)
- **Platform**: Google Sheets via Apps Script
- **External API**: Neon CRM v2 API (https://api.neoncrm.com/v2) - RESTful with Basic Auth
- **Auth**: Basic Auth with Base64-encoded `orgId:apiKey`

## Project Structure

```
scripts/
  test-script.js      # Google Apps Script (copy to Apps Script editor)
  auth-test.js        # Node.js script to test API authentication
.env                  # Local credentials (not committed)
.env.example          # Credential template
```

## Key Concepts

- **Google Apps Script**: Runs in Google's environment, not Node.js. Uses `UrlFetchApp` for HTTP requests, `SpreadsheetApp` for sheet manipulation.
- **Neon CRM v2 API**: RESTful API with Basic Auth and pagination. Search endpoints return paginated results.
- **onOpen()**: Special function that runs when the spreadsheet opens, creates custom menu.
- **Existing tabs only**: Script uses pre-existing tabs, does not create new ones.

## Data Endpoints

The script fetches from these Neon CRM endpoints:

| Tab Name | Endpoint | Method | Notes |
|----------|----------|--------|-------|
| Memberships | `/accounts/search` | POST (search) | Uses account search with membership output fields |
| 365+ Donors | `/accounts/search` | POST (search) | Accounts with >= $365 total donations in 2025, includes contact info and notes |
| Refresh Info | N/A | Auto-generated | Shows refresh timestamps and record counts for each tab |

## Development Workflow

1. Edit scripts locally
2. For Google Sheets: Copy contents to Apps Script editor (Extensions > Apps Script)
3. For auth testing: Run Node.js scripts from terminal

## Testing Authentication

```bash
node scripts/auth-test.js
```

## Common Tasks

- **Add new endpoint**: Create fetch function with `updateSingleRefreshInfo()` call, add to menu in `onOpen()`
- **Change search criteria**: Modify `searchFields` array in the relevant fetch function
- **Test API**: Use `node scripts/auth-test.js` or curl with credentials from `.env`
- **Each tab refreshes individually**: No batch refresh functionality, each tab must be refreshed separately via menu

## API Reference

- [Neon CRM API v2 Docs](https://developer.neoncrm.com/api-v2/)
- [Google Apps Script Reference](https://developers.google.com/apps-script/reference)
