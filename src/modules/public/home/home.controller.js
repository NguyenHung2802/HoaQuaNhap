const db = require('../../../config/db');
const { getActivePromotions, calculateBestPrice } = require('../../../utils/promotion-helper');

/**
 * Hiển thị trang chủ - Phase 4 Version
 */
exports.renderHome = async (req, res, next) => {
  try {
    // 1. Sản phẩm nổi bật (take 8 để có dư cho dedup)
    const featuredProducts = await db.product.findMany({
      where: { is_featured: true, status: 'published' },
      include: {
        images: { where: { is_thumbnail: true }, take: 1 }
      },
      take: 8,
      orderBy: { created_at: 'desc' }
    });

    // 2. Sản phẩm bán chạy (take 8 để có dư cho dedup)
    const bestSellers = await db.product.findMany({
      where: { is_best_seller: true, status: 'published' },
      include: {
        images: { where: { is_thumbnail: true }, take: 1 }
      },
      take: 8,
      orderBy: { created_at: 'desc' }
    });

    // 2.5 Sản phẩm Flash Sale
    const flashSaleProducts = await db.product.findMany({
      where: { 
        is_flash_sale: true, 
        status: 'published',
        flash_sale_end: { gt: new Date() }
      },
      include: {
        images: { where: { is_thumbnail: true }, take: 1 }
      },
      take: 8,
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

    const activePromotions = await getActivePromotions();
    const mapWithBestPrice = (p) => ({
      ...p,
      ...calculateBestPrice(p, activePromotions)
    });

    res.render('public/home/index', {
      title: 'Trang chủ',
      metaDesc: 'Khám phá hàng trăm loại trái cây nhập khẩu cao cấp tại WebHoaQua — Tươi ngon, đảm bảo chất lượng, giao hàng tận nơi.',
      featuredProducts: featuredProducts.map(mapWithBestPrice),
      bestSellers: bestSellers.map(mapWithBestPrice),
      flashSaleProducts: flashSaleProducts.map(mapWithBestPrice),
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
      flashSaleProducts: [],
      categories: [],
      banners: [],
      latestBlogs: [],
      layout: 'layouts/main'
    });
  }
};
