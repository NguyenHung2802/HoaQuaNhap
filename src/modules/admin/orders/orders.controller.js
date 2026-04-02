const db = require('../../../config/db');

/**
 * Danh sách đơn hàng trong Admin
 */
exports.index = async (req, res) => {
    try {
        const orders = await db.order.findMany({
            include: {
                customer: {
                    include: {
                        user: true
                    }
                }
            },
            orderBy: {
                created_at: 'desc'
            }
        });

        res.render('admin/orders/index', {
            title: 'Quản lý Đơn hàng',
            orders,
            layout: 'layouts/admin' // Layout admin
        });
    } catch (error) {
        console.error('Order admin list error:', error);
        req.flash('error_msg', 'Không thể lấy danh sách đơn hàng.');
        res.redirect('/admin');
    }
};

/**
 * Chi tiết đơn hàng
 */
exports.detail = async (req, res) => {
    const { id } = req.params;

    try {
        const order = await db.order.findUnique({
            where: { id: parseInt(id) },
            include: {
                customer: {
                    include: {
                        user: true
                    }
                },
                items: true
            }
        });

        if (!order) {
            req.flash('error_msg', 'Đơn hàng không tồn tại.');
            return res.redirect('/admin/orders');
        }

        res.render('admin/orders/detail', {
            title: 'Chi tiết Đơn hàng #' + order.order_code,
            order,
            layout: 'layouts/admin'
        });
    } catch (error) {
        console.error('Order admin detail error:', error);
        req.flash('error_msg', 'Lỗi khi lấy thông tin đơn hàng.');
        res.redirect('/admin/orders');
    }
};
