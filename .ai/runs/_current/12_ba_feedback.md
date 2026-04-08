# Business Analysis - Feedback Improvements

## 1. Contact Popup Enhancements
### Problem:
- The hidden contact popup blocks clicks in its area.
- Icon and text are in the wrong order.
- The "Nhắn tin để được liên hệ" text should show only on hover or after 3s, then hide/show.

### Proposed Solution:
- Fix the CSS for the popup container so it's not blocking clicks when it's closed.
- Reorder the icon and text in `src/views/partials/contact-popup.ejs`.
- Implement a CSS/JS animation for the text.

## 2. Product Review System Enhancements
### Problem:
- Logged-in users have to re-enter their information when reviewing.
- Reviews require admin approval before being visible.

### Proposed Solution:
- **Pre-fill Form**: In product detail page, if `currentUser` exists, pre-fill name and email.
- **Immediate Visibility**: 
  - Update Review creation to set `isVisible: true` by default.
  - Update product detail view to fetch all `isVisible` reviews.
  - Admin controls the visibility after the review is posted.

## 3. Scope of Work (Slices)
- **Slice S35**: Contact Popup UI/UX Fixes (CSS & Animation).
- **Slice S36**: Product Review Pre-fill & Immediate Visibility.
- **Slice S37**: Admin Review Management.
