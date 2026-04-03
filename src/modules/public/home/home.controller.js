const db = require('../../../config/db');

/**
 * Hiển thị trang chủ - Phase 4 Version
 */
exports.renderHome = async (req, res, next) => {
  try {
    // 1. Sản phẩm nổi bật (4 featured)
    const featuredProducts = await db.product.findMany({
      where: { is_featured: true, status: 'published' },
      include: {
        images: { where: { is_thumbnail: true }, take: 1 }
      },
      take: 4,
      orderBy: { created_at: 'desc' }
    });

    // 2. Sản phẩm bán chạy (4 best_seller)
    const bestSellers = await db.product.findMany({
      where: { is_best_seller: true, status: 'published' },
      include: {
        images: { where: { is_thumbnail: true }, take: 1 }
      },
      take: 4,
      orderBy: { created_at: 'desc' }
    });

    // 3. Categories (đã có trong globalCategories, lấy thêm với count)
    const categories = await db.category.findMany({
      where: { is_active: true },
      take: 6
    });

    // 4. Banners
    const banners = await db.banner.findMany({
      where: { is_active: true },
      orderBy: { sort_order: 'asc' }
    });

    // 5. Recent Blogs
    const latestBlogs = await db.blogPost.findMany({
      where: { is_published: true },
      orderBy: { created_at: 'desc' },
      take: 3
    });

    res.render('public/home/index', {
      title: 'Trang chủ',
      metaDesc: 'Khám phá hàng trăm loại trái cây nhập khẩu cao cấp tại WebHoaQua — Tươi ngon, đảm bảo chất lượng, giao hàng tận nơi.',
      featuredProducts,
      bestSellers,
      categories,
      banners,
      latestBlogs,
      layout: 'layouts/main'
    });
  } catch (error) {
    console.error('Home controller error:', error.message);
    res.render('public/home/index', {
      title: 'Trang chủ',
      metaDesc: '',
      featuredProducts: [],
      bestSellers: [],
      categories: [],
      layout: 'layouts/main'
    });
  }
};
