// Trigger function that runs every time the spreadsheet is edited
function onEdit(e) {
  runScheduleValidation(); // Call the main validation function
}

// Main function to validate schedules across all sheets except the Debug sheet
function runScheduleValidation() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(); // Get the active spreadsheet
  var debugSheet = getOrCreateDebugSheet(); // Get or create the Debug sheet
  debugSheet.clearContents(); // Clear previous contents of the Debug sheet

  // Set header row in the Debug sheet
  debugSheet.getRange(1, 1, 1, 5).setValues([["Date", "Employee Name", "Status", "Details", "Issues"]]);

  var sheets = ss.getSheets(); // Get all sheets in the spreadsheet

  // Loop through each sheet in the spreadsheet
  for (var i = 0; i < sheets.length; i++) {
    var sheet = sheets[i];
    if (sheet.getName() === "Debug") continue; // Skip the Debug sheet
    checkSchedules(sheet, debugSheet); // Validate schedules in the current sheet
  }
}

// Function to check schedules in a given sheet and log issues
function checkSchedules(sheet, debugSheet) {
  var sheetName = sheet.getName(); // Get the name of the current sheet
  var startRow = 6; // Row where employee names start
  var numRows = 7; // Number of rows to read for employee names and shifts
  var numCols = 7; // Number of days (columns) in the schedule

  // Version 2.5 change: Use batch data retrieval for efficiency
  // Get employee names from column A starting at startRow
  var employeeNamesData = sheet.getRange(startRow, 1, numRows, 1).getValues();
  // Get shift data starting from column B
  var shiftsData = sheet.getRange(startRow, 2, numRows, numCols).getValues();

  var employees = []; // Array to store employee details

  // Loop through each row to collect employee names
  for (var i = 0; i < numRows; i++) {
    var name = employeeNamesData[i][0]; // Get employee name
    if (name) {
      // Add employee to the employees array with their row index and previousOff status
      employees.push({ name: name, rowIndex: i, previousOff: false });
    }
  }

  // Arrays to collect warnings and missing shifts
  var criticalWarnings = [], cautionWarnings = [];
  var missingOpeners = [], missingClosers = [], missingMidShifts = [];
  var debugLog = []; // Array to store debug log entries

  // Version 2.5 change: Use batch retrieval for days and dates
  // Get days of the week and dates from the sheet
  var days = sheet.getRange(3, 2, 1, numCols).getValues()[0]; // Row 3, columns B to H
  var dates = sheet.getRange(4, 2, 1, numCols).getDisplayValues()[0]; // Row 4, columns B to H

  // Loop through each day of the week
  for (var d = 0; d < numCols; d++) {
    var opener = false, closer = false, midShift = false; // Flags for missing shifts
    var day = days[d]; // Get the day name (e.g., "Monday")
    var dateObj = new Date(dates[d]); // Convert date string to Date object
    var date = Utilities.formatDate(dateObj, Session.getScriptTimeZone(), "MM/dd"); // Format date

    // Loop through each employee
    for (var e = 0; e < employees.length; e++) {
      var emp = employees[e]; // Get employee details
      var shift = shiftsData[emp.rowIndex][d]; // Get shift for the current day
      var issues = []; // Array to store issues for this employee on this day
      var status = ""; // Status of the employee's shift
      var details = ""; // Details about the employee's shift

      if (!shift) {
        // Employee has not been scheduled
        details = emp.name + " has not been scheduled yet for " + day + " " + date + ".";
        status = "Not scheduled";
      } else if (shift === "OFF") {
        // Employee is off on this day
        details = emp.name + " is off on " + day + " " + date + ".";
        if (emp.previousOff) {
          // Employee was also off the previous day
          details += " That's two days in a row off! Enjoy :)";
        }
        status = "OFF";
        emp.previousOff = true; // Set previousOff to true for the next iteration
      } else if (shift === "PTO") {
        // Employee has paid time off
        details = emp.name + " has PTO on " + day + " " + date + ". Woah, they're getting paid to be off!";
        status = "PTO";
        emp.previousOff = true; // Set previousOff to true for the next iteration
      } else {
        // Employee is scheduled to work
        var startTime = shift.split('-')[0]; // Extract start time from shift
        var formattedStartTime = formatShiftTime(startTime); // Format start time

        // Version 2.5 change: Optimize next day's shift retrieval
        // Get next day's shift if it exists
        var nextDayShift = d < numCols - 1 ? shiftsData[emp.rowIndex][d + 1] : null;
        var nextDayOff = nextDayShift === "OFF" || nextDayShift === "PTO"; // Check if employee is off the next day

        if (nextDayShift && nextDayShift !== "OFF" && nextDayShift !== "PTO") {
          // Employee is scheduled the next day
          var nextDayStartTime = nextDayShift.split('-')[0];
          var formattedNextDayStartTime = formatShiftTime(nextDayStartTime);
          details = emp.name + " works on " + day + " " + date + ", and is scheduled the next day at " + formattedNextDayStartTime;
        } else if (nextDayOff) {
          // Employee is off the next day
          details = emp.name + " works on " + day + " " + date + ", and is off the next day.";
        } else {
          // No information about the next day
          details = emp.name + " works on " + day + " " + date + ".";
        }
        status = "Scheduled";
        emp.previousOff = false; // Reset previousOff

        // Check for conflicts with the previous day's closing shift
        if (d > 0) {
          var prevShift = shiftsData[emp.rowIndex][d - 1]; // Get previous day's shift
          if (isCloser(prevShift)) {
            // Employee closed the previous day
            var prevDateObj = new Date(dates[d - 1]);
            var prevDate = Utilities.formatDate(prevDateObj, Session.getScriptTimeZone(), "MM/dd");
            var prevDay = days[d - 1];

            if (isOpener(shift)) {
              // Employee is opening after closing—a critical issue
              issues.push(emp.name + " closes on " + prevDay + " " + prevDate + " but opens on " + day + " " + date);
              criticalWarnings.push("**CRITICAL** | " + emp.name + " closes on " + prevDay + " but opens on " + day);
              status = "CRITICAL"; // Update status to critical
            } else if (shiftStartsBefore(shift, 9)) {
              // Employee starts early after closing—a caution issue
              issues.push(emp.name + " closes on " + prevDay + " " + prevDate + " but starts early on " + day + " " + date);
              cautionWarnings.push("Caution | " + emp.name + " closes on " + prevDay + " but starts early on " + day);
              if (status !== "CRITICAL") status = "CAUTION"; // Update status to caution if not already critical
            }
          }
        }

        // Update flags if employee is scheduled as opener, closer, or mid-shift
        if (shift !== "OFF" && shift !== "PTO") {
          if (isOpener(shift)) opener = true;
          if (isCloser(shift)) closer = true;
          if (isMidShift(shift)) midShift = true;
        }
      }

      // Add entry to the debug log
      debugLog.push([day + " " + date, emp.name, status, details, issues.join("; ")]);
    }

    // Collect missing shifts for the day
    if (!opener) missingOpeners.push(day);
    if (!closer) missingClosers.push(day);
    if (!midShift) missingMidShifts.push(day);
  }

  // Compile warnings for missing openers, closers, and mid-shifts
  if (missingOpeners.length > 0) {
    var openerWarning = "**Reminder** | Opener needed on " + missingOpeners.join(", ");
    criticalWarnings.push(openerWarning);
  }
  if (missingClosers.length > 0) {
    var closerWarning = "**Reminder** | Closer needed on " + missingClosers.join(", ");
    criticalWarnings.push(closerWarning);
  }
  if (missingMidShifts.length > 0) {
    var midShiftWarning = "Caution | No mid shift scheduled on " + missingMidShifts.join(", ");
    cautionWarnings.push(midShiftWarning);
  }

  // Version 2.5 change: Improved status message compilation
  // Combine critical and caution warnings with a separator
  var warnings = criticalWarnings.concat("", cautionWarnings).filter(Boolean).join("\n");

  // Display warnings in cell B15 of the sheet
  sheet.getRange("B15").setValue(warnings || 'No conflicts');

  // Version 2.5 change: Overhauled the debugger to include detailed logs
  // Append the debug log entries to the Debug sheet
  if (debugLog.length > 0) {
    var lastRow = debugSheet.getLastRow(); // Find the last row in the Debug sheet
    debugSheet.getRange(lastRow + 1, 1, debugLog.length, 5).setValues(debugLog); // Append new entries
  }
}

