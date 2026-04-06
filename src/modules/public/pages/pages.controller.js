const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();

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
            return res.status(404).render('public/404', { title: '404 Not Found', layout: 'layouts/main' });
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
        const baseUrl = `${req.protocol}://${req.get('host')}`;
        
        // 1. Static URLs
        const staticUrls = ['', '/products', '/about', '/faq', '/policy', '/privacy', '/blogs'];
        
        // 2. Fetch Products
        const products = await prisma.product.findMany({
            where: { status: 'published' },
            select: { slug: true, updated_at: true }
        });

        // 3. Fetch Categories
        const categories = await prisma.category.findMany({
            select: { id: true, name: true } // Assuming categories use ID for now or need a custom route
        });

        // 4. Fetch Blogs
        const blogs = await prisma.blog.findMany({
            select: { id: true, updated_at: true } // Assuming blogs use ID
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
