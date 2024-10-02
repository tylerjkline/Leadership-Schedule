# Leadership Schedule Validator
This script automatically checks for shift conflicts and gaps in a leadership schedule within Google Sheets. It flags issues like back-to-back late closers followed by early openers and logs results both in the sheet and a debug log.

### Key Features:
- **Shift Conflict Detection**: Flags issues when employees close at 10pm and open the next day at 6am (CRITICAL) or 7am/8am (Caution).
- **Missing Shift Detection**: Flags missing openers, closers, or mid-shifts, consolidating them into single warnings like "Opener needed on Monday, Tuesday."
- **Debug Logging**: Tracks every action in a "Debug" sheet, logging the check results and conflicts.

### Requirements for Deployment:
1. **Employee Names**: Enter in cells `A6`, `A8`, `A10`, and `A12`.
2. **Shift Schedule**: 
   - Days of the week in `B3:H3` and dates in `B4:H4`.
   - Shifts in rows 6, 8, 10, and 12.
3. **Shift Format**: Shifts should be in the format `7a-6p`, `8a-7p`, or `OFF`/`PTO`. Openers must start at **6a**, and closers must end at **10p**.
4. **Debug Sheet**: A "Debug" sheet is created automatically for detailed logs.

The script runs on edits and displays results in cell `B15`.

---

# Version History

## Version 1.0 - Initial release
Basic checks for missing openers, closers, and mid-shifts. Summarized issues in cell B15.

### Version 1.1 - Shift pattern recognition
Added detection for common shift patterns (e.g., 7a-6p, 8a-7p). Began skipping checks for employees marked as "OFF" or "PTO."

### Version 1.2 - Time calculation and conflict detection
Introduced logic to calculate hours between consecutive shifts, flagging shifts that occur too soon after closings.

### Version 1.3 - Date and message improvements
Added parsing for dates from row 4 and improved conflict messages by displaying only the day of the week for end users.

---

## Version 2.0 - Major update: Dynamic employee management, conflict detection, and debug overhaul
- **Dynamic Employee Handling**: Automatically fetches employee names from cells, removing the need for hardcoding.
- **Enhanced Conflict Detection**: Flags **CRITICAL** conflicts when employees close at 10pm and open the next day at 6am, and **Caution** conflicts for 7am or 8am opens.
- **Multi-level Prioritization**: Organizes conflicts into priority tiers, with CRITICAL issues displayed first.
- **Debug Overhaul**: Expanded the debug sheet to include detailed logs of each check, capturing employees, shifts, and reasons for conflicts.
- **Consolidated Shift Warnings**: Combines warnings for missing openers, closers, and mid-shifts into single lines for each type (e.g., "Opener needed on Monday, Tuesday").

### Version 2.0a - Time formatting and clearer messaging
Shift time warnings are now easier to read (e.g., "8am after closing on Monday"). Enhanced conflict messaging for early starts after late closes.

### Version 2.0b - Consolidated opener/closer warnings
Opener and closer warnings are consolidated into two lines ("Opener needed on [days]" and "Closer needed on [days]"), with CRITICAL warnings displayed first, followed by Caution warnings with spacing.


# Function Walkthrough

### `onEdit(e)`
This function is triggered whenever an edit is made to the spreadsheet. It retrieves the active spreadsheet and clears any existing logs in the "Debug" sheet, resetting the headers. After that, it loops through all sheets except the "Debug" sheet and calls the `checkSchedules` function for each to perform conflict detection.

