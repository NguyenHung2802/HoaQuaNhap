const prisma = require('../../config/db');
const slugify = require('../../utils/slug');
const { uploadToCloudinary } = require('../../middlewares/upload.middleware');

const MAX_GALLERY = 5;

/** Upload tối đa 5 ảnh phụ lên Cloudinary, trả về mảng URL (bỏ qua nếu không có file). */
async function uploadGalleryFiles(files) {
    const list = (files || []).slice(0, MAX_GALLERY);
    const urls = [];
    for (const f of list) {
        const result = await uploadToCloudinary(f.buffer, 'blogs');
        urls.push(result.secure_url);
    }
    return urls;
}

/**
 * [POST] /admin/blogs/upload-image — Quill gọi khi chèn ảnh vào nội dung,
 * upload lên Cloudinary và trả về URL thay vì nhúng base64 (tránh request quá nặng).
 */
const uploadInlineImage = async (req, res) => {
    try {
        if (!req.file) return res.status(400).json({ error: 'Thiếu file ảnh.' });
        const result = await uploadToCloudinary(req.file.buffer, 'blogs/content');
        res.json({ url: result.secure_url });
    } catch (error) {
        res.status(500).json({ error: error.message || 'Upload ảnh thất bại.' });
    }
};

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
                where: { post_type: 'blog' },
                include: { author: { select: { full_name: true } } },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            }),
            prisma.blogPost.count({ where: { post_type: 'blog' } })
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

        const thumbFile = req.files && req.files.thumbnail && req.files.thumbnail[0];
        if (thumbFile) {
            const result = await uploadToCloudinary(thumbFile.buffer, 'blogs');
            thumbnail_url = result.secure_url;
        }

        const gallery = await uploadGalleryFiles(req.files && req.files.gallery);

        await prisma.blogPost.create({
            data: {
                title,
                slug,
                summary,
                content,
                thumbnail_url,
                gallery: gallery.length ? gallery : undefined,
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

        if (!blog || blog.post_type !== 'blog') {
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

        // DEBUG TẠM THỜI — tìm nguyên nhân ảnh phụ/ảnh nội dung bị mất trên production, sẽ xoá sau khi tìm ra lỗi.
        console.log('[DEBUG updateBlog]', {
            contentLength: req.headers['content-length'],
            files: req.files ? Object.keys(req.files).map((k) => ({ field: k, count: req.files[k].length, sizes: req.files[k].map((f) => f.size) })) : null,
            contentFieldLength: content ? content.length : 0,
            contentHasImg: content ? content.includes('<img') : false
        });

        const currentBlog = await prisma.blogPost.findUnique({ where: { id } });
        if (!currentBlog || currentBlog.post_type !== 'blog') {
            req.flash('error_msg', 'Không tìm thấy bài viết.');
            return res.redirect('/admin/blogs');
        }
        let thumbnail_url = currentBlog.thumbnail_url;

        const thumbFile = req.files && req.files.thumbnail && req.files.thumbnail[0];
        if (thumbFile) {
            const result = await uploadToCloudinary(thumbFile.buffer, 'blogs');
            thumbnail_url = result.secure_url;
        }

        // Ảnh phụ: giữ lại những ảnh cũ admin không bỏ chọn (keep_gallery[]), rồi nối thêm ảnh mới upload, tối đa 5 ảnh.
        const existingGallery = Array.isArray(currentBlog.gallery) ? currentBlog.gallery : [];
        const keepRaw = req.body.keep_gallery;
        const keep = keepRaw ? (Array.isArray(keepRaw) ? keepRaw : [keepRaw]) : [];
        const kept = existingGallery.filter((u) => keep.includes(u));
        const newUrls = await uploadGalleryFiles(req.files && req.files.gallery);
        const gallery = [...kept, ...newUrls].slice(0, MAX_GALLERY);
        if (kept.length + newUrls.length > MAX_GALLERY) {
            req.flash('error_msg', `Chỉ giữ tối đa ${MAX_GALLERY} ảnh phụ, một vài ảnh mới đã không được lưu.`);
        }

        await prisma.blogPost.update({
            where: { id },
            data: {
                title,
                slug: slugify(title),
                summary,
                content,
                thumbnail_url,
                gallery,
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
        const target = await prisma.blogPost.findUnique({ where: { id }, select: { post_type: true } });
        if (!target || target.post_type !== 'blog') {
            return res.json({ success: false, message: 'Không tìm thấy bài viết.' });
        }
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
    deleteBlog,
    uploadInlineImage
};
