const customersService = require('./customers.service');

/**
 * [GET] /admin/customers - Customer list
 */
exports.renderList = async (req, res, next) => {
    try {
        const { page = 1, q = '' } = req.query;
        const result = await customersService.getAllCustomers({
            page: parseInt(page),
            search: q
        });
        const stats = await customersService.getCustomerStats();

        res.render('admin/customers/index', {
            title: 'Quản lý Khách hàng',
            ...result,
            stats,
            search: q,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/customers/:id - Customer detail
 */
exports.renderDetail = async (req, res, next) => {
    try {
        const customer = await customersService.getCustomerById(req.params.id);
        if (!customer) {
            req.flash('error_msg', 'Không tìm thấy khách hàng.');
            return res.redirect('/admin/customers');
        }

        res.render('admin/customers/detail', {
            title: `Khách hàng: ${customer.full_name}`,
            customer,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/customers/:id/edit - Edit customer form
 */
exports.renderEdit = async (req, res, next) => {
    try {
        const customer = await customersService.getCustomerById(req.params.id);
        if (!customer) {
            req.flash('error_msg', 'Không tìm thấy khách hàng.');
            return res.redirect('/admin/customers');
        }

        res.render('admin/customers/edit', {
            title: `Chỉnh sửa: ${customer.full_name}`,
            customer,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/customers/:id/update - Update customer
 */
exports.updateCustomer = async (req, res, next) => {
    try {
        await customersService.updateCustomer(req.params.id, req.body);
        req.flash('success_msg', 'Cập nhật thông tin khách hàng thành công!');
        res.redirect(`/admin/customers/${req.params.id}`);
    } catch (error) {
        req.flash('error_msg', error.message || 'Lỗi khi cập nhật khách hàng.');
        res.redirect(`/admin/customers/${req.params.id}/edit`);
    }
};

/**
 * [POST] /admin/customers/:id/delete - Delete customer
 */
exports.deleteCustomer = async (req, res, next) => {
    try {
        await customersService.deleteCustomer(req.params.id);
        req.flash('success_msg', 'Đã xóa khách hàng thành công!');
        res.redirect('/admin/customers');
    } catch (error) {
        req.flash('error_msg', error.message || 'Lỗi khi xóa khách hàng.');
        res.redirect('/admin/customers');
    }
};
