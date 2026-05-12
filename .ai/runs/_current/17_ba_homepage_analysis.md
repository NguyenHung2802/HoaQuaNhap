# BA — Phân Tích Cơ Chế Hiển Thị Trang Chủ & Fix Menu Dropdown
- **Ngày**: 2026-05-08
- **Loại**: Phân tích code + Bug fix + Cải thiện UX

---

## 1. PHÂN TÍCH CƠ CHẾ HIỂN THỊ SẢN PHẨM TRANG CHỦ

### 1.1. "Khám Phá Thiên Đường Trái Cây" (Section Categories)

**File**: `src/views/public/home/index.ejs` (dòng 117-155)
**Nguồn dữ liệu**: `home.controller.js` dòng 44-47

```js
const categories = await db.category.findMany({
  where: { is_active: true },
  take: 6
});
```

**CƠ CHẾ**: 
- ❌ **KHÔNG có tính toán phức tạp**. Chỉ lấy **6 danh mục đầu tiên** có `is_active = true`.
- Không sort theo bất kỳ logic nào (không có `orderBy`), nên thứ tự phụ thuộc vào Prisma default = `id ASC` (thứ tự nhập vào DB).
- Khi click vào 1 category → link `/products?category=<slug>` → **Đúng**, sẽ lọc sản phẩm theo category slug.
- Fallback: Nếu không có categories → hiển thị 6 placeholder hardcoded.

**VẤN ĐỀ**:
- Không có `orderBy` → thứ tự hiển thị không kiểm soát được.
- Không lọc theo `sort_order` mặc dù schema Category có field `sort_order`.

---

### 1.2. "Sản Phẩm Yêu Thích Trong Mùa" (Section Featured Products)

**File**: `src/views/public/home/index.ejs` (dòng 213-282)  
**Nguồn dữ liệu**: `home.controller.js` dòng 10-27

```js
// 1. Sản phẩm nổi bật
const featuredProducts = await db.product.findMany({
  where: { is_featured: true, status: 'published' },
  take: 8, orderBy: { created_at: 'desc' }
});

// 2. Sản phẩm bán chạy
const bestSellers = await db.product.findMany({
  where: { is_best_seller: true, status: 'published' },
  take: 8, orderBy: { created_at: 'desc' }
});
```

**CƠ CHẾ** (trong EJS template, dòng 226-232):
```js
// Dedup: ưu tiên bestSellers trước, rồi featured, không trùng ID
const seenIds = new Map();
(bestSellers || []).forEach(p => { 
  if (!seenIds.has(p.id)) seenIds.set(p.id, { ...p, _priority: 'best_seller' }); 
});
(featuredProducts || []).forEach(p => { 
  if (!seenIds.has(p.id)) seenIds.set(p.id, { ...p, _priority: 'featured' }); 
});
const allProducts = [...seenIds.values()].slice(0, 4);
```

**LOGIC**:
- ✅ **CÓ tính toán**: Merge 2 pool `bestSellers` (8 SP) + `featuredProducts` (8 SP), loại trùng ID.
- Ưu tiên: `best_seller` > `featured` (bestSellers được add vào Map trước).
- Kết quả: Lấy tối đa **4 sản phẩm** để hiển thị.
- Tags: Hiển thị badge "Bán chạy 🔥" hoặc "Nổi bật ✨" tuỳ thuộc flag.
- Giá: Sử dụng `calculateBestPrice()` để tính giá khuyến mãi từ promotion campaigns.

**VẤN ĐỀ**:
- Nút "Xem tất cả" → link `/products` (không filter) → Không chính xác nếu muốn ngữ cảnh.
- Chỉ hiển thị 4 SP → có thể quá ít nếu có nhiều sản phẩm.

---

### 1.3. "Bộ Sưu Tập Theo Nhu Cầu" (Combo Section)

**File**: `src/views/public/home/index.ejs` (dòng 284-362)

**CƠ CHẾ**:
- ❌ **HOÀN TOÀN HARDCODED**. Không lấy từ DB.
- 4 combo cards được define trực tiếp trong template EJS (dòng 293-338).
- Ảnh: Sử dụng URL Unsplash external.
- Links: 
  - Combo Buổi Sáng → `/products?status=in_stock`
  - Combo Quà Biếu → `/products?status=in_stock`  
  - Combo Mùa Hè → `/products?status=in_stock`
  - Combo Gia Đình → `/products`

**VẤN ĐỀ NGHIÊM TRỌNG**:
- ⚠️ **Links không có ý nghĩa lọc**. Tất cả đều link đến `?status=in_stock` hoặc `/products`.
- Mô tả combo không liên kết với sản phẩm thực tế nào trong DB.
- Không có concept "Combo/Bundle/Gift Set" trong schema DB hiện tại.

---

## 2. VẤN ĐỀ DROPDOWN MENU "SẢN PHẨM"

**File**: `src/views/partials/navbar.ejs` (dòng 19-36)

```html
<a class="nav-link dropdown-toggle" href="/products" role="button" data-bs-toggle="dropdown">
    Sản phẩm
</a>
```

**VẤN ĐỀ**: 
- `data-bs-toggle="dropdown"` → Bootstrap yêu cầu **click** để toggle dropdown.
- Trên desktop, user mong muốn **hover** để hiển thị danh sách categories.
- Khi **click** vào "Sản phẩm" → nó toggle dropdown thay vì navigate đến `/products`.

**YÊU CẦU**:
1. **Hover** → Hiển thị dropdown danh sách categories.
2. **Click** vào "Sản phẩm" → Navigate đến `/products` (tất cả sản phẩm, không lọc).
3. **Click** vào từng danh mục trong dropdown → Navigate đến `/products?category=<slug>`.

---

## 3. TỔNG HỢP SCOPE

### Must-do:
| # | Hạng mục | Mô tả |
|---|----------|-------|
| M1 | Fix menu hover dropdown | Desktop: hover hiển thị dropdown, click "Sản phẩm" → `/products`. Mobile vẫn giữ click-toggle. |
| M2 | Fix Categories orderBy | Thêm `orderBy: { sort_order: 'asc' }` cho query categories trên trang chủ. |

### Should-do:
| # | Hạng mục | Mô tả |
|---|----------|-------|
| S1 | Cải thiện Combo links | Thay links hardcoded bằng links filter category phù hợp. |
| S2 | Document combo section | Ghi nhận rằng section Combo là hardcoded, cần chuyển sang dynamic khi có đủ data. |

### Could-do (tương lai):
| # | Hạng mục | Mô tả |
|---|----------|-------|
| C1 | Thêm model Combo/Bundle/Gift Set | Schema cho "Giỏ hoa quả", "Set", "Túi". |
| C2 | Dynamic Combo Section | Tạo admin CRUD cho combo collections. |
| C3 | Tags/Labels cho sản phẩm | Tags filter linh hoạt hơn. |

---

## 4. SCOPE CHỐT CHO TASK NÀY

**IN-SCOPE**: M1, M2, S1
**OUT-OF-SCOPE**: C1, C2, C3 (ghi vào recommendations log cho tương lai)
