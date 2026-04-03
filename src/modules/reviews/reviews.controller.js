const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * [GET] /admin/reviews
 */
const renderList = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 15;
        const skip = (page - 1) * limit;

        const [reviews, total] = await Promise.all([
            prisma.review.findMany({
                include: { product: { select: { name: true, sku: true } } },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            }),
            prisma.review.count()
        ]);

        res.render('admin/reviews/index', {
            title: 'Quản lý Đánh giá',
            reviews,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/reviews/approve/:id
 */
const approveReview = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.review.update({
            where: { id },
            data: { is_approved: true }
        });
        res.json({ success: true, message: 'Đã duyệt đánh giá!' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

/**
 * [DELETE] /admin/reviews/:id
 */
const deleteReview = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.review.delete({ where: { id } });
        res.json({ success: true, message: 'Xóa đánh giá thành công!' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

module.exports = {
    renderList,
    approveReview,
    deleteReview
};
