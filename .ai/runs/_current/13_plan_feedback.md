# Master Plan - Feedback Improvements

## Overview
This plan addresses user feedback for the contact popup and product review system.

## Slices

### S35: Contact Popup UI/UX Fixes
- **Description**: Fix container click-blocking, reorder icon/text, and add periodic animation.
- **Files**: 
  - `src/views/partials/contact-popup.ejs`
- **Steps**:
  1. Fix the CSS for the container (e.g., `width: auto`, `height: auto`, or `pointer-events: none` on container and `pointer-events: auto` on buttons).
  2. Swap icon and text positions.
  3. Add CSS keyframes for the "show/hide" animation of the text.
  4. Ensure text shows on hover.

### S36: Product Review Pre-fill & Immediate Visibility
- **Description**: Automatically fill user info if logged in and make reviews visible by default.
- **Files**:
  - `src/views/public/products/detail.ejs`
  - `src/modules/reviews/reviews.service.js`
  - `src/modules/reviews/reviews.controller.js`
- **Steps**:
  1. Update `detail.ejs` to check for `currentUser` and pass data to the review form.
  2. Update `reviews.service.js` creation logic to set `isApproved` (or similar) to `true` by default.
  3. Update `reviews.controller.js` or wherever reviews are fetched to include newly created reviews immediately.

### S37: Admin Review Management
- **Description**: Allow admin to toggle review visibility.
- **Files**:
  - `src/modules/admin/reviews/` (likely)
- **Steps**:
  1. Update the admin review list view to show a toggle/button for visibility.
  2. Implement the controller/service method to update visibility.

## Verification
- Test contact popup:
  - Clicks outside the popup work.
  - Icon is on the left.
  - Text animates every 3s and shows on hover.
- Test product reviews:
  - User info is pre-filled when logged in.
  - Review is visible immediately after submission.
  - Admin can hide/delete the review.
