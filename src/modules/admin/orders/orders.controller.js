const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const loyaltyService = require('../../loyalty/loyalty.service');

/**
 * [GET] /admin/orders
 * Render list of orders with filters and pagination
 */
const renderList = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const skip = (page - 1) * limit;
        const { status, q } = req.query;

        // Build Where Conditions
        const whereCond = {};

        if (status && status !== 'all') {
            whereCond.order_status = status;
        }

        if (q && q.trim() !== '') {
            whereCond.OR = [
                { order_code: { contains: q, mode: 'insensitive' } },
                { customer_phone: { contains: q } },
                { customer_name: { contains: q, mode: 'insensitive' } }
            ];
        }

        const [orders, totalOrders] = await Promise.all([
            prisma.order.findMany({
                where: whereCond,
                orderBy: { created_at: 'desc' },
                skip,
                take: limit,
                include: {
                    customer: {
                        select: { full_name: true, phone: true }
                    }
                }
            }),
            prisma.order.count({ where: whereCond })
        ]);

        const totalPages = Math.ceil(totalOrders / limit);

        res.render('admin/orders/index', {
            title: 'Quản lý Đơn hàng',
            orders,
            currentPage: page,
            totalPages,
            totalRecords: totalOrders,
            filters: { status: status || 'all', q: q || '' },
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/orders/:id
 */
const renderDetail = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.id);
        const order = await prisma.order.findUnique({
            where: { id: orderId },
            include: {
                customer: true,
                items: {
                    include: { product: true }
                },
                status_logs: {
                    orderBy: { changed_at: 'desc' }
                }
            }
        });

        if (!order) {
            req.flash('error_msg', 'Không tìm thấy đơn hàng.');
            return res.redirect('/admin/orders');
        }

        const pointSummary = await loyaltyService.getOrderPointSummary(orderId, prisma);
        
        res.render('admin/orders/detail', {
            title: `Chi tiết Đơn hàng ${order.order_code}`,
            order,
            pointSummary,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/orders/:id/status
 * Handle status update and restocking on cancellation
 */
const updateStatus = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.id);
        const { status, note } = req.body;
        const adminUser = req.session.user;

        const currentOrder = await prisma.order.findUnique({
            where: { id: orderId },
            include: { items: true }
        });

        if (!currentOrder) {
            return res.json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        const oldStatus = currentOrder.order_status;
        if (oldStatus === status) {
            return res.json({ success: false, message: 'Trạng thái không thay đổi' });
        }

        // Prevent moving backwards for completed/cancelled orders
        if (['completed', 'cancelled'].includes(oldStatus)) {
            return res.json({ success: false, message: 'Không thể thay đổi trạng thái của đơn hàng đã Hoàn thành hoặc đã Hủy.' });
        }

        await prisma.$transaction(async (tx) => {
            // Update Order Status
            const updateData = { order_status: status };
            if (status === 'completed') {
                updateData.payment_status = 'paid';
            }

            await tx.order.update({
                where: { id: orderId },
                data: updateData
            });

            // AWARD REWARD POINTS if completed or paid (if not already awarded)
            if (status === 'completed' || (status === 'confirmed' && currentOrder.payment_status === 'paid')) {
                const customer = await tx.customer.findUnique({
                    where: { id: currentOrder.customer_id },
                    select: { user_id: true }
                });

                if (customer && customer.user_id) {
                    const existingEarn = await tx.pointHistory.findFirst({
                        where: { order_id: orderId, type: 'earn' }
                    });

                    if (!existingEarn) {
                        const earnedPoints = loyaltyService.calculateEarnedPoints(currentOrder.total_amount);
                        if (earnedPoints > 0) {
                            await loyaltyService.awardPointsForOrder(tx, {
                                userId: customer.user_id,
                                orderId: orderId,
                                points: earnedPoints,
                                note: `Tích điểm từ đơn hàng ${currentOrder.order_code} (Cập nhật bởi Admin)`
                            });
                        }
                    }
                }
            }

            // Log change
            await tx.orderStatusLog.create({
                data: {
                    order_id: orderId,
                    old_status: oldStatus,
                    new_status: status,
                    note: note || '',
                    changed_by: adminUser ? adminUser.full_name : 'Admin'
                }
            });

            // IF CANCELLED: Restock items & Loyalty Points
            if (status === 'cancelled') {
                // 1. Restock items
                for (const item of currentOrder.items) {
                    const product = await tx.product.findUnique({
                        where: { id: item.product_id }
                    });

                    if (product) {
                        const newStock = product.stock_quantity + item.quantity;
                        await tx.product.update({
                            where: { id: item.product_id },
                            data: { stock_quantity: newStock }
                        });

                        await tx.inventoryLog.create({
                            data: {
                                product_id: item.product_id,
                                type: 'order_add',
                                quantity: item.quantity,
                                before_quantity: product.stock_quantity,
                                after_quantity: newStock,
                                reference_type: 'order',
                                reference_id: orderId,
                                note: `Bù tồn kho do hủy đơn ${currentOrder.order_code}`,
                                created_by: adminUser ? adminUser.full_name : 'Admin'
                            }
                        });
                    }
                }

                // 2. Loyalty Points handle
                const customer = await tx.customer.findUnique({
                    where: { id: currentOrder.customer_id },
                    select: { user_id: true }
                });

                if (customer && customer.user_id) {
                    const pointSummary = await loyaltyService.getOrderPointSummary(orderId, tx);
                    
                    // Revoke earned points
                    if (pointSummary.earnedPoints > 0) {
                        await loyaltyService.revokePointsForOrder(tx, {
                            userId: customer.user_id,
                            orderId: orderId,
                            points: pointSummary.earnedPoints,
                            note: `Thu hồi điểm đơn ${currentOrder.order_code} (Hủy đơn)`
                        });
                    }

                    // Refund redeemed points
                    if (pointSummary.usedPoints > 0) {
                        await loyaltyService.refundPointsForOrder(tx, {
                            userId: customer.user_id,
                            orderId: orderId,
                            points: pointSummary.usedPoints,
                            note: `Hoàn điểm đơn ${currentOrder.order_code} (Hủy đơn)`
                        });
                    }
                }
            }
        });

        res.json({ success: true, message: 'Cập nhật trạng thái thành công' });
    } catch (error) {
        console.error('Update status error:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật trạng thái' });
    }
};

