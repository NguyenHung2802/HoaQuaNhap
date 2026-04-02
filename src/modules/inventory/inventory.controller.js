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

        res.render('admin/inventory/index', {
            title: 'Lịch sử kho hàng',
            logs,
            total,
            totalPages,
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
