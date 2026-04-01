const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // 1. Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  const admin = await prisma.user.upsert({
    where: { email: 'admin@webhoaqua.com' },
    update: {
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active'
    },
    create: {
      email: 'admin@webhoaqua.com',
      full_name: 'Quản trị viên',
      password_hash: hashedPassword,
      role: 'admin',
      status: 'active',
    },
  });

  // 2. Create Categories
  const catApple = await prisma.category.upsert({
    where: { slug: 'tao-nhap-khau' },
    update: {},
    create: {
      name: 'Táo nhập khẩu',
      slug: 'tao-nhap-khau',
      description: 'Các loại táo thượng hạng từ Mỹ, New Zealand, Pháp...',
      is_active: true,
    },
  });

  const catGrape = await prisma.category.upsert({
    where: { slug: 'nho-nhap-khau' },
    update: {},
    create: {
      name: 'Nho nhập khẩu',
      slug: 'nho-nhap-khau',
      description: 'Nho mẫu đơn, nho đen không hạt từ Hàn Quốc, Mỹ...',
      is_active: true,
    },
  });

  // 3. Create Sample Products
  await prisma.product.upsert({
    where: { sku: 'APPLE-ENVY-NZ' },
    update: {},
    create: {
      name: 'Táo Envy New Zealand',
      slug: 'tao-envy-new-zealand',
      sku: 'APPLE-ENVY-NZ',
      short_description: 'Giòn, ngọt và hương thơm đặc trưng.',
      description: 'Táo Envy New Zealand là loại táo cao cấp nhất thế giới...',
      price: 250000,
      sale_price: 220000,
      stock_quantity: 50,
      unit: 'kg',
      origin_country: 'New Zealand',
      category_id: catApple.id,
      status: 'published',
      is_featured: true,
    },
  });

  await prisma.product.upsert({
    where: { sku: 'GRAPE-SHINE-KR' },
    update: {},
    create: {
      name: 'Nho Mẫu Đơn Hàn Quốc',
      slug: 'nho-mau-don-han-quoc',
      sku: 'GRAPE-SHINE-KR',
      short_description: 'Trái to, xanh mướt, vị ngọt như mật.',
      description: 'Nho mẫu đơn (Shine Muscat) nhập khẩu chính hiệu từ Hàn Quốc...',
      price: 850000,
      stock_quantity: 20,
      unit: 'chùm',
      origin_country: 'Hàn Quốc',
      category_id: catGrape.id,
      status: 'published',
      is_featured: true,
    },
  });

  console.log('Seed data created successfully!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
