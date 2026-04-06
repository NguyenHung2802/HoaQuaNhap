# Slice 1: Database Migration & Module Setup (Profile)

## 1. Cập nhật Prisma Schema
Thêm trường `avatar_url` vào bảng `User`.

```diff
model User {
  id            Int      @id @default(autoincrement())
  full_name     String
  email         String   @unique
  phone         String?
  password_hash String
+ avatar_url    String?
  role          String   @default("customer")
```

## 2. Thao tác thực thi
1. Sửa `prisma/schema.prisma`.
2. Chạy migrate.
3. Tạo thư mục `src/modules/public/profile`.
4. Tạo `profile.route.js` trung gian.
5. Tạo `profile.controller.js` với phương thức `renderProfile`.
6. Import vào `web.route.js`.
