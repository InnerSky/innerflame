# Developer Instructions: Working on Current Milestone

## Step 1: Begin Each Session with Proper Context
1. **Locate the milestone folder marked "current"**:
    - Look for a folder named milestone_n_current/ where "n" is a number
    - This is your active milestone folder

2. **Identify current status**:
   - Locate the current milestone folder (named `milestone_n_current/`)
   - Identify the current phase checklist (`phase_n_checklist_current.md`)

## Step 2: Conduct Mandatory Technical Review
1. **Review milestone overview**:
   - Open `milestone_overview.md` in the current milestone folder
   - Understand objectives, success criteria, and verification requirements

2. **Study the technical blueprint thoroughly**:
   - **CRITICAL**: Open and completely review `technical_blueprint.md`
   - Pay special attention to:
     - Data schema
     - API endpoints
     - Component library
     - Utility functions
     - State management
     - Existing feature implementations
   - This ensures you understand existing code and prevents duplicate functionality

## Step 3: Execute Current Phase Tasks
1. **Follow the UI-First approach**:
   - Interface implementation comes before business logic
   - Progress in this sequence:
     1. Design and implement user interface with mock data
     2. Implement minimal business logic for functionality
     3. Gradually enhance with more complex implementation
     4. Pause for human verification

2. **Check off tasks in the current phase checklist**:
   - Complete items sequentially unless noted otherwise
   - For unfinished tasks, document progress made for continuity

## Step 4: Document All Technical Changes
1. **Update `technical_blueprint.md`** with:
   - New implementations and patterns
   - Modifications to existing features
   - Feature progress in the dedicated feature section
   - Data schema updates
   - New components or utility functions

## Step 5: Verify Consistency
1. **Ensure DRY principle is followed**:
   - Confirm no duplicate functionality
   - Verify shared components/functions are properly utilized
   - Check that implementations follow documented patterns

2. **Validation before completion**:
   - Verify that all new work adheres to patterns in the technical blueprint
   - Confirm that all required documentation is updated

## Step 6: Document Progress and Next Steps
1. **Update phase checklist**:
   - Mark completed tasks
   - Add notes about partial progress
   - Document any challenges or blockers

2. **End of session tasks**:
   - If phase is complete:
     - Rename from `phase_n_checklist_current.md` to `phase_n_checklist_done.md`
     - Create next phase as `phase_(n+1)_checklist_current.md`
   - If milestone is complete:
     - Wait for human verification before proceeding
     - After verification:
       - Rename folder from `milestone_n_current/` to `milestone_n_done/`
       - Rename next milestone from `milestone_(n+1)_planned/` to `milestone_(n+1)_current/`
       - Review and update `milestone_overview.md` in the new current milestone
       - Create `phase_1_checklist_current.md` in the new milestone folder

## Important Reminders
- Human verification is required at phase transitions and milestone completions
- First milestone (`milestone_1_current/`) must focus on service connections and configuration
- Always check existing implementations before creating new code
- Document everything in the technical blueprint before considering work complete
- Use mock data for UI development when actual data sources aren't ready
- Each technical feature must be documented in the technical blueprint's dedicated feature section

By following these steps, you'll maintain continuity between development sessions and ensure the project progresses efficiently while adhering to established patterns and standards.