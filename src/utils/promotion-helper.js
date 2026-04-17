const db = require('../config/db');

/**
 * Promotion Helper
 * Logic for calculating the best price for a product based on current promotions.
 */

/**
 * Fetches all currently active and valid promotions.
 */
const getActivePromotions = async () => {
    const now = new Date();
    return await db.promotionCampaign.findMany({
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
};

/**
 * Calculates the best possible price and discount percentage for a product.
 * @param {Object} product - Product object from Prisma (must include price, sale_price)
 * @param {Array} activePromotions - List of active PromotionCampaign objects
 * @returns {Object} { originalPrice, bestPrice, discountPercent, discountAmount, promoName }
 */
const calculateBestPrice = (product, activePromotions = []) => {
    const originalPrice = parseFloat(product.price);
    let bestPrice = product.sale_price ? parseFloat(product.sale_price) : originalPrice;
    let promoName = product.sale_price ? 'Giá khuyến mãi' : null;
    let discountAmount = originalPrice - bestPrice;
    let isFlashSaleActive = false;

    // --- Check Flash Sale (highest priority if active and not expired) ---
    if (product.is_flash_sale && product.flash_sale_price) {
        const now = new Date();
        const flashSaleEnd = product.flash_sale_end ? new Date(product.flash_sale_end) : null;
        const isFlashSaleValid = !flashSaleEnd || flashSaleEnd > now;

        if (isFlashSaleValid) {
            const flashPrice = parseFloat(product.flash_sale_price);
            if (flashPrice < bestPrice) {
                bestPrice = flashPrice;
                discountAmount = originalPrice - flashPrice;
                promoName = 'Flash Sale';
                isFlashSaleActive = true;
            }
        }
    }

    // --- Filter promotions that apply to this product ---
    // Only apply promotion if flash sale is NOT already the best price
    if (!isFlashSaleActive) {
        const applicablePromotions = activePromotions.filter(promo => {
            // Only consider promotions that are "auto" apply (system shows them on product listing)
            // If it's manual, we don't necessarily show it on the product card price yet.
            if (promo.apply_type !== 'auto') return false;

            if (promo.target_type === 'all') return true;
            
            if (promo.target_type === 'category') {
                return promo.categories && promo.categories.some(pc => pc.category_id === product.category_id);
            }

            if (promo.target_type === 'product') {
                return promo.products && promo.products.some(pp => pp.product_id === product.id);
            }

            return false;
        });

        // Calculate price for each applicable promotion and find the best one
        applicablePromotions.forEach(promo => {
            let currentPromoPrice = originalPrice;
            let currentDiscount = 0;

            if (promo.type === 'percent') {
                currentDiscount = (originalPrice * parseFloat(promo.value)) / 100;
                // Cap by max_discount_value if exists
                if (promo.max_discount_value && currentDiscount > parseFloat(promo.max_discount_value)) {
                    currentDiscount = parseFloat(promo.max_discount_value);
                }
            } else if (promo.type === 'amount') {
                currentDiscount = parseFloat(promo.value);
            }

            currentPromoPrice = originalPrice - currentDiscount;

            if (currentPromoPrice < bestPrice) {
                bestPrice = currentPromoPrice;
                discountAmount = currentDiscount;
                promoName = promo.name;
            }
        });
    }

    // Keep it non-negative
    if (bestPrice < 0) bestPrice = 0;

    const discountPercent = originalPrice > 0 ? Math.round((originalPrice - bestPrice) / originalPrice * 100) : 0;

    return {
        originalPrice,
        bestPrice,
        discountPercent,
        discountAmount,
        promoName,
        isDiscounted: bestPrice < originalPrice,
        isFlashSale: isFlashSaleActive
    };
};

module.exports = {
    calculateBestPrice,
    getActivePromotions
};
