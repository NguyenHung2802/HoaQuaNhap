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
exports.renderSuccess = (req, res) => {
    const { orderCode } = req.params;
    res.render('public/checkout/success', {
        title: 'Đặt hàng thành công',
        orderCode
    });
};
