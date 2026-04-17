const cartService = require('../cart/cart.service');
const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { sendOrderNotificationEmail, sendOrderTelegramNotification } = require('../../../utils/order-notification');
const loyaltyService = require('../../loyalty/loyalty.service');

/**
 * [GET] /checkout
 * Render checkout form
 */
const renderCheckout = async (req, res, next) => {
    try {
        const sessionCart = req.session.cart || [];
        
        // If cart is empty, redirect back to shop
        if (sessionCart.length === 0) {
            req.flash('error_msg', 'Giỏ hàng của bạn đang trống. Vui lòng chọn sản phẩm trước khi thanh toán.');
            return res.redirect('/cart');
        }

        const { items, totalAmount } = await cartService.getCartDetails(sessionCart);

        // Fetch available promotions
        const promotionsService = require('../../promotions/promotions.service');
        const availablePromotions = await promotionsService.getAvailablePromotions(items);

        // Check if any item is out of stock, prevent checkout
        const hasErrors = items.some(i => i.is_out_of_stock);
        if (hasErrors) {
            req.flash('error_msg', 'Có sản phẩm không đủ số lượng trong kho, vui lòng kiểm tra lại giỏ hàng!');
            return res.redirect('/cart');
        }

        // ... (customer logic) ...
        let customerInfo = null;
        let loyaltySummary = null;
        if (req.session.user) {
            customerInfo = {
                full_name: req.session.user.full_name,
                email: req.session.user.email,
                phone: req.session.user.phone || ''
            };
            
            const customer = await prisma.customer.findUnique({
                where: { user_id: req.session.user.id },
                include: {
                    addresses: {
                        where: { is_default: true },
                        take: 1
                    }
                }
            });

            if (customer) {
                customerInfo.phone = customer.phone;
                if (customer.addresses.length > 0) {
                    customerInfo.address = customer.addresses[0];
                }
            }

            loyaltySummary = await loyaltyService.getCheckoutLoyaltySummary(req.session.user.id, totalAmount, prisma);
        }

        // Fetch active shipping campaigns
        const shippingCampaigns = await prisma.shippingCampaign.findMany({
            where: {
                is_active: true,
                OR: [{ end_at: null }, { end_at: { gte: new Date() } }]
            },
            orderBy: { min_order_value: 'asc' }
        });

        res.render('public/checkout/index', {
            title: 'Thanh toán đơn hàng',
            items,
            totalAmount,
            availablePromotions,
            shippingCampaigns,
            customerInfo,
            loyaltySummary,
            layout: 'layouts/main'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /checkout/place-order
 */
const placeOrder = async (req, res, next) => {
    try {
        const sessionCart = req.session.cart || [];
        if (sessionCart.length === 0) {
            req.flash('error_msg', 'Giỏ hàng trống hoặc phiên giao dịch đã hết hạn.');
            return res.redirect('/cart');
        }

        const userId = req.session.user ? req.session.user.id : null;
        const checkoutService = require('./checkout.service');
        
        // Process order in a transaction
        const order = await checkoutService.processOrder(req.body, sessionCart, userId);

        if (userId) {
            req.session.user.reward_points = await loyaltyService.getUserRewardPoints(userId, prisma);
        }

        // Clear cart session
        req.session.cart = [];

        // 🔔 Gửi thông báo đơn hàng mới (async, không block)
        // Lấy lại order đầy đủ với items để thông báo
        prisma.order.findUnique({
            where: { id: order.id },
            include: {
                items: {
                    select: { product_name_snapshot: true, quantity: true, price_snapshot: true }
                }
            }
        }).then(fullOrder => {
            if (fullOrder) {
                Promise.allSettled([
                    sendOrderNotificationEmail(fullOrder),
                    sendOrderTelegramNotification(fullOrder)
                ]);
            }
        }).catch(err => console.error('[Notify] Lỗi fetch order để thông báo:', err.message));

        // Flash message
        req.flash('success_msg', 'Đặt hàng thành công!');
        
        // Redirect to success page
        res.redirect(`/checkout/success/${order.order_code}`);
    } catch (error) {
        console.error('Lỗi khi đặt hàng:', error);
        req.flash('error_msg', error.message || 'Đã có lỗi xảy ra trong quá trình đặt hàng. Vui lòng thử lại sau.');
        res.redirect('/checkout');
    }
};

module.exports = {
    renderCheckout,
    placeOrder
};