// Function to format shift times from "7a" to "7am", etc.
function formatShiftTime(timeStr) {
  return timeStr.replace("a", "am").replace("p", "pm");
}

// Function to determine if a shift is a mid-shift (starts at 7a, 8a, or 9a)
function isMidShift(shift) {
  var startTime = shift.split('-')[0]; // Get the start time
  return startTime.startsWith('7a') || startTime.startsWith('8a') || startTime.startsWith('9a');
}

// Function to determine if a shift is an opener (starts at 6a)
function isOpener(shift) {
  return shift.startsWith('6a'); // Check if shift starts with '6a'
}

// Function to determine if a shift is a closer (ends at 10p)
function isCloser(shift) {
  if (!shift) return false; // Return false if shift is undefined or empty
  if (shift.includes('-')) {
    var endTime = shift.split('-')[1]; // Get the end time
    return endTime.includes("10p"); // Check if end time includes '10p'
  } else {
    return shift.includes("10p"); // Check if shift includes '10p'
  }
}

// Function to check if a shift starts before a specific hour (in 24-hour format)
function shiftStartsBefore(shift, hour) {
  var startTime = shift.split('-')[0]; // Get the start time
  var timeObj = convertTo24Hour(startTime); // Convert to 24-hour time
  return timeObj.hours < hour; // Compare hours
}

// Function to convert time strings like '7a' or '3p' to 24-hour time
function convertTo24Hour(timeStr) {
  var match = timeStr.match(/(\d+)([ap])/); // Match digits and 'a' or 'p'
  if (!match) return { hours: 0, minutes: 0 }; // Return default if no match
  var hours = parseInt(match[1], 10); // Parse the hour part
  var period = match[2]; // Get 'a' or 'p'

  if (period === 'p' && hours !== 12) {
    hours += 12; // Convert PM times to 24-hour format
  }
  if (period === 'a' && hours === 12) {
    hours = 0; // Adjust midnight to 0 hours
  }
  return { hours: hours, minutes: 0 }; // Return hours and minutes
}

// Function to get the 'Debug' sheet or create it if it doesn't exist
function getOrCreateDebugSheet() {
  var ss = SpreadsheetApp.getActiveSpreadsheet(); // Get the active spreadsheet
  var debugSheet = ss.getSheetByName('Debug'); // Try to get the 'Debug' sheet
  if (!debugSheet) {
    debugSheet = ss.insertSheet('Debug'); // Create 'Debug' sheet if it doesn't exist
  }
  return debugSheet; // Return the 'Debug' sheet
}
