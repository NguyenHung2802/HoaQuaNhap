const db = require('../../../config/db');

/**
 * Hiển thị Dashboard Admin
 */
exports.renderDashboard = async (req, res, next) => {
    try {
        // Tạm thời lấy số liệu thực tế từ DB để test kết nối
        const productCount = await db.product.count();
        const categoryCount = await db.category.count();
        const orderCount = await db.order.count();
        const customerCount = await db.customer.count();

        res.render('admin/dashboard/index', {
            title: 'Bảng điều khiển',
            layout: 'layouts/admin',
            stats: {
                products: productCount,
                categories: categoryCount,
                orders: orderCount,
                customers: customerCount
            }
        });
    } catch (error) {
        console.error('Admin dashboard error:', error);
        res.render('admin/dashboard/index', {
            title: 'Bảng điều khiển',
            layout: 'layouts/admin',
            stats: { products: 0, categories: 0, orders: 0, customers: 0 }
        });
    }
};
