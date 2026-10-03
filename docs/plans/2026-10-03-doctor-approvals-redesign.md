# Doctor Approvals Redesign Implementation Plan

> **For Claude:** REQUIRED SUB-SKILL: Use superpowers:executing-plans to implement this plan task-by-task.

**Goal:** Redesign the doctor approvals tab for web (desktop and mobile responsive) and flutter mobile app based on the provided dark mode "Case Review Center" UI.

**Architecture:** 
- Web: Update `ApprovalsPage.tsx` and add custom CSS to match the dark theme and specific layout structure shown in the mockup. 
- Mobile: Create a new Flutter screen `my_cases_review_screen.dart` or similar to replicate this UI, and link it to the router if needed.

**Tech Stack:** React, plain CSS, Flutter.

---

### Task 1: Redesign Web Approvals Page Structure

**Files:**
- Modify: `web/src/pages/doctor/ApprovalsPage.tsx`
- Create: `web/src/styles/case-review-center.css`

**Step 1:** Rewrite `ApprovalsPage.tsx` to match the two-column grid (Sidebar for queue, main content area for case details).
**Step 2:** Apply dark mode specific CSS classes.

### Task 2: Implement Web Approvals Page CSS

**Files:**
- Modify: `web/src/styles/case-review-center.css`
- Modify: `web/src/pages/doctor/ApprovalsPage.tsx` (import CSS)

**Step 1:** Write CSS variables for dark theme colors.
**Step 2:** Write layout CSS for responsive design (desktop vs mobile width).

### Task 3: Implement Flutter Approvals Screen

**Files:**
- Create: `mobile/lib/screens/doctor/case_review_screen.dart`
- Modify: `mobile/lib/router/app_router.dart` (Add route)
- Modify: `mobile/lib/screens/home/home_screen.dart` (Add access point for doctors if missing)

**Step 1:** Build the dark theme UI using Flutter widgets.
**Step 2:** Hook up the router to make it accessible.
