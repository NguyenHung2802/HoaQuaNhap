const prisma = require('../../../config/db');

/**
 * [GET] /page/:key
 */
const renderPage = async (req, res, next) => {
    try {
        const { key } = req.params;
        const page = await prisma.setting.findUnique({
            where: { key }
        });

        if (!page || page.group_key !== 'static_page') {
            return res.status(404).render('public/pages/404', { title: '404 Not Found', layout: 'layouts/main' });
        }

        res.render('public/pages/static', {
            title: page.description,
            page,
            layout: 'layouts/main'
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /sitemap.xml
 */
const renderSitemap = async (req, res, next) => {
    try {
        // Ưu tiên SITE_URL (tên miền chính thức) để sitemap luôn đúng https/tên miền khi chạy sau Nginx hoặc qua localhost
        const baseUrl = (process.env.SITE_URL || `${req.protocol}://${req.get('host')}`).replace(/\/+$/, '');
        
        // 1. Static URLs
        const staticUrls = ['', '/products', '/about', '/contact', '/faq', '/shipping', '/return', '/privacy', '/blogs'];
        
        // 2. Fetch Products
        const products = await prisma.product.findMany({
            where: { status: 'published' },
            select: { slug: true, updated_at: true }
        });

        // 3. Fetch Categories
        const categories = await prisma.category.findMany({
            where: { is_active: true },
            select: { slug: true } // shop lọc theo ?category=<slug>
        });

        // 4. Fetch Blogs
        // Chỉ bài blog công khai đã đăng. Tin tức ẩn (post_type = 'news') tuyệt đối KHÔNG đưa vào sitemap.
        const blogs = await prisma.blogPost.findMany({
            where: { is_published: true, post_type: 'blog' },
            select: { slug: true, updated_at: true }
        });

        res.set('Content-Type', 'text/xml');
        res.render('public/seo/sitemap', {
            layout: false,
            baseUrl,
            staticUrls,
            products,
            categories,
            blogs
        });
    } catch (error) {
        next(error);
    }
};

/**
 * [GET] /robots.txt
 */
const renderRobots = (req, res) => {
    const baseUrl = `${req.protocol}://${req.get('host')}`;
    res.set('Content-Type', 'text/plain');
    res.send(`User-agent: *
Allow: /
Disallow: /admin/
Disallow: /auth/
Disallow: /cart/
Disallow: /checkout/

Sitemap: ${baseUrl}/sitemap.xml
`);
};

module.exports = {
    renderPage,
    renderSitemap,
    renderRobots
};
