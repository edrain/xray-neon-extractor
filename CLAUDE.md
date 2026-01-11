# CLAUDE.md

This file provides guidance to Claude Code when working on this project.

## Project Overview

This is a Google Apps Script project that extracts active member data from Neon CRM and populates a Google Sheet.

## Tech Stack

- **Language**: JavaScript (Google Apps Script)
- **Platform**: Google Sheets via Apps Script
- **External API**: Neon CRM v2 API (https://api.neoncrm.com/v2)
- **Auth**: Basic Auth with Base64-encoded credentials

## Project Structure

```
scripts/
  test-script.js    # Main Google Apps Script (copy to Apps Script editor)
.env                # Local credentials (not committed)
.env.example        # Credential template
```

## Key Concepts

- **Google Apps Script**: Runs in Google's environment, not Node.js. Uses `UrlFetchApp` for HTTP requests, `SpreadsheetApp` for sheet manipulation.
- **Neon CRM API**: RESTful API with pagination. Search endpoint returns paginated results.
- **onOpen()**: Special function that runs when the spreadsheet opens, creates custom menu.

## Development Workflow

1. Edit `scripts/test-script.js` locally
2. Copy contents to Google Apps Script editor (Extensions > Apps Script)
3. Save and test in Google Sheets

## Common Tasks

- **Add new fields**: Update `outputFields` array in search payload and add to `headerRow` and row mapping
- **Change search criteria**: Modify `searchFields` array in `fetchMembers()`
- **Test API**: Use the credentials in `.env` with curl or Postman

## API Reference

- [Neon CRM API v2 Docs](https://developer.neoncrm.com/api-v2/)
- [Google Apps Script Reference](https://developers.google.com/apps-script/reference)
