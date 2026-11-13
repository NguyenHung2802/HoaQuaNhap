const prisma = require('../../../config/db');
const content = require('../../posts/content.service');
const article = require('../../posts/article.service');
const { optimizeImageUrl } = require('../../media/media.service');
const siteUrl = () => (process.env.SITE_URL || 'https://haianhfruit.com').replace(/\/+$/, '');

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
                where: { is_published: true, post_type: 'blog' },
                include: { author: { select: { full_name: true } } },
                orderBy: { created_at: 'desc' },
                skip,
                take: limit
            }),
            prisma.blogPost.count({ where: { is_published: true, post_type: 'blog' } })
        ]);

        res.render('public/blogs/index', {
            title: 'Tin tức & Kiến thức hoa quả',
            metaDesc: 'Mẹo chọn mua, bảo quản và thưởng thức trái cây nhập khẩu, tin mùa vụ và ưu đãi từ Hải Anh Fruit.',
            canonicalUrl: siteUrl() + '/blogs' + (page > 1 ? '?page=' + page : ''),
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

        if (!blog || blog.post_type !== 'blog' || (!blog.is_published && (!req.session.user || req.session.user.role !== 'admin'))) {
            return res.status(404).render('public/pages/404', { title: 'Trang không tìm thấy', layout: 'layouts/main' });
        }

        // Recent posts sidebar + dữ liệu bổ sung (mục lục, liên quan, chia sẻ, SEO)
        const [recentBlogs, relatedPosts, relatedProducts] = await Promise.all([
            prisma.blogPost.findMany({
                where: { is_published: true, post_type: 'blog', id: { not: blog.id } },
                orderBy: { created_at: 'desc' },
                take: 5
            }),
            article.findRelatedPosts(blog, 3),
            article.findRelatedProducts(blog, 4).catch((e) => { console.error('Related products error:', e.message); return []; })
        ]);

        const enhanced = article.enhanceArticle(blog.content);
        const url = `${siteUrl()}/blog/${blog.slug}`;
        const description = blog.seo_description || blog.summary || article.plainText(blog.content).slice(0, 160);
        const ogImage = blog.thumbnail_url ? optimizeImageUrl(blog.thumbnail_url, 1200) : null;
        const isFileVideo = !!blog.video_url && /res\.cloudinary\.com\/.+\/video\/upload\//.test(blog.video_url);

        res.render('public/blogs/detail', {
            title: blog.seo_title || blog.title,
            metaDesc: description,
            canonicalUrl: url,
            headExtra: article.buildHeadExtra({ blog, url, description, image: ogImage }),
            blog,
            bodyHtml: enhanced.html,
            toc: enhanced.toc,
            readMinutes: content.estimateReadMinutes(blog.content),
            publishedAt: blog.published_at || blog.created_at,
            tags: String(blog.tags || '').split(',').map((t) => t.trim()).filter(Boolean),
            gallery: (Array.isArray(blog.gallery) ? blog.gallery : []).map((u) => ({ thumb: optimizeImageUrl(u, 600), full: optimizeImageUrl(u, 1600) })),
            heroImage: blog.thumbnail_url ? optimizeImageUrl(blog.thumbnail_url, 1200) : null,
            isFileVideo,
            shareUrl: url,
            share: article.shareLinks(url, blog.title),
            recentBlogs,
            relatedPosts,
            relatedProducts,
            layout: 'layouts/main'
        });
    } catch (error) {
        next(error);
    }
};
