const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * [GET] /admin/settings/pages
 */
const renderPagesList = async (req, res, next) => {
    try {
        const pages = await prisma.setting.findMany({
            where: { group_key: 'static_page' }
        });

        res.render('admin/settings/pages', {
            title: 'Quản lý Trang tĩnh',
            pages,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/settings/pages/edit/:key
 */
const renderEditPage = async (req, res, next) => {
    try {
        const { key } = req.params;
        const page = await prisma.setting.findUnique({
            where: { key }
        });

        if (!page) {
            req.flash('error_msg', 'Không tìm thấy trang.');
            return res.redirect('/admin/settings/pages');
        }

        res.render('admin/settings/edit_page', {
            title: `Chỉnh sửa: ${page.description || page.key}`,
            page,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/settings/pages/edit/:key
 */
const updatePage = async (req, res, next) => {
    try {
        const { key } = req.params;
        const { value } = req.body;

        await prisma.setting.update({
            where: { key },
            data: { value }
        });

        req.flash('success_msg', 'Cập nhật nội dung trang thành công!');
        res.redirect('/admin/settings/pages');
    } catch (error) {
        next(error);
    }
};

module.exports = {
    renderPagesList,
    renderEditPage,
    updatePage
};
