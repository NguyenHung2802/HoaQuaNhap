const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');
const prisma = new PrismaClient();

async function main() {
  // 1. Create Admin User
  const hashedPassword = await bcrypt.hash('admin123', 10);
  await prisma.user.upsert({
    where: { email: 'admin@webhoaqua.com' },
    update: { password_hash: hashedPassword },
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

  const catStrawberry = await prisma.category.upsert({
    where: { slug: 'dau-tay' },
    update: {},
    create: {
      name: 'Dâu tây Hàn Quốc',
      slug: 'dau-tay',
      description: 'Dâu tây đỏ mọng, thơm phức nhập từ Hàn Quốc...',
      is_active: true,
    },
  });

  // 3. Create Sample Products
  const products = [
    {
      name: 'Táo Envy New Zealand',
      slug: 'tao-envy-new-zealand',
      sku: 'APPLE-ENVY-NZ',
      price: 250000,
      stock_quantity: 50,
      unit: 'kg',
      origin_country: 'New Zealand',
      category_id: catApple.id,
      status: 'published',
      is_featured: true
    },
    {
      name: 'Nho Mẫu Đơn Hàn Quốc',
      slug: 'nho-mau-don-han-quoc',
      sku: 'GRAPE-SHINE-KR',
      price: 850000,
      stock_quantity: 20,
      unit: 'chùm',
      origin_country: 'Hàn Quốc',
      category_id: catGrape.id,
      status: 'published',
      is_featured: true
    },
    {
      name: 'Dâu Tây Seolhyang Hàn Quốc',
      slug: 'dau-tay-seolhyang',
      sku: 'STRAW-KR-001',
      price: 450000,
      stock_quantity: 30,
      unit: 'hộp 500g',
      origin_country: 'Hàn Quốc',
      category_id: catStrawberry.id,
      status: 'published',
      is_featured: true
    },
    {
      name: 'Cam Vàng Navel Mỹ',
      slug: 'cam-vang-navel-my',
      sku: 'ORANGE-US-VAL',
      price: 120000,
      stock_quantity: 100,
      unit: 'kg',
      origin_country: 'Mỹ',
      category_id: catApple.id,
      status: 'published',
      is_best_seller: true
    }
  ];

  for (const p of products) {
    await prisma.product.upsert({
      where: { sku: p.sku },
      update: {},
      create: p
    });
  }

  // 4. Static Pages Settings
  const staticPages = [
    { key: 'about_us', description: 'Giới thiệu WebHoaQua', value: '<h2>Chúng tôi là ai?</h2><p>WebHoaQua là hệ thống phân phối trái cây nhập khẩu hàng đầu Việt Nam...</p>' },
    { key: 'faq', description: 'Câu hỏi thường gặp (FAQ)', value: '<h2>Các câu hỏi thường gặp</h2><p>1. Cách thức đặt hàng?<br>2. Quy trình đổi trả?</p>' },
    { key: 'shipping_policy', description: 'Chính sách vận chuyển', value: '<h2>Chính sách giao hàng</h2><p>Miễn phí vận chuyển cho đơn hàng từ 500k tại nội thành...</p>' },
    { key: 'privacy_policy', description: 'Chính sách bảo mật', value: '<h2>Bảo mật thông tin khách hàng</h2><p>Chúng tôi cam kết bảo vệ thông tin cá nhân của bạn...</p>' }
  ];

  for (const page of staticPages) {
    await prisma.setting.upsert({
      where: { key: page.key },
      update: {},
      create: {
        ...page,
        group_key: 'static_page'
      }
    });
  }

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
