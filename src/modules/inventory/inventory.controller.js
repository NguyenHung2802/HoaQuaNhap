const inventoryService = require('./inventory.service');

/**
 * [GET] /admin/inventory
 * Render inventory logs
 */
const renderLog = async (req, res, next) => {
    try {
        const { page = 1 } = req.query;
        const { logs, total, totalPages } = await inventoryService.getLogs({
            page: parseInt(page),
            limit: 20
        });

        // Fetch current stock for all products to show in an overview
        const { PrismaClient } = require('@prisma/client');
        const prisma = new PrismaClient();
        const productsStock = await prisma.product.findMany({
            select: {
                id: true,
                name: true,
                sku: true,
                stock_quantity: true,
                min_stock_alert: true,
                unit: true,
                category: { select: { name: true } }
            },
            orderBy: { stock_quantity: 'asc' }
        });

        res.render('admin/inventory/index', {
            title: 'Quản lý kho hàng',
            logs,
            total,
            totalPages,
            productsStock,
            currentPage: parseInt(page),
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    renderLog
};
