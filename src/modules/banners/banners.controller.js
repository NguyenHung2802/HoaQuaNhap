const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const { uploadToCloudinary } = require('../../middlewares/upload.middleware');

/**
 * [GET] /admin/banners
 */
const renderList = async (req, res, next) => {
    try {
        const banners = await prisma.banner.findMany({
            orderBy: { sort_order: 'asc' }
        });
        res.render('admin/banners/index', {
            title: 'Quản lý Banner',
            banners,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/banners/create
 */
const renderCreate = (req, res) => {
    res.render('admin/banners/create', {
        title: 'Thêm Banner mới',
        layout: 'layouts/admin'
    });
};

/**
 * [POST] /admin/banners
 */
const createBanner = async (req, res, next) => {
    try {
        const { title, subtitle, link_url, sort_order, is_active } = req.body;
        let image_url = '';

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'banners');
            image_url = result.secure_url;
        }

        await prisma.banner.create({
            data: {
                title,
                subtitle,
                image_url,
                link_url,
                sort_order: parseInt(sort_order) || 0,
                is_active: is_active === 'on'
            }
        });

        req.flash('success_msg', 'Thêm banner thành công!');
        res.redirect('/admin/banners');
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/banners/edit/:id
 */
const renderEdit = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const banner = await prisma.banner.findUnique({
            where: { id }
        });

        if (!banner) {
            req.flash('error_msg', 'Không tìm thấy banner.');
            return res.redirect('/admin/banners');
        }

        res.render('admin/banners/edit', {
            title: 'Chỉnh sửa Banner',
            banner,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/banners/:id
 */
const updateBanner = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { title, subtitle, link_url, sort_order, is_active } = req.body;
        
        const currentBanner = await prisma.banner.findUnique({ where: { id } });
        let image_url = currentBanner.image_url;

        if (req.file) {
            // New image uploaded
            const result = await uploadToCloudinary(req.file.buffer, 'banners');
            image_url = result.secure_url;
            
            // Note: Old image cleanup could be added here using result.public_id if stored
        }

        await prisma.banner.update({
            where: { id },
            data: {
                title,
                subtitle,
                image_url,
                link_url,
                sort_order: parseInt(sort_order) || 0,
                is_active: is_active === 'on'
            }
        });

        req.flash('success_msg', 'Cập nhật banner thành công!');
        res.redirect('/admin/banners');
    } catch (error) {
        next(error);
    }
};

/**
 * [DELETE] /admin/banners/:id
 */
const deleteBanner = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.banner.delete({ where: { id } });
        res.json({ success: true, message: 'Xóa banner thành công!' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

module.exports = {
    renderList,
    renderCreate,
    createBanner,
    renderEdit,
    updateBanner,
    deleteBanner
};
