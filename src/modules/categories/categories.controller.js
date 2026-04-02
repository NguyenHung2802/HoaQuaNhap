const categoriesService = require('./categories.service');
const { uploadToCloudinary } = require('../../middlewares/upload.middleware');

/**
 * [GET] /admin/categories
 * Render list categories
 */
const renderList = async (req, res, next) => {
    try {
        const categories = await categoriesService.getAllCategories();
        
        res.render('admin/categories/index', {
            title: 'Quản lý danh mục',
            categories,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/categories/create
 * Render create form
 */
const renderCreateForm = async (req, res, next) => {
    try {
        const categories = await categoriesService.getAllCategories();
        res.render('admin/categories/create', {
            title: 'Thêm danh mục mới',
            categories,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/categories/create
 * Handle create category
 */
const create = async (req, res, next) => {
    try {
        let image_url = null;
        
        // Handle image upload with helper
        if (req.file) {
            console.log('--- Uploading image: ', req.file.originalname);
            const result = await uploadToCloudinary(req.file.buffer, 'categories');
            image_url = result.secure_url;
            console.log('--- Uploaded successfully: ', image_url);
        }

        const data = {
            ...req.body,
            image_url: image_url
        };

        await categoriesService.createCategory(data);
        
        req.flash('success_msg', 'Tạo danh mục thành công!');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error creating category: ', error);
        req.flash('error_msg', 'Lỗi upload/lưu dữ liệu: ' + error.message);
        res.redirect('/admin/categories/create');
    }
};

/**
 * [GET] /admin/categories/edit/:id
 * Render edit form
 */
const renderEditForm = async (req, res, next) => {
    try {
        const { id } = req.params;
        const category = await categoriesService.getCategoryById(id);
        const categories = await categoriesService.getAllCategories(); // To choose parent

        if (!category) {
            req.flash('error_msg', 'Không tìm thấy danh mục!');
            return res.redirect('/admin/categories');
        }

        res.render('admin/categories/edit', {
            title: 'Sửa danh mục: ' + category.name,
            category,
            categories: categories.filter(c => c.id !== parseInt(id)), // Avoid self-parenting
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/categories/edit/:id
 * Handle update category
 */
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        let image_url = null;

        if (req.file) {
            console.log('--- Updating image: ', req.file.originalname);
            const result = await uploadToCloudinary(req.file.buffer, 'categories');
            image_url = result.secure_url;
            console.log('--- Updated successfully: ', image_url);
        }

        const data = {
            ...req.body,
            image_url: image_url
        };

        await categoriesService.updateCategory(id, data);
        
        req.flash('success_msg', 'Cập nhật danh mục thành công!');
        res.redirect('/admin/categories');
    } catch (error) {
        console.error('Error updating category: ', error);
        req.flash('error_msg', 'Lỗi upload/cập nhật: ' + error.message);
        res.redirect('/admin/categories/edit/' + req.params.id);
    }
};

/**
 * [DELETE] /admin/categories/:id
 * Handle delete
 */
const deleteCategory = async (req, res, next) => {
    try {
        const { id } = req.params;
        await categoriesService.deleteCategory(id);
        res.json({ success: true, message: 'Xóa danh mục thành công' });
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
    deleteCategory
};
