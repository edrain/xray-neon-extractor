// ============ CONFIGURATION ============
const NEON_ORG_ID = 'YOUR-NEON-ORG_ID';      // Replace with your Neon Org ID
const NEON_API_KEY = 'YOUR-NEON-API-KEY';    // Replace with your Neon API Key
const BASE_URL = 'https://api.neoncrm.com/v2';

// ============ MENU SETUP ============
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Neon CRM')
    .addItem('Refresh Memberships', 'fetchMemberships')
    .addItem('Refresh 365+ Donors', 'fetch365Donors')
    .addToUi();
}

// ============ UPDATE SINGLE REFRESH ENTRY ============
function updateSingleRefreshInfo(dataType, result) {
  const sheetName = 'Refresh Info';
  let sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);

  // Create the sheet if it doesn't exist
  if (!sheet) {
    sheet = SpreadsheetApp.getActiveSpreadsheet().insertSheet(sheetName);
    const headers = ['Data Type', 'Record Count', 'Status', 'Refreshed At'];
    sheet.getRange(1, 1, 1, headers.length).setValues([headers]);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold');
  }

  // Parse the record count from the result string
  const countMatch = result.match(/^(\d+)/);
  const recordCount = countMatch ? parseInt(countMatch[1], 10) : 0;
  const refreshedAt = new Date();

  // Find existing row for this data type or add new row
  const dataRange = sheet.getDataRange();
  const values = dataRange.getValues();
  let rowIndex = -1;

  for (let i = 1; i < values.length; i++) {
    if (values[i][0] === dataType) {
      rowIndex = i + 1;
      break;
    }
  }

  // If not found, add new row
  if (rowIndex === -1) {
    rowIndex = values.length + 1;
  }

  // Update the row
  const row = [
    dataType,
    recordCount,
    result,
    Utilities.formatDate(refreshedAt, Session.getScriptTimeZone(), 'yyyy-MM-dd HH:mm:ss')
  ];
  sheet.getRange(rowIndex, 1, 1, 4).setValues([row]);

  // Auto-resize columns
  sheet.autoResizeColumns(1, 4);
}

// ============ FETCH MEMBERSHIPS ============
function fetchMemberships() {
  const sheetName = 'Memberships';
  const sheet = getSheet(sheetName);
  if (!sheet) return 'Sheet not found';

  // Get all available output fields and filter for membership-related ones
  const allFields = getSearchFields('/accounts/search/outputFields');

  // Filter for membership-related fields - prefer current/recent fields, not old calendar years
  let membershipFields = allFields.filter(f => {
    const lower = f.toLowerCase();
    // Include current membership fields
    if (lower.includes('current') && lower.includes('membership')) return true;
    // Include general membership fields (not year-specific aggregates)
    if (lower.includes('membership') && !lower.match(/^\d{4}/)) return true;
    return false;
  });

  // If no current fields found, use most recent year fields
  if (membershipFields.length === 0) {
    membershipFields = allFields.filter(f =>
      f.toLowerCase().includes('membership')
    ).slice(0, 20);
  }

  // Add basic account fields at the beginning
  const accountFields = ['Account ID', 'First Name', 'Last Name', 'Email 1'].filter(f => allFields.includes(f));
  membershipFields = [...accountFields, ...membershipFields.filter(f => !accountFields.includes(f))];

  Logger.log('fetchMemberships - Found ' + membershipFields.length + ' membership-related fields');
  Logger.log('fetchMemberships - Fields: ' + membershipFields.slice(0, 10).join(', '));

  if (membershipFields.length <= accountFields.length) {
    sheet.clear();
    sheet.getRange(1, 1).setValue('No membership fields found in API');
    return '0 records - no membership fields';
  }

  // Use Account ID as search criterion (always valid), output membership fields
  const searchPayload = {
    searchFields: [
      { field: 'Account ID', operator: 'NOT_BLANK' }
    ],
    outputFields: membershipFields.slice(0, 30),
    pagination: { currentPage: 0, pageSize: 200 }
  };

  Logger.log('fetchMemberships - Using Account ID search with membership output fields');

  const allResults = paginatedSearch('/accounts/search', searchPayload);

  // Filter to only accounts that have some membership data
  const membershipDataFields = membershipFields.filter(f => !accountFields.includes(f));
  const filteredResults = allResults.filter(record => {
    return membershipDataFields.some(field => {
      const val = record[field];
      return val !== null && val !== undefined && val !== '' && val !== 0 && val !== '0';
    });
  });

  Logger.log('fetchMemberships - Filtered from ' + allResults.length + ' to ' + filteredResults.length + ' records with membership data');

  if (filteredResults.length > 0) {
    writeToSheetFromObjects(sheet, filteredResults);
  } else {
    sheet.clear();
    sheet.getRange(1, 1).setValue('No accounts with membership data found');
  }

  const result = filteredResults.length + ' records';
  updateSingleRefreshInfo('Memberships', result);
  return result;
}

