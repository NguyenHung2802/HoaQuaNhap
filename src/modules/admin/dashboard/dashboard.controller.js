const db = require('../../../config/db');

/**
 * Hiển thị Dashboard Admin
 */
exports.renderDashboard = async (req, res, next) => {
    try {
        // 1. Summary Statistics
        const [
            productCount,
            categoryCount,
            totalOrders,
            totalCustomers,
            pendingOrdersCount,
            completedOrders
        ] = await Promise.all([
            db.product.count(),
            db.category.count(),
            db.order.count(),
            db.customer.count(),
            db.order.count({ where: { order_status: 'pending' } }),
            db.order.findMany({
                where: { order_status: 'completed' },
                select: { total_amount: true }
            })
        ]);

        const totalRevenue = completedOrders.reduce((sum, order) => sum + parseFloat(order.total_amount), 0);

        // 2. Low Stock Alerts
        const lowStockProducts = await db.product.findMany({
            where: { stock_quantity: { lte: db.product.fields.min_stock_alert } },
            take: 5,
            orderBy: { stock_quantity: 'asc' },
            include: { category: true }
        });

        // 3. Best Sellers (Based on completed order items quantity)
        // Using OrderItem joined with completed orders
        const bestSellersData = await db.orderItem.groupBy({
            by: ['product_id', 'product_name_snapshot'],
            _sum: { quantity: true },
            where: {
                order: { order_status: 'completed' }
            },
            orderBy: {
                _sum: { quantity: 'desc' }
            },
            take: 5
        });

        // 4. Revenue Trend (7 days)
        const sevenDaysAgo = new Date();
        sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 6);
        sevenDaysAgo.setHours(0, 0, 0, 0);

        const dailyRevenueRaw = await db.order.findMany({
            where: {
                order_status: 'completed',
                created_at: { gte: sevenDaysAgo }
            },
            select: {
                created_at: true,
                total_amount: true
            }
        });

        // Format chart data
        const chartLabels = [];
        const chartData = [];
        for (let i = 0; i < 7; i++) {
            const d = new Date();
            d.setDate(d.getDate() - (6 - i));
            const dateStr = d.toLocaleDateString('vi-VN', { day: '2-digit', month: '2-digit' });
            chartLabels.push(dateStr);

            const dayRevenue = dailyRevenueRaw
                .filter(o => new Date(o.created_at).toDateString() === d.toDateString())
                .reduce((sum, o) => sum + parseFloat(o.total_amount), 0);
            chartData.push(dayRevenue);
        }

        res.render('admin/dashboard/index', {
            title: 'Bảng điều khiển',
            layout: 'layouts/admin',
            stats: {
                products: productCount,
                categories: categoryCount,
                orders: totalOrders,
                customers: totalCustomers,
                pendingOrders: pendingOrdersCount,
                revenue: totalRevenue
            },
            lowStockProducts,
            bestSellers: bestSellersData,
            chartLabels,
            chartData
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
