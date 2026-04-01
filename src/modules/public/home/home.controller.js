const db = require('../../../config/db');

/**
 * Hiển thị trang chủ với dữ liệu mẫu từ DB để test kết nối
 */
exports.renderHome = async (req, res, next) => {
  try {
    // 1. Fetch Featured Products
    const featuredProducts = await db.product.findMany({
      where: { is_featured: true, status: 'published' },
      include: { category: true },
      take: 8,
    });

    // 2. Fetch Active Categories
    const categories = await db.category.findMany({
      where: { is_active: true },
      take: 6,
    });

    res.render('public/home/index', {
      title: 'Trang chủ - Thế giới Hoa Quả Nhập Khẩu',
      featuredProducts,
      categories,
    });
  } catch (error) {
    // Nếu chưa có DB hoặc chưa migrate, vẫn render trang nhưng báo log
    console.error('Home controller error (Possibly DB not ready):', error.message);
    res.render('public/home/index', {
      title: 'Chào mừng đến với WebHoaQua',
      featuredProducts: [],
      categories: [],
    });
  }
};
