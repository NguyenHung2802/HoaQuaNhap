const promotionsService = require('./promotions.service');
const categoriesService = require('../categories/categories.service');
const productsService = require('../products/products.service');

/**
 * [GET] /admin/promotions
 */
const renderList = async (req, res, next) => {
    try {
        const { page = 1 } = req.query;
        const { promotions, total, totalPages } = await promotionsService.getAllPromotions(parseInt(page));

        res.render('admin/promotions/index', {
            title: 'Quản lý chiến dịch khuyến mãi',
            promotions,
            total,
            totalPages,
            currentPage: parseInt(page),
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/promotions/create
 */
const renderCreateForm = async (req, res, next) => {
    try {
        const categories = await categoriesService.getAllCategories();
        // Just get first 100 products for selection to avoid heavy load
        const { products } = await productsService.getAllProducts({ limit: 100 });

        res.render('admin/promotions/create', {
            title: 'Tạo chiến dịch mới',
            categories,
            products,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/promotions/create
 */
const create = async (req, res, next) => {
    try {
        await promotionsService.createPromotion(req.body);
        req.flash('success_msg', 'Tạo chiến dịch thành công!');
        res.redirect('/admin/promotions');
    } catch (error) {
        req.flash('error_msg', 'Lỗi: ' + error.message);
        res.redirect('/admin/promotions/create');
    }
};

/**
 * [GET] /admin/promotions/edit/:id
 */
const renderEditForm = async (req, res, next) => {
    try {
        const { id } = req.params;
        const promotion = await promotionsService.getPromotionById(id);
        if (!promotion) {
            req.flash('error_msg', 'Không tìm thấy chiến dịch');
            return res.redirect('/admin/promotions');
        }

        const categories = await categoriesService.getAllCategories();
        const { products } = await productsService.getAllProducts({ limit: 100 });

        res.render('admin/promotions/edit', {
            title: 'Sửa chiến dịch: ' + promotion.name,
            promotion,
            categories,
            products,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/promotions/edit/:id
 */
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        await promotionsService.updatePromotion(id, req.body);
        req.flash('success_msg', 'Cập nhật chiến dịch thành công!');
        res.redirect('/admin/promotions');
    } catch (error) {
        req.flash('error_msg', 'Lỗi: ' + error.message);
        res.redirect('/admin/promotions/edit/' + req.params.id);
    }
};

/**
 * [DELETE] /admin/promotions/:id
 */
const deletePromotion = async (req, res, next) => {
    try {
        const { id } = req.params;
        await promotionsService.deletePromotion(id);
        res.json({ success: true, message: 'Xóa chiến dịch thành công' });
    } catch (error) {
        res.status(400).json({ success: false, message: error.message });
    }
};

module.exports = {
    renderList,
    renderCreateForm,
    create,
    renderEditForm,
    update,
    deletePromotion
};
