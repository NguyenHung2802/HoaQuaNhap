const db = require('../../config/db');

/**
 * [POST] /api/wishlist/toggle/:productId
 */
exports.toggleWishlist = async (req, res, next) => {
    try {
        if (!req.session.user) {
            return res.status(401).json({ success: false, message: 'Vui lòng đăng nhập để lưu sản phẩm yêu thích.' });
        }

        const productId = parseInt(req.params.productId);
        const userId = req.session.user.id;

        // Find customer
        const customer = await db.customer.findUnique({ where: { user_id: userId } });
        if (!customer) {
            return res.status(404).json({ success: false, message: 'Không tìm thấy thông tin khách hàng.' });
        }

        const existing = await db.wishlist.findUnique({
            where: {
                customer_id_product_id: {
                    customer_id: customer.id,
                    product_id: productId
                }
            }
        });

        if (existing) {
            await db.wishlist.delete({
                where: { id: existing.id }
            });
            return res.json({ success: true, status: 'removed', message: 'Đã xóa khỏi danh sách yêu thích.' });
        } else {
            await db.wishlist.create({
                data: {
                    customer_id: customer.id,
                    product_id: productId
                }
            });
            return res.json({ success: true, status: 'added', message: 'Đã thêm vào danh sách yêu thích.' });
        }
    } catch (error) {
        console.error('Wishlist toggle error:', error);
        res.status(500).json({ success: false, message: 'Có lỗi xảy ra.' });
    }
};

/**
 * [GET] /profile/wishlist
 */
exports.renderWishlistPage = async (req, res, next) => {
    try {
        if (!req.session.user) return res.redirect('/login');

        const customer = await db.customer.findUnique({
            where: { user_id: req.session.user.id },
            include: {
                wishlist: {
                    include: {
                        product: {
                            include: {
                                images: { where: { is_thumbnail: true }, take: 1 }
                            }
                        }
                    }
                }
            }
        });

        const activePromotions = await require('../../../utils/promotion-helper').getActivePromotions();
        const calculateBestPrice = require('../../../utils/promotion-helper').calculateBestPrice;

        const wishlistProducts = customer.wishlist.map(item => ({
            ...item.product,
            ...calculateBestPrice(item.product, activePromotions)
        }));

        res.render('public/profile/wishlist', {
            title: 'Sản phẩm yêu thích',
            products: wishlistProducts,
            layout: 'layouts/main'
        });
    } catch (error) {
        next(error);
    }
};
