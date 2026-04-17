const cartService = require('./cart.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateBestPrice, getActivePromotions } = require('../../../utils/promotion-helper');

const buildShippingPromotion = (campaign, totalAmount) => {
    if (!campaign || !campaign.min_order_value || parseFloat(campaign.min_order_value) <= 0) {
        return null;
    }

    const threshold = parseFloat(campaign.min_order_value);
    const discountValue = parseFloat(campaign.value || 0);
    const amountNeeded = Math.max(0, threshold - totalAmount);
    const progress = threshold > 0 ? Math.min(100, Math.round((totalAmount / threshold) * 100)) : 100;
    const reached = totalAmount >= threshold;
    const isFreeShipping = campaign.type === 'percent' && discountValue >= 100;

    let benefitLabel = 'ưu đãi phí vận chuyển';
    if (campaign.type === 'amount') {
        benefitLabel = `giảm ${Math.round(discountValue).toLocaleString('vi-VN')}đ phí ship`;
    } else if (isFreeShipping) {
        benefitLabel = 'miễn phí giao hàng';
    } else {
        benefitLabel = `giảm ${discountValue}% phí ship`;
    }

    return {
        id: campaign.id,
        campaignName: campaign.name,
        campaignType: campaign.type,
        discountValue,
        threshold,
        amountNeeded,
        progress,
        reached,
        isFreeShipping,
        benefitLabel,
        unlockedMessage: `Đơn hàng của bạn đã đạt ưu đãi ${benefitLabel}!`,
        pendingMessage: `Mua thêm ${Math.round(amountNeeded).toLocaleString('vi-VN')}đ để được ${benefitLabel}`,
        thresholdLabel: `${Math.round(threshold).toLocaleString('vi-VN')}đ`
    };
};

// Middleware to init cart session if undefined
const initCart = (req, res, next) => {
    if (!req.session.cart) {
        req.session.cart = [];
    }
    next();
};

/**
 * [GET] /cart
 * Render cart page
 */
const renderCart = async (req, res, next) => {
    try {
        const sessionCart = req.session.cart || [];
        const { items, totalAmount } = await cartService.getCartDetails(sessionCart);

        // --- Shipping promotion progress logic ---
        const now = new Date();
        const activeShippingCampaign = await prisma.shippingCampaign.findFirst({
            where: {
                is_active: true,
                OR: [{ start_at: null }, { start_at: { lte: now } }],
                AND: [{ OR: [{ end_at: null }, { end_at: { gte: now } }] }]
            },
            orderBy: { min_order_value: 'asc' }
        });

        const shippingPromotion = buildShippingPromotion(activeShippingCampaign, totalAmount);

        // --- Suggested Products (2 affordable products not in cart) ---
        const cartProductIds = (sessionCart || []).map(i => parseInt(i.product_id));
        let suggestedProducts = [];
        if (items.length > 0) {
            const activePromotions = await getActivePromotions();
            const rawSuggested = await prisma.product.findMany({
                where: {
                    id: { notIn: cartProductIds.length > 0 ? cartProductIds : [0] },
                    status: 'published',
                    stock_quantity: { gt: 0 }
                },
                include: {
                    images: { where: { is_thumbnail: true }, take: 1 }
                },
                orderBy: { price: 'asc' },
                take: 10
            });

            // Shuffle and pick 2
            const shuffled = rawSuggested.sort(() => Math.random() - 0.5);
            suggestedProducts = shuffled.slice(0, 2).map(p => ({
                ...p,
                ...calculateBestPrice(p, activePromotions)
            }));
        }

        res.render('public/cart/index', {
            title: 'Giỏ hàng',
            items,
            totalAmount,
            cartItemsCount: items.reduce((sum, i) => sum + i.quantity, 0),
            shippingPromotion,
            suggestedProducts,
            layout: 'layouts/main'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /cart/count
 * Return total quantity in cart for header badge
 */
const getCartCount = (req, res) => {
    const sessionCart = req.session.cart || [];
    const count = sessionCart.reduce((total, item) => total + parseInt(item.quantity), 0);
    res.json({ success: true, count });
};

/**
 * [POST] /cart/add
 */
const addToCart = (req, res) => {
    try {
        let { product_id, quantity } = req.body;
        product_id = parseInt(product_id);
        quantity = parseInt(quantity) || 1;

        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
        }

        const existingItem = req.session.cart.find(item => parseInt(item.product_id) === product_id);
        if (existingItem) {
            existingItem.quantity += quantity;
        } else {
            req.session.cart.push({ product_id, quantity });
        }

        const count = req.session.cart.reduce((tot, item) => tot + parseInt(item.quantity), 0);
        res.json({ success: true, message: 'Thêm vào giỏ hàng thành công', count });
    } catch (error) {
        console.error('Add to cart error:', error);
        res.status(500).json({ success: false, message: 'Lỗi server khi thêm vào giỏ' });
    }
};

/**
 * [POST] /cart/update
 */
const updateCart = (req, res) => {
    try {
        let { product_id, quantity } = req.body;
        product_id = parseInt(product_id);
        quantity = parseInt(quantity);

        if (!product_id || isNaN(quantity)) {
            return res.status(400).json({ success: false, message: 'Thông tin không hợp lệ' });
        }

        if (quantity <= 0) {
            // Remove item
            req.session.cart = req.session.cart.filter(item => parseInt(item.product_id) !== product_id);
        } else {
            // Update quantity
            const existingItem = req.session.cart.find(item => parseInt(item.product_id) === product_id);
            if (existingItem) {
                existingItem.quantity = quantity;
            }
        }

        const count = req.session.cart.reduce((tot, item) => tot + parseInt(item.quantity), 0);
        res.json({ success: true, message: 'Cập nhật giỏ hàng thành công', count });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi cập nhật giỏ' });
    }
};

/**
 * [POST] /cart/remove
 */
const removeFromCart = (req, res) => {
    try {
        let { product_id } = req.body;
        product_id = parseInt(product_id);

        if (!product_id) {
            return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
        }

        req.session.cart = req.session.cart.filter(item => parseInt(item.product_id) !== product_id);
        const count = req.session.cart.reduce((tot, item) => tot + parseInt(item.quantity), 0);
        
        res.json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ', count });
    } catch (error) {
        res.status(500).json({ success: false, message: 'Lỗi server khi xóa sản phẩm' });
    }
};

module.exports = {
    initCart,
    renderCart,
    getCartCount,
    addToCart,
    updateCart,
    removeFromCart
};
