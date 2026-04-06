const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * Get revenue statistics by date range
 */
const getRevenueReport = async (startDate, endDate) => {
    // 1. Fetch orders in range with 'completed' or logic status
    // For MVP, we can count all non-cancelled orders as potential revenue, 
    // or only 'completed' orders. Let's take all except 'cancelled'.
    const orders = await prisma.order.findMany({
        where: {
            created_at: {
                gte: new Date(startDate),
                lte: new Date(endDate)
            },
            order_status: { not: 'cancelled' }
        },
        select: {
            total_amount: true,
            discount_amount: true,
            subtotal_amount: true,
            created_at: true
        },
        orderBy: { created_at: 'asc' }
    });

    // 2. Aggregate by day
    const statsByDate = {};
    let totalRevenue = 0;
    let totalDiscount = 0;
    let orderCount = orders.length;

    orders.forEach(order => {
        const dateKey = order.created_at.toISOString().split('T')[0];
        if (!statsByDate[dateKey]) {
            statsByDate[dateKey] = {
                revenue: 0,
                orders: 0
            };
        }
        statsByDate[dateKey].revenue += parseFloat(order.total_amount);
        statsByDate[dateKey].orders += 1;
        
        totalRevenue += parseFloat(order.total_amount);
        totalDiscount += parseFloat(order.discount_amount);
    });

    // 3. Prepare data for Chart.js
    const labels = Object.keys(statsByDate);
    const data = labels.map(label => statsByDate[label].revenue);

    return {
        summary: {
            totalRevenue,
            totalDiscount,
            orderCount
        },
        chartData: {
            labels,
            data
        },
        rawStats: statsByDate
    };
};

/**
 * Get insights: Top customers and slow products
 */
const getInsightsReport = async () => {
    // 1. Top 10 Customers
    const topCustomers = await prisma.customer.findMany({
        orderBy: { total_spent: 'desc' },
        take: 10,
        select: {
            id: true,
            full_name: true,
            phone: true,
            total_orders: true,
            total_spent: true,
            created_at: true
        }
    });

    // 2. Slow moving products (Sold in last 3 months but low quantity)
    // For MVP, simplified: Get products with lowest selling quantity from OrderItems
    const threeMonthsAgo = new Date();
    threeMonthsAgo.setMonth(threeMonthsAgo.getMonth() - 3);

    // Sum quantities from OrderItems
    const orderItems = await prisma.orderItem.groupBy({
        by: ['product_id'],
        _sum: {
          quantity: true
        },
        where: {
            order: {
                created_at: { gte: threeMonthsAgo },
                order_status: { not: 'cancelled' }
            }
        }
    });

    // Create a map of sales
    const salesMap = {};
    orderItems.forEach(item => {
        salesMap[item.product_id] = item._sum.quantity;
    });

    // Fetch all products
    const products = await prisma.product.findMany({
        where: { status: 'published' },
        select: {
            id: true,
            name: true,
            sku: true,
            price: true,
            stock_quantity: true,
            category: { select: { name: true } }
        }
    });

    // Attach sales count
    const productsWithSales = products.map(p => ({
        ...p,
        sales_count: salesMap[p.id] || 0
    }));

    // Slow products: sort by sales_count ASC, filters those not sold at all or very low
    const slowProducts = productsWithSales
        .sort((a, b) => a.sales_count - b.sales_count)
        .slice(0, 10);

    return {
        topCustomers,
        slowProducts
    };
};

module.exports = {
    getRevenueReport,
    getInsightsReport
};