/**
 * [POST] /admin/orders/:id/payment-status
 */
const updatePaymentStatus = async (req, res, next) => {
    try {
        const orderId = parseInt(req.params.id);
        const { payment_status, note } = req.body;
        const adminUser = req.session.user;

        const currentOrder = await prisma.order.findUnique({
            where: { id: orderId }
        });

        if (!currentOrder) {
            return res.json({ success: false, message: 'Không tìm thấy đơn hàng' });
        }

        await prisma.$transaction(async (tx) => {
            await tx.order.update({
                where: { id: orderId },
                data: { payment_status }
            });

            // AWARD REWARD POINTS if paid (if not already awarded)
            if (payment_status === 'paid') {
                const customer = await tx.customer.findUnique({
                    where: { id: currentOrder.customer_id },
                    select: { user_id: true }
                });

                if (customer && customer.user_id) {
                    const existingEarn = await tx.pointHistory.findFirst({
                        where: { order_id: orderId, type: 'earn' }
                    });

                    if (!existingEarn) {
                        const earnedPoints = loyaltyService.calculateEarnedPoints(currentOrder.total_amount);
                        if (earnedPoints > 0) {
                            await loyaltyService.awardPointsForOrder(tx, {
                                userId: customer.user_id,
                                orderId: orderId,
                                points: earnedPoints,
                                note: `Tích điểm từ đơn hàng ${currentOrder.order_code} (Xác nhận thanh toán)`
                            });
                        }
                    }
                }
            }

            // Log change
            await tx.orderStatusLog.create({
                data: {
                    order_id: orderId,
                    old_status: currentOrder.payment_status,
                    new_status: `PAYMENT_${payment_status.toUpperCase()}`,
                    note: note || `Cập nhật trạng thái thanh toán sang ${payment_status}`,
                    changed_by: adminUser ? adminUser.full_name : 'Admin'
                }
            });
        });

        res.json({ success: true, message: 'Cập nhật trạng thái thanh toán thành công' });
    } catch (error) {
        console.error('Update payment status error:', error);
        res.status(500).json({ success: false, message: 'Lỗi máy chủ khi cập nhật thanh toán' });
    }
};

module.exports = {
    renderList,
    renderDetail,
    updateStatus,
    updatePaymentStatus
};
