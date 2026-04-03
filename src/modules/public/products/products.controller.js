const db = require('../../../config/db');

/**
 * [GET] /products - Shop listing page
 */
exports.renderShop = async (req, res, next) => {
    try {
        const { q, category, sort = 'newest', page = 1, minPrice, maxPrice } = req.query;
        let { origin, status } = req.query;
        const limit = 12;
        const skip = (parseInt(page) - 1) * limit;

        const where = { status: 'published' };

        if (q) {
            where.OR = [
                { name: { contains: q, mode: 'insensitive' } },
                { sku: { contains: q, mode: 'insensitive' } }
            ];
        }

        if (category) {
            where.category = { slug: category };
        }

        if (origin) {
            if (!Array.isArray(origin)) origin = [origin];
            where.origin_country = { in: origin };
        }

        if (minPrice || maxPrice) {
            where.price = {};
            if (minPrice) where.price.gte = parseFloat(minPrice);
            if (maxPrice) where.price.lte = parseFloat(maxPrice);
        }

        if (status) {
            if (!Array.isArray(status)) status = [status];
            if (status.includes('in_stock')) {
                where.stock_quantity = { gt: 0 };
            }
            if (status.includes('on_sale')) {
                where.sale_price = { not: null };
            }
            if (status.includes('new_arrival')) {
                const thirtyDaysAgo = new Date();
                thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
                where.created_at = { gte: thirtyDaysAgo };
            }
        }

        let orderBy = { created_at: 'desc' };
        if (sort === 'price_asc') orderBy = { price: 'asc' };
        else if (sort === 'price_desc') orderBy = { price: 'desc' };
        else if (sort === 'name') orderBy = { name: 'asc' };

        const [products, total, categories, distinctOrigins] = await Promise.all([
            db.product.findMany({
                where,
                include: {
                    images: { where: { is_thumbnail: true }, take: 1 },
                    category: { select: { name: true, slug: true } }
                },
                orderBy,
                skip,
                take: limit
            }),
            db.product.count({ where }),
            db.category.findMany({ 
                where: { is_active: true }, 
                include: { _count: { select: { products: { where: { status: 'published' } } } } },
                orderBy: { name: 'asc' } 
            }),
            db.product.groupBy({
                by: ['origin_country'],
                _count: { origin_country: true },
                where: { origin_country: { not: null }, status: 'published' }
            })
        ]);

        res.render('public/products/shop', {
            title: q ? `Tìm kiếm: "${q}"` : (category ? `Danh mục: ${category}` : 'Tất cả sản phẩm'),
            metaDesc: 'Khám phá hàng trăm loại trái cây nhập khẩu cao cấp tại WebHoaQua.',
            products,
            total,
            totalPages: Math.ceil(total / limit),
            currentPage: parseInt(page),
            categories,
            distinctOrigins,
            filters: { 
                q: q || '', 
                category: category || '', 
                sort,
                origin: origin || [],
                status: status || [],
                minPrice: minPrice || '',
                maxPrice: maxPrice || ''
            },
            layout: 'layouts/main'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /product/:slug - Product detail page
 */
exports.renderDetail = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const product = await db.product.findUnique({
            where: { slug },
            include: {
                images: { orderBy: { sort_order: 'asc' } },
                category: true,
                reviews: {
                    where: { is_approved: true },
                    orderBy: { created_at: 'desc' }
                }
            }
        });

        if (!product) {
            return res.status(404).render('public/404', { title: 'Không tìm thấy', layout: 'layouts/main' });
        }

        // Calculate average rating
        const avgRating = product.reviews.length > 0 
            ? (product.reviews.reduce((sum, r) => sum + r.rating, 0) / product.reviews.length).toFixed(1)
            : 0;
        
        product.avg_rating = parseFloat(avgRating);
        product.review_count = product.reviews.length;

        const relatedProducts = await db.product.findMany({
            where: {
                category_id: product.category_id,
                id: { not: product.id },
                status: 'published'
            },
            include: {
                images: { where: { is_thumbnail: true }, take: 1 }
            },
            take: 4
        });

        res.render('public/products/detail', {
            title: product.name,
            metaDesc: product.short_description || `Mua ${product.name} tươi ngon tại WebHoaQua`,
            product,
            relatedProducts,
            layout: 'layouts/main'
        });
    } catch (error) {
        next(error);
    }
};
/**
 * [POST] /product/:id/review - Submit product review
 */
exports.submitReview = async (req, res, next) => {
    try {
        const product_id = parseInt(req.params.id);
        const { customer_name, rating, content } = req.body;

        if (!customer_name || !rating) {
            return res.status(400).json({ success: false, message: 'Vui lòng nhập tên và số sao đánh giá.' });
        }

        await db.review.create({
            data: {
                product_id,
                customer_name,
                rating: parseInt(rating),
                content,
                is_approved: false // Requirement: admin must approve
            }
        });

        res.json({ 
            success: true, 
            message: 'Cảm ơn bạn đã đánh giá! Phản hồi của bạn đang được duyệt và sẽ sớm hiển thị.' 
        });
    } catch (error) {
        console.error('Submit review error:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra, vui lòng thử lại sau.' });
    }
};
