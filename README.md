# Leadership Schedule Validator
This script automates shift conflict detection and checks for scheduling gaps in a Google Sheet. It flags problematic shift patterns, like back-to-back late closers followed by early openers, and logs the results both in the sheet and a debug log.

### Key Features:
- **Shift Conflict Detection**: The script checks for employees who close (10pm) and then open the next day (6am, 7am, or 8am).
  - **CRITICAL**: If an employee closes at 10pm and opens at 6am the next day.
  - **Caution**: If an employee closes at 10pm and starts at 7am or 8am the next day.

- **Missing Shift Detection**: Flags missing openers, closers, or mid-shifts, consolidating them into single lines like "Opener needed on Monday, Tuesday."

- **Debug Logging**: Tracks all actions in a "Debug" sheet, logging every check and outcome for each employee shift.

### Requirements for Deployment

1. **Employee Names**: Must be entered in cells `A6`, `A8`, `A10`, and `A12`.  
2. **Shift Schedule**:
   - Days of the week in `B3:H3` and dates in `B4:H4`.
   - Employee shifts for the week in rows 6, 8, 10, and 12.
3. **Shift Format**: Shifts must follow the format `7a-6p`, `8a-7p`, or `OFF`/`PTO`. Openers must be **6a**, and closers must be **10p**.
4. **Debug Sheet**: A "Debug" sheet is automatically created to log detailed checks.

The script runs automatically on edits and displays results in cell `B15`.

# Version History for Conflict Detection Script

## Version 1.0 - Basic checking features
The script could read employee shifts from designated cells and perform basic checks for missing schedules like openers, closers, and mid-shifts. It summarized these issues with a warning message in cell B15 of each sheet.

### Version 1.1 - Shift pattern recognition and scheduling improvements
This update added the ability to recognize common shift patterns (e.g., 7a-6p, 8a-7p, 9a-8p) and improved detection for missing openers and closers. It also began skipping conflict checks for employees marked as "OFF" or "PTO."

### Version 1.2 - Time calculation and conflict thresholds
This version introduced logic to calculate hours between consecutive shifts, with a threshold (e.g., 12 hours) to detect and flag shifts occurring too soon after a closing shift.

### Version 1.3 - Date handling improvements
Improved the handling of dates by parsing them from row 4 of the sheet and displaying both the day of the week and the date in conflict messages. This update also included fixes for minor timezone issues.

### Version 1.4 - Message refinement and display enhancements
Refined conflict messages by removing dates from the user-facing output, instead displaying only the day of the week (e.g., "No mid shift on Monday"). Debug logging continued to include full details with both day and date.

---

## Version 2.0 - Major update: dynamic employee management, conflict detection, and debug overhaul

### Dynamic Employee Handling
Introduced dynamic fetching of employee names from cells `A6`, `A8`, `A10`, and `A12`. This eliminates the need for hardcoding employee names into the script and allows for easier adjustments to employee rosters without modifying the code.

### Enhanced Conflict Detection
New logic for detecting shift conflicts, including:
- **CRITICAL conflicts**: Flagged when an employee closes at 10pm and opens the next day at 6am.
- **Caution conflicts**: Flagged when an employee closes at 10pm and starts the next day at 7am or 8am.
These new detection rules help prevent scheduling issues and reduce manual effort by automatically identifying potential problems based on shift patterns.

### Multi-level Conflict Prioritization
The script now organizes conflict messages into **priority tiers**. CRITICAL issues are displayed at the top, followed by Caution warnings, ensuring that the most important scheduling conflicts are highlighted for immediate attention.

### Debug Overhaul
The debug system was significantly overhauled to include detailed tracking of every check performed by the script. Logs now capture not only the presence of scheduling conflicts but also the reasons behind them. The debug sheet logs the exact employee, day, shift, and the reason for conflicts, such as insufficient hours between shifts. This provides much clearer visibility into the inner workings of the conflict checks and makes troubleshooting easier.

### Consolidated Shift Warnings
Warnings for missing openers, closers, and mid-shifts are now consolidated into single lines for each type, such as "Opener needed on Monday, Tuesday." This makes the output cleaner and easier to interpret, reducing the clutter from individual warnings for each day.

---

### Version 2.0a - Improved time formatting and conflict messages
Improved readability of shift time warnings by converting time ranges like "8a-7p" into human-readable formats (e.g., "8am after closing on Monday"). Also ensured clearer conflict messaging for early shift starts after late closings.

### Version 2.0b - Consolidated opener/closer warnings
Consolidated opener and closer warnings into two lines: "Opener needed on [days]" and "Closer needed on [days]," simplifying the display of missing shifts while keeping CRITICAL warnings at the top, followed by Caution warnings with an empty line between.

- Ensured that **CRITICAL** warnings appear at the top, followed by an empty line, and then **Caution** warnings.
