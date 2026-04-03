const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

/**
 * [GET] /blogs
 */
exports.renderList = async (req, res, next) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = 9;
        const skip = (page - 1) * limit;

        const [blogs, total] = await Promise.all([
            prisma.blogPost.findMany({
                where: { is_published: true },
                include: { author: { select: { full_name: true } } },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            }),
            prisma.blogPost.count({ where: { is_published: true } })
        ]);

        res.render('public/blogs/index', {
            title: 'Tin tức & Kiến thức hoa quả',
            blogs,
            currentPage: page,
            totalPages: Math.ceil(total / limit),
            layout: 'layouts/main'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /blog/:slug
 */
exports.renderDetail = async (req, res, next) => {
    try {
        const { slug } = req.params;
        const blog = await prisma.blogPost.findUnique({
            where: { slug },
            include: { author: { select: { full_name: true } } }
        });

        if (!blog || (!blog.is_published && (!req.session.user || req.session.user.role !== 'admin'))) {
            return res.status(404).render('public/errors/404', { title: '404 Not Found', layout: 'layouts/main' });
        }

        // Recent posts sidebar
        const recentBlogs = await prisma.blogPost.findMany({
            where: { is_published: true, id: { not: blog.id } },
            orderBy: { created_at: 'desc' },
            take: 5
        });

        res.render('public/blogs/detail', {
            title: blog.title,
            blog,
            recentBlogs,
            layout: 'layouts/main'
        });
    } catch (error) {
        next(error);
    }
};
