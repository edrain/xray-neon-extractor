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
apps-scripts/
  test-script.js      # Google Apps Script (copy to Apps Script editor) — source of truth
preview-scripts/
  runner.js           # Generic runner: loads any Apps Script, runs it, exports CSVs
preview/              # CSV exports from runner.js (gitignored)
.claude/skills/
  preview.md          # /preview skill — runs runner.js and shows output summary
neon-data-model.md    # XRAY's Neon CRM data model — campaigns, funds, membership levels, API structure, field names, scale
.env                  # Local credentials (not committed)
.env.example          # Credential template
```

## Key Concepts

- **Google Apps Script**: Runs in Google's environment, not Node.js. Uses `UrlFetchApp` for HTTP requests, `SpreadsheetApp` for sheet manipulation.
- **Neon CRM v2 API**: RESTful API with Basic Auth and pagination. Search endpoints return paginated results. See `neon-data-model.md` for XRAY's campaigns, funds, membership levels, available fields, search operators, and API scale.
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

1. Edit `apps-scripts/test-script.js` (the Apps Script — source of truth)
2. Preview locally with `/preview` or `node preview-scripts/runner.js test-script.js`
3. For Google Sheets: Copy contents to Apps Script editor (Extensions > Apps Script)
4. For auth testing: Run Node.js scripts from terminal

## Local Preview (`/preview` skill)

Run any Apps Script file locally without touching Google Sheets:

```bash
node preview-scripts/runner.js test-script.js
```

- Discovers functions from `onOpen()` automatically
- Injects Node.js shims for `UrlFetchApp`, `SpreadsheetApp`, `Utilities`, `Logger`, `Session`
- Exports each sheet tab as `preview/<tab-slug>.csv`
- To add a new Apps Script: create the file in `apps-scripts/`, it will be picked up automatically

## Common Tasks

- **Add new endpoint**: Create fetch function with `updateSingleRefreshInfo()` call, add to menu in `onOpen()`
- **Change search criteria**: Modify `searchFields` array in the relevant fetch function
- **Preview data locally**: Use `/preview` or `node preview-scripts/runner.js test-script.js`
- **Test API**: Use curl with credentials from `.env`
- **Each tab refreshes individually**: No batch refresh functionality, each tab must be refreshed separately via menu
