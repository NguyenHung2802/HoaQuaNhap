const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { calculateBestPrice, getActivePromotions } = require('../../../utils/promotion-helper');

/**
 * Generate unique order code: WHQ-YYMMDD-XXXX
 */
const generateOrderCode = () => {
    const date = new Date();
    const yy = String(date.getFullYear()).slice(-2);
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const random = Math.random().toString(36).substring(2, 6).toUpperCase();
    return `WHQ-${yy}${mm}${dd}-${random}`;
};

/**
 * Process order with Prisma transaction
 */
const processOrder = async (orderData, sessionCart, userId) => {
    return await prisma.$transaction(async (tx) => {
        // 1. Fetch current products to check stock and prices
        const productIds = sessionCart.map(item => parseInt(item.product_id));
        const products = await tx.product.findMany({
            where: { id: { in: productIds } }
        });

        // 1.1 Restriction: Only Hà Nội
        const province = (orderData.province || '').toLowerCase();
        if (!province.includes('hà nội')) {
            throw new Error('Hiện tại hệ thống chỉ hỗ trợ giao hàng tại khu vực Hà Nội. Vui lòng chọn địa chỉ tại Hà nội để tiếp tục.');
        }

        // 1.1 Re-evaluate Coupon if provided
        let couponDiscountAmount = 0;
        let appliedCoupon = null;
        // 1.2 Re-evaluate Promotion if provided
        let promotionDiscountAmount = 0;
        let appliedPromotion = null;
        
        // If promotion_id is passed (selection by radio button)
        if (orderData.promotion_id) {
            const promo = await tx.promotionCampaign.findUnique({
                where: { id: parseInt(orderData.promotion_id) },
                include: { categories: true, products: true }
            });

            if (promo && promo.is_active) {
                const now = new Date();
                const isStarted = !promo.start_at || new Date(promo.start_at) <= now;
                const isNotExpired = !promo.end_at || new Date(promo.end_at) >= now;

                if (isStarted && isNotExpired) {
                    appliedPromotion = promo;
                }
            }
        }
        
        // --- Try to find coupon or campaign by input code ---
        if (orderData.coupon_code) {
            const code = orderData.coupon_code;
            const coupon = await tx.coupon.findUnique({
                where: { code: code.toUpperCase() }
            });

            if (coupon && coupon.is_active) {
                const now = new Date();
                const isStarted = !coupon.start_at || new Date(coupon.start_at) <= now;
                const isNotExpired = !coupon.end_at || new Date(coupon.end_at) >= now;
                const hasUsage = !coupon.usage_limit || coupon.used_count < coupon.usage_limit;

                if (isStarted && isNotExpired && hasUsage) {
                    appliedCoupon = coupon;
                }
            }
            
            // If it wasn't a coupon, maybe it was a promotion name?
            if (!appliedCoupon) {
                const campaigns = await tx.promotionCampaign.findMany({
                    where: { is_active: true, apply_type: 'manual' },
                    include: { categories: true, products: true }
                });
                
                const slugify = (text) => {
                    return text.toString().toLowerCase()
                        .replace(/á|à|ả|ã|ạ|ă|ắ|ằ|ẳ|ẵ|ặ|â|ấ|ầ|ẩ|ẫ|ậ/g, 'a')
                        .replace(/é|è|ẻ|ẽ|ẹ|ê|ế|ề|ể|ễ|ệ/g, 'e')
                        .replace(/i|í|ì|ỉ|ĩ|ị/g, 'i')
                        .replace(/ó|ò|ỏ|õ|ọ|ô|ố|ồ|ổ|ỗ|ộ|ơ|ớ|ờ|ở|ỡ|ợ/g, 'o')
                        .replace(/ú|ù|ủ|ũ|ụ|ư|ứ|ừ|ử|ữ|ự/g, 'u')
                        .replace(/ý|ỳ|ỷ|ỹ|ỵ/g, 'y')
                        .replace(/đ/g, 'd')
                        .replace(/\s+/g, '')
                        .replace(/[^\w-]+/g, '');
                };

                const searchCode = slugify(code);
                const foundPromo = campaigns.find(p => slugify(p.name) === searchCode);
                
                // If it matched a campaign name AND no campaign was already selected by radio buttons
                if (foundPromo && !appliedPromotion) {
                    const now = new Date();
                    const isStarted = !foundPromo.start_at || new Date(foundPromo.start_at) <= now;
                    const isNotExpired = !foundPromo.end_at || new Date(foundPromo.end_at) >= now;
                    if (isStarted && isNotExpired) {
                        appliedPromotion = foundPromo;
                    }
                }
            }
        }

        const orderItemsParams = [];
        let subtotalAmount = 0;
        let promoEligibleAmount = 0;
        const activePromotions = await getActivePromotions();

        for (const cartItem of sessionCart) {
            const product = products.find(p => p.id === parseInt(cartItem.product_id));
            if (!product) throw new Error(`Sản phẩm không tồn tại (ID: ${cartItem.product_id})`);
            if (product.status !== 'published') throw new Error(`Sản phẩm ${product.name} đang ngừng bán.`);
            if (product.stock_quantity < cartItem.quantity) throw new Error(`Sản phẩm ${product.name} không đủ tồn kho.`);

            const pricing = calculateBestPrice(product, activePromotions);
            const activePrice = pricing.bestPrice;
            const lineTotal = activePrice * cartItem.quantity;
            subtotalAmount += lineTotal;

            // Check eligibility for Promotion
            if (appliedPromotion) {
                let isItemEligible = false;
                if (appliedPromotion.target_type === 'all') {
                    isItemEligible = true;
                } else if (appliedPromotion.target_type === 'category') {
                    const allowedCatIds = appliedPromotion.categories.map(c => c.category_id);
                    if (allowedCatIds.includes(product.category_id)) isItemEligible = true;
                } else if (appliedPromotion.target_type === 'product') {
                    const allowedProdIds = appliedPromotion.products.map(p => p.product_id);
                    if (allowedProdIds.includes(product.id)) isItemEligible = true;
                }
                if (isItemEligible) promoEligibleAmount += lineTotal;
            }

            orderItemsParams.push({
                product_id: product.id,
                product_name_snapshot: product.name,
                sku_snapshot: product.sku,
                price_snapshot: activePrice,
                quantity: parseInt(cartItem.quantity),
                line_total: lineTotal
            });
        }

        // 2. Finalize Discounts
        // Coupon discount
        if (appliedCoupon) {
            if (appliedCoupon.min_order_value && subtotalAmount < parseFloat(appliedCoupon.min_order_value)) {
                appliedCoupon = null;
            } else {
                if (appliedCoupon.type === 'percent') {
                    couponDiscountAmount = (subtotalAmount * parseFloat(appliedCoupon.value)) / 100;
                    if (appliedCoupon.max_discount_value && couponDiscountAmount > parseFloat(appliedCoupon.max_discount_value)) {
                        couponDiscountAmount = parseFloat(appliedCoupon.max_discount_value);
                    }
                } else {
                    couponDiscountAmount = parseFloat(appliedCoupon.value);
                }
            }
        }

        // Promotion discount
        if (appliedPromotion) {
            if (promoEligibleAmount >= (appliedPromotion.min_order_value || 0)) {
                if (appliedPromotion.type === 'percent') {
                    promotionDiscountAmount = promoEligibleAmount * (parseFloat(appliedPromotion.value) / 100);
                    if (appliedPromotion.max_discount_value && promotionDiscountAmount > parseFloat(appliedPromotion.max_discount_value)) {
                        promotionDiscountAmount = parseFloat(appliedPromotion.max_discount_value);
                    }
                } else {
                    promotionDiscountAmount = parseFloat(appliedPromotion.value);
                }
            } else {
                appliedPromotion = null;
            }
        }

        const totalDiscount = Math.round(couponDiscountAmount + promotionDiscountAmount);
        
        // --- NEW: Shipping Logic (Manual Handling) ---
        let baseShippingFee = 0; // Luôn để 0 vì xử lý thủ công sau
        
        // Tìm khuyến mãi vận chuyển (Shipping Campaign) để ghi chú
        const shippingPromos = await tx.shippingCampaign.findMany({
            where: {
                is_active: true,
                min_order_value: { lte: subtotalAmount },
                OR: [
                    { start_at: null },
                    { start_at: { lte: new Date() } }
                ],
                AND: [
                    { OR: [{ end_at: null }, { end_at: { gte: new Date() } }] }
                ]
            },
            orderBy: { value: 'desc' }
        });

        let appliedShippingPromo = null;
        let shippingDiscount = 0;
        if (shippingPromos.length > 0) {
            appliedShippingPromo = shippingPromos[0];
            if (appliedShippingPromo.type === 'percent') {
                shippingDiscount = parseFloat(appliedShippingPromo.value); // Lưu % hoặc số tiền để admin biết
            } else {
                shippingDiscount = parseFloat(appliedShippingPromo.value);
            }
        }

        // TỔNG TIỀN: Chỉ tính tiền hàng - giảm giá hàng. KHÔNG TÍNH SHIP.
        const finalTotal = Math.max(0, subtotalAmount - totalDiscount);

        // ... (resolve customer logic) ...
        let customerId = null;
        if (userId) {
            let customer = await tx.customer.findUnique({ where: { user_id: parseInt(userId) } });
            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        full_name: orderData.customer_name,
                        phone: orderData.customer_phone,
                        email: orderData.customer_email || null,
                        user_id: parseInt(userId)
                    }
                });
            }
            customerId = customer.id;
        } else {
            let customer = await tx.customer.findUnique({ where: { phone: orderData.customer_phone } });
            if (!customer) {
                customer = await tx.customer.create({
                    data: {
                        full_name: orderData.customer_name,
                        phone: orderData.customer_phone,
                        email: orderData.customer_email || null
                    }
                });
            }
            customerId = customer.id;
        }

        // 4. Create Order
        const orderCode = generateOrderCode();
        const order = await tx.order.create({
            data: {
                order_code: orderCode,
                customer_id: customerId,
                customer_name: orderData.customer_name,
                customer_phone: orderData.customer_phone,
                customer_email: orderData.customer_email || null,
                receiver_name: orderData.receiver_name || orderData.customer_name,
                receiver_phone: orderData.receiver_phone || orderData.customer_phone,
                delivery_address: orderData.delivery_address,
                province: orderData.province,
                district: orderData.district,
                ward: orderData.ward,
                note: orderData.note || null,
                subtotal_amount: subtotalAmount,
                shipping_fee: baseShippingFee,
                shipping_discount_amount: shippingDiscount,
                discount_amount: totalDiscount,
                total_amount: finalTotal,
                payment_method: orderData.payment_method || 'COD',
                payment_status: 'pending',
                order_status: 'pending',
                // ONLY set promotion_id if it's a PromotionCampaign. 
                // Coupons don't have a direct relation in current Order model, they are tracked via discount amount and notes.
                promotion_id: appliedPromotion ? appliedPromotion.id : null, 
                shipping_campaign_id: appliedShippingPromo ? appliedShippingPromo.id : null,
                items: { create: orderItemsParams },
                status_logs: {
                    create: {
                        new_status: 'pending',
                        note: 'Khách đặt đơn.' + 
                               (appliedCoupon ? ` Voucher (Coupon): ${appliedCoupon.code}.` : '') + 
                               (appliedPromotion ? ` Ưu đãi (Promo): ${appliedPromotion.name}.` : '') +
                               (appliedShippingPromo ? ` KM Vận chuyển: ${appliedShippingPromo.name}.` : ''),
                        changed_by: 'system'
                    }
                }
            }
        });

        // 5. Post-order logic (Stock, Coupon count, Customer stats)
        if (appliedCoupon) {
            await tx.coupon.update({
                where: { id: appliedCoupon.id },
                data: { used_count: { increment: 1 } }
            });
        }

        for (const item of orderItemsParams) {
            const product = products.find(p => p.id === item.product_id);
            await tx.product.update({
                where: { id: item.product_id },
                data: { stock_quantity: product.stock_quantity - item.quantity }
            });
            await tx.inventoryLog.create({
                data: {
                    product_id: item.product_id,
                    type: 'order_sub',
                    quantity: item.quantity,
                    before_quantity: product.stock_quantity,
                    after_quantity: product.stock_quantity - item.quantity,
                    reference_type: 'order',
                    reference_id: order.id,
                    note: `Trừ tồn kho khi đặt đơn ${orderCode}`,
                    created_by: 'system'
                }
            });
        }

        await tx.customer.update({
            where: { id: customerId },
            data: { 
                total_orders: { increment: 1 },
                total_spent: { increment: finalTotal }
            }
        });

        return order;
    });
};

module.exports = {
    processOrder,
    generateOrderCode
};
