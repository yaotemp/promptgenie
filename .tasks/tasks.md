# Task Plan: Prompt Version Tracking

This document outlines the tasks required to implement prompt version tracking.

---

### Phase 1: Database Schema Modification

-   [ ] **Task:** Modify `src-tauri/db/schema.sql`.
-   **Details:**
    -   Drop `prompt_tags` and `prompts` tables.
    -   Recreate the `prompts` table with `prompt_group_id`, `version`, and `is_latest` columns.
    -   Recreate the `prompt_tags` table.

---

### Phase 2: Update Data Service Layer

-   [ ] **Task:** Modify `src/services/db.ts`.
-   **Details:**
    -   Update the `Prompt` interface to include new versioning fields.
    -   Update `getAllPrompts` to fetch only the latest versions.
    -   Update `createPrompt` to set initial versioning fields.
    -   Update `updatePrompt` to create new versions instead of in-place updates.
    -   Create `getPromptHistory` to fetch all versions for a prompt group.
    -   Create `getPromptByVersionId` to fetch a specific version by its unique ID.

---

### Phase 3: Frontend UI Implementation

-   [ ] **Task:** Create `src/components/PromptHistory.tsx`.
    -   **Details:** A modal or panel to display the list of versions for a prompt.
-   [ ] **Task:** Create `src/components/PromptVersionView.tsx`.
    -   **Details:** A component to show the read-only content of a selected historical version.
-   [ ] **Task:** Modify `src/App.tsx`.
    -   **Details:** Add state management and handlers to control the visibility of the history and version view components.
-   [ ] **Task:** Modify `src/components/PromptCard.tsx` (or equivalent).
    -   **Details:** Add a "History" button to trigger the version history view.

---

### Phase 4: Documentation

-   [x] **Task:** Update `.requirement/requirement.md`.
-   **Details:** Document the prompt versioning feature. (Completed) 