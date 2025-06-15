# Auto-Export Database Before Exit

## Task Description
Implement automatic database export functionality that triggers before the application exits, saving all data to a JSON file.

## Implementation Approach
Hybrid approach using frontend detection + Rust backend execution for reliable export before application exit.

## Subtasks Completed

### ✅ 1. Create Rust Export Commands
- **File**: `src-tauri/src/lib.rs`
- **Changes**: 
  - Added `export_database_to_file` command
  - Added `get_default_export_path` command  
  - Added `safe_quit` command
  - Modified quit handler to trigger export before exit
- **Dependencies**: Added `chrono = "0.4"` to `src-tauri/Cargo.toml`

### ✅ 2. Frontend Export Integration
- **File**: `src/services/db.ts`
- **Changes**:
  - Added `exportDatabaseBeforeExit()` function
  - Added `exportDatabaseToFile()` function
  - Integrated with existing `exportAllData()` function

### ✅ 3. Application Exit Handling
- **File**: `src/App.tsx`
- **Changes**:
  - Added export status state management
  - Added `handleBeforeQuit()` function
  - Added beforeunload event listener
  - Added before-quit event listener
  - Imported and integrated export functionality

### ✅ 4. Export Progress Modal
- **File**: `src/components/ExportProgressModal.tsx` (new)
- **Features**:
  - Progress indication with icons and animations
  - Success/error message display
  - Cancel functionality during export
  - Proper modal styling with Tailwind CSS

### ✅ 5. Settings Integration
- **File**: `src/components/Settings.tsx`
- **Changes**:
  - Added auto-export toggle setting
  - Added manual export button
  - Added export status feedback
  - Added export settings persistence

### ✅ 6. Settings Service
- **File**: `src/services/settings.ts` (new)
- **Features**:
  - Centralized settings management
  - Default values handling
  - Type-safe settings interface
  - Local storage persistence
  - Settings validation and error handling

## Technical Implementation Details

### Export Process Flow
1. User initiates quit (tray menu or window close)
2. Rust backend emits `before-quit` event
3. Frontend detects event and triggers export
4. Export progress modal shows status
5. Database exported to timestamped JSON file
6. Application exits after export completion

### File Naming Convention
- Pattern: `promptgenie-export-YYYY-MM-DD-HH-mm-ss.json`
- Location: Application data directory
- Automatic timestamp generation

### Error Handling
- Export failures logged to console
- User notification via progress modal
- Graceful degradation if export fails
- Timeout protection prevents indefinite delays

### Settings Management
- Auto-export enabled by default
- User can disable via Settings
- Manual export available anytime
- Settings persist across app restarts

## Testing Commands

### Manual Testing
```bash
# Start the application
pnpm run tauri dev

# Test export scenarios:
# 1. Use tray menu "退出" option
# 2. Close main window
# 3. Use manual export in Settings
# 4. Check exported files in app data directory
```

### Export File Verification
```bash
# Check export file format
cat <app-data-dir>/promptgenie-export-*.json | jq '.'

# Verify data completeness
# Should contain: version, exportDate, metadata, prompts, tags
```

## Files Modified/Created

### Modified Files
- `src-tauri/src/lib.rs` - Added export commands and safe quit
- `src-tauri/Cargo.toml` - Added chrono dependency
- `src/services/db.ts` - Added export functions
- `src/App.tsx` - Added export handling and modal integration
- `src/components/Settings.tsx` - Added export settings UI

### New Files
- `src/components/ExportProgressModal.tsx` - Export progress modal
- `src/services/settings.ts` - Settings management service
- `.Project/code/issues/auto-export-database-before-exit.md` - This task documentation

## Success Criteria
- [x] Database exports automatically on application exit
- [x] Export creates valid JSON with all data
- [x] User can configure auto-export behavior
- [x] Manual export functionality available
- [x] Progress indication during export
- [x] Error handling and user feedback
- [x] Settings persistence across sessions
- [x] No data loss during export process

## Known Limitations
- Export timeout set to 5 seconds maximum
- Requires writable access to app data directory
- BeforeUnload event may not work in all scenarios
- Manual export path selection not implemented

## Future Enhancements
- Custom export path selection
- Export scheduling options
- Backup file rotation
- Export to different formats (CSV, etc.)
- Cloud storage integration 