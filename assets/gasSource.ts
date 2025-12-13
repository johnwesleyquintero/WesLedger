export const GAS_BACKEND_CODE = `// --- CONFIGURATION ---
const API_SECRET = "wes-ledger-secret"; // <--- CHANGE THIS to your own strong password
// ---------------------

function doGet(e) {
  // 0. Handle Manual Execution
  if (!e || !e.parameter) {
    return ContentService.createTextOutput("System Online. Access this URL via your WesLedger App.");
  }

  // 1. Security Check
  const token = e.parameter.token;
  if (token !== API_SECRET) {
    return errorResponse("Unauthorized: Invalid Token");
  }

  const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ledger');
  if (!sheet) return errorResponse("Sheet 'ledger' not found");
  
  // 2. Fetch Data
  const data = sheet.getDataRange().getValues();
  if (data.length < 2) return jsonResponse([]); // Only header or empty

  const headers = data.shift(); // Remove headers
  
  // 3. Map & Normalize
  // We explicitly convert Dates to Strings to avoid serialization issues
  const entries = data.map(row => {
    let dateVal = row[0];
    if (Object.prototype.toString.call(dateVal) === '[object Date]') {
      // Convert Google Sheet Date Object to YYYY-MM-DD
      try {
        dateVal = Utilities.formatDate(dateVal, Session.getScriptTimeZone(), "yyyy-MM-dd");
      } catch(e) {
        dateVal = new Date().toISOString().split('T')[0];
      }
    }
    
    return {
      date: dateVal || "", 
      description: row[1] || "",
      amount: row[2] || 0,
      category: row[3] || "Uncategorized",
      createdAt: row[4] || "",
      id: row[5] || "" 
    };
  }).filter(e => e.date !== "" && e.description !== ""); // Filter empty rows

  return jsonResponse(entries);
}

function doPost(e) {
  // 0. Handle Manual Execution
  if (!e || !e.postData) {
    return ContentService.createTextOutput("System Online. Access this URL via your WesLedger App.");
  }

  const lock = LockService.getScriptLock();
  try {
    lock.waitLock(10000); 
    
    const payload = JSON.parse(e.postData.contents);
    
    if (payload.token !== API_SECRET) {
       return errorResponse("Unauthorized: Invalid Token");
    }

    const sheet = SpreadsheetApp.getActiveSpreadsheet().getSheetByName('ledger');
    if (!sheet) return errorResponse("Sheet 'ledger' not found");
    
    const action = payload.action || 'create';
    const entry = payload.entry;

    if (action === 'create') {
      const id = entry.id || Utilities.getUuid();
      const newRow = [
        entry.date,
        entry.description,
        entry.amount,
        entry.category,
        new Date().toISOString(),
        id
      ];
      sheet.appendRow(newRow);
      return jsonResponse({ status: "success", id: id });
    } 
    
    else if (action === 'update') {
      if (!entry.id) return errorResponse("ID required for update");
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][5] == entry.id) {
          const range = sheet.getRange(i + 1, 1, 1, 4);
          range.setValues([[entry.date, entry.description, entry.amount, entry.category]]);
          return jsonResponse({ status: "updated" });
        }
      }
      return errorResponse("ID not found");
    }
    
    else if (action === 'delete') {
      if (!entry.id) return errorResponse("ID required for delete");
      const data = sheet.getDataRange().getValues();
      for (let i = 1; i < data.length; i++) {
        if (data[i][5] == entry.id) {
          sheet.deleteRow(i + 1);
          return jsonResponse({ status: "deleted" });
        }
      }
      return errorResponse("ID not found");
    }

  } catch (err) {
    return errorResponse(err.toString());
  } finally {
    lock.releaseLock();
  }
}

function jsonResponse(data) {
  return ContentService.createTextOutput(JSON.stringify(data))
    .setMimeType(ContentService.MimeType.JSON);
}

function errorResponse(msg) {
  return ContentService.createTextOutput(JSON.stringify({status: "error", message: msg}))
    .setMimeType(ContentService.MimeType.JSON);
}`;