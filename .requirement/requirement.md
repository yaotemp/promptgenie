# Requirements

## Prompt Version Tracking (2024-06-14)

-   **Objective:** Implement a version control system for prompts.
-   **Details:**
    -   Any update to a prompt should create a new version, preserving the old one.
    -   The system should not allow direct editing of existing prompts; all changes result in a new version.
    -   The UI must provide a way to view the history of a prompt.
    -   Users should be able to view the content of any specific historical version.
    -   Users should be able to create a new version based on any historical version.
    -   The database schema will be updated to support versioning by grouping all versions of a prompt and flagging the latest one.
-   **Status:** Done 