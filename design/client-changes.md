# Client Change Log

<!-- Template:
## YYYY-MM-DD — Short title
**Files:** list of changed files
**What:** what changed and why
-->

## 2026-05-25 — Move gender to Settings; add age field
**Files:** `LoginPage.jsx`, `App.jsx`, `Sidebar.jsx`, `components/SettingsModal.jsx` (new)
**What:** Removed gender picker from login — login is now username-only. Added `SettingsModal` accessible via the sidebar "Settings" button, containing gender (body type) and age fields plus a Log out button. Age persisted to `localStorage` as `irp_age`. Sidebar "Settings / Logout" split: settings opens the modal, logout lives inside the modal.
