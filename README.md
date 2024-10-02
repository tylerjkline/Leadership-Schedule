## Script Overview

This script automates shift conflict detection and checks for scheduling gaps in a Google Sheet. It flags problematic shift patterns, like back-to-back late closers followed by early openers, and logs the results both in the sheet and a debug log.

### Key Features:
- **Shift Conflict Detection**: The script checks for employees who close (10pm) and then open the next day (6am, 7am, or 8am).
  - **CRITICAL**: If an employee closes at 10pm and opens at 6am the next day.
  - **Caution**: If an employee closes at 10pm and starts at 7am or 8am the next day.

- **Missing Shift Detection**: Flags missing openers, closers, or mid-shifts, consolidating them into single lines like "Opener needed on Monday, Tuesday."

- **Debug Logging**: Tracks all actions in a "Debug" sheet, logging every check and outcome for each employee shift.

## Requirements for Deployment

1. **Employee Names**: Must be entered in cells `A6`, `A8`, `A10`, and `A12`.  
2. **Shift Schedule**:
   - Days of the week in `B3:H3` and dates in `B4:H4`.
   - Employee shifts for the week in rows 6, 8, 10, and 12.
3. **Shift Format**: Shifts must follow the format `7a-6p`, `8a-7p`, or `OFF`/`PTO`. Openers must be **6a**, and closers must be **10p**.
4. **Debug Sheet**: A "Debug" sheet is automatically created to log detailed checks.

The script runs automatically on edits and displays results in cell `B15`.


# Version History for Conflict Detection Script

## Version 1.0 - Basic checking features
- Ability to read employee shifts from cells.
- Basic checks for missing schedules (closers, openers, mid shifts).
- Outputs a warning message in B15 of each sheet.

## Version 1.1 - Added logging and debug sheet
- Introduced debug mode with detailed logging of all conflict checks.
- Added a new "Debug" sheet to track all actions and reasons behind conflict detections.
- Debug log includes the exact employee being checked and the reason for conflicts (like insufficient hours between shifts).

## Version 1.2 - Conflict thresholds and time calculations
- Added logic to calculate the number of hours between shifts.
- Implemented a threshold (e.g., 12 hours) to flag shifts that occur too soon after a closing shift.
- Introduced functions for parsing shifts into 24-hour time for accurate time comparisons.

## Version 1.3 - Shift pattern improvements
- Recognized common shift patterns such as mid shifts (7a-6p, 8a-7p, 9a-8p).
- Improved detection logic to ensure accurate checks for closers and openers by time.
- Skipped conflict detection if the employee has "OFF" or "PTO" as their shift.

## Version 1.4 - Date handling improvement
- Added parsing of the date from cells in row 4 (B4, C4, etc.).
- Incorporated logic to display both the day of the week and the date for conflict messages.
- Fixed minor timezone issues by ensuring dates are processed correctly with Utilities.formatDate.

## Version 1.5 - Refined display messages and logging
- Changed messages in B15 to remove dates, only displaying weekdays (e.g., "No mid shift on Monday").
- Debug log continued to display full details, including the date (e.g., "Monday 10/6").
- Improved readability of warning and conflict messages.

## Version 1.6 - Bug fixes for day/date alignment
- Corrected a bug where the displayed date in the sheet was off by one day.
- Ensured that the correct weekday is displayed with each warning (e.g., "Monday 10/14" rather than "Monday 10/13").

## Version 1.7 - Final adjustments for date parsing and timezone issues
- Fixed issues with date parsing, ensuring the script does not misinterpret the date and shows accurate weekdays.
- Kept debug information consistent while ensuring that displayed messages in the sheet only show relevant warnings (without the date).

---

## Version 2.0 - Dynamic employee name fetching and conflict detection refinements
- Replaced hardcoded employee names with dynamic fetching from cells A6, A8, A10, and A12.
- Allowed employee names to be changed directly in the sheet without updating the script.
- Added detection for **CRITICAL** conflicts when an employee closes at 10p and then opens at 6a the next day.
- Added **Caution** warnings for employees closing at 10p and starting at 7a or 8a the next day.

### Version 2.0a - Consolidated mid-shift warnings
- Consolidated mid-shift warnings into a single line (e.g., "Caution | No mid shift scheduled on Monday, Wednesday, Friday") to avoid listing each day separately.

### Version 2.0b - Better time formatting and consolidation of opener/closer warnings
- Improved readability of shift time warnings by converting shift times like "8a-7p" to human-readable formats like "8am after closing on Monday".
- Consolidated opener and closer warnings into two lines: "Opener needed on [days]" and "Closer needed on [days]".
- Ensured that **CRITICAL** warnings appear at the top, followed by an empty line, and then **Caution** warnings.