// ============ FETCH 365+ DONORS ============
function fetch365Donors() {
  const sheetName = '365+ Donors';
  const sheet = getSheet(sheetName);
  if (!sheet) return 'Sheet not found';

  // Get all available output fields
  const allFields = getSearchFields('/accounts/search/outputFields');

  // Filter for contact info fields
  const contactFields = ['Account ID', 'First Name', 'Last Name', 'Email 1', 'Email 2', 'Email 3',
                         'Preferred Phone', 'Phone 1', 'Phone 2', 'Phone 3',
                         'Address Line 1', 'Address Line 2', 'City', 'State/Province', 'Zip Code', 'Country'].filter(f => allFields.includes(f));

  // Filter for donor notes fields
  const noteFields = allFields.filter(f => {
    const lower = f.toLowerCase();
    return lower.includes('note') || lower.includes('comment');
  });

  // Filter for 2025 donation aggregate fields
  const donationFields = allFields.filter(f => {
    const lower = f.toLowerCase();
    return lower.includes('2025') &&
           (lower.includes('donation') || lower.includes('gift')) &&
           (lower.includes('total') || lower.includes('amount') || lower.includes('sum'));
  });

  if (donationFields.length === 0) {
    sheet.clear();
    sheet.getRange(1, 1).setValue('No donation aggregate fields found for 2025 in API');
    return '0 records - no donation fields';
  }

  // Combine all desired output fields
  let outputFields = [...contactFields, ...noteFields, ...donationFields];

  // Remove duplicates
  outputFields = [...new Set(outputFields)];

  const searchPayload = {
    searchFields: [
      { field: 'Account ID', operator: 'NOT_BLANK' }
    ],
    outputFields: outputFields.slice(0, 50),
    pagination: { currentPage: 0, pageSize: 200 }
  };

  const allResults = paginatedSearch('/accounts/search', searchPayload);

  // Filter to accounts with >= $365 in donations in 2025
  const filteredResults = allResults.filter(record => {
    for (const field of donationFields) {
      const value = parseFloat(record[field]);
      if (!isNaN(value) && value >= 365) {
        return true;
      }
    }
    return false;
  });

  if (filteredResults.length > 0) {
    // Use writeToSheet with explicit field order to ensure contact info appears first
    writeToSheet(sheet, filteredResults, outputFields);
  } else {
    sheet.clear();
    sheet.getRange(1, 1).setValue('No donors with >= $365 in 2025 found');
  }

  const result = filteredResults.length + ' records';
  updateSingleRefreshInfo('365+ Donors', result);
  return result;
}

// ============ HELPER: Get Existing Sheet ============
function getSheet(sheetName) {
  return SpreadsheetApp.getActiveSpreadsheet().getSheetByName(sheetName);
}

// ============ HELPER: Safe JSON Parse ============
function safeJsonParse(text, fallback) {
  if (!text || text.trim() === '') {
    Logger.log('Empty response received');
    return fallback !== undefined ? fallback : null;
  }
  try {
    return JSON.parse(text);
  } catch (e) {
    Logger.log('JSON parse error: ' + e + ' | Text: ' + text.substring(0, 200));
    return fallback !== undefined ? fallback : null;
  }
}

