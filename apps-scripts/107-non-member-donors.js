// ============ CONFIGURATION ============
const NEON_ORG_ID = 'YOUR-NEON-ORG_ID';      // Replace with your Neon Org ID
const NEON_API_KEY = 'YOUR-NEON-API-KEY';    // Replace with your Neon API Key
const BASE_URL = 'https://api.neoncrm.com/v2';

const CAMPAIGN_NAME = '107.1 Capital Campaign';
const SHEET_NAME = '107.1 Non-Member Donors';

// ============ MENU SETUP ============
function onOpen() {
  SpreadsheetApp.getUi()
    .createMenu('Neon CRM')
    .addItem('Refresh 107.1 Non-Member Donors', 'fetch107NonMemberDonors')
    .addToUi();
}

// ============ FETCH ACTIVE MEMBER IDS ============
// Account Current Membership Status is not available on the donation search endpoint,
// so we fetch it separately from accounts/search and use it as an exclusion set.
function getActiveMemberIds() {
  const payload = {
    searchFields: [
      { field: 'Account Current Membership Status', operator: 'EQUAL', value: 'Active' }
    ],
    outputFields: ['Account ID'],
    pagination: { currentPage: 0, pageSize: 200 }
  };
  const results = paginatedSearch('/accounts/search', payload);
  const ids = new Set(results.map(a => String(a['Account ID'])));
  Logger.log('Active member account IDs fetched: ' + ids.size);
  return ids;
}

// ============ FETCH 107.1 NON-MEMBER DONORS ============
function fetch107NonMemberDonors() {
  const sheet = getSheet(SHEET_NAME);
  if (!sheet) return 'Sheet not found: ' + SHEET_NAME;

  // Fetch active member IDs upfront for reliable membership filtering.
  // (Account Current Membership Status is unavailable on donation search output fields.)
  const activeMemberIds = getActiveMemberIds();

  // Discover available donation output fields
  const allFields = getSearchFields('/donations/search/outputFields');

  // Find the account-level "All Time Donation Count" field for the exclusivity check.
  // Neon exposes account aggregate fields on each donation search row.
  const totalCountField = allFields.find(f => f === 'All Time Donation Count') ||
    allFields.find(f => {
      const lower = f.toLowerCase();
      return lower.includes('all time') && lower.includes('donation') && lower.includes('count');
    });

  Logger.log('Total donation count field found: ' + (totalCountField || 'none — will skip exclusivity filter'));

  // Contact fields to include in output
  const wantedContactFields = [
    'Account ID', 'First Name', 'Last Name',
    'Email 1', 'Email 2',
    'Phone 1 Full Number (F)', 'Phone 2 Full Number (F)', 'Phone 3 Full Number (F)',
    'Address Line 1', 'City', 'State/Province', 'Zip Code'
  ];
  const contactFields = wantedContactFields.filter(f => allFields.includes(f));

  const outputFields = [
    ...contactFields,
    'Donation ID', 'Donation Amount', 'Donation Date',
    ...(totalCountField ? [totalCountField] : [])
  ].filter(f => allFields.includes(f));

  const uniqueOutputFields = [...new Set(outputFields)];

  // Search all donations to the 107.1 Capital Campaign
  const searchPayload = {
    searchFields: [
      { field: 'Donation Campaign', operator: 'EQUAL', value: CAMPAIGN_NAME }
    ],
    outputFields: uniqueOutputFields,
    pagination: { currentPage: 0, pageSize: 200 }
  };

  const allDonations = paginatedSearch('/donations/search', searchPayload);
  Logger.log('107.1 campaign donations fetched: ' + allDonations.length);

  if (allDonations.length === 0) {
    sheet.clear();
    sheet.getRange(1, 1).setValue('No donations found for ' + CAMPAIGN_NAME);
    updateSingleRefreshInfo(SHEET_NAME, '0 records');
    return '0 records';
  }

  // Group donations by account
  const accountMap = {};
  for (const donation of allDonations) {
    const accountId = donation['Account ID'];
    if (!accountId) continue;

    if (!accountMap[accountId]) {
      const info = {};
      for (const field of contactFields) {
        info[field] = donation[field] !== undefined ? donation[field] : '';
      }
      if (totalCountField) {
        info[totalCountField] = donation[totalCountField];
      }
      accountMap[accountId] = { info, donations: [] };
    }
    accountMap[accountId].donations.push(donation);
  }

  const results = [];

  for (const [accountId, data] of Object.entries(accountMap)) {
    // Exclude active members (checked against the pre-fetched set)
    if (activeMemberIds.has(String(accountId))) continue;

    // Exclude donors who have also given to other campaigns (when count field is available)
    if (totalCountField) {
      const totalDonations = parseInt(data.info[totalCountField], 10);
      if (!isNaN(totalDonations) && data.donations.length < totalDonations) {
        Logger.log('Excluding ' + accountId + ': ' + data.donations.length + ' of ' + totalDonations + ' donations are 107.1');
        continue;
      }
    }

    // Aggregate donation summary for this account
    const totalAmount = data.donations.reduce((sum, d) => sum + (parseFloat(d['Donation Amount']) || 0), 0);
    const latestDate = data.donations
      .map(d => d['Donation Date'])
      .filter(Boolean)
      .sort()
      .pop() || '';

    results.push({
      ...data.info,
      '107.1 Donation Count': data.donations.length,
      '107.1 Total Amount': totalAmount.toFixed(2),
      'Most Recent 107.1 Donation': latestDate
    });
  }

  Logger.log('After filtering: ' + results.length + ' non-member, 107.1-only donors');

  if (results.length > 0) {
    writeToSheetFromObjects(sheet, results);
  } else {
    sheet.clear();
    sheet.getRange(1, 1).setValue('No qualifying donors found');
  }

  const result = results.length + ' records';
  updateSingleRefreshInfo(SHEET_NAME, result);
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

    if (responseCode !== 200) {
      Logger.log('Error response from ' + endpoint + ': ' + responseText);
      return [];
    }

    const result = safeJsonParse(responseText, null);
    if (!result) return [];

    let fields = null;
    if (Array.isArray(result)) {
      fields = result;
    } else if (result.standardFields) {
      fields = result.standardFields;
    } else if (result.outputFields) {
      fields = result.outputFields;
    }

    if (fields && Array.isArray(fields)) {
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

    Logger.log('paginatedSearch ' + endpoint + ' - Status: ' + responseCode);

    if (responseCode !== 200) {
      Logger.log('paginatedSearch error (status ' + responseCode + '): ' + responseText.substring(0, 500));
      break;
    }

    const result = safeJsonParse(responseText, {});

    const results = result.searchResults || result.accounts || result.memberships ||
                    result.donations || result.results || result.data || [];

    if (results.length > 0) {
      allResults = allResults.concat(results);
      Logger.log('paginatedSearch - Found ' + results.length + ' results this page');
    }

    totalPages = result.pagination?.totalPages || 1;
    currentPage++;

    if (currentPage > 100) break;
  }

  Logger.log('paginatedSearch ' + endpoint + ' - Total results: ' + allResults.length);
  return allResults;
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
