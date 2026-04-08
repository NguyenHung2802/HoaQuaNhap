# Business Analysis - Feedback & New Features

## 1. Admin Contact Requests Fixes
### Problem 1: Update Bug
- Status updates incorrectly update the "Need" (nhu cầu) column instead of the "Status" (trạng thái) column.
- Frontend doesn't reflect changes immediately without page reload.
### Problem 2: Missing Pagination
- Contact requests list is not paginated, making it difficult to manage many requests.

### Proposed Solution:
- Correct the controller logic for status updates.
- Ensure the frontend DOM reflects the update via JavaScript (handled via existing `fetch` response).
- Implement pagination logic in the controller and view (limit 15 per page).

## 2. Shipping Region Restriction
### Problem:
- User wants to limit orders only to "Hà Nội". Other provinces/cities are not supported.

### Proposed Solution:
- Add a check in the checkout process (controller/service and frontend) for province/city selection.
- If not "Hà Nội", show a message "Hiện tại hệ thống chỉ hỗ trợ giao hàng tại khu vực Hà Nội." and prevent purchase.
- Pre-select "Hà Nội" in the addresses or checkout form if possible.

## 3. Product Nutritional Information
### Problem:
- The "Thông tin dinh dưỡng" tab on the product detail page is empty/placeholder.
- No field exists in the DB/Admin to input this info.

### Proposed Solution:
- Update `prisma/schema.prisma` to add `nutritional_info` field to the `Product` model (String @db.Text).
- Update the admin product form (create/edit) to include a textarea for this info.
- Update the product detail page (`detail.ejs`) to display this info.

## 4. Wishlist (Sản phẩm yêu thích)
### Problem:
- Customers want to save products for later (separate from cart).
- Must persist after login.

### Proposed Solution:
- **Database**: Add a `Wishlist` model (or `Favorite`) to `schema.prisma` linking `Customer` and `Product`.
- **API**: Create endpoints to add/remove/list wishlist items.
- **Frontend**: 
    - Update product cards and detail pages to include a "Heart" icon to toggle favorites.
    - Create a "Sản phẩm yêu thích" page for customers.
    - Sync frontend state for guests? (User only specified persisting after login, but common to have guest wishlist too via localStorage). User says "sau khi đăng nhập... tìm lại", so syncing DB is key.

## 5. Revised Slices
- **S38**: [Fix] Admin Contact Requests (Status bug & Pagination).
- **S39**: [Fix] Checkout Shipping Restriction (Hà Nội only).
- **S40**: [Feature] Product Nutritional Info (DB, Admin UI, Public Detail).
- **S41**: [Feature] Wishlist System (DB, API, Public UI, Page).
