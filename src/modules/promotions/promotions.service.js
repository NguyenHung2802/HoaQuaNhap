const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get all promotions with pagination
 */
const getAllPromotions = async (page = 1, limit = 10) => {
    const skip = (page - 1) * limit;
    const [promotions, total] = await Promise.all([
        prisma.promotionCampaign.findMany({
            orderBy: { created_at: 'desc' },
            skip,
            take: limit,
            include: {
                _count: {
                    select: { products: true, categories: true }
                }
            }
        }),
        prisma.promotionCampaign.count()
    ]);

    return {
        promotions,
        total,
        page,
        totalPages: Math.ceil(total / limit)
    };
};

/**
 * Get promotion by ID with target relations
 */
const getPromotionById = async (id) => {
    return await prisma.promotionCampaign.findUnique({
        where: { id: parseInt(id) },
        include: {
            categories: { include: { category: true } },
            products: { include: { product: true } }
        }
    });
};

/**
 * Create new promotion
 */
const createPromotion = async (data) => {
    const { 
        name, description, type, value, min_order_value, 
        max_discount_value, apply_type, target_type, 
        start_at, end_at, is_active,
        category_ids, product_ids 
    } = data;

    return await prisma.$transaction(async (tx) => {
        // 1. Create Campaign
        const promotion = await tx.promotionCampaign.create({
            data: {
                name,
                description,
                type,
                value: parseFloat(value),
                min_order_value: min_order_value ? parseFloat(min_order_value) : null,
                max_discount_value: max_discount_value ? parseFloat(max_discount_value) : null,
                apply_type: apply_type || 'auto',
                target_type: target_type || 'all',
                start_at: start_at ? new Date(start_at) : null,
                end_at: end_at ? new Date(end_at) : null,
                is_active: is_active === 'true' || is_active === true
            }
        });

        // 2. Add Category targets
        if (target_type === 'category' && category_ids) {
            const ids = Array.isArray(category_ids) ? category_ids : [category_ids];
            await tx.promotionCategory.createMany({
                data: ids.map(cid => ({
                    promotion_id: promotion.id,
                    category_id: parseInt(cid)
                }))
            });
        }

        // 3. Add Product targets
        if (target_type === 'product' && product_ids) {
            const ids = Array.isArray(product_ids) ? product_ids : [product_ids];
            await tx.promotionProduct.createMany({
                data: ids.map(pid => ({
                    promotion_id: promotion.id,
                    product_id: parseInt(pid)
                }))
            });
        }

        return promotion;
    });
};

/**
 * Update promotion
 */
const updatePromotion = async (id, data) => {
    const { 
        name, description, type, value, min_order_value, 
        max_discount_value, apply_type, target_type, 
        start_at, end_at, is_active,
        category_ids, product_ids 
    } = data;

    return await prisma.$transaction(async (tx) => {
        // 1. Update Campaign
        const promotion = await tx.promotionCampaign.update({
            where: { id: parseInt(id) },
            data: {
                name,
                description,
                type,
                value: parseFloat(value),
                min_order_value: min_order_value ? parseFloat(min_order_value) : null,
                max_discount_value: max_discount_value ? parseFloat(max_discount_value) : null,
                apply_type: apply_type || 'auto',
                target_type: target_type || 'all',
                start_at: start_at ? new Date(start_at) : null,
                end_at: end_at ? new Date(end_at) : null,
                is_active: is_active === 'true' || is_active === true
            }
        });

        // 2. Refresh target relations
        await tx.promotionCategory.deleteMany({ where: { promotion_id: promotion.id } });
        await tx.promotionProduct.deleteMany({ where: { promotion_id: promotion.id } });

        if (target_type === 'category' && category_ids) {
            const ids = Array.isArray(category_ids) ? category_ids : [category_ids];
            await tx.promotionCategory.createMany({
                data: ids.map(cid => ({
                    promotion_id: promotion.id,
                    category_id: parseInt(cid)
                }))
            });
        }

        if (target_type === 'product' && product_ids) {
            const ids = Array.isArray(product_ids) ? product_ids : [product_ids];
            await tx.promotionProduct.createMany({
                data: ids.map(pid => ({
                    promotion_id: promotion.id,
                    product_id: parseInt(pid)
                }))
            });
        }

        return promotion;
    });
};

/**
 * Delete promotion
 */
const deletePromotion = async (id) => {
    return await prisma.promotionCampaign.delete({
        where: { id: parseInt(id) }
    });
};

/**
 * PUBLIC: Get valid promotions for current cart
 */
const getAvailablePromotions = async (cartItems) => {
    const now = new Date();
    const promotions = await prisma.promotionCampaign.findMany({
        where: {
            is_active: true,
            AND: [
                { OR: [{ start_at: null }, { start_at: { lte: now } }] },
                { OR: [{ end_at: null }, { end_at: { gte: now } }] }
            ]
        },
        include: {
            categories: true,
            products: true
        }
    });

    // cartItems có cấu trúc: { product_id, price, quantity, category_id, line_total, ... }
    const totalAmount = cartItems.reduce((sum, item) => sum + item.line_total, 0);
    const available = [];

    for (const promo of promotions) {
        let isEligible = false;
        let eligibleAmount = 0;

        if (promo.target_type === 'all') {
            eligibleAmount = totalAmount;
            if (eligibleAmount >= (promo.min_order_value || 0)) {
                isEligible = true;
            }
        } else if (promo.target_type === 'category') {
            const allowedCategoryIds = promo.categories.map(c => c.category_id);
            eligibleAmount = cartItems
                .filter(item => allowedCategoryIds.includes(item.category_id))
                .reduce((sum, item) => sum + item.line_total, 0);
            
            if (eligibleAmount > 0 && eligibleAmount >= (promo.min_order_value || 0)) {
                isEligible = true;
            }
        } else if (promo.target_type === 'product') {
            const allowedProductIds = promo.products.map(p => p.product_id);
            eligibleAmount = cartItems
                .filter(item => allowedProductIds.includes(item.product_id))
                .reduce((sum, item) => sum + item.line_total, 0);

            if (eligibleAmount > 0 && eligibleAmount >= (promo.min_order_value || 0)) {
                isEligible = true;
            }
        }

        if (isEligible) {
            let discount = 0;
            if (promo.type === 'percent') {
                discount = eligibleAmount * (parseFloat(promo.value) / 100);
                if (promo.max_discount_value && discount > parseFloat(promo.max_discount_value)) {
                    discount = parseFloat(promo.max_discount_value);
                }
            } else {
                discount = parseFloat(promo.value);
            }

            available.push({
                ...promo,
                estimatedDiscount: Math.round(discount)
            });
        }
    }

    return available;
};

module.exports = {
    getAllPromotions,
    getPromotionById,
    createPromotion,
    updatePromotion,
    deletePromotion,
    getAvailablePromotions
};
