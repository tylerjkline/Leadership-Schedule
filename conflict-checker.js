function onEdit(e) {
  var ss = SpreadsheetApp.getActiveSpreadsheet(), debugSheet = getOrCreateDebugSheet();
  debugSheet.clear().getRange(1, 1, 1, 3).setValues([["Date", "Sheet Name", "Issue Description"]]);
  
  ss.getSheets().forEach(sheet => {
    if (sheet.getName() === "Debug") return;
    checkSchedules(sheet, debugSheet);
  });
}

function checkSchedules(sheet, debugSheet) {
  var employees = [
    { name: sheet.getRange("A6").getValue(), row: 6 },
    { name: sheet.getRange("A8").getValue(), row: 8 },
    { name: sheet.getRange("A10").getValue(), row: 10 },
    { name: sheet.getRange("A12").getValue(), row: 12 }
  ];

  var criticalWarnings = [], cautionWarnings = [], missingOpeners = [], missingClosers = [], missingMidShifts = [], debugLog = [], days = sheet.getRange("B3:H3").getValues()[0], dates = sheet.getRange("B4:H4").getValues()[0];
  
  for (var d = 0; d < 7; d++) {
    var opener = false, closer = false, midShift = false, allOff = true, day = days[d], date = Utilities.formatDate(new Date(dates[d]), Session.getScriptTimeZone(), "MM/dd");
    
    employees.forEach(emp => {
      var shift = sheet.getRange(emp.row, d + 2).getValue();
      debugLog.push([`${day} ${date}`, sheet.getName(), `Checking ${emp.name}'s ${day} shift: ${shift}`]);
      
      if (shift !== "PTO" && shift !== "OFF") allOff = false;
      if (isOpener(shift)) opener = true;
      if (isCloser(shift)) closer = true;
      if (isMidShift(shift)) midShift = true;

      if (d > 0) {
        var prevShift = sheet.getRange(emp.row, d + 1).getValue();
        if (isCloser(prevShift)) {
          if (isOpener(shift)) {
            criticalWarnings.push(`**CRITICAL** | ${emp.name} closes ${days[d - 1]} at 10p and starts at 6am on ${day}`);
          } else if (isEarlyShift(shift)) {
            cautionWarnings.push(`Caution | ${emp.name} closes ${days[d - 1]} at 10p and starts at ${formatShiftTime(shift)} on ${day}`);
          }
        }
      }
    });
    
    if (!opener) missingOpeners.push(day);
    if (!closer) missingClosers.push(day);
    if (!midShift) missingMidShifts.push(day);
  }

  if (missingOpeners.length > 0) criticalWarnings.push(`**Reminder** | Opener needed on ${missingOpeners.join(", ")}`);
  if (missingClosers.length > 0) criticalWarnings.push(`**Reminder** | Closer needed on ${missingClosers.join(", ")}`);
  if (missingMidShifts.length > 0) cautionWarnings.push(`Caution | No mid shift scheduled on ${missingMidShifts.join(", ")}`);

  var warnings = [].concat(criticalWarnings, "", cautionWarnings).filter(Boolean).join("\n");
  sheet.getRange("B15").setValue(warnings || 'No conflicts');
  debugSheet.getRange(debugSheet.getLastRow() + 1, 1, debugLog.length, 3).setValues(debugLog);
}

function formatShiftTime(shift) {
  var startTime = shift.split('-')[0];
  return startTime.replace("a", "am").replace("p", "pm");
}

function isMidShift(shift) {
  return ["7a-6p", "8a-7p", "9a-8p"].includes(shift);
}

function isOpener(shift) {
  return shift.includes('6a');
}

function isCloser(shift) {
  return shift.includes('-') ? shift.split('-')[1].includes("10p") : shift.includes("10p");
}

function isEarlyShift(shift) {
  return shift.includes('7a') || shift.includes('8a');
}

function getOrCreateDebugSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet();
  return ss.getSheetByName('Debug') || ss.insertSheet('Debug');
}
