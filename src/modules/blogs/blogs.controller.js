const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
const slugify = require('../../utils/slug');
const { uploadToCloudinary } = require('../../middlewares/upload.middleware');

/**
 * [GET] /admin/blogs
 */
const renderList = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 10;
        const skip = (page - 1) * limit;

        const [blogs, total] = await Promise.all([
            prisma.blogPost.findMany({
                include: { author: { select: { full_name: true } } },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            }),
            prisma.blogPost.count()
        ]);

        res.render('admin/blogs/index', {
            title: 'Quản lý Tin tức',
            blogs,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /admin/blogs/create
 */
const renderCreate = (req, res) => {
    res.render('admin/blogs/create', {
        title: 'Viết bài mới',
        layout: 'layouts/admin'
    });
};

/**
 * [POST] /admin/blogs
 */
const createBlog = async (req, res, next) => {
    try {
        const { title, summary, content, is_published } = req.body;
        const slug = slugify(title);
        let thumbnail_url = '';

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'blogs');
            thumbnail_url = result.secure_url;
        }

        await prisma.blogPost.create({
            data: {
                title,
                slug,
                summary,
                content,
                thumbnail_url,
                is_published: is_published === 'on',
                published_at: is_published === 'on' ? new Date() : null,
                author_id: req.session.user.id
            }
        });

        req.flash('success_msg', 'Đăng bài viết thành công!');
        res.redirect('/admin/blogs');
    } catch (error) {
        if (error.code === 'P2002') {
            req.flash('error_msg', 'Tiêu đề bài viết đã tồn tại (Slug trùng lặp).');
            return res.redirect('/admin/blogs/create');
        }
        next(error);
    }
};

/**
 * [GET] /admin/blogs/edit/:id
 */
const renderEdit = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const blog = await prisma.blogPost.findUnique({
            where: { id }
        });

        if (!blog) {
            req.flash('error_msg', 'Không tìm thấy bài viết.');
            return res.redirect('/admin/blogs');
        }

        res.render('admin/blogs/edit', {
            title: 'Chỉnh sửa bài viết',
            blog,
            layout: 'layouts/admin'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [POST] /admin/blogs/edit/:id
 */
const updateBlog = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        const { title, summary, content, is_published } = req.body;
        
        const currentBlog = await prisma.blogPost.findUnique({ where: { id } });
        let thumbnail_url = currentBlog.thumbnail_url;

        if (req.file) {
            const result = await uploadToCloudinary(req.file.buffer, 'blogs');
            thumbnail_url = result.secure_url;
        }

        await prisma.blogPost.update({
            where: { id },
            data: {
                title,
                slug: slugify(title),
                summary,
                content,
                thumbnail_url,
                is_published: is_published === 'on',
                updated_at: new Date()
            }
        });

        req.flash('success_msg', 'Cập nhật bài viết thành công!');
        res.redirect('/admin/blogs');
    } catch (error) {
        next(error);
    }
};

/**
 * [DELETE] /admin/blogs/:id
 */
const deleteBlog = async (req, res, next) => {
    try {
        const id = parseInt(req.params.id);
        await prisma.blogPost.delete({ where: { id } });
        res.json({ success: true, message: 'Xóa bài viết thành công!' });
    } catch (error) {
        res.json({ success: false, message: error.message });
    }
};

module.exports = {
    renderList,
    renderCreate,
    createBlog,
    renderEdit,
    updateBlog,
    deleteBlog
};
