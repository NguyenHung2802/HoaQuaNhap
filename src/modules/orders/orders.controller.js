const ordersService = require('./orders.service');

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

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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

        const orders = await prisma.order.findMany({
            where: {
                OR: [
                    { customer: { user_id: user.id } },
                    { customer_phone: user.phone }
                ]
            },
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
