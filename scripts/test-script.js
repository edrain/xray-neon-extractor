// ============ CONFIGURATION ============                                
  const NEON_ORG_ID = 'YOUR-NEON-ORG_ID';      // Replace with your Neon Org ID  
  const NEON_API_KEY = 'YOUR-NEON-API-KEY';    // Replace with your Neon API Key 
  const BASE_URL = 'https://api.neoncrm.com/v2';                            
                                                                            
  // ============ MENU SETUP ============                                   
  function onOpen() {                                                       
    SpreadsheetApp.getUi()                                                  
      .createMenu('Neon CRM')                                               
      .addItem('Refresh Members', 'fetchMembers')                           
      .addToUi();                                                           
  }                                                                         
                                                                            
  // ============ FETCH MEMBERS ============                                
  function fetchMembers() {                                                 
    const sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();   
    const headers = getAuthHeaders();                                       
                                                                            
    // Search for all accounts with active memberships                      
    const searchPayload = {                                                 
      searchFields: [                                                       
        { field: 'Membership Status', operator: 'EQUAL', value: 'Active' }  
      ],                                                                    
      outputFields: [                                                       
        'Account ID', 'First Name', 'Last Name', 'Email 1',                 
        'Phone 1', 'Address Line 1', 'City', 'State', 'Zip Code',           
        'Membership Name', 'Membership Expiration Date'                     
      ],                                                                    
      pagination: { currentPage: 0, pageSize: 200 }                         
    };                                                                      
                                                                            
    let allMembers = [];                                                    
    let currentPage = 0;                                                    
    let totalPages = 1;                                                     
                                                                            
    // Paginate through all results                                         
    while (currentPage < totalPages) {                                      
      searchPayload.pagination.currentPage = currentPage;                   
                                                                            
      const response = UrlFetchApp.fetch(BASE_URL + '/accounts/search', {   
        method: 'POST',                                                     
        headers: headers,                                                   
        contentType: 'application/json',                                    
        payload: JSON.stringify(searchPayload),                             
        muteHttpExceptions: true                                            
      });                                                                   
                                                                            
      const result = JSON.parse(response.getContentText());                 
                                                                            
      if (result.searchResults) {                                           
        allMembers = allMembers.concat(result.searchResults);               
      }                                                                     
                                                                            
      totalPages = result.pagination?.totalPages || 1;                      
      currentPage++;                                                        
    }                                                                       
                                                                            
    // Write to sheet                                                       
    if (allMembers.length > 0) {                                            
      sheet.clear();                                                        
                                                                            
      // Header row                                                         
      const headerRow = ['Account ID', 'First Name', 'Last Name', 'Email',  
                         'Phone', 'Address', 'City', 'State', 'Zip',        
                         'Membership', 'Expiration'];                       
      sheet.getRange(1, 1, 1, headerRow.length).setValues([headerRow]);     
                                                                            
      // Data rows                                                          
      const rows = allMembers.map(m => [                                    
        m['Account ID'] || '',                                              
        m['First Name'] || '',                                              
        m['Last Name'] || '',                                               
        m['Email 1'] || '',                                                 
        m['Phone 1'] || '',                                                 
        m['Address Line 1'] || '',                                          
        m['City'] || '',                                                    
        m['State'] || '',                                                   
        m['Zip Code'] || '',                                                
        m['Membership Name'] || '',                                         
        m['Membership Expiration Date'] || ''                               
      ]);                                                                   
                                                                            
      sheet.getRange(2, 1, rows.length, headerRow.length).setValues(rows);  
                                                                            
      SpreadsheetApp.getUi().alert(`Imported ${allMembers.length}           
  members.`);                                                               
    } else {                                                                
      SpreadsheetApp.getUi().alert('No members found.');                    
    }                                                                       
  }                                                                         
                                                                            
  // ============ AUTH HELPER ============                                  
  function getAuthHeaders() {                                               
    const credentials = Utilities.base64Encode(NEON_ORG_ID + ':' +          
  NEON_API_KEY);                                                            
    return { 'Authorization': 'Basic ' + credentials };                     
  }    