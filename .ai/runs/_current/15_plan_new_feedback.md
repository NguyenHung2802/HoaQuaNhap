# Master Plan - New Tasks & Bug Fixes

## Overview
This plan addresses user feedback for the admin contact requests bug, shipping province restriction, product nutritional info, and the new wishlist system.

## Slices

### S38: Admin Contact Requests (Bugs & Pagination)
- **Description**: Fix state update logic, ensure UI reacts immediately, and add pagination.
- **Files**:
  - `src/modules/contacts/contacts.controller.js`
  - `src/views/admin/contacts/index.ejs`
- **Steps**:
  1. Update `contacts.controller.js` `updateStatus` method: correct the field name (from `need` -> `status`).
  2. Implement `renderAdminList` pagination in `contacts.controller.js`.
  3. Update `index.ejs` with pagination controls.
  4. Fix frontend JS in `index.ejs` to reflect state change without reload.

### S39: Checkout Shipping Restriction (Hà Nội Only)
- **Description**: Limit shipping/order address to "Hà Nội".
- **Files**:
  - `src/modules/public/checkout/checkout.controller.js`
  - `src/views/public/checkout/index.ejs` (likely)
- **Steps**:
  1. Add a check in `checkout.controller.js` (validation).
  2. Update frontend validation (if any) or display a restrictive select box.
  3. Pre-fill and lock "Thành phố: Hà Nội" if the user wants strict control.

### S40: Product Nutritional Info (DB, Admin, Public)
- **Description**: Add nutritional info to products.
- **Files**:
  - `prisma/schema.prisma`
  - `src/modules/products/products.controller.js` (Admin side)
  - `src/views/admin/products/create.ejs`
  - `src/views/admin/products/edit.ejs`
  - `src/views/public/products/detail.ejs`
- **Steps**:
  1. Add `nutritional_info` to `Product` model.
  2. Run `npx prisma migrate dev`.
  3. Update Admin controllers/views.
  4. Populate the tab in `detail.ejs`.

### S41: Wishlist System (DB, API, UI)
- **Description**: Implement a wishlist system synced with user account.
- **Files**:
  - `prisma/schema.prisma`
  - `src/modules/wishlist/` (New module)
  - `src/views/public/profile/wishlist.ejs` (New view)
- **Steps**:
  1. Create `Wishlist` model (Many-to-Many between Customer and Product).
  2. Run `npx prisma migrate dev`.
  3. Create routes and controller for `/api/wishlist`.
  4. Add toggle heart icons to product cards and detail page.
  5. Create the wishlist management page.

## Verification
- Test admin contact request:
  - Changing status updates the correct column.
  - No page reload is needed to see the new badge.
  - Pagination works.
- Test checkout:
  - If a city other than "Hà Nội" is chosen, order is blocked.
- Test nutritional info:
  - Info can be edited in Admin and seen on the product detail page.
- Test wishlist:
  - Products can be favorited/unfavorited.
  - Persistent after logging in.