// ============ HELPER: Get Search Fields ============
function getSearchFields(endpoint) {
  const headers = getAuthHeaders();

  try {
    const response = UrlFetchApp.fetch(BASE_URL + endpoint, {
      method: 'GET',
      headers: headers,
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('getSearchFields ' + endpoint + ' - Status: ' + responseCode);
    Logger.log('Response: ' + responseText.substring(0, 500));

    if (responseCode !== 200) {
      Logger.log('Error response from ' + endpoint + ': ' + responseText);
      return [];
    }

    const result = safeJsonParse(responseText, null);
    if (!result) return [];

    // Handle different response formats
    let fields = null;
    if (Array.isArray(result)) {
      fields = result;
    } else if (result.standardFields) {
      fields = result.standardFields;
    } else if (result.outputFields) {
      fields = result.outputFields;
    }

    if (fields && Array.isArray(fields)) {
      // Fields can be strings or objects with fieldName/name
      return fields.map(f => typeof f === 'string' ? f : (f.fieldName || f.name || f));
    }

    Logger.log('Unexpected response format from ' + endpoint + ': ' + JSON.stringify(result).substring(0, 200));
    return [];
  } catch (e) {
    Logger.log('Error getting fields from ' + endpoint + ': ' + e);
    return [];
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

    Logger.log('paginatedSearch ' + endpoint + ' page ' + currentPage + ' - Payload: ' + JSON.stringify(searchPayload).substring(0, 500));

    const response = UrlFetchApp.fetch(BASE_URL + endpoint, {
      method: 'POST',
      headers: headers,
      contentType: 'application/json',
      payload: JSON.stringify(searchPayload),
      muteHttpExceptions: true
    });

    const responseCode = response.getResponseCode();
    const responseText = response.getContentText();

    Logger.log('paginatedSearch ' + endpoint + ' - Status: ' + responseCode);
    Logger.log('paginatedSearch ' + endpoint + ' - Response: ' + responseText.substring(0, 1000));

    if (responseCode !== 200) {
      Logger.log('paginatedSearch error from ' + endpoint + ' (status ' + responseCode + '): ' + responseText.substring(0, 500));
      break;
    }

    const result = safeJsonParse(responseText, {});

    // Try different possible result keys
    const results = result.searchResults || result.accounts || result.memberships ||
                    result.donations || result.eventRegistrations || result.activities ||
                    result.results || result.data || [];

    if (results.length > 0) {
      allResults = allResults.concat(results);
      Logger.log('paginatedSearch ' + endpoint + ' - Found ' + results.length + ' results this page');
    }

    totalPages = result.pagination?.totalPages || 1;
    currentPage++;

    if (currentPage > 100) break;
  }

  Logger.log('paginatedSearch ' + endpoint + ' - Total results: ' + allResults.length);
  return allResults;
}

// ============ HELPER: Write to Sheet (Search Results) ============
function writeToSheet(sheet, data, fields) {
  sheet.clear();

  if (data.length === 0) {
    sheet.getRange(1, 1).setValue('No data found');
    return;
  }

  sheet.getRange(1, 1, 1, fields.length).setValues([fields]);

  const rows = data.map(record =>
    fields.map(field => {
      const value = record[field];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return value;
    })
  );

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, fields.length).setValues(rows);
  }
}

// ============ HELPER: Write to Sheet (Object Array) ============
function writeToSheetFromObjects(sheet, data) {
  sheet.clear();

  if (data.length === 0) {
    sheet.getRange(1, 1).setValue('No data found');
    return;
  }

  const allKeys = [...new Set(data.flatMap(obj => Object.keys(obj)))];

  sheet.getRange(1, 1, 1, allKeys.length).setValues([allKeys]);

  const rows = data.map(record =>
    allKeys.map(key => {
      const value = record[key];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return value;
    })
  );

  if (rows.length > 0) {
    sheet.getRange(2, 1, rows.length, allKeys.length).setValues(rows);
  }
}

// ============ AUTH HELPER ============
function getAuthHeaders() {
  const credentials = Utilities.base64Encode(NEON_ORG_ID + ':' + NEON_API_KEY);
  return { 'Authorization': 'Basic ' + credentials };
}