Sample code for `onEdit`:
```
 function onEdit(e) {`
     var ss = SpreadsheetApp.getActiveSpreadsheet(), debugSheet = getOrCreateDebugSheet();`
     debugSheet.clear().getRange(1, 1, 1, 3).setValues([["Date", "Sheet Name", "Issue Description"]]);`
     ss.getSheets().forEach(sheet => {`
         if (sheet.getName() === "Debug") return;`
         checkSchedules(sheet, debugSheet);`
     });`
 }`
```
### `checkSchedules(sheet, debugSheet)`
This function processes each sheet to detect shift conflicts and missing shifts. It retrieves employee names from cells `A6`, `A8`, `A10`, and `A12` dynamically and loops through each day of the week (`B3:H3`) to check:

- **Missing openers**, **closers**, or **mid-shifts**: It logs the days that are missing these shifts.
- **Critical conflicts**: If an employee closes at 10 pm and opens at 6 am the next day, a critical warning is generated.
- **Caution conflicts**: If an employee closes at 10 pm and starts at 7 am or 8 am the next day, a caution warning is generated.

The results for openers, closers, and mid-shifts are consolidated into single lines for clarity (e.g., "Opener needed on Monday, Tuesday").

Sample code for `checkSchedules`:
```
 function checkSchedules(sheet, debugSheet) {`
     var employees = [`
         { name: sheet.getRange("A6").getValue(), row: 6 },`
         { name: sheet.getRange("A8").getValue(), row: 8 },`
         { name: sheet.getRange("A10").getValue(), row: 10 },`
         { name: sheet.getRange("A12").getValue(), row: 12 }`
     ];`
     var criticalWarnings = [], cautionWarnings = [];`
     var missingOpeners = [], missingClosers = [], missingMidShifts = [];`
     var debugLog = [], days = sheet.getRange("B3:H3").getValues()[0], dates = sheet.getRange("B4:H4").getValues()[0];`
     for (var d = 0; d < 7; d++) {`
         var opener = false, closer = false, midShift = false, allOff = true;`
         var day = days[d], date = Utilities.formatDate(new Date(dates[d]), Session.getScriptTimeZone(), "MM/dd");`
         employees.forEach(emp => {`
             var shift = sheet.getRange(emp.row, d + 2).getValue();`
             debugLog.push([day + " " + date, sheet.getName(), "Checking " + emp.name + "'s " + day + " shift: " + shift]);`
             if (shift !== "PTO" && shift !== "OFF") allOff = false;`
             if (isOpener(shift)) opener = true;`
             if (isCloser(shift)) closer = true;`
             if (isMidShift(shift)) midShift = true;`
             if (d > 0) {`
                 var prevShift = sheet.getRange(emp.row, d + 1).getValue();`
                 if (isCloser(prevShift)) {`
                     if (isOpener(shift)) {`
                         criticalWarnings.push("**CRITICAL** | " + emp.name + " closes " + days[d - 1] + " at 10p and starts at 6am on " + day);`
                     } else if (isEarlyShift(shift)) {`
                         cautionWarnings.push("Caution | " + emp.name + " closes " + days[d - 1] + " at 10p and starts at " + formatShiftTime(shift) + " on " + day);`
                     }`
                 }`
             }`
         });`
         if (!opener) missingOpeners.push(day);`
         if (!closer) missingClosers.push(day);`
         if (!midShift) missingMidShifts.push(day);`
     }`
     if (missingOpeners.length > 0) criticalWarnings.push("**Reminder** | Opener needed on " + missingOpeners.join(", "));`
     if (missingClosers.length > 0) criticalWarnings.push("**Reminder** | Closer needed on " + missingClosers.join(", "));`
     if (missingMidShifts.length > 0) cautionWarnings.push("Caution | No mid shift scheduled on " + missingMidShifts.join(", "));`
     var warnings = [].concat(criticalWarnings, "", cautionWarnings).filter(Boolean).join("\n");`
     sheet.getRange("B15").setValue(warnings || 'No conflicts');`
     debugSheet.getRange(debugSheet.getLastRow() + 1, 1, debugLog.length, 3).setValues(debugLog);`
 }`
```
### Helper Functions

#### `formatShiftTime(shift)`
This helper function formats a shift's start time (e.g., `8a-7p`) into a more readable format like `8am`.

Sample code:
```
 function formatShiftTime(shift) {`
     var startTime = shift.split('-')[0];`
     return startTime.replace("a", "am").replace("p", "pm");`
 }`
```
#### `isMidShift(shift)`
Checks if the given shift is one of the predefined mid-shift patterns.

Sample code:
```
 function isMidShift(shift) {`
     return ["7a-6p", "8a-7p", "9a-8p"].includes(shift);`
 }`
```
#### `isOpener(shift)`
Determines if a shift is an opener by checking if it starts at 6am.

Sample code:
```
 function isOpener(shift) {`
     return shift.includes('6a');`
 }`
```
#### `isCloser(shift)`
Checks if a shift is a closer by identifying if it ends at 10pm.

Sample code:
```
 function isCloser(shift) {`
     return shift.includes('-') ? shift.split('-')[1].includes("10p") : shift.includes("10p");`
 }`
```

#### `isEarlyShift(shift)`
Determines if the shift starts early (either 7am or 8am).

Sample code:
```
 function isEarlyShift(shift) {`
     return shift.includes('7a') || shift.includes('8a');`
 }`
```
#### `getOrCreateDebugSheet()`
Retrieves or creates the "Debug" sheet where logs are stored. If it doesn't exist, it will be created.

Sample code:
```
 function getOrCreateDebugSheet() {`
     var ss = SpreadsheetApp.getActiveSpreadsheet();`
     return ss.getSheetByName('Debug') || ss.insertSheet('Debug');`
 }`
```

## Script Flow Summary

1. **Initialization**: `onEdit(e)` is triggered whenever the sheet is edited. It clears out the "Debug" sheet and calls `checkSchedules` on each relevant sheet.
2. **Employee Data Retrieval**: The `checkSchedules` function dynamically pulls employee names and corresponding shifts from predefined cells in the sheet.
3. **Daily Iteration**: The script loops through each day, checking for missing openers, closers, and mid-shifts.
4. **Conflict Detection**: Critical warnings are triggered for consecutive close (10pm) and open (6am) shifts, and caution warnings are triggered for close (10pm) followed by early shifts (7am or 8am).
5. **Consolidated Warnings**: Warnings for missing openers, closers, and mid-shifts are consolidated into single lines and displayed in the sheet.
6. **Logging**: Detailed logs of all checks are saved in the "Debug" sheet, and the results are written to cell `B15` in the active sheet.

