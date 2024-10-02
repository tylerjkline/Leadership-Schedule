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
- Automatically fetches employee names from cells, removing the need for hardcoding, flags **CRITICAL** conflicts when employees close at 10pm and open the next day at 6am, and **Caution** conflicts for 7am or 8am opens. Assigns a 'score'.
- **Debug/Display Improvements**: Expanded the debug sheet to include detailed logs of each check, capturing employees, shifts, and reasons for conflicts. Also combined warnings displayed in B15 missing openers, closers, and mid-shifts into single lines for each type (e.g., "Opener needed on Monday, Tuesday"). Also improved broad readability.

## Version 2.5 - Major update: Debugger Overhaul, Logic/Performance Rework
- **Debugger Overhaul and Performance Enhancements**: Completely redesigned the debug logging system for better clarity and efficiency. Implemented batch data retrieval using getValues(), adjusted loops to minimize interactions with the spreadsheet, and reduced method calls to improve script execution speed.
- **Enhanced Conflict Detection Logic and Status Messages**: Updated logic to only consider 6 am shifts as openers and recognize 7 am and 8 am shifts as early shifts. Adjusted logic to set the status to "CAUTION" when an employee starts before 9 am after closing the previous day at 10 pm. Improved status messages in cell B15, ensuring the status column accurately reflects detected conditions.
- **Additional Fixes: Added logic to handle empty shift values, preventing script failures, and adjusted the script to only validate the sheet that was edited, improving performance.**

# Function Walkthrough

1. **Initialization**: `onEdit(e)` is triggered whenever the sheet is edited. It clears out the "Debug" sheet and calls `checkSchedules` on each relevant sheet.
2. **Employee Data Retrieval**: The `checkSchedules` function dynamically pulls employee names and corresponding shifts from predefined cells in the sheet.
3. **Daily Iteration**: The script loops through each day, checking for missing openers, closers, and mid-shifts.
4. **Conflict Detection**: Critical warnings are triggered for consecutive close (10pm) and open (6am) shifts, and caution warnings are triggered for close (10pm) followed by early shifts (7am or 8am).
5. **Consolidated Warnings**: Warnings for missing openers, closers, and mid-shifts are consolidated into single lines and displayed in the sheet.
6. **Logging**: Detailed logs of all checks are saved in the "Debug" sheet, and the results are written to cell `B15` in the active sheet.

