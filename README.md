# Neon CRM Data Extractor

A Google Apps Script that extracts data from Neon CRM into a Google Sheet with separate tabs per data type.

## Features

- Fetches from multiple Neon CRM v2 API endpoints with automatic pagination
- Dynamically retrieves all available fields
- One-click refresh via custom Google Sheets menu
- Local preview via Node.js runner (`node preview-scripts/runner.js test-script.js`)

## Setup

1. Get your **Organization ID** and **API Key** from Neon CRM (**Settings > API Keys**)
2. Create a `.env` file: `NEON_ORG_ID=...` and `NEON_API_KEY=...`
3. Create these tabs in your Google Sheet: `Memberships`, `365+ Donors`
4. Copy `apps-scripts/test-script.js` into **Extensions > Apps Script**, update credentials at the top, save, and refresh

## Menu Options

| Menu Item | Description |
|-----------|-------------|
| Refresh Memberships | Accounts with membership data |
| Refresh 365+ Donors | Accounts with >= $365 total donations in 2025 |

A **Refresh Info** tab auto-updates with timestamps and record counts.

## License

MIT
