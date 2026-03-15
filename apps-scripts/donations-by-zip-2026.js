// ============ CONFIGURATION ============
const NEON_ORG_ID = 'YOUR-NEON-ORG_ID';      // Replace with your Neon Org ID
const NEON_API_KEY = 'YOUR-NEON-API-KEY';    // Replace with your Neon API Key
const BASE_URL = 'https://api.neoncrm.com/v2';

// ============ MENU SETUP ============
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Neon CRM')
    .addItem('Refresh 2026 Donations by Zip', 'fetch2026DonationsByZip')
    .addToUi();
}

// ============ FETCH 2026 DONATIONS BY ZIP ============
function fetch2026DonationsByZip() {
  const sheetName = '2026 Donations by Zip';
  const sheet = getOrCreateSheet(sheetName);

  const searchPayload = {
    searchFields: [
      { field: 'Donation Date', operator: 'GREATER_THAN', value: '2025-12-31' },
      { field: 'Donation Date', operator: 'LESS_THAN', value: '2027-01-01' },
      { field: 'Donation Status', operator: 'EQUAL', value: 'SUCCEEDED' }
    ],
    outputFields: ['Donation Amount', 'Zip Code'],
    pagination: { currentPage: 0, pageSize: 200 }
  };

  const allDonations = paginatedSearch('/donations/search', searchPayload);

  // Aggregate total by zip code
  const zipTotals = {};
  const zipCounts = {};

  for (const donation of allDonations) {
    const zip = (donation['Zip Code'] || '').toString().trim() || '(blank)';
    const amount = parseFloat(donation['Donation Amount']) || 0;
    zipTotals[zip] = (zipTotals[zip] || 0) + amount;
    zipCounts[zip] = (zipCounts[zip] || 0) + 1;
  }

  // Sort by total descending
  const rows = Object.entries(zipTotals)
    .sort((a, b) => b[1] - a[1])
    .map(([zip, total]) => [zip, zipCounts[zip], Math.round(total * 100) / 100]);

  sheet.clear();

  if (rows.length === 0) {
    sheet.getRange(1, 1).setValue('No 2026 donations found');
    updateSingleRefreshInfo('2026 Donations by Zip', '0 zip codes');
    return '0 zip codes';
  }

  const headers = ['Zip Code', 'Donation Count', 'Total Amount'];
  sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
  sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  sheet.getRange(2, 1, rows.length, headers.length).setValues(rows);
  sheet.autoResizeColumns(1, headers.length);

  const result = rows.length + ' zip codes, ' + allDonations.length + ' donations';
  updateSingleRefreshInfo('2026 Donations by Zip', result);
  return result;
}

// ============ UPDATE SINGLE REFRESH ENTRY ============
function updateSingleRefreshInfo(dataType, result) {
  const sheetName = 'Refresh Info';
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
    const headers = ['Data Type', 'Record Count', 'Status', 'Refreshed At'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  const countMatch = result.match(/^(\d+)/);
  const recordCount = countMatch ? parseInt(countMatch[1], 10) : 0;
  const refreshedAt = new Date();

  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === dataType) {
      rowIndex = i + 1;
      break;
    }
  }

  if (rowIndex === -1) rowIndex = values.length + 1;

  sheet.getRange(rowIndex, 1, 1, 4).setValues([[
    dataType,
    recordCount,
    result,
    Utilities.formatDate(refreshedAt, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
  ]]);

  sheet.autoResizeColumns(1, 4);
}

// ============ HELPER: Get or Create Sheet ============
function getOrCreateSheet(sheetName) {
  const ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName(sheetName) || ss.insertSheet(sheetName);
}

// ============ HELPER: Safe JSON Parse ============
function safeJsonParse(text, fallback) {
  if (!text || text.trim() === '') return fallback !== undefined ? fallback : null;
  try {
    return JSON.parse(text);
  } catch (e) {
    Logger.log('JSON parse error: ' + e + ' | Text: ' + text.substring(0, 200));
    return fallback !== undefined ? fallback : null;
  }
}

// ============ HELPER: Paginated Search ============
function paginatedSearch(endpoint, searchPayload) {
  const headers = getAuthHeaders();
  let allResults = [];
  let currentPage = 0;
  let totalPages = 1;

  while (currentPage < totalPages) {
    searchPayload.pagination.currentPage = currentPage;

    Logger.log('paginatedSearch ' + endpoint + ' page ' + currentPage);

    const response = UrlFetchApp.fetch(BASE_URL + endpoint, {
      method: 'POST',
      headers: headers,
      contentType: 'application/json',
      payload: JSON.stringify(searchPayload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    if (responseCode !== 200) {
      Logger.log('paginatedSearch error (status ' + responseCode + '): ' + responseText.substring(0, 500));
      break;
    }

    const result = safeJsonParse(responseText, {});
    const results = result.searchResults || result.donations || result.results || result.data || [];

    if (results.length > 0) {
      allResults = allResults.concat(results);
      Logger.log('paginatedSearch - Found ' + results.length + ' results this page');
    }

    totalPages = result.pagination?.totalPages || 1;
    currentPage++;

    if (currentPage > 100) break;
  }

  Logger.log('paginatedSearch - Total results: ' + allResults.length);
  return allResults;
}

// ============ AUTH HELPER ============
function getAuthHeaders() {
  const credentials = Utilities.base64Encode(NEON_ORG_ID + ':' + NEON_API_KEY);
  return { 'Authorization': 'Basic ' + credentials };
}
