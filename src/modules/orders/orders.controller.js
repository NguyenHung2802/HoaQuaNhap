const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

const ordersService = require('./orders.service');
const { sendOrderNotificationEmail, sendOrderTelegramNotification } = require('../../utils/order-notification');
const loyaltyService = require('../loyalty/loyalty.service');

/**
 * Xử lý đặt hàng nhanh cho Guest
 */
exports.quickCheckout = async (req, res) => {
    const { full_name, phone, product_id, quantity } = req.body;

    try {
        if (!full_name || !phone || !product_id) {
            req.flash('error_msg', 'Vui lòng nhập đầy đủ tên và số điện thoại.');
            return res.redirect('back');
        }

        const order = await ordersService.createQuickOrder({ 
            full_name, phone, product_id, quantity: parseInt(quantity) || 1 
        });

        // 🔔 Gửi thông báo đơn hàng nhanh (async, không block)
        prisma.order.findUnique({
            where: { id: order.id },
            include: { items: { select: { product_name_snapshot: true, quantity: true, price_snapshot: true } } }
        }).then(fullOrder => {
            if (fullOrder) {
                Promise.allSettled([
                    sendOrderNotificationEmail(fullOrder),
                    sendOrderTelegramNotification(fullOrder)
                ]);
            }
        }).catch(err => console.error('[Notify] Lỗi quick checkout notify:', err.message));

        req.flash('success_msg', 'Đặt hàng thành công! Đội ngũ tư vấn sẽ liên hệ với bạn trong vòng 15 phút.');
        res.redirect(`/checkout/success/${order.order_code}`);
    } catch (error) {
        console.error('Quick Checkout Error:', error.message);
        req.flash('error_msg', error.message || 'Có lỗi xảy ra khi đặt hàng.');
        res.redirect('back');
    }
};

/**
 * Render trang cảm ơn / thành công
 */
exports.renderSuccess = async (req, res) => {
    const { orderCode } = req.params;
    
    try {
        const order = await prisma.order.findUnique({
            where: { order_code: orderCode },
            include: { items: true }
        });

        if (!order) {
            return res.redirect('/');
        }

        // Lấy cấu hình ngân hàng từ Settings
        const settings = await prisma.setting.findMany({
            where: { key: { in: ['bank_id', 'bank_account_no', 'bank_account_name'] } }
        });

        const bankConfig = {};
        settings.forEach(s => bankConfig[s.key] = s.value);

        let qrUrl = null;
        let bankDisplayName = 'Ngân hàng (VietinBank)';
        
        if (order.payment_method === 'BANK_TRANSFER' && bankConfig.bank_id && bankConfig.bank_account_no) {
            const amount = parseInt(order.total_amount);
            const addInfo = encodeURIComponent(order.order_code);
            const accountName = encodeURIComponent(bankConfig.bank_account_name || 'WEBHOAQUA');
            qrUrl = `https://img.vietqr.io/image/${bankConfig.bank_id}-${bankConfig.bank_account_no}-compact.png?amount=${amount}&addInfo=${addInfo}&accountName=${accountName}`;
            
            // Map common BINs to names for better UI
            const bankMaps = { '970415': 'VietinBank', '970405': 'Agribank', '970436': 'Vietcombank', '970418': 'BIDV' };
            bankDisplayName = bankMaps[bankConfig.bank_id] || bankConfig.bank_id;
        }

        res.render('public/checkout/success', {
            title: 'Đặt hàng thành công',
            layout: 'layouts/main',
            order,
            qrUrl,
            bankConfig,
            bankDisplayName
        });
    } catch (error) {
        console.error('Render Success Error:', error);
        res.redirect('/');
    }
};

/**
 * Render trang danh sách đơn hàng của khách hàng (Frontend)
 */
exports.renderMyOrders = async (req, res, next) => {
    try {
        const user = req.session.user;
        if (!user) {
            req.flash('error_msg', 'Vui lòng đăng nhập để xem đơn hàng.');
            return res.redirect('/auth/login?redirect=/orders');
        }

        const orConditions = [{ customer: { user_id: user.id } }];
        if (user.phone) {
            orConditions.push({ customer_phone: user.phone });
        }

        const orders = await prisma.order.findMany({
            where: { OR: orConditions },
            include: {
                items: {
                    include: {
                        product: {
                            select: {
                                images: { take: 1, select: { image_url: true } }
                            }
                        }
                    }
                }
            },
            orderBy: { created_at: 'desc' }
        });

        res.render('public/orders/index', {
            title: 'Đơn hàng của tôi',
            orders,
            layout: 'layouts/main'
        });
    } catch (e) {
        console.error('Lỗi khi tải lịch sử đơn hàng:', e);
        next(e);
    }
};

/**
 * [GET] /track-order
 * Render trang tra cứu đơn hàng cho Guest
 */
exports.renderTrackOrder = (req, res) => {
    res.render('public/orders/track-order', {
        title: 'Tra cứu đơn hàng',
        layout: 'layouts/main',
        orders: [],
        error: null,
        queryData: {}
    });
};

/**
 * [POST] /track-order
 * Xử lý tra cứu đơn hàng theo sđt HOẶC mã đơn
 */
exports.processTrackOrder = async (req, res) => {
    try {
        const { phone, order_code } = req.body;

        if (!phone && !order_code) {
            return res.render('public/orders/track-order', {
                title: 'Tra cứu đơn hàng',
                layout: 'layouts/main',
                orders: [],
                error: 'Vui lòng nhập Mã đơn hàng hoặc Số điện thoại.',
                queryData: { phone, order_code }
            });
        }

        const cleanPhone = phone ? phone.trim() : '';
        const cleanCode = order_code ? order_code.trim() : '';

        let orders = [];

        if (cleanCode) { // Có mã đơn hàng, ưu tiên mã đơn hàng
            const order = await prisma.order.findFirst({
                where: { order_code: { equals: cleanCode, mode: 'insensitive' } },
                include: { items: { include: { product: { select: { images: { take: 1, select: { image_url: true } } } } } } }
            });
            if (order) orders = [order];
        } else if (cleanPhone) { // Chỉ có SĐT
            orders = await prisma.order.findMany({
                where: {
                    OR: [
                        { customer_phone: { contains: cleanPhone } },
                        { receiver_phone: { contains: cleanPhone } }
                    ]
                },
                include: { items: { include: { product: { select: { images: { take: 1, select: { image_url: true } } } } } } },
                orderBy: { created_at: 'desc' },
                take: 50 // Ngăn việc tải quá nhiều đơn cũ gây chậm query
            });
        }

        if (orders.length === 0) {
            return res.render('public/orders/track-order', {
                title: 'Tra cứu đơn hàng',
                layout: 'layouts/main',
                orders: [],
                error: 'Không tìm thấy đơn hàng! Vui lòng kiểm tra lại thông tin đã nhập.',
                queryData: { phone, order_code }
            });
        }

        res.render('public/orders/track-order', {
            title: 'Kết quả tra cứu đơn hàng',
            layout: 'layouts/main',
            orders,
            error: null,
            queryData: { phone, order_code }
        });
    } catch (e) {
        console.error('Lỗi khi tra cứu đơn hàng:', e);
        res.render('public/orders/track-order', {
            title: 'Tra cứu đơn hàng',
            layout: 'layouts/main',
            orders: [],
            error: 'Đã xảy ra lỗi hệ thống. Vui lòng thử lại sau ít phút.',
            queryData: req.body
        });
    }
};
