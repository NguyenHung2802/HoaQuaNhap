const productsService = require('./products.service');
const categoriesService = require('../categories/categories.service');
const { uploadToCloudinary } = require('../../middlewares/upload.middleware');

/**
 * [GET] /admin/products
 * Render product list
 */
const renderList = async (req, res, next) => {
    try {
        const { search, category_id, status, page = 1 } = req.query;
        
        const { products, total, totalPages } = await productsService.getAllProducts({
            search,
            category_id,
            status,
            page: parseInt(page),
            limit: 10
        });

        const categories = await categoriesService.getAllCategories();

        res.render('admin/products/index', {
            title: 'Quản lý sản phẩm',
            products: products.map(p => ({
                ...p,
                images: p.images || []
            })),
            total,
            totalPages,
            currentPage: parseInt(page),
            categories,
            filters: {
                search: search || '',
                category_id: category_id || '',
                status: status || ''
            },
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/products/create
 */
const renderCreateForm = async (req, res, next) => {
    try {
        const categories = await categoriesService.getAllCategories();
        res.render('admin/products/create', {
            title: 'Thêm sản phẩm mới',
            categories,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/products/create
 */
const create = async (req, res, next) => {
    try {
        const uploadedImages = [];
        
        // Handling multi-images upload
        if (req.files && req.files.length > 0) {
            console.log(`--- Uploading ${req.files.length} images for product...`);
            for (const file of req.files) {
                const result = await uploadToCloudinary(file.buffer, 'products');
                uploadedImages.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        }

        const data = {
            ...req.body,
            images: uploadedImages
        };

        const product = await productsService.createProduct(data);
        console.log('--- Product created successfully: ', product.id);

        req.flash('success_msg', 'Tạo sản phẩm thành công!');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error creating product: ', error);
        req.flash('error_msg', 'Lỗi khi tạo sản phẩm: ' + error.message);
        res.redirect('/admin/products/create');
    }
};

/**
 * [GET] /admin/products/edit/:id
 */
const renderEditForm = async (req, res, next) => {
    try {
        const { id } = req.params;
        const product = await productsService.getProductById(id);
        if (!product) {
            req.flash('error_msg', 'Không tìm thấy sản phẩm!');
            return res.redirect('/admin/products');
        }

        const categories = await categoriesService.getAllCategories();
        res.render('admin/products/edit', {
            title: 'Sửa sản phẩm: ' + product.name,
            product,
            categories,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/products/edit/:id
 */
const update = async (req, res, next) => {
    try {
        const { id } = req.params;
        const newUploadedImages = [];
        
        // Handle new images
        if (req.files && req.files.length > 0) {
            console.log(`--- Adding ${req.files.length} new images to product ${id}...`);
            for (const file of req.files) {
                const result = await uploadToCloudinary(file.buffer, 'products');
                newUploadedImages.push({
                    url: result.secure_url,
                    public_id: result.public_id
                });
            }
        }

        const data = {
            ...req.body,
            new_images: newUploadedImages,
            delete_image_ids: req.body.delete_image_ids ? (Array.isArray(req.body.delete_image_ids) ? req.body.delete_image_ids : [req.body.delete_image_ids]) : []
        };

        await productsService.updateProduct(id, data);
        
        req.flash('success_msg', 'Cập nhật sản phẩm thành công!');
        res.redirect('/admin/products');
    } catch (error) {
        console.error('Error updating product: ', error);
        req.flash('error_msg', 'Lỗi khi cập nhật sản phẩm: ' + error.message);
        res.redirect('/admin/products/edit/' + req.params.id);
    }
};

/**
 * [DELETE] /admin/products/:id
 */
const deleteProduct = async (req, res, next) => {
    try {
        const { id } = req.params;
        await productsService.deleteProduct(id);
        res.json({ success: true, message: 'Xóa sản phẩm thành công' });
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
    deleteProduct
};
