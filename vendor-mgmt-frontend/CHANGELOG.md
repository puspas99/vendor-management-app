# DevXcelerate App Change Log

Date: 2025-11-15

## Overview
This changelog captures user prompts and the resulting code changes performed during the development session on November 15, 2025.

## Changes

### Dependency & Setup
- Installed `react-hot-toast` to enable toast notifications.

### Authentication & Routing
- Added `AuthContext` for global auth state (login/logout, persistence via localStorage).
- Introduced `ProtectedRoute` component to guard authenticated routes.
- Updated `App.jsx` to wrap app with `AuthProvider` and protect all routes except `/login` and `/signup`.
- Modified `Login.jsx` to invoke `login()` and redirect to the new home page (`/`).

### Logout & Session UX
- Implemented logout in `Sidebar.jsx` (clears auth state and redirects to `/login`).
- Later replaced standalone logout button on Home page with user info panel, then aligned it visually with the Dashboard’s profile block.

### Home Page (New Feature)
- Created `Home.jsx` as the default post-login landing page at route `/`.
- Added "Request Form" button to display a new vendor request form with fields: Vendor Name, Vendor Email, Contact Person, Contact Number, Vendor Category, Remarks, Files.
- Added additional quick-access buttons: "Dashboard" and "Pending Vendor Reviews" (filters pending vendors).
- Removed sidebar from Home to focus on primary actions.
- Added gradient background, logo display, and later integrated Dashboard-style top bar with compact user info.
- Removed search bar from Home’s top bar and reduced avatar/text/icon sizes for a compact appearance.

### Vendor Detail Page
- Removed toggle button for onboarding; made Onboarding Details section always visible.
- Converted onboarding section into a single editable form positioned above action buttons.

### UI & Branding
- Added `Logo.png` usage on Home page and inserted logo beside the text in `Sidebar.jsx`.
- Adjusted sidebar logo size (from 32px to 28px) and reduced text font size to prevent overlap.

### User Info Consistency
- Initial Home implementation used a custom dropdown for user info; later replaced with the Dashboard-style profile block (avatar, name, email, icons) for consistency.
- Final refinement: Removed search input on Home and compacted user info styling.

### Miscellaneous
- Added toast feedback on vendor request submission.
- Ensured new vendor requests default to `Pending` status.

## Sequence of Prompts (Condensed)
1. Resolve missing `react-hot-toast` import -> installed dependency.
2. Request for logout redirect + global auth -> added AuthContext & ProtectedRoute.
3. Remove onboarding toggle; always show details -> updated `VendorDetail.jsx`.
4. Add Home page with vendor request form & navigation buttons -> created `Home.jsx`.
5. Remove sidebar from Home; refine buttons -> updated layout.
6. Add logo to Home & Sidebar; adjust sizes -> branding applied.
7. Make user info on Home match Dashboard -> replaced header implementation.
8. Remove search bar & shrink user info on Home -> final UI polish.

## Notes
- No commit hashes captured; operations were applied directly to workspace files.
- Further enhancements (e.g., persistence of uploaded files, backend integration, role-based access) remain open for future iterations.

---
Generated automatically based on interactive development session prompts and applied code changes.
