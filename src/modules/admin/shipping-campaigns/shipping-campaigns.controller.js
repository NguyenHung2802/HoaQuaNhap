const shippingCampaignsService = require('./shipping-campaigns.service');

/**
 * [GET] /admin/shipping-campaigns
 * Render shipping campaigns list
 */
const renderList = async (req, res, next) => {
    try {
        const campaigns = await shippingCampaignsService.getAll();
        res.render('admin/shipping-campaigns/index', {
            title: 'Quản lý khuyến mãi vận chuyển',
            campaigns,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/shipping-campaigns/create
 */
const renderCreateForm = async (req, res, next) => {
    try {
        res.render('admin/shipping-campaigns/create', {
            title: 'Thêm khuyến mãi vận chuyển mới',
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/shipping-campaigns/create
 */
const create = async (req, res, next) => {
    try {
        await shippingCampaignsService.create(req.body);
        req.flash('success_msg', 'Tạo khuyến mãi vận chuyển thành công!');
        res.redirect('/admin/shipping-campaigns');
    } catch (error) {
        req.flash('error_msg', 'Lỗi khi tạo: ' + error.message);
        res.redirect('/admin/shipping-campaigns/create');
    }
};

/**
 * [GET] /admin/shipping-campaigns/edit/:id
 */
const renderEditForm = async (req, res, next) => {
    try {
        const { id } = req.params;
        const campaign = await shippingCampaignsService.getById(id);
        if (!campaign) {
            req.flash('error_msg', 'Không tìm thấy khuyến mãi!');
            return res.redirect('/admin/shipping-campaigns');
        }

        const formatDate = (date) => {
            if (!date) return '';
            return new Date(date).toISOString().split('T')[0];
        };

        res.render('admin/shipping-campaigns/edit', {
            title: 'Sửa khuyến mãi vận chuyển',
            campaign,
            formattedDates: {
                start_at: formatDate(campaign.start_at),
                end_at: formatDate(campaign.end_at)
            },
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/shipping-campaigns/edit/:id
 */
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        await shippingCampaignsService.update(id, req.body);
        req.flash('success_msg', 'Cập nhật khuyến mãi vận chuyển thành công!');
        res.redirect('/admin/shipping-campaigns');
    } catch (error) {
        req.flash('error_msg', 'Lỗi khi cập nhật: ' + error.message);
        res.redirect('/admin/shipping-campaigns/edit/' + req.params.id);
    }
};

/**
 * [DELETE] /admin/shipping-campaigns/:id
 */
const deleteCampaign = async (req, res, next) => {
    try {
        const { id } = req.params;
        await shippingCampaignsService.remove(id);
        res.json({ success: true, message: 'Xóa khuyến mãi thành công' });
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
    deleteCampaign
};
